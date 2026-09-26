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
    """Delta from HA areas → Alexa rooms as reviewable ops. HA areas are the truth.

    HA-first, many-to-one. For each HA area we gather the Alexa rooms that belong to it —
    an exact name match, or NAME VARIANTS (one name's word-set is a subset of the other's,
    e.g. the churn twins "Media Room 2/3" for area "Media Room"). One becomes canonical
    (renamed to the HA name); the rest are merge-deletes. Ops:
    - rename: line an Alexa room up with its HA area (case fix, or the canonical variant).
    - delete(merge): a duplicate variant folding into its HA area — suggested ON (its
      devices move to the canonical room, then it's emptied).
    - create: an HA area with no Alexa room at all (suggested OFF — not every area wants one).
    - delete: an Alexa room matching NO HA area; suggested ON only when EMPTY (a ghost),
      left opt-in when it still holds devices.

    A numbered room that is ITS OWN HA area (real "Bedroom 2") exact-matches and is never
    folded — so genuine second rooms are safe.
    """

    def norm(s: str) -> str:
        return s.strip().lower()

    def tokens(s: str) -> frozenset[str]:
        return frozenset(norm(s).split())

    areas_by_norm = {norm(a): a for a in area_names}
    ops: list[dict] = []
    claimed: set[str] = set()  # normalized group names already assigned to some area

    # Exact matches first, so a numbered room that is its own HA area keeps itself.
    exact_of: dict[str, dict] = {}  # area-norm → its exactly-named group
    for g in groups:
        gn = norm(_group_name(g))
        if gn in areas_by_norm:
            exact_of.setdefault(gn, g)
            claimed.add(gn)

    for an, area in areas_by_norm.items():
        at = tokens(area)
        # Variant rooms: subset either direction, not already claimed by another area.
        variants = [
            g for g in groups
            if norm(_group_name(g)) not in claimed
            and (at <= tokens(_group_name(g)) or tokens(_group_name(g)) <= at)
        ]
        exact = exact_of.get(an)
        members = exact or (max(variants, key=_group_member_count) if variants else None)
        if members is None:
            ops.append({"op": "create", "name": area, "suggested": False})
            continue
        # Canonical: rename to the HA area name when the text differs.
        cn = norm(_group_name(members))
        claimed.add(cn)
        if _group_name(members) != area:
            op = {"op": "rename", "id": members["id"], "from": _group_name(members), "to": area, "suggested": True}
            if exact is None:
                op["fuzzy"] = True
            ops.append(op)
        # Everything else that folds into this area is a merge-delete (its devices move out).
        for g in variants:
            if g is members or norm(_group_name(g)) in claimed:
                continue
            claimed.add(norm(_group_name(g)))
            ops.append({
                "op": "delete", "id": g["id"], "name": _group_name(g),
                "empty": _group_member_count(g) == 0, "suggested": True, "merge": True,
            })

    # Alexa rooms matching no HA area at all — orphans; empty ghosts pre-checked.
    for g in groups:
        if norm(_group_name(g)) in claimed:
            continue
        claimed.add(norm(_group_name(g)))
        empty = _group_member_count(g) == 0
        ops.append({"op": "delete", "id": g["id"], "name": _group_name(g), "empty": empty, "suggested": empty})
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


async def async_board(hass, email: str | None = None) -> dict:
    """The whole panel as ONE model: rooms (HA areas ∪ Alexa groups) and the devices in
    them, each tagged with its source (ha / alexa / echo). Read-only.

    Degrades gracefully — if HA exposure can't be read, the Alexa side still returns
    (devices just won't carry HA matches).
    """
    from . import inventory
    from .exposure import ExposureUnavailable

    groups = await async_list_groups(hass, email)
    node = await async_graphql(hass, {"query": _ENDPOINTS_QUERY}, email)
    endpoints = (((node.get("data") or {}).get("listEndpoints") or {}).get("endpoints")) or []

    rows: list[dict] = []
    try:
        for r in inventory.build_inventory(hass)["rows"]:
            names = [r.get("name")]
            state = hass.states.get(r["entity_id"])
            if state and state.attributes.get("friendly_name"):
                names.append(state.attributes["friendly_name"])
            rows.append({**r, "names": names})
    except ExposureUnavailable:
        pass

    return build_board(rows, endpoints, groups)


