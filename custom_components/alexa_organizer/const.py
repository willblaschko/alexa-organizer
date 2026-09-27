"""Constants and the exposure policy tables for Alexa Organizer.

This module is PURE (stdlib only, no `homeassistant` imports) so the policy
tiers and tunables can be imported and unit-tested without a running HA — the
same split Chorus uses for const.py/sonos.py.
"""
from __future__ import annotations

DOMAIN = "alexa_organizer"

# The Nabu Casa Alexa assistant id (verified against HA's KNOWN_ASSISTANTS —
# homeassistant.components.homeassistant.exposed_entities).
ASSISTANT = "cloud.alexa"

# Where HA stashes the ExposedEntities singleton on hass.data. Imported lazily
# where used (exposure.py) so this file stays HA-free; the string is stable.
DATA_EXPOSED_ENTITIES = "homeassistant.exposed_entities"

# Stability contract / fail-safe. If a single reconcile would UNEXPOSE more than
# this many entities, we HOLD instead: a policy bug must never mass-unexpose and
# drop devices out of their Alexa Groups. Tunable; deliberately small.
MAX_REMOVALS = 5

# Debug service names.
SERVICE_RECONCILE = "reconcile"  # force an apply now
SERVICE_PREVIEW = "preview"  # dry-run: log/notify the diff, change nothing
# Experimental device cleanup: preview (default) or, with apply:true, deregister the
# suggested-junk device registrations. Protected devices are never touched.
SERVICE_ALEXA_DEVICES = "alexa_devices"
# Experimental room sync: apply ONE room op (create / rename / delete) — the panel
# calls this per op so it can show per-op status like the Chorus change bar.
SERVICE_ROOM_OP = "room_op"
# Experimental: move ONE device between Alexa rooms (per-move, for panel status).
SERVICE_MOVE_DEVICE = "move_device"
# Experimental: remove ONE Alexa smart-home endpoint (per-op, for panel status).
SERVICE_FORGET_ENDPOINT = "forget_endpoint"
# Experimental: set ONE room's preferred speaker (brand-agnostic — Echo/Sonos/etc.).
SERVICE_SET_PREFERRED_SPEAKER = "set_preferred_speaker"
# Read-only diagnostic (returns response): each room's current preferred speaker + candidates.
SERVICE_ROOM_SPEAKERS = "room_speakers"
# Debug (returns response): run an arbitrary GraphQL body against Alexa. Temporary.
SERVICE_DEBUG_GRAPHQL = "debug_graphql"

# How many junk devices to remove per apply call when no explicit limit is given —
# small, so the first real run is a safe taste, not a 60-device sweep.
DEVICE_CLEANUP_DEFAULT_LIMIT = 5

# ── The opinionated exposure policy (docs/alexa.md tiers) ─────────────────────
# Decisions are made per DOMAIN (the part of an entity_id before the dot), then
# a small per-entity override allowlist/denylist tunes the edges. Phase 1 keeps
# lights simple (individual bulbs that have an area) — the per-area light-group
# opinion is Phase 3.

# NO hardcoded entity lists. Membership is a RULE per domain; the handful of
# things a rule can't infer (which scripts are voice scenes, which helpers are
# voice targets) are opted in/out with HA LABELS the user manages in the UI —
# nothing here goes stale when entity_ids churn.

# Tier 1 — exposed by default, directly, by domain.
TIER1_DOMAINS: frozenset[str] = frozenset(
    {"media_player", "climate", "scene", "cover", "fan", "vacuum"}
)

# Lights and switches get an area-scoped rule (see policy.decide): a `light` or a
# `switch` is exposed only if it has an HA area — a room-scoped target — which
# catches real room lights / light-switches and drops area-less junk (LED-indicator
# switches, integration plumbing). Config/diagnostic entities are excluded first.
AREA_SCOPED_DOMAINS: frozenset[str] = frozenset({"light", "switch"})

# Everything else (sensor, binary_sensor, number, button, event, automation,
# update, select, input_*, device_tracker, weather, sun, person, …) is Tier 3:
# never exposed unless force-labelled.

# ── Label overrides (the ONLY per-entity mechanism) ──────────────────────────
# The user tags entities in HA. An entity carrying EXPOSE_LABEL is force-exposed
# (this is how voice-scene scripts and voice-target helpers opt in); one carrying
# HIDE_LABEL is force-excluded (wins over everything). Matched by label NAME
# (case-insensitive) via the label registry, so the slug doesn't matter.
EXPOSE_LABEL = "alexa"
HIDE_LABEL = "alexa-hide"
