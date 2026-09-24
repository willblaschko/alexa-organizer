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


def _login(hass, email: str | None = None):
    """Fetch a.m.p.'s AlexaLogin object. Re-fetched per call — a.m.p. can swap it on relogin."""
    data = hass.data.get(DATA_ALEXAMEDIA)
    if not data or not data.get("accounts"):
        raise AlexaCloudUnavailable("Alexa Media Player is not set up")
    accounts = data["accounts"]
    entry = accounts.get(email) if email else next(iter(accounts.values()), None)
    login = (entry or {}).get("login_obj")
    if login is None:
        raise AlexaCloudUnavailable("Alexa Media Player has no active login (re-login needed)")
    return login


def available(hass, email: str | None = None) -> bool:
    """True if a piggyback session is present (no network call)."""
    try:
        _login(hass, email)
        return True
    except AlexaCloudUnavailable:
        return False


def _csrf(login) -> str | None:
    try:
        return login._get_cookies_from_session()["csrf"].value
    except Exception:  # noqa: BLE001 - internal shape; jar also carries the cookie regardless
        return None


async def async_graphql(hass, body: dict[str, Any], email: str | None = None) -> Any:
    """POST a GraphQL body to /nexus/v1/graphql via a.m.p.'s session; return parsed JSON.

    `body` is the GraphQL request object, e.g. {"query": "...", "variables": {...}}.
    """
    try:
        from alexapy import AlexaAPI
    except ImportError as err:  # a.m.p. (and its alexapy dep) not installed
        raise AlexaCloudUnavailable("alexapy is not available (Alexa Media Player missing)") from err

    login = _login(hass, email)
    headers = {}
    csrf = _csrf(login)
    if csrf:
        headers["csrf"] = csrf  # belt-and-suspenders; the cookie jar also carries it

    try:
        resp = await AlexaAPI._static_request(
            "post", login, "/nexus/v1/graphql", data=body,
            additional_headers=headers or None,
        )
    except Exception as err:  # noqa: BLE001 - alexapy raises login/rate-limit errors; unify them
        raise AlexaCloudUnavailable(f"Alexa request failed: {err}") from err
    if resp is None:  # alexapy collapses >=400 to None
        raise AlexaCloudUnavailable("Alexa rejected the request (>=400 — session may have expired)")

    data = await resp.json(content_type=None)
    node = data[0] if isinstance(data, list) else data  # endpoint accepts single or batched
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


# ── Device registrations (Echos, phantom app installs, …) ────────────────────

_ENDPOINTS_QUERY = (
    "query{listEndpoints(listEndpointsInput:{}){endpoints{id friendlyNameObject{value{text}} "
    "displayCategories{primary{value}} legacyIdentifiers{dmsIdentifier{deviceType{value{text}}}}}}}"
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