# Endpoint categories that can be a room's preferred speaker (brand-agnostic: Echos are
# ALEXA_VOICE_ENABLED, Sonos and other approved audio show as SPEAKER).
_SPEAKER_CATEGORIES = frozenset({"ALEXA_VOICE_ENABLED", "SPEAKER"})

_SET_SPEAKER = (
    "mutation s($id:String!,$spk:[GroupEndpointSpeakerInput!]!,$t:PlayMusicTargetingType!){"
    "updateDeviceGroupSpeakerConfiguration(input:{deviceGroupId:$id,selectedSpeakers:$spk,"
    "playMusicTargetingType:$t}){playMusicTargetingType selectedSpeakers{type endpointId}}}"
)


async def async_room_speakers(hass, email: str | None = None) -> list[dict]:
    """Per room: its current preferred speaker(s) + the speaker-capable members to choose from.

    Only rooms that actually have a speaker option are returned — so this works for any house
    (Echo-only, Sonos, mixed) with no brand assumption. Read-only.
    """
    groups = await async_list_groups(hass, email)
    node = await async_graphql(hass, {"query": _ENDPOINTS_QUERY}, email)
    eps = (((node.get("data") or {}).get("listEndpoints") or {}).get("endpoints")) or []

    info: dict[str, dict] = {}
    for e in eps:
        info[e["id"]] = {
            "name": ((e.get("friendlyNameObject") or {}).get("value") or {}).get("text") or e["id"],
            "category": ((e.get("displayCategories") or {}).get("primary") or {}).get("value") or "",
        }

    out: list[dict] = []
    for g in groups:
        members = [m["id"] for m in (g.get("memberDevices") or {}).get("items") or [] if m.get("id")]
        candidates = [
            {"endpointId": mid, "name": info.get(mid, {}).get("name", mid)}
            for mid in members
            if info.get(mid, {}).get("category") in _SPEAKER_CATEGORIES
        ]
        if not candidates:
            continue
        sc = g.get("speakerConfiguration") or {}
        current = [s.get("endpointId") for s in (sc.get("selectedSpeakers") or []) if s.get("endpointId")]
        out.append(
            {
                "room_id": g["id"],
                "room_name": _group_name(g),
                "current_id": current[0] if current else None,
                "candidates": sorted(candidates, key=lambda c: c["name"].lower()),
            }
        )
    return sorted(out, key=lambda r: r["room_name"].lower())


async def async_set_preferred_speaker(
    hass, room_id: str, endpoint_id: str, email: str | None = None
) -> None:
    """Set one room's preferred speaker (brand-agnostic — Echo, Sonos, whatever's in the room)."""
    speakers = [{"type": "PRIMARY", "endpointId": endpoint_id}]
    await async_graphql(
        hass,
        {"query": _SET_SPEAKER, "variables": {"id": room_id, "spk": speakers, "t": "ALL_THE_TIME"}},
        email,
    )


_FORGET = "mutation f($id:EndpointId!){forgetEndpoint(forgetEndpointInput:{endpointId:$id}){endpointId}}"


async def async_forget_endpoint(hass, endpoint_id: str, email: str | None = None) -> str:
    """Remove one Alexa smart-home endpoint by id (forgetEndpoint)."""
    node = await async_graphql(hass, {"query": _FORGET, "variables": {"id": endpoint_id}}, email)
    return (((node.get("data") or {}).get("forgetEndpoint") or {}).get("endpointId")) or ""


async def async_smarthome_cleanup(hass, email: str | None = None) -> list[dict]:
    """Opinionated cleanup candidates among Alexa smart-home endpoints. Read-only.

    Candidates = DUPLICATE endpoints (2nd+ sharing a name — the confident cruft signal) and
    STRAY endpoints (name doesn't match any live exposed HA entity). A matched, first-of-its-
    name endpoint is the real device and is NOT listed. Only duplicates are suggested for
    removal by default; strays are shown but left for the user to opt in (they may be
    other-source devices we can't judge — no HA back-reference exists).
    """
    from . import inventory

    node = await async_graphql(hass, {"query": _ENDPOINTS_QUERY}, email)
    eps = (((node.get("data") or {}).get("listEndpoints") or {}).get("endpoints")) or []

    ha_names: set[str] = set()
    try:
        for r in inventory.build_inventory(hass)["rows"]:
            if r.get("ghost") or not (r.get("desired") or r.get("exposed")):
                continue
            ha_names.add(str(r["name"]).strip().lower())
            state = hass.states.get(r["entity_id"])
            if state and state.attributes.get("friendly_name"):
                ha_names.add(str(state.attributes["friendly_name"]).strip().lower())
    except AlexaCloudUnavailable:
        pass

    seen: set[str] = set()
    out: list[dict] = []
    for e in eps:
        dms = (e.get("legacyIdentifiers") or {}).get("dmsIdentifier")
        if dms and (((dms.get("deviceType") or {}).get("value") or {}).get("text")):
            continue  # an Amazon device — handled by the device cleanup
        name = ((e.get("friendlyNameObject") or {}).get("value") or {}).get("text") or ""
        key = name.strip().lower()
        duplicate = key in seen
        seen.add(key)
        matched = key in ha_names
        if not duplicate and matched:
            continue  # the real, first-seen HA device — leave it
        out.append(
            {
                "id": e["id"],
                "name": name,
                "duplicate": duplicate,
                "matched": matched,
                "suggested_remove": duplicate,  # confident signal only
            }
        )
    return out


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


