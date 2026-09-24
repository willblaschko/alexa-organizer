# Alexa Curator

**Make Home Assistant the source of truth for what Alexa sees.**

Home Assistant exposes *entities*; Alexa wants *things you'd say out loud*. The gap between
those is why keeping Alexa in sync is miserable — a flood of 1,000 entities, endless pruning
and re-organizing in the Alexa app, and devices that quietly drop out of their rooms.

Alexa Curator is **opinionated**. Instead of handing you a flat list to manage by hand, it
ships a strong policy about what belongs in Alexa, exposes exactly that, and keeps it in sync
as you add rooms and devices — while staying out of the way of the things Alexa alone controls.

> **Status: Phase 1 (the engine).** Hardcoded, opinionated policy + automatic reconcile. No
> UI yet (that's Phase 2) and no auto light-groups yet (Phase 3). A sibling project to
> [Chorus](https://github.com/willblaschko/chorus).

## What it does

- **De-clutters Alexa for good.** Only the entities that make sense as voice targets are
  exposed — room speakers, lights (that live in a room), climate, scenes, covers, fans, and
  the handful of scripts you tag as voice scenes. Sensors, buttons, config toggles, diagnostic
  junk: never.
- **Stays in sync automatically.** Add a bulb, add a room, re-home a device — Alexa Curator
  reconciles exposure within seconds. No trip to the Alexa app.
- **Owns the "expose new entities" default.** It keeps that OFF for Alexa, so nothing leaks in
  except through the policy.

## The honest scope

Amazon gives **no consumer API** for Alexa Groups or preferred-speaker room routing — that
pairing is app-only, for everyone. So:

| Your pain | What this fixes |
|---|---|
| **Clutter / a messy Alexa app** | ✅ Directly. The junk never reaches Alexa again. |
| **Room organization keeps drifting** | 🟡 Substantially — see the stability contract below. It can't *create* Alexa Groups, but it stops them from silently falling apart. |
| **Multi-room music routing** | 🔴 Mostly Amazon-side. Out of scope (a later version can expose your music scripts as Alexa scenes). |

### The stability contract

Most "drift" isn't you — it's **churn**. When a device is unexposed→re-exposed, or its
`entity_id` changes, Alexa treats it as *removed → new* and drops it out of its Alexa Group,
so "play music in the office" or "turn on the kitchen lights" stops finding it until you
re-add it in the app.

Alexa Curator is built around never causing that:

- It applies **only genuine changes** — an entity already in the right state is never touched
  (no flapping).
- A reconcile that would **unexpose more than a few entities HOLDS** its removals, logs loudly,
  and raises a notification. A policy mistake can never mass-unexpose your house and nuke every
  Alexa Group. (Additions always apply — they can't break routing.)

## The policy (Phase 1)

| Tier | Domains | Exposed? |
|---|---|---|
| **1** | `media_player` (room speakers), `light` (with an area), `climate`, `scene`, `cover`, `fan`; `script` tagged as a voice scene | ✅ by default |
| **2** | `lock`, `camera`, `switch`, `vacuum` | ❌ (per-entity opt-in via the allowlist for now; a UI toggle in Phase 2) |
| **3** | `sensor`, `binary_sensor`, `number`, `button`, `automation`, `update`, … | ❌ never |

Per-entity `EXTRA_ALLOW` / `EXTRA_DENY` lists in `const.py` tune the edges (light-like
switches, the specific voice scripts, an HT-satellite media_player to keep out). Lights are
individual-but-room-scoped in Phase 1; the flagship per-area **light groups** ("Kitchen
Lights") arrive in Phase 3.

## Install

HACS → ⋮ → **Custom repositories** → add `https://github.com/willblaschko/alexa-curator`
(category: *Integration*) → install → restart HA → **Settings › Devices & Services › Add
Integration › Alexa Curator**. Requires Home Assistant Cloud (Nabu Casa) with Alexa enabled.

## Use it

Two services (Developer Tools › Actions):

- **`alexa_curator.preview`** — dry run. Reports what *would* change (a notification + the log),
  changes nothing. **Run this first:** against an already-curated system it should be a
  near-no-op. A large diff means the policy needs tuning before you apply.
- **`alexa_curator.reconcile`** — apply now (respects the fail-safe hold).

Otherwise it runs itself: on startup and whenever your entities or areas change.

## Development

```
python3 tests/run.py     # pure unit tests (policy tiers + engine diff/guard), no HA needed
```

Deployed like Chorus: a git checkout in your HA `/config`, `git pull` + `ha core restart`.

## License

AGPL-3.0.
