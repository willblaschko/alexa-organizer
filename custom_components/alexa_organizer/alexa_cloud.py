"""EXPERIMENTAL — borrow alexa_media_player's Amazon session to reach Alexa's
internal, undocumented GraphQL API (`/nexus/v1/graphql`).

This is the ONLY module that touches the unofficial Alexa API, and it does nothing
unless the `alexa_media_player` integration is installed and logged in. It's opt-in
and clearly experimental (see README → "Alexa Room Sync"): the API is
reverse-engineered, ToS-gray, and can change without notice.

Session reuse is via a.m.p.'s own request machinery (`AlexaAPI._static_request`),
so we inherit its cookie jar, headers, SSL, OAuth-token refresh, locking, and
backoff — rather than re-implementing any auth. All attribute paths here are
a.m.p./alexapy internals and are therefore version-fragile; every failure mode
collapses to `AlexaCloudUnavailable` so callers can degrade gracefully.
"""
from __future__ import annotations

import logging
from typing import Any

_LOGGER = logging.getLogger(__name__)

DATA_ALEXAMEDIA = "alexa_media"  # a.m.p.'s hass.data key (== its DOMAIN)


class AlexaCloudUnavailable(RuntimeError):
    """alexa_media_player isn't set up, has no live login, or the call failed."""


DATA_ALEXA_DEVICES = "alexa_devices"  # the core integration's domain
_NEXUS_PATH = "/nexus/v1/graphql"
_CALLER_PKG = "AlexaDCWebsiteAssets"

# The GraphQL request rides on the session COOKIES (+ csrf header), never the OAuth bearer
# token — proven live (cookie-only writes succeed) and matches how aioamazondevices calls
# /nexus itself. So all we need from any source is a cookie jar for alexa.amazon.com.


def _amp_login(hass, email: str | None = None):
    """a.m.p.'s AlexaLogin object, or None. Re-fetched per call (swapped on relogin)."""
    data = hass.data.get(DATA_ALEXAMEDIA)
    accounts = (data or {}).get("accounts") or {}
    entry = accounts.get(email) if email else next(iter(accounts.values()), None)
    return (entry or {}).get("login_obj")


def _alexa_devices_api(hass):
    """The core alexa_devices integration's AmazonEchoApi (with a live http wrapper), or None."""
    try:
        entries = hass.config_entries.async_entries(DATA_ALEXA_DEVICES)
    except Exception:  # noqa: BLE001
        return None
    for entry in entries:
        api = getattr(getattr(entry, "runtime_data", None), "api", None)
        if api is not None and getattr(api, "_http_wrapper", None) is not None:
            return api
    return None


def available(hass, email: str | None = None) -> bool:
    """True if EITHER piggyback session is present (no network call)."""
    return _alexa_devices_api(hass) is not None or _amp_login(hass, email) is not None


async def _graphql_via_alexa_devices(hass, api, body: dict[str, Any]) -> Any:
    """Borrow the core integration's aiohttp session (cookies + csrf) for one POST."""
    hw = getattr(api, "_http_wrapper", None)
    session = getattr(hw, "_session", None)
    if session is None:
        raise AlexaCloudUnavailable("alexa_devices session not exposed")
    base = getattr(getattr(api, "_session_state_data", None), "alexa_website_url", None) or "https://alexa.amazon.com"
    csrf = getattr(hw, "_csrf_cookie", None)
    if not csrf:  # cold start — read the csrf cookie straight off the jar
        for c in session.cookie_jar:
            if getattr(c, "key", None) == "csrf":
                csrf = c.value
                break
    headers = {"Content-Type": "application/json", "x-amzn-caller-package": _CALLER_PKG}
    if csrf:
        headers["csrf"] = csrf
    try:
        async with session.post(f"{base.rstrip('/')}{_NEXUS_PATH}", json=body, headers=headers) as resp:
            if resp.status >= 400:
                raise AlexaCloudUnavailable(f"alexa_devices request status {resp.status}")
            return await resp.json(content_type=None)
    except AlexaCloudUnavailable:
        raise
    except Exception as err:  # noqa: BLE001
        raise AlexaCloudUnavailable(f"alexa_devices request failed: {err}") from err