# ── Aggregated board: one room-centric, source-tagged view of everything ─────
# The whole panel is really ONE model — rooms, and the devices in them — joined
# across three sources by NAME (Alexa's chrsId is an opaque UUID, not the HA
# entity_id, so name is the only join key). build_board is PURE (takes already-
# fetched dicts) so the fiddly join is unit-testable without the live API.


def _norm(s) -> str:
    return (s or "").strip().lower()


def _endpoint_view(e: dict) -> dict:
    """Flatten one listEndpoints endpoint into the fields the board join needs."""
    leg = e.get("legacyIdentifiers") or {}
    dms = leg.get("dmsIdentifier") or {}
    return {
        "id": e.get("id") or "",
        "name": ((e.get("friendlyNameObject") or {}).get("value") or {}).get("text") or "",
        "category": ((e.get("displayCategories") or {}).get("primary") or {}).get("value") or "",
        "chrs": ((leg.get("chrsIdentifier") or {}).get("entityId")) or "",
        "device_type": (((dms.get("deviceType") or {}).get("value") or {}).get("text")) or None,
    }


def build_board(ha_rows, endpoints, groups, live_ids=None):
    """Join HA exposure + Alexa endpoints + Alexa groups into a room-centric board.

    PURE. Args are plain dicts already fetched by the caller:
      ha_rows   — inventory rows {entity_id, name, domain, area, desired, exposed, ghost,
                  names?} (names = optional lowercased aliases incl. the live friendly_name).
      endpoints — raw listEndpoints endpoints.
      groups    — raw listDeviceGroups.

    Returns {rooms: [...], unroomed: [...]}. Each device row carries a `source`
    ("ha" | "alexa" | "echo") and the ids each inline action needs.
    """
    live_ids = live_ids or set()
    eps = [_endpoint_view(e) for e in endpoints]

    # Alexa group membership + preferred speaker per room.
    ep_room: dict[str, str] = {}
    preferred: dict[str, str] = {}
    group_by_norm: dict[str, dict] = {}
    for g in groups:
        rid = g.get("id") or ""
        name = _group_name(g)
        group_by_norm[_norm(name)] = {"id": rid, "name": name}
        for m in (g.get("memberDevices") or {}).get("items") or []:
            if m.get("id"):
                ep_room[m["id"]] = rid
        sel = [
            s.get("endpointId")
            for s in ((g.get("speakerConfiguration") or {}).get("selectedSpeakers") or [])
            if s.get("endpointId")
        ]
        if sel:
            preferred[rid] = sel[0]

    # HA exposure indexed by every name it answers to, plus the set of HA areas.
    ha_by_name: dict[str, dict] = {}
    ha_areas: dict[str, str] = {}
    for r in ha_rows:
        if r.get("ghost"):
            continue
        if r.get("area"):
            ha_areas[_norm(r["area"])] = r["area"]
        for n in r.get("names") or [r.get("name")]:
            if n:
                ha_by_name.setdefault(_norm(n), r)

    # Account-device flags (protected / cruft / duplicate) reuse the device annotator.
    acct = [
        {"id": e["id"], "name": e["name"], "category": e["category"]}
        for e in eps
        if e["device_type"] is not None
    ]
    acct_flags = {d["id"]: d for d in annotate_devices(acct)}

    matched_ha: set[str] = set()  # HA names that DID surface as a live Alexa endpoint
    seen_sh: set[str] = set()  # smart-home names seen, for duplicate detection

    def device_row(e: dict) -> dict:
        rid = ep_room.get(e["id"]) or None
        row = {
            "name": e["name"],
            "endpoint_id": e["id"],
            "entity_id": None,
            "domain": None,
            "exposed": None,
            "room_id": rid,
            "is_speaker": e["category"] in _SPEAKER_CATEGORIES,
            "is_preferred": bool(rid and preferred.get(rid) == e["id"]),
            "synced": True,
            "protected": False,
            "suggested_remove": False,
            "source": "alexa",
            "area": None,
        }
        if e["device_type"] is not None:
            fl = acct_flags.get(e["id"], {})
            row["source"] = "echo"
            row["protected"] = fl.get("protected", False)
            row["suggested_remove"] = fl.get("suggested_remove", False)
            return row
        # Smart-home endpoint: match to HA by name; 2nd+ of a name is a duplicate (cruft).
        key = _norm(e["name"])
        dup = key in seen_sh
        seen_sh.add(key)
        ha = ha_by_name.get(key)
        if ha and not dup:
            matched_ha.add(key)
            row["source"] = "ha"
            row["entity_id"] = ha.get("entity_id")
            row["domain"] = ha.get("domain")
            row["exposed"] = ha.get("exposed")
            row["area"] = ha.get("area")
        elif dup:
            row["suggested_remove"] = True  # confident cruft signal
        return row

    ep_rows = [device_row(e) for e in eps]

    # HA-exposed entities that never surfaced as an Alexa endpoint (not synced yet).
    unsynced: list[dict] = []
    for r in ha_rows:
        if r.get("ghost") or not (r.get("desired") or r.get("exposed")):
            continue
        if any(_norm(n) in matched_ha for n in (r.get("names") or [r.get("name")]) if n):
            continue
        unsynced.append(
            {
                "name": r.get("name"),
                "endpoint_id": None,
                "entity_id": r.get("entity_id"),
                "domain": r.get("domain"),
                "exposed": r.get("exposed"),
                "room_id": None,
                "area": r.get("area"),
                "is_speaker": False,
                "is_preferred": False,
                "synced": False,
                "protected": False,
                "suggested_remove": False,
                "source": "ha",
            }
        )

    # Bucket endpoint rows by room; unsynced HA rows by their area.
    ep_by_room: dict[str, list] = {}
    unroomed: list[dict] = []
    for row in ep_rows:
        (ep_by_room.setdefault(row["room_id"], []) if row["room_id"] else unroomed).append(row)
    unsynced_by_area: dict[str, list] = {}
    for u in unsynced:
        unsynced_by_area.setdefault(_norm(u["area"]) if u["area"] else "", []).append(u)

    rooms = []
    for key in set(group_by_norm) | set(ha_areas):
        grp = group_by_norm.get(key)
        rid = grp["id"] if grp else None
        devices = list(ep_by_room.get(rid, [])) if rid else []
        devices += unsynced_by_area.get(key, [])
        devices.sort(key=lambda d: _norm(d["name"]))
        rooms.append(
            {
                "id": rid,
                "name": grp["name"] if grp else ha_areas.get(key),
                "in_alexa": grp is not None,
                "in_ha": key in ha_areas,
                "preferred_id": preferred.get(rid) if rid else None,
                "devices": devices,
            }
        )
    rooms.sort(key=lambda r: _norm(r["name"]))

    unroomed += unsynced_by_area.get("", [])
    unroomed.sort(key=lambda d: _norm(d["name"]))
    return {"rooms": rooms, "unroomed": unroomed}


