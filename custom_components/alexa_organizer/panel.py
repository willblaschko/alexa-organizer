"""Alexa Organizer sidebar panel: serves the frontend and a websocket API.

The panel is a custom element (`alexa-panel`) served as a static module. It reads
the live inventory (what's exposed, what the policy wants, and why) over websocket
commands, toggles exposure by writing HA labels, and applies via the engine.
"""
from __future__ import annotations

import hashlib
import logging
import os

import voluptuous as vol
from homeassistant.components import frontend, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant, callback

from . import engine, inventory
from .const import DOMAIN, MAX_REMOVALS
from .exposure import ExposureUnavailable

_LOGGER = logging.getLogger(__name__)

PANEL_URL_PATH = "alexa-organizer"
STATIC_URL = "/alexa_organizer_static"
PANEL_ELEMENT = "alexa-panel"
_FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend")
_UI = f"{DOMAIN}_ui"  # scratch namespace kept OUT of hass.data[DOMAIN]

# A generous ceiling for an explicit, user-clicked "Force apply" (the person is
# looking at the diff and chose to proceed) — still finite, never truly unbounded.
_FORCE_MAX_REMOVALS = 100_000


def _bundle_version() -> str:
    """Content hash of the built panel JS — cache-busts the module URL each build."""
    try:
        with open(os.path.join(_FRONTEND_DIR, f"{PANEL_ELEMENT}.js"), "rb") as fh:
            return hashlib.md5(fh.read()).hexdigest()[:10]
    except OSError:
        return "dev"


async def async_register_panel(hass: HomeAssistant) -> None:
    """Register the static assets, the websocket commands, and the sidebar panel."""
    ui = hass.data.setdefault(_UI, {})

    if not ui.get("static"):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, _FRONTEND_DIR, False)]
        )
        ui["static"] = True

    if not ui.get("ws"):
        websocket_api.async_register_command(hass, ws_inventory)
        websocket_api.async_register_command(hass, ws_set)
        websocket_api.async_register_command(hass, ws_apply)
        websocket_api.async_register_command(hass, ws_alexa_devices)
        websocket_api.async_register_command(hass, ws_room_plan)
        websocket_api.async_register_command(hass, ws_device_rooms)
        websocket_api.async_register_command(hass, ws_assign_plan)
        websocket_api.async_register_command(hass, ws_smarthome_cleanup)
        ui["ws"] = True

    frontend.async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title="Alexa Organizer",
        sidebar_icon="mdi:microphone-message",
        frontend_url_path=PANEL_URL_PATH,
        require_admin=True,
        update=True,
        config={
            "_panel_custom": {
                "name": PANEL_ELEMENT,
                "module_url": f"{STATIC_URL}/{PANEL_ELEMENT}.js?v={_bundle_version()}",
                "embed_iframe": False,
                "trust_external": False,
            }
        },
    )
    ui["panel"] = True


@callback
def async_unregister_panel(hass: HomeAssistant) -> None:
    """Remove the sidebar panel (static assets + ws commands persist for the run)."""
    ui = hass.data.get(_UI, {})
    if ui.get("panel"):
        frontend.async_remove_panel(hass, PANEL_URL_PATH)
        ui["panel"] = False


def _safe_inventory(hass: HomeAssistant) -> dict:
    """build_inventory, degrading to an explicit unavailable payload if the API is gone."""
    try:
        return inventory.build_inventory(hass)
    except ExposureUnavailable as err:
        return {"rows": [], "summary": {"expose": 0, "live_remove": 0, "ghost_remove": 0},
                "unavailable": str(err)}


@websocket_api.websocket_command({vol.Required("type"): "alexa_organizer/inventory"})
@websocket_api.async_response
async def ws_inventory(hass: HomeAssistant, connection, msg) -> None:
    """Return the current exposure inventory (rows + preview summary)."""
    connection.send_result(msg["id"], _safe_inventory(hass))


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "alexa_organizer/set",
        vol.Required("entity_id"): str,
        vol.Required("expose"): bool,
    }
)
@websocket_api.async_response
async def ws_set(hass: HomeAssistant, connection, msg) -> None:
    """Toggle one entity's desired exposure (writes an alexa / alexa-hide label)."""
    inventory.set_desired(hass, msg["entity_id"], msg["expose"])
    connection.send_result(msg["id"], _safe_inventory(hass))


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "alexa_organizer/apply", vol.Optional("force", default=False): bool}
)
@websocket_api.async_response
async def ws_apply(hass: HomeAssistant, connection, msg) -> None:
    """Apply the diff. Ghosts + additions always go; live removals over the guard are
    held unless `force` (an explicit, user-clicked confirmation)."""
    force = msg["force"]
    before = _safe_inventory(hass)
    if before.get("unavailable"):
        connection.send_result(msg["id"], {"held": False, "inventory": before})
        return
    held = not force and before["summary"]["live_remove"] > MAX_REMOVALS
    try:
        await engine.async_reconcile(
            hass, max_removals=_FORCE_MAX_REMOVALS if force else MAX_REMOVALS
        )
    except ExposureUnavailable:
        pass  # engine already logged + notified
    connection.send_result(
        msg["id"], {"held": held, "before": before["summary"], "inventory": _safe_inventory(hass)}
    )