async def _graphql_via_amp(hass, body: dict[str, Any], email: str | None) -> Any:
    """Fallback: a.m.p.'s AlexaLogin via alexapy's request machinery."""
    login = _amp_login(hass, email)
    if login is None:
        raise AlexaCloudUnavailable("Alexa Media Player has no active login")
    try:
        from alexapy import AlexaAPI
    except ImportError as err:
        raise AlexaCloudUnavailable("alexapy not available") from err
    headers = {}
    try:
        headers["csrf"] = login._get_cookies_from_session()["csrf"].value
    except Exception:  # noqa: BLE001 - jar carries it regardless
        pass
    try:
        resp = await AlexaAPI._static_request(
            "post", login, _NEXUS_PATH, data=body, additional_headers=headers or None
        )
    except Exception as err:  # noqa: BLE001
        raise AlexaCloudUnavailable(f"Alexa request failed: {err}") from err
    if resp is None:
        raise AlexaCloudUnavailable("Alexa rejected the request (>=400 — session may have expired)")
    return await resp.json(content_type=None)


async def async_graphql(hass, body: dict[str, Any], email: str | None = None) -> Any:
    """POST a GraphQL body to /nexus/v1/graphql; return parsed JSON.

    Multi-source: prefer the core `alexa_devices` session (official, self-healing cookies),
    fall back to `alexa_media_player`. Every failure collapses to AlexaCloudUnavailable.
    """
    errors: list[str] = []
    api = _alexa_devices_api(hass)
    if api is not None:
        try:
            raw = await _graphql_via_alexa_devices(hass, api, body)
            return _normalize(raw)
        except AlexaCloudUnavailable as err:
            errors.append(f"alexa_devices: {err}")
    try:
        raw = await _graphql_via_amp(hass, body, email)
        return _normalize(raw)
    except AlexaCloudUnavailable as err:
        errors.append(f"alexa_media_player: {err}")
    raise AlexaCloudUnavailable(
        "No usable Alexa session — install Alexa Devices or Alexa Media Player and log in"
        + (f" ({'; '.join(errors)})" if errors else "")
    )


def _normalize(raw: Any) -> Any:
    """The endpoint accepts single or batched; unwrap and surface GraphQL errors."""
    node = raw[0] if isinstance(raw, list) else raw
    if isinstance(node, dict) and node.get("errors"):
        raise AlexaCloudUnavailable(f"GraphQL errors: {node['errors']}")
    return node


# ── Read-only queries (the only thing wired up for now) ──────────────────────

_GROUPS_QUERY = (
    "query{listDeviceGroups{deviceGroups{id friendlyName{value{text}} "
    "memberDevices{items{id}} speakerConfiguration{playMusicTargetingType "
    "selectedSpeakers{type endpointId}}}}}"
)


async def async_list_groups(hass, email: str | None = None) -> list[dict]:
    """Return the account's Alexa device groups (rooms). Read-only."""
    node = await async_graphql(hass, {"query": _GROUPS_QUERY}, email)
    return (((node.get("data") or {}).get("listDeviceGroups") or {}).get("deviceGroups")) or []


# ── Room sync: HA areas (desired) vs Alexa rooms (current) ────────────────────


def _group_name(g: dict) -> str:
    return ((g.get("friendlyName") or {}).get("value") or {}).get("text") or "(unnamed)"


def _group_member_count(g: dict) -> int:
    return len((g.get("memberDevices") or {}).get("items") or [])


def ha_area_names(hass) -> list[str]:
    """The Home Assistant area names — the desired Alexa room list."""
    from homeassistant.helpers import area_registry as ar  # lazy

    return sorted((a.name for a in ar.async_get(hass).areas.values()), key=str.lower)


def plan_room_sync(area_names: list[str], groups: list[dict]) -> list[dict]:
    """Delta from HA areas → Alexa rooms as reviewable ops (suggestions only).

    - rename: an Alexa room matches an HA area by name (case-insensitive) but the exact
      text differs → line it up with HA.
    - create: an HA area with no Alexa room (suggested OFF — not every area wants one).
    - delete: an Alexa room with no matching HA area; suggested ON only when it's EMPTY
      (a ghost / bond artifact), left alone when it still holds devices.
    """

    def norm(s: str) -> str:
        return s.strip().lower()

    groups_by_norm = {norm(_group_name(g)): g for g in groups}
    areas_by_norm = {norm(a): a for a in area_names}
    ops: list[dict] = []
    matched: set[str] = set()

    for n, area in areas_by_norm.items():
        g = groups_by_norm.get(n)
        if g is not None:
            matched.add(n)
            gname = _group_name(g)
            if gname != area:
                ops.append({"op": "rename", "id": g["id"], "from": gname, "to": area, "suggested": True})
        else:
            ops.append({"op": "create", "name": area, "suggested": False})

    for n, g in groups_by_norm.items():
        if n in matched or n in areas_by_norm:
            continue
        empty = _group_member_count(g) == 0
        ops.append(
            {"op": "delete", "id": g["id"], "name": _group_name(g), "empty": empty, "suggested": empty}
        )
    return ops