def _preferred_default(room: dict) -> str | None:
    """The opinion for a room's preferred speaker, or None (leave alone / can't guess).

    Only proposes when the room has no preferred speaker yet. A single speaker wins
    outright; with several, the one whose name matches the room (e.g. "Kitchen Echo"
    in "Kitchen") wins; otherwise it's ambiguous and we don't guess.
    """
    if room.get("preferred_id"):
        return None
    speakers = [d for d in room.get("devices", []) if d.get("is_speaker") and d.get("endpoint_id")]
    if not speakers:
        return None
    if len(speakers) == 1:
        return speakers[0]["endpoint_id"]
    rn = _norm(room.get("name") or "")
    for d in speakers:
        dn = _norm(d.get("name") or "")
        if rn and (dn == rn or dn.startswith(rn + " ") or dn.endswith(" " + rn)):
            return d["endpoint_id"]
    return None


# The opinion, as one ordered plan. Groups run in this order (matches the proven
# apply pipeline): expose first, rooms exist before devices land in them, speakers
# after their room is populated, destructive cleanups + room deletes last.
_PLAN_GROUP_ORDER = (
    "expose", "rooms", "place", "speakers", "cleanup_devices", "cleanup_endpoints", "rooms_delete",
)
_PLAN_TITLES = {
    "expose": "Show devices to Alexa",
    "rooms": "Rooms",
    "place": "Put devices in their room",
    "speakers": "Preferred speaker",
    "cleanup_devices": "Remove unused devices",
    "cleanup_endpoints": "Remove duplicate or extra devices",
    "rooms_delete": "Delete empty rooms",
}
_PLAN_DESTRUCTIVE = {"cleanup_devices", "cleanup_endpoints", "rooms_delete"}


