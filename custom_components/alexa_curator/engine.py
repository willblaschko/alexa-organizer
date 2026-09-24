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

HOLD_NOTIFICATION_ID = "alexa_curator_hold"


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


def removal_is_safe(diff: Diff, max_removals: int = MAX_REMOVALS) -> bool:
    """The stability guard: is the number of unexposures within the safe threshold?"""
    return len(diff.to_remove) <= max_removals


def describe(diff: Diff) -> str:
    """A short human summary of a diff for logs / the preview notification."""
    if diff.is_noop:
        return "No changes — Alexa exposure already matches the policy."
    lines = [f"+{len(diff.to_add)} to expose, -{len(diff.to_remove)} to unexpose."]
    if diff.to_add:
        lines.append("Expose: " + ", ".join(sorted(diff.to_add)))
    if diff.to_remove:
        lines.append("Unexpose: " + ", ".join(sorted(diff.to_remove)))
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
    except ExposureUnavailable as err:
        _hold(hass, f"Can't read Alexa exposure state ({err}). Holding — nothing changed.")
        raise

    diff = compute_diff(desired, current)

    if dry_run:
        _LOGGER.info("Alexa Curator preview: %s", describe(diff))
        return diff

    if diff.is_noop:
        _LOGGER.debug("Alexa Curator: exposure already matches policy; nothing to do.")
        return diff

    safe = removal_is_safe(diff, max_removals)

    try:
        # Additions always apply — they never break Alexa Group routing.
        for entity_id in sorted(diff.to_add):
            exposure.set_exposed(hass, entity_id, True)
        # Removals apply only within the stability guard.
        if safe:
            for entity_id in sorted(diff.to_remove):
                exposure.set_exposed(hass, entity_id, False)
    except ExposureUnavailable as err:
        _hold(hass, f"Alexa exposure API failed mid-apply ({err}). Some changes may be partial.")
        raise

    if safe:
        _LOGGER.info("Alexa Curator reconciled: %s", describe(diff))
    else:
        _hold(
            hass,
            "Alexa Curator held a large unexposure: the policy would remove "
            f"{len(diff.to_remove)} entities (> {max_removals}). Exposed "
            f"{len(diff.to_add)} additions only; removals NOT applied. Review the "
            f"policy, then run alexa_curator.reconcile. Would remove: "
            + ", ".join(sorted(diff.to_remove)),
        )

    return diff


def _hold(hass, message: str) -> None:
    """Log loudly and raise a persistent notification — the visible fail-safe."""
    _LOGGER.error(message)
    try:
        from homeassistant.components import persistent_notification

        persistent_notification.async_create(
            hass, message, title="Alexa Curator", notification_id=HOLD_NOTIFICATION_ID
        )
    except Exception:  # noqa: BLE001 - notification is best-effort; never mask the real error
        pass
