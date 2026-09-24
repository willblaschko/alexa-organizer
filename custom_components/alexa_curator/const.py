"""Constants and the exposure policy tables for Alexa Curator.

This module is PURE (stdlib only, no `homeassistant` imports) so the policy
tiers and tunables can be imported and unit-tested without a running HA — the
same split Chorus uses for const.py/sonos.py.
"""
from __future__ import annotations

DOMAIN = "alexa_curator"

# The Nabu Casa Alexa assistant id (verified against HA's KNOWN_ASSISTANTS —
# homeassistant.components.homeassistant.exposed_entities).
ASSISTANT = "cloud.alexa"

# Where HA stashes the ExposedEntities singleton on hass.data. Imported lazily
# where used (exposure.py) so this file stays HA-free; the string is stable.
DATA_EXPOSED_ENTITIES = "homeassistant.exposed_entities"

# Debounce window (seconds): bursts of registry events collapse into one
# reconcile.
DEBOUNCE_SECONDS = 5.0

# Stability contract / fail-safe. If a single reconcile would UNEXPOSE more than
# this many entities, we HOLD instead: a policy bug must never mass-unexpose and
# drop devices out of their Alexa Groups. Tunable; deliberately small.
MAX_REMOVALS = 5

# Debug service names.
SERVICE_RECONCILE = "reconcile"  # force an apply now
SERVICE_PREVIEW = "preview"  # dry-run: log/notify the diff, change nothing

# ── The opinionated exposure policy (docs/alexa.md tiers) ─────────────────────
# Decisions are made per DOMAIN (the part of an entity_id before the dot), then
# a small per-entity override allowlist/denylist tunes the edges. Phase 1 keeps
# lights simple (individual bulbs that have an area) — the per-area light-group
# opinion is Phase 3.

# Tier 1 — exposed by default, directly.
TIER1_DOMAINS: frozenset[str] = frozenset(
    {"media_player", "climate", "scene", "cover", "fan"}
)

# Lights are Tier 1 but get their own rule (area-scoped) — see policy.decide.
LIGHT_DOMAIN = "light"

# `script` is Tier 1 ONLY when tagged as a "voice scene". Phase 1 has no UI to
# tag, so a named allowlist stands in (the music-zone voice scripts + any the
# user adds here). Entries are full entity_ids.
VOICE_SCRIPT_ALLOWLIST: frozenset[str] = frozenset(
    {
        "script.play_music_everywhere",
        "script.play_music_upstairs",
        "script.play_music_downstairs",
        "script.stop_music_everywhere",
    }
)

# Tier 2 — off by default (togglable once the Phase 2 UI exists). Listed for
# clarity; Phase 1 simply does not expose them unless an entity is in
# EXTRA_ALLOW below.
TIER2_DOMAINS: frozenset[str] = frozenset({"lock", "camera", "switch", "vacuum"})

# Everything else (sensor, binary_sensor, number, button, event, automation,
# update, select, input_*, device_tracker, weather, sun, person, …) is Tier 3:
# never exposed. We express this as "not Tier 1 and not explicitly allowed".

# Per-entity overrides (the documented allowlist that lets Phase 1 reproduce the
# live ~67 keep-set so the first reconcile is a near-no-op). Full entity_ids.
#   EXTRA_ALLOW  — expose even though its domain isn't Tier 1 (light-like
#                  switches, the two Eufy vacuums, toggles used as voice targets).
#   EXTRA_DENY   — never expose even though its domain is Tier 1 (e.g. an HT
#                  satellite media_player, a utility scene).
# These are tuned against the real system during verification (the `preview`
# service shows the diff); ship conservative, widen as preview reveals gaps.
EXTRA_ALLOW: frozenset[str] = frozenset(set())
EXTRA_DENY: frozenset[str] = frozenset(set())
