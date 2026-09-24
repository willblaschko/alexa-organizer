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


# ── Device registrations (Echos, phantom app installs, …) ────────────────────

_ENDPOINTS_QUERY = (
    "query{listEndpoints(listEndpointsInput:{}){endpoints{id friendlyNameObject{value{text}} "
    "displayCategories{primary{value}} legacyIdentifiers{dmsIdentifier{deviceType{value{text}}}}}}}"
)

# Categorization of Amazon DEVICE registrations (endpoints that carry a deviceType).
# There is no reliable "dead/offline" flag from the API, so this is a heuristic SUGGESTION
# the user reviews — never an autonomous delete.
#   PROTECTED — must never be removed (kills our session, or the web login).
#   junk      — suggested removal (phantom app/device re-registrations, dupes).
#   keep      — everything else (real Echos).
_PROTECT_NAME = ("alexa media player", "alexa web")
_PROTECT_CATEGORY = ("APPLICATION",)
_JUNK_KEYWORDS = (
    "android device", "audible", "amazon alexa on", "echo buds", " fire", "eero",
    "pixel", " shield", "luna controller", "simulator", "for iphone", "for android",
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


def categorize_devices(endpoints: list[dict]) -> dict[str, list[dict]]:
    """Split device endpoints into keep / junk / protected (a reviewable suggestion)."""
    keep: list[dict] = []
    junk: list[dict] = []
    protected: list[dict] = []
    for e in endpoints:
        lname = e["name"].lower()
        if e["category"] in _PROTECT_CATEGORY or any(p in lname for p in _PROTECT_NAME):
            protected.append(e)
        elif any(k in lname for k in _JUNK_KEYWORDS):
            junk.append(e)
        else:
            keep.append(e)
    return {"keep": keep, "junk": junk, "protected": protected}


_REMOVE = (
    "mutation d($id:EndpointId!){deregisterEndpoint(deregisterEndpointInput:{endpointId:$id}){endpointId}}"
)


async def async_remove_device(hass, endpoint_id: str, email: str | None = None) -> str:
    """Remove one Amazon device registration by endpoint id. Returns the id echoed back."""
    node = await async_graphql(hass, {"query": _REMOVE, "variables": {"id": endpoint_id}}, email)
    return (((node.get("data") or {}).get("deregisterEndpoint") or {}).get("endpointId")) or ""
