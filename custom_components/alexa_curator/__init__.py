"""Alexa Curator — make Home Assistant the source of truth for what Alexa sees.

Phase 1 is the reconcile engine: a hardcoded, opinionated policy computes the
desired Alexa-exposed set, diffs it against the current exposure, and applies
only the genuine changes — on startup and whenever the entity/area registries
change (debounced). No UI yet (Phase 2); no auto light-groups yet (Phase 3).
"""
from __future__ import annotations

import logging

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.helpers import area_registry as ar, entity_registry as er
from homeassistant.helpers.debounce import Debouncer

from . import engine, exposure
from .const import (
    DEBOUNCE_SECONDS,
    DOMAIN,
    MAX_REMOVALS,
    SERVICE_PREVIEW,
    SERVICE_RECONCILE,
)

_LOGGER = logging.getLogger(__name__)

_ALL_SERVICES = (SERVICE_RECONCILE, SERVICE_PREVIEW)


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

    # Initial reconcile (guarded by the engine's fail-safe).
    await _run_reconcile()
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry and, if it's the last, remove the services."""
    hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    if not hass.data.get(DOMAIN):
        for service in _ALL_SERVICES:
            hass.services.async_remove(DOMAIN, service)
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

    hass.services.async_register(
        DOMAIN,
        SERVICE_RECONCILE,
        reconcile,
        schema=vol.Schema({vol.Optional("max_removals"): vol.All(vol.Coerce(int), vol.Range(min=0))}),
    )
    hass.services.async_register(DOMAIN, SERVICE_PREVIEW, preview)