# ── Room writes (create / rename / delete a room) ────────────────────────────

_CREATE_GROUP = (
    "mutation c($name:String!){createDeviceGroup(createDeviceGroupInput:{friendlyName:$name})"
    "{deviceGroup{id}}}"
)
_RENAME_GROUP = (
    "mutation r($id:String!,$name:String!){updateDeviceGroup(updateDeviceGroupInput:"
    "{deviceGroupId:$id,friendlyName:$name}){deviceGroup{id}}}"
)
_DELETE_GROUP = (
    "mutation d($id:String!){deleteDeviceGroup(deleteDeviceGroupInput:{deviceGroupId:$id})"
    "{deviceGroupId}}"
)


async def async_create_group(hass, name: str, email: str | None = None) -> str:
    node = await async_graphql(hass, {"query": _CREATE_GROUP, "variables": {"name": name}}, email)
    return (((node.get("data") or {}).get("createDeviceGroup") or {}).get("deviceGroup") or {}).get("id") or ""


async def async_rename_group(hass, group_id: str, name: str, email: str | None = None) -> None:
    await async_graphql(hass, {"query": _RENAME_GROUP, "variables": {"id": group_id, "name": name}}, email)


async def async_delete_group(hass, group_id: str, email: str | None = None) -> None:
    await async_graphql(hass, {"query": _DELETE_GROUP, "variables": {"id": group_id}}, email)


# ── Device → room assignment (move an endpoint between rooms) ─────────────────

_GROUP_MEMBER = (
    "mutation m($id:String!,$dev:[String!],$op:CollectionOperationOptions!){updateDeviceGroup"
    "(updateDeviceGroupInput:{deviceGroupId:$id,memberDeviceIds:$dev,"
    "memberDeviceIdsUpdateOperation:$op}){deviceGroup{id}}}"
)


async def _group_member(hass, group_id: str, endpoint_id: str, op: str, email: str | None = None) -> None:
    await async_graphql(
        hass, {"query": _GROUP_MEMBER, "variables": {"id": group_id, "dev": [endpoint_id], "op": op}}, email
    )


async def async_move_device(
    hass, endpoint_id: str, from_room_id: str | None, to_room_id: str | None, email: str | None = None
) -> None:
    """Move a device between Alexa rooms: remove from its current room, add to the target."""
    if from_room_id:
        await _group_member(hass, from_room_id, endpoint_id, "REMOVE", email)
    if to_room_id:
        await _group_member(hass, to_room_id, endpoint_id, "ADD", email)


async def async_device_rooms(hass, email: str | None = None) -> dict:
    """Rooms + real (kept) devices with each device's CURRENT room. Read-only.

    Junk/protected device registrations are excluded — only the real devices worth
    placing in a room are offered for assignment.
    """
    groups = await async_list_groups(hass, email)
    endpoints = await async_list_endpoints(hass, email)

    ep_room: dict[str, dict] = {}
    for g in groups:
        info = {"id": g["id"], "name": _group_name(g)}
        for m in (g.get("memberDevices") or {}).get("items") or []:
            if m.get("id"):
                ep_room[m["id"]] = info

    rooms = sorted(
        ({"id": g["id"], "name": _group_name(g)} for g in groups), key=lambda r: r["name"].lower()
    )
    devices: list[dict] = []
    for d in annotate_devices(endpoints):
        if d["protected"] or d["suggested_remove"]:
            continue
        r = ep_room.get(d["id"])
        current = r["id"] if r else None
        suggested = _suggest_room(d["name"], rooms)
        devices.append(
            {
                "id": d["id"],
                "name": d["name"],
                "room_id": current,
                "room_name": r["name"] if r else None,
                # A name-matched room to snap to, only when it differs from the current one.
                "suggested_room_id": suggested if suggested and suggested != current else None,
            }
        )
    devices.sort(key=lambda x: x["name"].lower())
    return {"rooms": rooms, "devices": devices}