def assemble_plan(board: dict, rows: list[dict], room_ops: list[dict]) -> dict:
    """The single opinionated plan: one grouped, ordered, overridable change list.

    PURE. Composes already-fetched data — `build_board` output, `build_inventory`
    rows, and `plan_room_sync` ops — into groups of ops. Each op carries the
    EXISTING service to run it (`action.kind`), so the writer path is reused.
    `suggested` = pre-checked (the app's recommendation); confident cruft only.
    """
    rooms = board.get("rooms") or []
    unroomed = board.get("unroomed") or []
    all_devices = [d for r in rooms for d in (r.get("devices") or [])] + list(unroomed)

    # HA area (normalized) → its CANONICAL Alexa room id. Start from existing rooms, then
    # apply the plan's renames so a device lands in the room its area is being consolidated
    # into (e.g. "Media Room" → the id of the room being renamed "Media Room 2" → "Media Room").
    area_to_room = {_norm(r["name"]): r["id"] for r in rooms if r.get("id")}
    for o in room_ops:
        if o["op"] == "rename":
            area_to_room[_norm(o["to"])] = o["id"]
    # For devices with no HA area (Echoes, strays), match the name to an HA area's room.
    ha_area_targets = [
        {"id": area_to_room[_norm(r["name"])], "name": r["name"]}
        for r in rooms
        if r.get("in_ha") and _norm(r["name"]) in area_to_room
    ]

    g: dict[str, list] = {k: [] for k in _PLAN_GROUP_ORDER}

    # 1. Expose / hide — live entities whose actual exposure ≠ the policy's desire.
    for r in rows:
        if r.get("ghost"):
            continue  # stale records are cleared by reconcile regardless
        desired, exposed = bool(r.get("desired")), bool(r.get("exposed"))
        if desired == exposed:
            continue
        eid = r["entity_id"]
        g["expose"].append({
            "id": f"expose:{eid}", "group": "expose",
            "title": f"{'Show' if desired else 'Hide'} {r.get('name')}", "detail": "",
            "suggested": True, "destructive": False,
            "action": {"kind": "expose", "entity_id": eid, "to": desired},
        })

    # 2 & 7. Rooms — create/rename now, delete last.
    for o in room_ops:
        if o["op"] == "create":
            g["rooms"].append({
                "id": f"room:create:{o['name']}", "group": "rooms",
                "title": f"Create room {o['name']}", "detail": "",
                "suggested": o.get("suggested", False), "destructive": False,
                "action": {"kind": "room_op", "op": "create", "name": o["name"]},
            })
        elif o["op"] == "rename":
            g["rooms"].append({
                "id": f"room:rename:{o['id']}", "group": "rooms",
                "title": f"Rename {o['from']} → {o['to']}",
                "detail": "same room, different name" if o.get("fuzzy") else "",
                "suggested": o.get("suggested", False), "destructive": False,
                "action": {"kind": "room_op", "op": "rename", "id": o["id"], "name": o["to"]},
            })
        elif o["op"] == "delete":
            g["rooms_delete"].append({
                "id": f"room:delete:{o['id']}", "group": "rooms_delete",
                "title": f"Delete room {o['name']}",
                "detail": "duplicate — its devices move to your room first"
                if o.get("merge")
                else ("empty" if o.get("empty") else "still has devices"),
                "suggested": o.get("suggested", False), "destructive": True,
                "action": {"kind": "room_op", "op": "delete", "id": o["id"]},
            })

    # 3. Place devices — into their HA area's room (truth), else a name-matched room.
    for d in all_devices:
        eid = d.get("endpoint_id")
        if not eid:
            continue  # not in Alexa yet — nothing to move
        if d.get("source") == "ha" and d.get("area"):
            target = area_to_room.get(_norm(d["area"]))
        else:
            target = _suggest_room(d.get("name", ""), ha_area_targets)
        if target and target != d.get("room_id"):
            g["place"].append({
                "id": f"move:{eid}", "group": "place",
                "title": f"Put {d.get('name')} in its room", "detail": "",
                "suggested": True, "destructive": False,
                "action": {"kind": "move", "endpoint_id": eid, "from": d.get("room_id"), "to": target},
            })

    # 4. Preferred speaker — the room's main Echo, when unset and unambiguous.
    for r in rooms:
        if not r.get("id"):
            continue
        pref = _preferred_default(r)
        if pref:
            g["speakers"].append({
                "id": f"pref:{r['id']}", "group": "speakers",
                "title": f"Set the main speaker in {r['name']}", "detail": "",
                "suggested": True, "destructive": False,
                "action": {"kind": "preferred", "room_id": r["id"], "endpoint_id": pref},
            })

    # 5 & 6. Cleanup — unused Amazon devices; duplicate/stray smart-home endpoints.
    for d in all_devices:
        eid = d.get("endpoint_id")
        if not eid or d.get("protected"):
            continue
        if d.get("source") == "echo" and d.get("suggested_remove"):
            g["cleanup_devices"].append({
                "id": f"rmdev:{eid}", "group": "cleanup_devices",
                "title": f"Remove {d.get('name')}", "detail": "unused device",
                "suggested": True, "destructive": True,
                "action": {"kind": "remove_device", "endpoint_id": eid},
            })
        elif d.get("source") == "alexa":
            g["cleanup_endpoints"].append({
                "id": f"rmep:{eid}", "group": "cleanup_endpoints",
                "title": f"Remove {d.get('name')}",
                "detail": "duplicate" if d.get("suggested_remove") else "not in Home Assistant",
                "suggested": bool(d.get("suggested_remove")), "destructive": True,
                "action": {"kind": "remove_endpoint", "endpoint_id": eid},
            })

    groups = [
        {"key": k, "title": _PLAN_TITLES[k], "destructive": k in _PLAN_DESTRUCTIVE, "ops": g[k]}
        for k in _PLAN_GROUP_ORDER
        if g[k]
    ]
    all_ops = [o for k in _PLAN_GROUP_ORDER for o in g[k]]
    counts = {grp["key"]: sum(1 for o in grp["ops"] if o["suggested"]) for grp in groups}
    return {
        "in_sync": not any(o["suggested"] for o in all_ops),
        "counts": counts,
        "groups": groups,
    }


