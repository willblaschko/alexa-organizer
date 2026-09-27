# Alexa Organizer — services, policy & internals

The power-user reference: every action as a Home Assistant service, the full exposure
policy, how it works under the hood, and troubleshooting. For the overview, see the
[main README](../README.md).

---

## Services

Everything the panel does is also a service, under **Developer Tools → Actions** — the panel
calls these same ones. Devices and rooms are referenced by their Alexa **endpoint id** / room
id (use `room_speakers` below to find them).

| Service | What it does |
| --- | --- |
| `alexa_organizer.preview` | Dry run of the exposure policy — a notification listing what would be exposed or hidden. Changes nothing. |
| `alexa_organizer.reconcile` | Apply the exposure policy now. Holds large batches of removals (see [the safety guard](#the-safety-guard)); pass `max_removals` to raise it once. |
| `alexa_organizer.room_op` | Create, rename, or delete one Alexa room. |
| `alexa_organizer.move_device` | Move one device between Alexa rooms (`from` and/or `to`). |
| `alexa_organizer.rename_device` | Rename one Alexa device. It keeps its id and its room. |
| `alexa_organizer.set_preferred_speaker` | Make a speaker a room's main speaker, playing there for a plain "play music". |
| `alexa_organizer.alexa_devices` | Preview (default) or remove Amazon device registrations — suggested junk, or exactly the `endpoint_ids` you pass. Protected devices are never touched. |
| `alexa_organizer.forget_endpoint` | Remove one smart-home device from Alexa. |
| `alexa_organizer.room_speakers` | Report every room's main speaker, play mode, and speaker candidates. Returns a response; changes nothing. |

---

## The exposure policy

Membership is **rules, not lists**, so nothing goes stale when entity ids change.

| Domains | Exposed? |
| --- | --- |
| `media_player`, `climate`, `scene`, `cover`, `fan`, `vacuum` | ✅ always |
| `light`, `switch` | ✅ only if the entity has an HA **area** — drops area-less junk like LED-indicator switches |
| everything else (`sensor`, `binary_sensor`, `button`, `script`, `lock`, `camera`, `input_*`, …) | ❌ unless labelled |

Also never exposed: config/diagnostic entities (anything with an `entity_category`), hidden
entities, and a switch that shares a device with an exposed light (the light already covers
it).

### Labels

The few things no rule can infer, you mark with an HA label (Settings → Labels):

- **`alexa`** — force-expose (voice-scene scripts, voice-target helpers, a hidden light you
  still want).
- **`alexa-hide`** — force-exclude. Wins over everything.

Labels are matched by name and read live.

### The safety guard

Most "drift" in Alexa is **churn**: when a device is un-exposed and re-exposed, or its entity
id changes, Alexa treats it as a brand-new device and drops it from its room. So:

- Only **genuine changes** are applied — nothing already right is touched.
- The `reconcile` service **holds** a run that would un-expose more than 5 still-existing
  entities, and notifies you instead. (Removing a *ghost* — an entity id that no longer
  exists — is always safe and never counts.) The panel's Sync skips this hold, since you just
  reviewed exactly what it will do.
- Home Assistant's "expose new entities" is kept **off**, and nothing reconciles in the
  background.

---

## How it works

### Two halves

- **Exposure** goes through Home Assistant Cloud's standard Alexa connection. The organizer
  sets each entity's Alexa exposure via Home Assistant's exposed-entities store.
- **Rooms, placement, speakers, and cleanup** have no official API, for anyone. The
  organizer uses Alexa's internal GraphQL API — the one the Alexa app uses — borrowing the
  Amazon login of the **Alexa Devices** integration (preferred) or **Alexa Media Player**.
  Without either, the panel still handles exposure and shows Alexa as unavailable.

### Matching devices across systems

The same physical device can show up in Alexa more than once — an Echo, plus the copy
Home Assistant sends of that Echo's `media_player`. The organizer joins them into one device:

1. The Home Assistant copy names its entity exactly (its Alexa description is
   *"`media_player.x` via Home Assistant"*).
2. If that entity's device comes from **Alexa Media Player**, its identifier is the Echo's
   **serial number**, which matches the Echo's own Alexa entry.
3. Devices without a shared id (e.g. a Sonos, whose Home Assistant and Alexa ids differ)
   fall back to an exact, unambiguous name match.

Once joined, every action fans out: a move relocates both, a remove deletes the Echo and
stops sending the copy, and a device with protected parts is protected as a whole.

### Speakers

A room's main speaker must be a device Alexa can play to directly — an Echo, or a Sonos
linked through the Sonos Alexa skill. Home Assistant copies can't be (Alexa rejects them), so
they're never offered. The organizer also sets the room to play there **always**, not only
when you say the room's name.

### Naming

When you move an Echo, it can take its new room's name: the room part is swapped and the
rest kept ("Media Room Echo Show 5" → "Dining Room Echo Show 5"). A name without a room gets
it prepended; a clash gets a " 2" suffix. Only Echos are renamed — Sonos names come from the
Sonos app, and Home Assistant devices from Home Assistant.

---

## Troubleshooting

- **"Alexa unavailable" / no rooms shown** — log in to Alexa Media Player or Alexa Devices
  in Home Assistant; the organizer borrows that login.
- **A device you exposed isn't in Alexa yet** — Alexa takes a little while to discover new
  devices. The panel waits and refreshes after a sync; if it's still missing, say "Alexa,
  discover devices" and reopen the panel.
- **A speaker can't be made main** — it's probably a Home Assistant copy. Link the speaker in
  Alexa directly (Sonos → the Sonos skill), then it'll show up as a main-speaker option.
- **Something looks wrong in the plan** — untick it and sync the rest, then
  [open an issue](https://github.com/willblaschko/alexa-organizer/issues) with what you
  expected.

---

## Development

```
python3 tests/run.py                     # backend unit tests (no Home Assistant needed)
cd frontend && npm install && npm test   # frontend unit tests (Node 22+, zero deps)
npm run build                            # rebuilds the committed panel bundle
```

For iterating on a live instance: a git checkout of this repo in your Home Assistant
`/config`, then `git pull` + `ha core restart`.
