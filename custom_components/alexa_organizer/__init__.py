"""Alexa Organizer — make Home Assistant the source of truth for what Alexa sees.

Phase 1 is the reconcile engine: a hardcoded, opinionated policy computes the
desired Alexa-exposed set, diffs it against the current exposure, and applies
only the genuine changes — on startup and whenever the entity/area registries
change (debounced). No UI yet (Phase 2); no auto light-groups yet (Phase 3).
"""
from __future__ import annotations

import asyncio
import logging

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse

from . import engine, exposure
from .const import (
    DEVICE_CLEANUP_DEFAULT_LIMIT,
    DOMAIN,
    MAX_REMOVALS,
    SERVICE_ALEXA_DEVICES,
    SERVICE_ALEXA_ROOMS,
    SERVICE_ASSIGN_PREVIEW,
    SERVICE_FORGET_ENDPOINT,
    SERVICE_MOVE_DEVICE,
    SERVICE_PREVIEW,
    SERVICE_PLACE_IN_AREA,
    SERVICE_RECONCILE,
    SERVICE_ROOM_OP,
    SERVICE_ROOM_SPEAKERS,
    SERVICE_SET_PREFERRED_SPEAKER,
    SERVICE_DEBUG_GRAPHQL,
)
from .panel import async_register_panel, async_unregister_panel

_LOGGER = logging.getLogger(__name__)

_ALL_SERVICES = (
    SERVICE_RECONCILE,
    SERVICE_PREVIEW,
    SERVICE_ALEXA_ROOMS,
    SERVICE_ALEXA_DEVICES,
    SERVICE_ROOM_OP,
    SERVICE_MOVE_DEVICE,
    SERVICE_ASSIGN_PREVIEW,
    SERVICE_FORGET_ENDPOINT,
    SERVICE_SET_PREFERRED_SPEAKER,
    SERVICE_PLACE_IN_AREA,
    SERVICE_ROOM_SPEAKERS,
    SERVICE_DEBUG_GRAPHQL,
)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Alexa Organizer from a config entry."""
    # We own the "expose new entities" default — keep it OFF so nothing reaches
    # Alexa except through the policy (matches the Phase 0 manual state).
    try:
        exposure.set_expose_new(hass, False)
    except exposure.ExposureUnavailable as err:
        _LOGGER.warning("Alexa Organizer: couldn't set expose-new OFF (%s); continuing", err)

    # NOTE: no automatic reconcile. Exposure is applied through the panel's "Apply"
    # (reviewed) or the explicit alexa_organizer.reconcile service — never silently on
    # registry changes. Auto-reconcile used to fight the review model (it would try to
    # apply opt-in hides behind the user's back and nag with a HOLD notification).
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = {}

    _register_services(hass)
    await async_register_panel(hass)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry and, if it's the last, remove the services."""
    hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    if not hass.data.get(DOMAIN):
        for service in _ALL_SERVICES:
            hass.services.async_remove(DOMAIN, service)
        async_unregister_panel(hass)
    return True