async def async_plan(hass, email: str | None = None) -> dict:
    """The whole opinion, computed once: the board + the grouped change list.

    Fetches groups + endpoints + inventory a single time, then composes them via the
    PURE `build_board` + `assemble_plan`. Degrades gracefully — if Alexa is unreachable
    the exposure-only plan (from HA) still returns, `available` marks the difference.
    """
    from . import inventory
    from .exposure import ExposureUnavailable

    rows: list[dict] = []
    try:
        for r in inventory.build_inventory(hass)["rows"]:
            names = [r.get("name")]
            state = hass.states.get(r["entity_id"])
            if state and state.attributes.get("friendly_name"):
                names.append(state.attributes["friendly_name"])
            rows.append({**r, "names": names})
    except ExposureUnavailable:
        rows = []

    try:
        groups = await async_list_groups(hass, email)
        node = await async_graphql(hass, {"query": _ENDPOINTS_QUERY}, email)
        endpoints = (((node.get("data") or {}).get("listEndpoints") or {}).get("endpoints")) or []
        alexa_ok = True
    except AlexaCloudUnavailable:
        groups, endpoints, alexa_ok = [], [], False

    board = build_board(rows, endpoints, groups)
    room_ops = plan_room_sync(ha_area_names(hass), groups) if alexa_ok else []
    plan = assemble_plan(board, rows, room_ops)
    return {"available": alexa_ok, "board": board, **plan}


_REMOVE = (
    "mutation d($id:EndpointId!){deregisterEndpoint(deregisterEndpointInput:{endpointId:$id}){endpointId}}"
)


async def async_remove_device(hass, endpoint_id: str, email: str | None = None) -> str:
    """Remove one Amazon device registration by endpoint id. Returns the id echoed back."""
    node = await async_graphql(hass, {"query": _REMOVE, "variables": {"id": endpoint_id}}, email)
    return (((node.get("data") or {}).get("deregisterEndpoint") or {}).get("endpointId")) or ""
