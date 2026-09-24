"""The opinionated exposure policy — which entities Alexa should see.

`decide(...)` is PURE (primitive args, no `homeassistant` import) so the tier
logic is unit-tested without a running HA. `desired_exposure(hass)` is the thin
HA-facing wrapper that reads the entity/area/device/label registries and calls
`decide` per entity; its `homeassistant` imports are lazy (inside the function)
so this module imports cleanly on the test runner's flat path too.

Membership is rule-based per domain. The only per-entity mechanism is HA LABELS:
an entity tagged EXPOSE_LABEL is force-exposed (how voice-scene scripts / voice
helpers opt in), one tagged HIDE_LABEL is force-excluded. No entity_id lists —
nothing to go stale when ids churn.
"""
from __future__ import annotations

# Dual-safe import: `.const` when loaded as a package (real HA), bare `const`
# when the test runner puts the package dir on sys.path and imports us flat.
try:  # pragma: no cover - trivial import plumbing
    from .const import (
        AREA_SCOPED_DOMAINS,
        EXPOSE_LABEL,
        HIDE_LABEL,
        TIER1_DOMAINS,
    )
except ImportError:  # pragma: no cover
    from const import (  # type: ignore[no-redef]
        AREA_SCOPED_DOMAINS,
        EXPOSE_LABEL,
        HIDE_LABEL,
        TIER1_DOMAINS,
    )


def classify(
    *,
    domain: str,
    has_area: bool,
    hidden: bool,
    has_entity_category: bool,
    force_expose: bool,
    force_hide: bool,
) -> tuple[bool, str]:
    """Return (should_expose, human reason). The reason drives the UI's "why" column.

    Order matters: a HIDE label is an absolute kill switch; then an EXPOSE label
    force-includes; then the universal "never expose hidden / config / diagnostic"
    rule; then the domain rules.
    """
    if force_hide:
        return False, "label: alexa-hide"
    if force_expose:
        return True, "label: alexa"

    # Hidden entities, and config/diagnostic ones (entity_category set), are never
    # voice targets.
    if hidden:
        return False, "hidden in HA"
    if has_entity_category:
        return False, "config/diagnostic"

    # Lights and switches must be room-scoped (have an area) — that's what makes a
    # clean "turn on the <room> lights" target and drops area-less junk.
    if domain in AREA_SCOPED_DOMAINS:
        if has_area:
            return True, f"rule: {domain} in a room"
        return False, f"{domain} has no room"

    # Tier 1 domains expose directly.
    if domain in TIER1_DOMAINS:
        return True, f"rule: {domain}"

    # Everything else stays hidden unless force-labelled above.
    return False, "not a voice target"


def decide(
    *,
    domain: str,
    has_area: bool,
    hidden: bool,
    has_entity_category: bool,
    force_expose: bool,
    force_hide: bool,
) -> bool:
    """Return True if this entity should be exposed to Alexa (the boolean of `classify`)."""
    return classify(
        domain=domain,
        has_area=has_area,
        hidden=hidden,
        has_entity_category=has_entity_category,
        force_expose=force_expose,
        force_hide=force_hide,
    )[0]


def desired_exposure(hass) -> set[str]:
    """Compute the set of entity_ids that SHOULD be exposed to Alexa right now.

    Reads the entity registry (and each entity's effective area, inherited from
    its device when the entity itself has none) plus the label registry, and
    applies `decide`.
    """
    from homeassistant.helpers import (  # lazy — keeps this module HA-free at import
        device_registry as dr,
        entity_registry as er,
        label_registry as lr,
    )

    ent_reg = er.async_get(hass)
    dev_reg = dr.async_get(hass)
    label_reg = lr.async_get(hass)

    # Resolve our label NAMES (case-insensitive) to their label_ids, since
    # entity_registry entries carry label_ids, not names.
    name_to_id = {lbl.name.lower(): lbl.label_id for lbl in label_reg.labels.values()}
    expose_id = name_to_id.get(EXPOSE_LABEL.lower())
    hide_id = name_to_id.get(HIDE_LABEL.lower())

    desired: set[str] = set()
    for entry in ent_reg.entities.values():
        if entry.disabled_by is not None:
            continue  # disabled entities can't be exposed anyway

        area_id = entry.area_id
        if area_id is None and entry.device_id is not None:
            device = dev_reg.async_get(entry.device_id)
            if device is not None:
                area_id = device.area_id

        labels = entry.labels or set()
        if decide(
            domain=entry.domain,
            has_area=area_id is not None,
            hidden=entry.hidden_by is not None,
            has_entity_category=entry.entity_category is not None,
            force_expose=expose_id is not None and expose_id in labels,
            force_hide=hide_id is not None and hide_id in labels,
        ):
            desired.add(entry.entity_id)

    return desired


def live_entity_ids(hass) -> set[str]:
    """Every entity_id that STILL EXISTS in HA (registry entries + state machine).

    Used by the engine's ghost-aware guard: a removal of an entity_id that isn't
    live is a stale exposure record (Sonos re-discovery churn leaves these), and
    cleaning it can't break an Alexa Group — so it must never count against the
    stability threshold the way removing a real speaker does.
    """
    from homeassistant.helpers import entity_registry as er  # lazy

    ent_reg = er.async_get(hass)
    live = {e.entity_id for e in ent_reg.entities.values() if e.disabled_by is None}
    live.update(hass.states.async_entity_ids())  # non-registry (e.g. template) entities
    return live