def _register_services(hass: HomeAssistant) -> None:
    async def reconcile(call: ServiceCall) -> None:
        # Optional one-shot override of the live-removal guard, for the initial
        # cleanup after you've reviewed a preview. Steady-state stays at the safe
        # default (MAX_REMOVALS).
        max_removals = call.data.get("max_removals", MAX_REMOVALS)
        try:
            await engine.async_reconcile(hass, max_removals=max_removals)
        except exposure.ExposureUnavailable:
            pass

    async def preview(_call: ServiceCall) -> None:
        try:
            diff = await engine.async_reconcile(hass, dry_run=True)
        except exposure.ExposureUnavailable:
            return
        from homeassistant.components import persistent_notification

        persistent_notification.async_create(
            hass,
            engine.describe(diff),
            title="Alexa Organizer — preview",
            notification_id="alexa_organizer_preview",
        )

    async def alexa_rooms(_call: ServiceCall) -> None:
        # EXPERIMENTAL read-only: prove the alexa_media_player piggyback by listing
        # the account's Alexa rooms. No writes.
        from . import alexa_cloud

        from homeassistant.components import persistent_notification

        try:
            groups = await alexa_cloud.async_list_groups(hass)
        except alexa_cloud.AlexaCloudUnavailable as err:
            persistent_notification.async_create(
                hass,
                f"Alexa Room Sync (experimental) couldn't reach Alexa: {err}. "
                "It needs the Alexa Media Player integration installed and logged in.",
                title="Alexa Organizer — Alexa rooms",
                notification_id="alexa_organizer_rooms",
            )
            return

        def _name(g: dict) -> str:
            return ((g.get("friendlyName") or {}).get("value") or {}).get("text", "(unnamed)")

        def _count(g: dict) -> int:
            return len((g.get("memberDevices") or {}).get("items") or [])

        lines = sorted(f"• {_name(g)} — {_count(g)} device(s)" for g in groups)
        persistent_notification.async_create(
            hass,
            f"{len(groups)} Alexa rooms (read-only, via Alexa Media Player):\n" + "\n".join(lines),
            title="Alexa Organizer — Alexa rooms",
            notification_id="alexa_organizer_rooms",
        )

    async def alexa_devices(call: ServiceCall) -> None:
        # EXPERIMENTAL. Default = preview (no writes). apply:true deregisters the
        # suggested-junk devices (protected ones are never touched), up to `limit`
        # per call so the first real run is a small, safe taste.
        from . import alexa_cloud

        from homeassistant.components import persistent_notification

        def _notify(msg: str) -> None:
            persistent_notification.async_create(
                hass, msg, title="Alexa Organizer — device cleanup",
                notification_id="alexa_organizer_devices",
            )

        try:
            endpoints = await alexa_cloud.async_list_endpoints(hass)
        except alexa_cloud.AlexaCloudUnavailable as err:
            _notify(
                f"Couldn't reach Alexa: {err}. Needs Alexa Media Player installed and logged in."
            )
            return

        cats = alexa_cloud.categorize_devices(endpoints)
        junk = sorted(cats["junk"], key=lambda d: d["name"].lower())
        protected, keep = cats["protected"], cats["keep"]

        if not call.data.get("apply", False):
            preview_lines = "\n".join(f"• {d['name']}" for d in junk)
            _notify(
                f"Device cleanup — PREVIEW (nothing changed).\n\n"
                f"Would deregister {len(junk)} device(s):\n{preview_lines}\n\n"
                f"Protected, never touched ({len(protected)}): "
                f"{', '.join(d['name'] for d in protected) or 'none'}\n"
                f"Keeping {len(keep)} real device(s).\n\n"
                f"To remove them, call again with apply: true "
                f"(optionally limit: N — default {DEVICE_CLEANUP_DEFAULT_LIMIT} per call)."
            )
            return

        protected_ids = {d["id"] for d in protected}  # belt-and-suspenders guard
        requested = call.data.get("endpoint_ids")
        if requested:
            # Panel flow: remove exactly the user-selected devices (protected never).
            by_id = {d["id"]: d for d in alexa_cloud.annotate_devices(endpoints)}
            targets = [by_id[i] for i in requested if i in by_id and not by_id[i]["protected"]]
        else:
            limit = call.data.get("limit", DEVICE_CLEANUP_DEFAULT_LIMIT)
            targets = junk[:limit] if limit else junk
        done: list[str] = []
        failed: list[str] = []
        for d in targets:
            if d["id"] in protected_ids:
                continue
            try:
                await alexa_cloud.async_remove_device(hass, d["id"])
                done.append(d["name"])
            except alexa_cloud.AlexaCloudUnavailable as err:
                failed.append(f"{d['name']}: {err}")
            await asyncio.sleep(0.4)  # be gentle on Amazon's rate limits

        remaining = 0 if requested else (len(junk) - len(targets))
        msg = f"Device cleanup — deregistered {len(done)} device(s)."
        if remaining > 0:
            msg += f" {remaining} still suggested (raise limit or run again)."
        if failed:
            msg += "\n\nFailures:\n" + "\n".join(failed[:10])
        _notify(msg)

    hass.services.async_register(
        DOMAIN,
        SERVICE_RECONCILE,
        reconcile,
        schema=vol.Schema({vol.Optional("max_removals"): vol.All(vol.Coerce(int), vol.Range(min=0))}),
    )
    hass.services.async_register(DOMAIN, SERVICE_PREVIEW, preview)
    hass.services.async_register(DOMAIN, SERVICE_ALEXA_ROOMS, alexa_rooms)
    async def room_op(call: ServiceCall) -> None:
        # Apply ONE room op; the panel calls this per op to show per-op status.
        from . import alexa_cloud

        from homeassistant.exceptions import HomeAssistantError

        action = call.data["action"]
        try:
            if action == "create":
                await alexa_cloud.async_create_group(hass, call.data["name"])
            elif action == "rename":
                await alexa_cloud.async_rename_group(hass, call.data["id"], call.data["name"])
            elif action == "delete":
                await alexa_cloud.async_delete_group(hass, call.data["id"])
        except alexa_cloud.AlexaCloudUnavailable as err:
            raise HomeAssistantError(str(err)) from err

    hass.services.async_register(
        DOMAIN,
        SERVICE_ALEXA_DEVICES,
        alexa_devices,
        schema=vol.Schema(
            {
                vol.Optional("apply", default=False): bool,
                vol.Optional("limit"): vol.All(vol.Coerce(int), vol.Range(min=0)),
                vol.Optional("endpoint_ids"): [str],
            }
        ),
    )
    async def move_device(call: ServiceCall) -> None:
        from . import alexa_cloud

        from homeassistant.exceptions import HomeAssistantError

        try:
            await alexa_cloud.async_move_device(
                hass, call.data["endpoint_id"], call.data.get("from"), call.data.get("to")
            )
        except alexa_cloud.AlexaCloudUnavailable as err:
            raise HomeAssistantError(str(err)) from err

    hass.services.async_register(
        DOMAIN,
        SERVICE_ROOM_OP,
        room_op,
        schema=vol.Schema(
            {
                vol.Required("action"): vol.In(["create", "rename", "delete"]),
                vol.Optional("id"): str,
                vol.Optional("name"): str,
            }
        ),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_MOVE_DEVICE,
        move_device,
        schema=vol.Schema(
            {
                vol.Required("endpoint_id"): str,
                vol.Optional("from"): str,
                vol.Optional("to"): str,
            }
        ),
    )

    async def forget_endpoint(call: ServiceCall) -> None:
        from . import alexa_cloud

        from homeassistant.exceptions import HomeAssistantError

        try:
            await alexa_cloud.async_forget_endpoint(hass, call.data["endpoint_id"])
        except alexa_cloud.AlexaCloudUnavailable as err:
            raise HomeAssistantError(str(err)) from err

    hass.services.async_register(
        DOMAIN,
        SERVICE_FORGET_ENDPOINT,
        forget_endpoint,
        schema=vol.Schema({vol.Required("endpoint_id"): str}),
    )

    async def set_preferred_speaker(call: ServiceCall) -> None:
        from . import alexa_cloud

        from homeassistant.exceptions import HomeAssistantError

        try:
            await alexa_cloud.async_set_preferred_speaker(
                hass, call.data["room_id"], call.data["endpoint_id"]
            )
        except alexa_cloud.AlexaCloudUnavailable as err:
            raise HomeAssistantError(str(err)) from err

    hass.services.async_register(
        DOMAIN,
        SERVICE_SET_PREFERRED_SPEAKER,
        set_preferred_speaker,
        schema=vol.Schema(
            {vol.Required("room_id"): str, vol.Required("endpoint_id"): str}
        ),
    )

    async def place_in_area(call: ServiceCall) -> None:
        from . import alexa_cloud

        from homeassistant.exceptions import HomeAssistantError

        try:
            await alexa_cloud.async_move_to_area(
                hass, call.data["endpoint_id"], call.data.get("from"), call.data["area"]
            )
        except alexa_cloud.AlexaCloudUnavailable as err:
            raise HomeAssistantError(str(err)) from err

    hass.services.async_register(
        DOMAIN,
        SERVICE_PLACE_IN_AREA,
        place_in_area,
        schema=vol.Schema(
            {vol.Required("endpoint_id"): str, vol.Required("area"): str, vol.Optional("from"): str}
        ),
    )

    async def room_speakers(_call: ServiceCall) -> dict:
        # READ-ONLY diagnostic, returns response: each room's preferred speaker + candidates.
        from . import alexa_cloud

        try:
            return {"available": True, "rooms": await alexa_cloud.async_room_speakers(hass)}
        except alexa_cloud.AlexaCloudUnavailable as err:
            return {"available": False, "reason": str(err)}

    hass.services.async_register(
        DOMAIN,
        SERVICE_ROOM_SPEAKERS,
        room_speakers,
        supports_response=SupportsResponse.ONLY,
    )

    async def debug_graphql(call: ServiceCall) -> dict:
        # DEBUG (returns response): run an arbitrary GraphQL body against Alexa and return
        # the raw result (data + errors). Lets us introspect/repair mutations from REST.
        from . import alexa_cloud

        body: dict = {"query": call.data["query"]}
        if call.data.get("variables") is not None:
            body["variables"] = call.data["variables"]
        try:
            return {"ok": True, "result": await alexa_cloud.async_graphql(hass, body)}
        except alexa_cloud.AlexaCloudUnavailable as err:
            return {"ok": False, "error": str(err)}

    hass.services.async_register(
        DOMAIN,
        SERVICE_DEBUG_GRAPHQL,
        debug_graphql,
        schema=vol.Schema({vol.Required("query"): str, vol.Optional("variables"): dict}),
        supports_response=SupportsResponse.ONLY,
    )

    async def assign_preview(_call: ServiceCall) -> None:
        # READ-ONLY diagnostic: does the exposed-HA-device → area's-room mapping land?
        from . import alexa_cloud

        from homeassistant.components import persistent_notification

        try:
            plan = await alexa_cloud.async_assign_plan(hass)
        except alexa_cloud.AlexaCloudUnavailable as err:
            persistent_notification.async_create(
                hass, f"Couldn't reach Alexa: {err}.", title="Alexa Organizer — assign preview",
                notification_id="alexa_organizer_assign",
            )
            return
        assigns = plan["assigns"]
        sample = "\n".join(
            f"• {a['name']}: {(a['from'] or {}).get('name', '(unassigned)')} → {a['to']['name']}"
            for a in assigns[:20]
        )
        no_room = plan["area_has_no_room"]
        unmatched = plan["unmatched"]
        orphans = [u for u in unmatched if u["ha_orphan"]]
        other = [u for u in unmatched if not u["ha_orphan"]]
        orphan_s = "\n".join(f"   - {o['name']}  [{o['chrs']}]" for o in orphans[:15]) or "   (none)"
        other_s = "\n".join(f"   - {o['name']}  [{o['chrs'] or 'no chrs id'}]" for o in other[:15])
        msg = (
            f"ASSIGN — {len(assigns)} exposed devices to their area's room "
            f"(of {plan['exposed_with_area']} matched to an area):\n{sample}\n\n"
            f"NO ROOM YET — {len(no_room)} matched an area with no Alexa room (room sync creates it first).\n\n"
            f"UNMATCHED — {len(unmatched)} smart-home endpoints didn't name-match a live HA entity:\n"
            f"  DELETABLE orphans ({len(orphans)}) — chrsId is an HA entity_id that's GONE from HA:\n{orphan_s}\n"
            f"  KEEP ({len(other)}) — other-source or name-drift:\n{other_s}"
        )
        persistent_notification.async_create(
            hass, msg, title="Alexa Organizer — assign preview", notification_id="alexa_organizer_assign"
        )

    hass.services.async_register(DOMAIN, SERVICE_ASSIGN_PREVIEW, assign_preview)
