# Alexa Curator

**Make Home Assistant the source of truth for what Alexa sees.**

Home Assistant exposes *entities*; Alexa wants *things you'd say out loud*. The gap between
those is why keeping Alexa in sync is miserable — a flood of 1,000 entities, endless pruning
and re-organizing in the Alexa app, and devices that quietly drop out of their rooms.

Alexa Curator is **opinionated**. Instead of handing you a flat list to manage by hand, it
ships a strong policy about what belongs in Alexa, exposes exactly that, and keeps it in sync
as you add rooms and devices — while staying out of the way of the things Alexa alone controls.

> **Status:** the reconcile engine and a sidebar **panel** (the exposure dashboard, grouped by
> your HA areas) are in. Per-area light groups and the **experimental [Alexa Room Sync](#experimental-alexa-room-sync)**
> are next. A sibling project to [Chorus](https://github.com/willblaschko/chorus).

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
| **Room organization keeps drifting** | 🟡 Substantially — see the stability contract below. The core can't *create* Alexa rooms (no official API), but it stops them from falling apart; the experimental [Alexa Room Sync](#experimental-alexa-room-sync) *can* push your HA areas into Alexa. |
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

Membership is **rules, not lists** — nothing to go stale when entity_ids churn:

| Tier | Domains | Exposed? |
|---|---|---|
| **1** | `media_player`, `climate`, `scene`, `cover`, `fan`, `vacuum` | ✅ by default |
| **area-scoped** | `light`, `switch` | ✅ only if the entity has an HA **area** (a room-scoped target; drops area-less junk) |
| **2** | `lock`, `camera` | ❌ (a UI toggle in Phase 2) |
| **3** | `sensor`, `binary_sensor`, `number`, `button`, `automation`, `script`, `input_*`, … | ❌ never — unless force-labelled |

Config/diagnostic entities (those with an `entity_category`) and hidden entities are never
exposed.

### Overrides are HA **labels**, not code

The handful of things no rule can infer — *which scripts are voice scenes, which helpers are
voice targets* — you mark with a label in HA (Settings › Labels, then tag the entity):

- Label an entity **`alexa`** → force-exposed (this is how voice-scene scripts and voice
  helpers opt in; also how you expose a *hidden* light you still want in Alexa).
- Label an entity **`alexa-hide`** → force-excluded (wins over everything).

The policy reads labels live. Nothing is hardcoded; you manage the exceptions in HA where
they belong. Lights are individual-but-room-scoped in Phase 1; the flagship per-area **light
groups** ("Kitchen Lights") arrive in Phase 3.

### Churn cleanup (the stability contract, in practice)

Sonos re-discovery leaves **stale exposure records** — entity_ids Alexa still lists for
speakers that were renamed or removed. The engine treats a removal of a **ghost** (an
entity_id that no longer exists) as always-safe cleanup, so it never trips the fail-safe.
Only removals of entities that *still exist* count against the safety threshold — and a large
batch of those is held with a notification until you approve it (see `max_removals` below).

## Install

HACS → ⋮ → **Custom repositories** → add `https://github.com/willblaschko/alexa-curator`
(category: *Integration*) → install → restart HA → **Settings › Devices & Services › Add
Integration › Alexa Curator**.

**Requirements:**
- **Home Assistant Cloud (Nabu Casa)** with Alexa enabled — the exposure path (the whole core).
- **Only for the experimental [Alexa Room Sync](#experimental-alexa-room-sync):** the
  [**Alexa Media Player**](https://github.com/alandtse/alexa_media_player) integration, installed
  and logged in. Room Sync piggybacks its Amazon session to reach Alexa's internal API. The
  exposure core does **not** need it.

## Use it

Open **Alexa Curator** in the sidebar (admin only): a dashboard grouped by your HA areas, then
by type (Lighting, Speakers, Climate, …), with a one-click on/off per entity — toggling writes
the `alexa` / `alexa-hide` label for you — a live preview of pending changes (split into live
vs. stale/ghost), and an **Apply** button.

Or drive it from two services (Developer Tools › Actions):

- **`alexa_curator.preview`** — dry run. Reports what *would* change (a notification + the log),
  split into live vs. stale/ghost removals; changes nothing. **Run this first.**
- **`alexa_curator.reconcile`** — apply now (respects the fail-safe hold). Takes an optional
  **`max_removals`** to raise the live-removal guard for one run — use a high value for the
  initial cleanup after you've reviewed a preview; omit it for the safe default afterward.

Otherwise it runs itself: on startup and whenever your entities or areas change.

## Experimental: Alexa Room Sync

> ⚠️ **Experimental, opt-in, and off by default.** This is the one part of Alexa Curator that
> leaves the safe, local path. It is **not** part of the robust exposure core and can break at
> any time.

The core makes Alexa *see* the right devices; Room Sync makes Alexa *organize* them the way
Home Assistant does — a **1:1 mirror of your HA areas → Alexa rooms**. It reconciles the two
one-directionally (HA is the source of truth): create rooms that are missing, rename to match,
delete the ghost/junk rooms, assign your exposed devices, and set the Sonos as preferred
speaker. Same opinionated, self-healing stance as the exposure engine — and the same safety:
a **Chorus-style action-list preview** (dry-run diff you review, expand per row), a per-room
opt-out, and a fail-safe guard so "force our format" never blindly nukes a room you meant to keep.

**How it authenticates.** There is **no official/sanctioned API** for Alexa rooms/groups — for
anyone. Room Sync uses Alexa's **internal, undocumented GraphQL API** (the same one the Alexa
app uses), reached by piggybacking the Amazon session held by the
[Alexa Media Player](https://github.com/alandtse/alexa_media_player) integration. So it
**requires Alexa Media Player installed and logged in**; without it, Room Sync stays dark and
the rest of Alexa Curator works normally.

**Know what you're opting into:**
- It's a **reverse-engineered, undocumented** API. Amazon can (and does) change it without
  notice — no stability guarantee.
- Using it is **against Amazon's Terms of Service**, and leans on Alexa Media Player's cookie
  auth (periodic re-login, credentials/2FA-seed on the box). Use it on your own account at your
  own risk.
- **Preferred speaker** is gated by Amazon to Echos + approved partners (e.g. Sonos); arbitrary
  speakers are rejected server-side.

## Development

```
python3 tests/run.py     # pure unit tests (policy tiers + engine diff/guard), no HA needed
```

Deployed like Chorus: a git checkout in your HA `/config`, `git pull` + `ha core restart`.

## License

AGPL-3.0.
