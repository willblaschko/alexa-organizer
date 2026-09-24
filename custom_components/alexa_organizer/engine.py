"""The reconcile engine: desired exposure vs. current, apply only the difference.

The diff math (`compute_diff`) and the fail-safe check (`removal_is_safe`) are
PURE and unit-tested. `async_reconcile` wires them to HA: read desired (policy)
and current (exposure), diff, enforce the stability contract, apply.

Stability contract: never flap. We only expose the genuinely-new and unexpose
the genuinely-gone; entities already in the right state are never touched. And a
reconcile that would UNEXPOSE more than MAX_REMOVALS entities HOLDS its removals
— a policy bug must never mass-unexpose and drop devices out of their Alexa
Groups. Additions are always safe (they never break group routing), so they
still apply.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

# Dual-safe import (see policy.py): package path in HA, flat path under the runner.
try:  # pragma: no cover - import plumbing
    from .const import MAX_REMOVALS
except ImportError:  # pragma: no cover
    from const import MAX_REMOVALS  # type: ignore[no-redef]

_LOGGER = logging.getLogger(__name__)

HOLD_NOTIFICATION_ID = "alexa_organizer_hold"


@dataclass(frozen=True)
class Diff:
    """What a reconcile would change."""

    to_add: frozenset[str]
    to_remove: frozenset[str]

    @property
    def is_noop(self) -> bool:
        return not self.to_add and not self.to_remove


def compute_diff(desired: set[str] | frozenset[str], current: set[str] | frozenset[str]) -> Diff:
    """Pure set diff: what to expose (desired−current), what to unexpose (current−desired)."""
    desired_set = set(desired)
    current_set = set(current)
    return Diff(
        to_add=frozenset(desired_set - current_set),
        to_remove=frozenset(current_set - desired_set),
    )


def live_removals(diff: Diff, live_ids: set[str] | frozenset[str] | None) -> frozenset[str]:
    """The removals that target entities which STILL EXIST.

    `live_ids is None` means "assume everything is live" (no ghost info) — then
    every removal counts. Otherwise, removals of entity_ids not in `live_ids` are
    ghosts (stale exposure records) and are excluded here.
    """
    if live_ids is None:
        return diff.to_remove
    live = set(live_ids)
    return frozenset(e for e in diff.to_remove if e in live)


def ghost_removals(diff: Diff, live_ids: set[str] | frozenset[str] | None) -> frozenset[str]:
    """The removals that target entity_ids no longer present in HA (safe to clean)."""
    if live_ids is None:
        return frozenset()
    live = set(live_ids)
    return frozenset(e for e in diff.to_remove if e not in live)


def removal_is_safe(
    diff: Diff,
    max_removals: int = MAX_REMOVALS,
    live_ids: set[str] | frozenset[str] | None = None,
) -> bool:
    """The stability guard: are the LIVE unexposures within the safe threshold?

    Ghost removals (entities that no longer exist) never count — cleaning a stale
    record can't drop a real device out of an Alexa Group.
    """
    return len(live_removals(diff, live_ids)) <= max_removals


def describe(diff: Diff, live_ids: set[str] | frozenset[str] | None = None) -> str:
    """A short human summary of a diff for logs / the preview notification.

    With `live_ids`, removals are split into live (real devices) vs. stale/ghost
    (entity_ids that no longer exist) so the reader sees churn cleanup for what it is.
    """
    if diff.is_noop:
        return "No changes — Alexa exposure already matches the policy."
    live_rm = live_removals(diff, live_ids)
    ghosts = ghost_removals(diff, live_ids)
    lines = [
        f"+{len(diff.to_add)} to expose, -{len(diff.to_remove)} to unexpose "
        f"({len(live_rm)} live, {len(ghosts)} stale/ghost)."
    ]
    if diff.to_add:
        lines.append("Expose: " + ", ".join(sorted(diff.to_add)))
    if live_rm:
        lines.append("Unexpose (live): " + ", ".join(sorted(live_rm)))
    if ghosts:
        lines.append("Clean stale records: " + ", ".join(sorted(ghosts)))
    return "\n".join(lines)


async def async_reconcile(hass, *, dry_run: bool = False, max_removals: int = MAX_REMOVALS) -> Diff:
    """Read desired/current, diff, and (unless dry_run) apply within the guard.

    Raises `ExposureUnavailable` if HA's exposure API can't be read — after
    logging + a HOLD notification — so setup/services can swallow it quietly.
    """
    from . import exposure, policy
    from .exposure import ExposureUnavailable

    try:
        desired = policy.desired_exposure(hass)
        current = exposure.current_exposed(hass)
        live = policy.live_entity_ids(hass)
    except ExposureUnavailable as err:
        _hold(hass, f"Can't read Alexa exposure state ({err}). Holding — nothing changed.")
        raise

    diff = compute_diff(desired, current)
    ghosts = ghost_removals(diff, live)
    live_rm = live_removals(diff, live)

    if dry_run:
        _LOGGER.info("Alexa Organizer preview: %s", describe(diff, live))
        return diff

    if diff.is_noop:
        _LOGGER.debug("Alexa Organizer: exposure already matches policy; nothing to do.")
        return diff

    # Ghost removals (entities that no longer exist) never count against the guard —
    # cleaning a stale record can't drop a real device out of an Alexa Group.
    safe = removal_is_safe(diff, max_removals, live)

    try:
        # Additions always apply — they never break Alexa Group routing.
        for entity_id in sorted(diff.to_add):
            exposure.set_exposed(hass, entity_id, True)
        # Stale/ghost records always get cleaned.
        for entity_id in sorted(ghosts):
            exposure.set_exposed(hass, entity_id, False)
        # Live removals apply only within the stability guard.
        if safe:
            for entity_id in sorted(live_rm):
                exposure.set_exposed(hass, entity_id, False)
    except ExposureUnavailable as err:
        _hold(hass, f"Alexa exposure API failed mid-apply ({err}). Some changes may be partial.")
        raise

    if safe:
        _LOGGER.info("Alexa Organizer reconciled: %s", describe(diff, live))
    else:
        _hold(
            hass,
            f"Alexa Organizer held a large unexposure: the policy would remove "
            f"{len(live_rm)} LIVE entities (> {max_removals}). Exposed "
            f"{len(diff.to_add)} additions and cleaned {len(ghosts)} stale records; "
            f"live removals NOT applied. Review the policy (or run "
            f"alexa_organizer.reconcile with a higher max_removals once), then re-run. "
            f"Would remove (live): " + ", ".join(sorted(live_rm)),
        )

    return diff


def _hold(hass, message: str) -> None:
    """Log loudly and raise a persistent notification — the visible fail-safe."""
    _LOGGER.error(message)
    try:
        from homeassistant.components import persistent_notification

        persistent_notification.async_create(
            hass, message, title="Alexa Organizer", notification_id=HOLD_NOTIFICATION_ID
        )
    except Exception:  # noqa: BLE001 - notification is best-effort; never mask the real error
        pass