# ── Experimental: Alexa-side device cleanup preview (piggybacks alexa_media_player) ──
# READ-ONLY. The panel's Apply button calls the alexa_organizer.alexa_devices SERVICE
# (apply: true) instead, so all the write logic stays in one place.


@websocket_api.websocket_command({vol.Required("type"): "alexa_organizer/alexa_devices"})
@websocket_api.async_response
async def ws_alexa_devices(hass: HomeAssistant, connection, msg) -> None:
    """Read-only: the full annotated device list (id, name, protected, suggested_remove)."""
    from . import alexa_cloud

    try:
        endpoints = await alexa_cloud.async_list_endpoints(hass)
    except alexa_cloud.AlexaCloudUnavailable as err:
        connection.send_result(msg["id"], {"available": False, "reason": str(err)})
        return
    devices = sorted(alexa_cloud.annotate_devices(endpoints), key=lambda d: d["name"].lower())
    connection.send_result(msg["id"], {"available": True, "devices": devices})


@websocket_api.websocket_command({vol.Required("type"): "alexa_organizer/room_plan"})
@websocket_api.async_response
async def ws_room_plan(hass: HomeAssistant, connection, msg) -> None:
    """Read-only: the HA-areas → Alexa-rooms delta (create / rename / delete ops)."""
    from . import alexa_cloud

    try:
        groups = await alexa_cloud.async_list_groups(hass)
    except alexa_cloud.AlexaCloudUnavailable as err:
        connection.send_result(msg["id"], {"available": False, "reason": str(err)})
        return
    ops = alexa_cloud.plan_room_sync(alexa_cloud.ha_area_names(hass), groups)
    connection.send_result(msg["id"], {"available": True, "ops": ops})


@websocket_api.websocket_command({vol.Required("type"): "alexa_organizer/device_rooms"})
@websocket_api.async_response
async def ws_device_rooms(hass: HomeAssistant, connection, msg) -> None:
    """Read-only: rooms + real devices with each device's current room (for the move UI)."""
    from . import alexa_cloud

    try:
        data = await alexa_cloud.async_device_rooms(hass)
    except alexa_cloud.AlexaCloudUnavailable as err:
        connection.send_result(msg["id"], {"available": False, "reason": str(err)})
        return
    connection.send_result(msg["id"], {"available": True, **data})


@websocket_api.websocket_command({vol.Required("type"): "alexa_organizer/assign_plan"})
@websocket_api.async_response
async def ws_assign_plan(hass: HomeAssistant, connection, msg) -> None:
    """Read-only: exposed HA devices → their HA-area's Alexa room (the assign suggestions)."""
    from . import alexa_cloud

    try:
        plan = await alexa_cloud.async_assign_plan(hass)
    except alexa_cloud.AlexaCloudUnavailable as err:
        connection.send_result(msg["id"], {"available": False, "reason": str(err)})
        return
    assigns = [
        {
            "id": a["id"],
            "name": a["name"],
            "from_id": (a["from"] or {}).get("id"),
            "from_name": (a["from"] or {}).get("name"),
            "to_id": a["to"]["id"],
            "to_name": a["to"]["name"],
        }
        for a in plan["assigns"]
    ]
    connection.send_result(
        msg["id"],
        {
            "available": True,
            "assigns": assigns,
            "no_room": len(plan["area_has_no_room"]),
            "unmatched": len(plan["unmatched"]),
        },
    )


@websocket_api.websocket_command({vol.Required("type"): "alexa_organizer/smarthome_cleanup"})
@websocket_api.async_response
async def ws_smarthome_cleanup(hass: HomeAssistant, connection, msg) -> None:
    """Read-only: duplicate / stray Alexa smart-home endpoints, with remove suggestions."""
    from . import alexa_cloud

    try:
        candidates = await alexa_cloud.async_smarthome_cleanup(hass)
    except alexa_cloud.AlexaCloudUnavailable as err:
        connection.send_result(msg["id"], {"available": False, "reason": str(err)})
        return
    connection.send_result(msg["id"], {"available": True, "candidates": candidates})
