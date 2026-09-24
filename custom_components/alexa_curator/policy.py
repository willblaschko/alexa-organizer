"""The opinionated exposure policy — which entities Alexa should see.

`decide(...)` is PURE (primitive args, no `homeassistant` import) so the tier
logic is unit-tested without a running HA. `desired_exposure(hass)` is the thin
HA-facing wrapper that reads the entity/area/device registries and calls
`decide` per entity; its `homeassistant` imports are lazy (inside the function)
so this module imports cleanly on the test runner's flat path too.
"""
from __future__ import annotations

# Dual-safe import: `.const` when loaded as a package (real HA), bare `const`
# when the test runner puts the package dir on sys.path and imports us flat.
try:  # pragma: no cover - trivial import plumbing
    from .const import (
        EXTRA_ALLOW,
        EXTRA_DENY,
        LIGHT_DOMAIN,
        TIER1_DOMAINS,
        VOICE_SCRIPT_ALLOWLIST,
    )
except ImportError:  # pragma: no cover
    from const import (  # type: ignore[no-redef]
        EXTRA_ALLOW,
        EXTRA_DENY,
        LIGHT_DOMAIN,
        TIER1_DOMAINS,
        VOICE_SCRIPT_ALLOWLIST,
    )


def decide(
    *,
    entity_id: str,
    domain: str,
    has_area: bool,
    hidden: bool,
    has_entity_category: bool,
) -> bool:
    """Return True if this entity should be exposed to Alexa.

    Order matters: explicit per-entity overrides win, then the universal
    "never expose hidden / config / diagnostic" rule, then the domain tiers.
    """
    # Per-entity overrides (the documented allowlist/denylist).
    if entity_id in EXTRA_DENY:
        return False
    if entity_id in EXTRA_ALLOW:
        return True

    # Hidden entities, and config/diagnostic ones (entity_category set), are
    # never voice targets.
    if hidden or has_entity_category:
        return False

    # Lights: Phase 1 exposes an individual bulb only if it belongs to an area
    # (a room-scoped target). The per-area light-GROUP opinion is Phase 3.
    if domain == LIGHT_DOMAIN:
        return has_area

    # Tier 1 domains expose directly.
    if domain in TIER1_DOMAINS:
        return True

    # Scripts expose only when tagged a "voice scene" (Phase 1: the allowlist).
    if domain == "script":
        return entity_id in VOICE_SCRIPT_ALLOWLIST

    # Everything else (Tier 2 off-by-default, Tier 3 never) stays hidden until a
    # future UI toggle or an EXTRA_ALLOW entry opts it in.
    return False


def desired_exposure(hass) -> set[str]:
    """Compute the set of entity_ids that SHOULD be exposed to Alexa right now.

    Reads the entity registry (and each entity's effective area, inherited from
    its device when the entity itself has none) and applies `decide`.
    """
    from homeassistant.helpers import (  # lazy — keeps this module HA-free at import
        device_registry as dr,
        entity_registry as er,
    )

    ent_reg = er.async_get(hass)
    dev_reg = dr.async_get(hass)

    desired: set[str] = set()
    for entry in ent_reg.entities.values():
        if entry.disabled_by is not None:
            continue  # disabled entities can't be exposed anyway

        area_id = entry.area_id
        if area_id is None and entry.device_id is not None:
            device = dev_reg.async_get(entry.device_id)
            if device is not None:
                area_id = device.area_id

        if decide(
            entity_id=entry.entity_id,
            domain=entry.domain,
            has_area=area_id is not None,
            hidden=entry.hidden_by is not None,
            has_entity_category=entry.entity_category is not None,
        ):
            desired.add(entry.entity_id)

    return desired
