"""Compat shim over Home Assistant's INTERNAL exposure API.

Everything that touches `homeassistant.components.homeassistant.exposed_entities`
lives HERE and nowhere else, because that module is not a blessed public API (the
core PR to make it public was never merged). Isolating it means one place to
version-guard, and a single failure mode — `ExposureUnavailable` — that the
engine turns into a fail-safe HOLD instead of a crash or a silent wrong answer.

Verified signatures (HA dev, 2026): the module functions are synchronous
`@callback`s — do NOT await them.
  async_get_assistant_settings(hass, assistant) -> {entity_id: {opt: val}}
  async_expose_entity(hass, assistant, entity_id, should_expose) -> None
The expose-new default lives on the ExposedEntities singleton (no module wrapper):
  hass.data[DATA_EXPOSED_ENTITIES].async_set_expose_new_entities(assistant, bool)
"""
from __future__ import annotations

import logging

from .const import ASSISTANT, DATA_EXPOSED_ENTITIES

_LOGGER = logging.getLogger(__name__)


class ExposureUnavailable(RuntimeError):
    """HA's internal exposure API isn't importable / shaped as expected.

    The engine catches this and HOLDS (never mass-unexposes on a broken API).
    """


def _module():
    try:
        from homeassistant.components.homeassistant import exposed_entities
    except ImportError as err:  # HA internals moved/renamed
        raise ExposureUnavailable(
            "homeassistant.components.homeassistant.exposed_entities is not importable"
        ) from err
    return exposed_entities


def current_exposed(hass) -> set[str]:
    """Every entity_id currently exposed to Alexa (should_expose is True).

    Entities never touched don't appear here — their effective state is governed
    by the expose-new default, which we own and keep OFF.
    """
    module = _module()
    try:
        settings = module.async_get_assistant_settings(hass, ASSISTANT)
    except AttributeError as err:  # signature drift
        raise ExposureUnavailable("async_get_assistant_settings missing/changed") from err
    return {
        entity_id
        for entity_id, opts in settings.items()
        if opts.get("should_expose") is True
    }


def set_exposed(hass, entity_id: str, should_expose: bool) -> None:
    """Expose or unexpose one entity for Alexa. Synchronous @callback — no await."""
    module = _module()
    try:
        module.async_expose_entity(hass, ASSISTANT, entity_id, should_expose)
    except AttributeError as err:
        raise ExposureUnavailable("async_expose_entity missing/changed") from err


def set_expose_new(hass, expose_new: bool) -> None:
    """Own the 'expose new entities' default for Alexa (we keep it OFF)."""
    singleton = hass.data.get(DATA_EXPOSED_ENTITIES)
    if singleton is None:
        raise ExposureUnavailable("ExposedEntities singleton not present on hass.data")
    try:
        singleton.async_set_expose_new_entities(ASSISTANT, expose_new)
    except AttributeError as err:
        raise ExposureUnavailable("async_set_expose_new_entities missing/changed") from err