def _suggest_room(name: str, rooms: list[dict]) -> str | None:
    """The room whose name the device name starts with (longest wins) — 'Kitchen Echo' → Kitchen."""
    ln = name.lower()
    best_id: str | None = None
    best_len = 0
    for r in rooms:
        rn = r["name"].lower()
        if (ln == rn or ln.startswith(rn + " ")) and len(rn) > best_len:
            best_id, best_len = r["id"], len(rn)
    return best_id


async def async_assign_plan(hass, email: str | None = None) -> dict:
    """Plan assigning EXPOSED HA devices to their HA-area's Alexa room (HA = truth). Read-only.

    Maps each Alexa smart-home endpoint (the exposed HA entities — those WITHOUT an Amazon
    deviceType) to an HA entity by friendly name → its HA area → that area's Alexa room, and
    stages an assign where the endpoint isn't already there. Returns the plan + match stats so
    we can confirm the name-mapping before wiring any writes.
    """
    from . import inventory, policy

    groups = await async_list_groups(hass, email)
    node = await async_graphql(hass, {"query": _ENDPOINTS_QUERY}, email)
    eps = (((node.get("data") or {}).get("listEndpoints") or {}).get("endpoints")) or []

    ep_room: dict[str, dict] = {}
    rooms_by_norm: dict[str, dict] = {}
    for g in groups:
        info = {"id": g["id"], "name": _group_name(g)}
        rooms_by_norm[_group_name(g).strip().lower()] = info
        for m in (g.get("memberDevices") or {}).get("items") or []:
            if m.get("id"):
                ep_room[m["id"]] = info

    # HA exposed entity → area (the truth we snap Alexa to). Key on BOTH the registry name
    # and the live friendly_name (what HA actually sends Alexa), since Alexa shows the latter.
    ha_area: dict[str, str] = {}
    try:
        for r in inventory.build_inventory(hass)["rows"]:
            if not (r.get("area") and (r.get("desired") or r.get("exposed")) and not r.get("ghost")):
                continue
            keys = {str(r["name"]).strip().lower()}
            state = hass.states.get(r["entity_id"])
            if state:
                friendly = state.attributes.get("friendly_name")
                if friendly:
                    keys.add(str(friendly).strip().lower())
            for key in keys:
                if key:
                    ha_area[key] = r["area"]
    except AlexaCloudUnavailable:
        pass

    # Live HA entity_ids, to tell an orphaned HA exposure from an other-source device.
    live_ids = policy.live_entity_ids(hass)

    assigns: list[dict] = []
    unmatched: list[dict] = []
    no_room: list[str] = []
    for e in eps:
        dms = (e.get("legacyIdentifiers") or {}).get("dmsIdentifier")
        if dms and (((dms.get("deviceType") or {}).get("value") or {}).get("text")):
            continue  # an Amazon device (Echo/app) — handled by the device-move UI
        name = ((e.get("friendlyNameObject") or {}).get("value") or {}).get("text") or ""
        chrs = (((e.get("legacyIdentifiers") or {}).get("chrsIdentifier") or {}).get("entityId")) or ""
        area = ha_area.get(name.strip().lower())
        if not area:
            # Not matched by name. Is chrsIdentifier an HA entity_id? If so, is it still live?
            looks_ha = "." in chrs and chrs.split(".")[0].islower()
            unmatched.append(
                {
                    "id": e["id"],
                    "name": name,
                    "chrs": chrs,
                    "ha_shaped": looks_ha,
                    "ha_orphan": looks_ha and chrs not in live_ids,
                }
            )
            continue
        desired = rooms_by_norm.get(area.strip().lower())
        if not desired:
            no_room.append(f"{name} → {area}")  # area has no Alexa room yet (room sync makes it)
            continue
        cur = ep_room.get(e["id"])
        if cur and cur["id"] == desired["id"]:
            continue  # already in the right room
        assigns.append({"id": e["id"], "name": name, "from": cur, "to": desired})

    return {
        "assigns": assigns,
        "exposed_with_area": len(ha_area),
        "unmatched": unmatched,
        "area_has_no_room": no_room,
    }


