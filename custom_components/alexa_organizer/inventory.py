"""Backend for the sidebar panel: build the row view, and toggle exposure by label.

HA-facing (registry reads/writes). The pure policy decision lives in policy.classify;
this module just feeds it registry facts and shapes the result for the UI.
"""
from __future__ import annotations

from .const import AREA_SCOPED_DOMAINS, EXPOSE_LABEL, HIDE_LABEL, TIER1_DOMAINS
from . import exposure, policy
from .engine import compute_diff, ghost_removals, live_removals

# Domains worth listing in the UI — the realistic voice-target candidates. Sensor /
# binary_sensor / number / … are omitted so the list isn't 900 rows of noise; a power
# user can still force one on with a label in HA directly.
MANAGEABLE_DOMAINS: frozenset[str] = (
    TIER1_DOMAINS | AREA_SCOPED_DOMAINS | frozenset({"lock", "camera", "script", "input_boolean"})
)


def _area_name(hass, area_id: str | None) -> str | None:
    if area_id is None:
        return None
    from homeassistant.helpers import area_registry as ar

    area = ar.async_get(hass).async_get_area(area_id)
    return area.name if area else None


def _label_ids(hass) -> tuple[str | None, str | None]:
    """Resolve the expose/hide label NAMES to their label_ids (or None if not created)."""
    from homeassistant.helpers import label_registry as lr

    name_to_id = {lbl.name.lower(): lbl.label_id for lbl in lr.async_get(hass).labels.values()}
    return name_to_id.get(EXPOSE_LABEL.lower()), name_to_id.get(HIDE_LABEL.lower())


def _effective_area_id(hass, entry) -> str | None:
    area_id = entry.area_id
    if area_id is None and entry.device_id is not None:
        from homeassistant.helpers import device_registry as dr

        device = dr.async_get(hass).async_get(entry.device_id)
        if device is not None:
            area_id = device.area_id
    return area_id


def build_inventory(hass) -> dict:
    """The panel payload: per-entity rows + the preview summary.

    May raise ExposureUnavailable (from current_exposed) — the WS handler catches it.
    """
    from homeassistant.helpers import entity_registry as er

    ent_reg = er.async_get(hass)
    expose_id, hide_id = _label_ids(hass)
    current = exposure.current_exposed(hass)
    live = policy.live_entity_ids(hass)

    rows: list[dict] = []
    listed: set[str] = set()
    for entry in ent_reg.entities.values():
        if entry.disabled_by is not None or entry.domain not in MANAGEABLE_DOMAINS:
            continue
        area_id = _effective_area_id(hass, entry)
        labels = entry.labels or set()
        force_expose = expose_id is not None and expose_id in labels
        force_hide = hide_id is not None and hide_id in labels
        desired, reason = policy.classify(
            domain=entry.domain,
            has_area=area_id is not None,
            hidden=entry.hidden_by is not None,
            has_entity_category=entry.entity_category is not None,
            force_expose=force_expose,
            force_hide=force_hide,
        )
        rows.append(
            {
                "entity_id": entry.entity_id,
                # Prefer a human name: registry name, then the live friendly_name, then
                # the entity_id as a last resort (never show the raw id if we can help it).
                "name": entry.name
                or entry.original_name
                or ((s := hass.states.get(entry.entity_id)) and s.attributes.get("friendly_name"))
                or entry.entity_id,
                "domain": entry.domain,
                "area": _area_name(hass, area_id),
                "desired": desired,
                "exposed": entry.entity_id in current,
                "reason": reason,
                "overridden": force_expose or force_hide,
                "ghost": False,
            }
        )
        listed.add(entry.entity_id)

    # Ghost rows: currently exposed to Alexa but no longer a live entity (churn debris).
    for entity_id in sorted(current):
        if entity_id in listed or entity_id in live:
            continue
        rows.append(
            {
                "entity_id": entity_id,
                "name": entity_id,
                "domain": entity_id.split(".")[0],
                "area": None,
                "desired": False,
                "exposed": True,
                "reason": "stale record — will be cleaned",
                "overridden": False,
                "ghost": True,
            }
        )

    rows.sort(key=lambda r: (r["ghost"], r["domain"], r["name"].lower()))

    diff = compute_diff(policy.desired_exposure(hass), current)
    summary = {
        "expose": len(diff.to_add),
        "live_remove": len(live_removals(diff, live)),
        "ghost_remove": len(ghost_removals(diff, live)),
    }
    return {"rows": rows, "summary": summary}


def _ensure_label_id(hass, name: str) -> str:
    """Return the label_id for a label NAME, creating the label if it doesn't exist."""
    from homeassistant.helpers import label_registry as lr

    label_reg = lr.async_get(hass)
    for lbl in label_reg.labels.values():
        if lbl.name.lower() == name.lower():
            return lbl.label_id
    return label_reg.async_create(name=name).label_id


def set_desired(hass, entity_id: str, want_on: bool) -> None:
    """Make an entity's desired exposure match `want_on` using the fewest labels.

    A label is only added when it overrides the rule: to turn ON something a rule
    wouldn't expose, add `alexa`; to turn OFF something a rule would expose, add
    `alexa-hide`. Otherwise both override labels are cleared (back to the rule).
    """
    from homeassistant.helpers import entity_registry as er

    ent_reg = er.async_get(hass)
    entry = ent_reg.async_get(entity_id)
    if entry is None:
        return  # ghost / unknown — nothing to label

    area_id = _effective_area_id(hass, entry)
    rule_on, _ = policy.classify(
        domain=entry.domain,
        has_area=area_id is not None,
        hidden=entry.hidden_by is not None,
        has_entity_category=entry.entity_category is not None,
        force_expose=False,
        force_hide=False,
    )

    expose_id = _ensure_label_id(hass, EXPOSE_LABEL)
    hide_id = _ensure_label_id(hass, HIDE_LABEL)

    labels = set(entry.labels or set())
    labels.discard(expose_id)
    labels.discard(hide_id)
    if want_on and not rule_on:
        labels.add(expose_id)
    elif not want_on and rule_on:
        labels.add(hide_id)

    ent_reg.async_update_entity(entity_id, labels=labels)
