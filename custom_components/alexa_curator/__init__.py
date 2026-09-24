"""Alexa Curator — make Home Assistant the source of truth for what Alexa sees.

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
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.helpers import area_registry as ar, entity_registry as er
from homeassistant.helpers.debounce import Debouncer

from . import engine, exposure
from .const import (
    DEBOUNCE_SECONDS,
    DEVICE_CLEANUP_DEFAULT_LIMIT,
    DOMAIN,
    MAX_REMOVALS,
    SERVICE_ALEXA_DEVICES,
    SERVICE_ALEXA_ROOMS,
    SERVICE_PREVIEW,
    SERVICE_RECONCILE,
)
from .panel import async_register_panel, async_unregister_panel

_LOGGER = logging.getLogger(__name__)

_ALL_SERVICES = (
    SERVICE_RECONCILE,
    SERVICE_PREVIEW,
    SERVICE_ALEXA_ROOMS,
    SERVICE_ALEXA_DEVICES,
)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Alexa Curator from a config entry."""
    # We own the "expose new entities" default — keep it OFF so nothing reaches
    # Alexa except through the policy (matches the Phase 0 manual state).
    try:
        exposure.set_expose_new(hass, False)
    except exposure.ExposureUnavailable as err:
        _LOGGER.warning("Alexa Curator: couldn't set expose-new OFF (%s); continuing", err)

    async def _run_reconcile() -> None:
        try:
            await engine.async_reconcile(hass)
        except exposure.ExposureUnavailable:
            pass  # already logged + notified by the engine's HOLD

    debouncer = Debouncer(
        hass,
        _LOGGER,
        cooldown=DEBOUNCE_SECONDS,
        immediate=False,
        function=_run_reconcile,
    )
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = {"debouncer": debouncer}

    @callback
    def _schedule(_event=None) -> None:
        hass.async_create_task(debouncer.async_call())

    # Registry changes (new bulb, new room, re-home) trigger a debounced reconcile.
    entry.async_on_unload(
        hass.bus.async_listen(er.EVENT_ENTITY_REGISTRY_UPDATED, _schedule)
    )
    entry.async_on_unload(
        hass.bus.async_listen(ar.EVENT_AREA_REGISTRY_UPDATED, _schedule)
    )

    _register_services(hass)
    await async_register_panel(hass)

    # Initial reconcile (guarded by the engine's fail-safe).
    await _run_reconcile()
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
            title="Alexa Curator — preview",
            notification_id="alexa_curator_preview",
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
                title="Alexa Curator — Alexa rooms",
                notification_id="alexa_curator_rooms",
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
            title="Alexa Curator — Alexa rooms",
            notification_id="alexa_curator_rooms",
        )

    async def alexa_devices(call: ServiceCall) -> None:
        # EXPERIMENTAL. Default = preview (no writes). apply:true deregisters the
        # suggested-junk devices (protected ones are never touched), up to `limit`
        # per call so the first real run is a small, safe taste.
        from . import alexa_cloud

        from homeassistant.components import persistent_notification

        def _notify(msg: str) -> None:
            persistent_notification.async_create(
                hass, msg, title="Alexa Curator — device cleanup",
                notification_id="alexa_curator_devices",
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