# ── Device registrations (Echos, phantom app installs, …) ────────────────────

_ENDPOINTS_QUERY = (
    "query{listEndpoints(listEndpointsInput:{}){endpoints{id friendlyNameObject{value{text}} "
    "displayCategories{primary{value}} legacyIdentifiers{chrsIdentifier{entityId} "
    "dmsIdentifier{deviceType{value{text}}}}}}}"
)

# Annotation of Amazon DEVICE registrations (endpoints that carry a deviceType).
# There is no reliable "dead/offline" flag from the API, so every disposition here is a
# generic, account-agnostic SUGGESTION the user reviews and toggles per-device — never an
# autonomous delete, and never keyed to any one person's specific gadgets.
#   protected        — must never be removed (kills our session, or the web login).
#   suggested_remove — likely-stale: a companion-app/phone/simulator entry, or a DUPLICATE
#                      name (the 2nd+ device sharing a friendly name). Default only.
_PROTECT_NAME = ("alexa media player", "alexa web")
_PROTECT_CATEGORY = ("APPLICATION",)
# Generic companion-app / non-speaker registration markers (product-name-agnostic).
_APP_CRUFT = (
    "android device", "audible", "amazon alexa on", "alexa app", "for iphone",
    "for android", "simulator", "this device",
)


async def async_list_endpoints(hass, email: str | None = None) -> list[dict]:
    """Return the account's DEVICE endpoints (those with a deviceType). Read-only.

    Smart-home endpoints (lights etc., no deviceType) are excluded — those are managed
    through exposure, not removed here.
    """
    node = await async_graphql(hass, {"query": _ENDPOINTS_QUERY}, email)
    eps = (((node.get("data") or {}).get("listEndpoints") or {}).get("endpoints")) or []
    out: list[dict] = []
    for e in eps:
        dms = (e.get("legacyIdentifiers") or {}).get("dmsIdentifier")
        device_type = (((dms or {}).get("deviceType") or {}).get("value") or {}).get("text") if dms else None
        if device_type is None:
            continue  # a smart-home endpoint, not an account device
        name = ((e.get("friendlyNameObject") or {}).get("value") or {}).get("text") or "(unnamed)"
        category = ((e.get("displayCategories") or {}).get("primary") or {}).get("value") or ""
        out.append({"id": e["id"], "name": name, "category": category, "device_type": device_type})
    return out


def annotate_devices(endpoints: list[dict]) -> list[dict]:
    """Annotate each device: {id, name, protected, suggested_remove}. Suggestions only."""
    seen: dict[str, int] = {}
    out: list[dict] = []
    for e in endpoints:
        lname = e["name"].lower()
        protected = e["category"] in _PROTECT_CATEGORY or any(p in lname for p in _PROTECT_NAME)
        count = seen.get(lname, 0)
        seen[lname] = count + 1
        is_duplicate = count > 0  # a later device sharing an earlier one's name
        app_cruft = any(k in lname for k in _APP_CRUFT)
        out.append(
            {
                "id": e["id"],
                "name": e["name"],
                "protected": protected,
                "suggested_remove": (not protected) and (app_cruft or is_duplicate),
            }
        )
    return out


def categorize_devices(endpoints: list[dict]) -> dict[str, list[dict]]:
    """Back-compat split into keep / junk / protected, derived from the annotations."""
    keep: list[dict] = []
    junk: list[dict] = []
    protected: list[dict] = []
    for d in annotate_devices(endpoints):
        if d["protected"]:
            protected.append(d)
        elif d["suggested_remove"]:
            junk.append(d)
        else:
            keep.append(d)
    return {"keep": keep, "junk": junk, "protected": protected}


_REMOVE = (
    "mutation d($id:EndpointId!){deregisterEndpoint(deregisterEndpointInput:{endpointId:$id}){endpointId}}"
)


async def async_remove_device(hass, endpoint_id: str, email: str | None = None) -> str:
    """Remove one Amazon device registration by endpoint id. Returns the id echoed back."""
    node = await async_graphql(hass, {"query": _REMOVE, "variables": {"id": endpoint_id}}, email)
    return (((node.get("data") or {}).get("deregisterEndpoint") or {}).get("endpointId")) or ""
