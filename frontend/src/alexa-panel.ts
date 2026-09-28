import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  projectBoard,
  roomRename,
  type BoardDevice,
  type BoardRoom,
  type Plan,
  type PlanGroup,
  type PlanOp,
} from "./board-layout.js";
import { planLanes } from "./queue.js";
import { ICON, type IconName } from "./icons.js";

// Minimal shape of the objects HA hands a custom panel.
interface HomeAssistant {
  connection: {
    sendMessagePromise<T>(msg: Record<string, unknown>): Promise<T>;
  };
  callService(domain: string, service: string, data?: Record<string, unknown>): Promise<unknown>;
}

// Opinionated within-room type grouping. Lighting collapses light + switch (a
// switch or plug driving a light is, to a voice user, a light). Order here is the
// order sections appear in each room; any domain not listed falls into "Other".
const KIND_GROUPS: ReadonlyArray<{ label: string; domains: readonly string[] }> = [
  { label: "Lighting", domains: ["light", "switch"] },
  { label: "Media", domains: ["media_player"] }, // TVs, receivers (real speakers get their own section)
  { label: "Climate", domains: ["climate", "fan"] },
  { label: "Scenes & routines", domains: ["scene", "script"] },
  { label: "Other", domains: ["cover", "vacuum", "lock", "camera", "input_boolean"] },
];
const KIND_OF: Record<string, number> = {};
KIND_GROUPS.forEach((g, i) => g.domains.forEach((d) => (KIND_OF[d] = i)));
const kindIndex = (domain: string) => KIND_OF[domain] ?? KIND_GROUPS.length - 1;

// Brand of an endpoint from its real manufacturer (not device_type — a Sonos linked via the
// Sonos-Alexa skill carries an Amazon device_type yet is made by Sonos).
const isAmazon = (d: { manufacturer?: string }) => (d.manufacturer ?? "").toLowerCase().includes("amazon");

const svgIcon = (name: IconName, cls = ""): TemplateResult =>
  html`<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d=${ICON[name]}></path></svg>`;

// A device's icon: its HA domain when it has one, else its Alexa display category.
const DOMAIN_ICON: Record<string, IconName> = {
  light: "bulb", switch: "toggle", input_boolean: "toggle", media_player: "speaker", climate: "thermostat",
  fan: "fan", scene: "scene", script: "script", cover: "cover", vacuum: "vacuum", lock: "lock", camera: "camera",
};
const CATEGORY_ICON: Record<string, IconName> = {
  LIGHT: "bulb", SWITCH: "toggle", SMARTPLUG: "toggle", TV: "tv", STREAMING_DEVICE: "tv", GAME_CONSOLE: "tv",
  SPEAKER: "speaker", ALEXA_VOICE_ENABLED: "speaker", THERMOSTAT: "thermostat", FAN: "fan",
  SCENE_TRIGGER: "scene", ACTIVITY_TRIGGER: "scene", INTERIOR_BLIND: "cover", EXTERIOR_BLIND: "cover",
  VACUUM_CLEANER: "vacuum", SMARTLOCK: "lock", CAMERA: "camera", PHONE: "phone", MOBILE_PHONE: "phone",
};
const deviceIcon = (d: BoardDevice): IconName => {
  if (d.domain === "media_player" && d.category === "TV") return "tv";
  return (d.domain && DOMAIN_ICON[d.domain]) || (d.category && CATEGORY_ICON[d.category]) || (d.is_speaker ? "speaker" : "device");
};
// The review sheet's group icons.
const GROUP_ICON: Record<string, IconName> = {
  expose: "eyeoff", rooms: "home", place: "arrow", rename: "pencil", speakers: "note",
  cleanup_devices: "trash", cleanup_endpoints: "trash", rooms_delete: "trash",
};
const joinDot = (parts: TemplateResult[]): TemplateResult[] =>
  parts.flatMap((p, i) => (i ? [html`<span class="sep"> · </span>`, p] : [p]));

// The app icon, inline (a house of room tiles with voice bars — Chorus's sibling).
const BRAND_MARK = html`<svg class="brand" viewBox="0 0 512 512" aria-hidden="true">
  <rect width="512" height="512" rx="112" fill="#0d1628"/>
  <path d="M256 92 L420 222 L420 408 L92 408 L92 222 Z" fill="#2c3368" stroke="#2c3368" stroke-width="36" stroke-linejoin="round"/>
  <rect x="128" y="238" width="118" height="70" rx="18" fill="#4a86ff"/><rect x="266" y="238" width="118" height="70" rx="18" fill="#1fc6c4"/>
  <rect x="128" y="328" width="118" height="70" rx="18" fill="#8f7ef7"/><rect x="266" y="328" width="118" height="70" rx="18" fill="#4a86ff"/>
  <rect x="219" y="168" width="18" height="44" rx="9" fill="#4a86ff"/><rect x="247" y="152" width="18" height="60" rx="9" fill="#1fc6c4"/>
  <rect x="275" y="176" width="18" height="36" rx="9" fill="#8f7ef7"/>
</svg>`;

@customElement("alexa-panel")
export class AlexaPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public narrow = false;

  @state() private _plan: Plan | null = null;
  @state() private _planBusy = false;
  @state() private _accepted = new Set<string>(); // plan op ids the user will apply
  @state() private _reviewOpen = false;
  @state() private _opStatus: Record<string, string> = {}; // op id -> pending/running/done/error
  @state() private _applying = false;
  @state() private _userMove: Record<string, string> = {}; // endpoint id -> room/#area# value the user chose
  @state() private _userPref: Record<string, string> = {}; // room id -> chosen main-speaker endpoint id
  @state() private _userRemove: Record<string, PlanOp> = {}; // op id -> a removal op the user staged inline
  @state() private _expandedGroups = new Set<string>(); // review groups shown expanded
  @state() private _openRow: string | null = null; // the device row expanded for editing
  @state() private _applyTotal = 0; // ops in the current sync (for the progress bar)
  @state() private _lastErrors = 0; // ops that failed in the last sync
  @state() private _justSynced = false; // the "Done" moment after a clean sync

  override connectedCallback(): void {
    super.connectedCallback();
    void this._loadPlan(); // the one opinionated plan drives the whole screen
  }

  protected override render(): TemplateResult {
    const staged =
      Object.keys(this._userMove).length + Object.keys(this._userPref).length + Object.keys(this._userRemove).length;
    return html`
      <div class="wrap">
        <header class="top">
          ${this.narrow ? html`<ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>` : nothing}
          ${BRAND_MARK}
          <div class="titles">
            <h1>Alexa Organizer</h1>
            <p class="sub">Home Assistant is your house. This keeps Alexa matched to it.</p>
          </div>
          <button
            class="iconbtn"
            title=${staged ? "Sync or undo your edits before checking again" : "Check Alexa again"}
            ?disabled=${this._planBusy || this._applying || staged > 0}
            @click=${() => this._loadPlan()}
          >
            ${svgIcon("refresh", this._planBusy && this._plan ? "spin" : "")}
          </button>
        </header>
        ${this._planView()}
      </div>
      ${this._reviewOpen ? this._reviewSheet() : nothing}
    `;
  }

  private async _loadPlan(): Promise<void> {
    if (this._planBusy) return;
    this._planBusy = true;
    try {
      const p = await this.hass.connection.sendMessagePromise<Plan>({
        type: "alexa_organizer/plan",
      });
      this._plan = p;
      const acc = new Set(
        (p.groups ?? []).flatMap((g) => g.ops).filter((o) => o.suggested).map((o) => o.id)
      );
      // An Echo the plan moves gets its match-the-room rename pre-checked too (opt-out).
      for (const o of this._renameOps(p.groups ?? [], acc)) acc.add(o.id);
      this._accepted = acc;
      this._opStatus = {};
      this._userMove = {};
      this._userPref = {};
      this._userRemove = {};
    } finally {
      this._planBusy = false;
    }
  }

  private _toggleOp(id: string): void {
    const next = new Set(this._accepted);
    next.has(id) ? next.delete(id) : next.add(id);
    this._accepted = next;
  }

  private get _acceptedCount(): number {
    const ids = new Set(this._effectiveGroups().flatMap((g) => g.ops).map((o) => o.id));
    let n = 0;
    for (const id of this._accepted) if (ids.has(id)) n++;
    return n;
  }

  // endpoint id -> its CURRENT room id ("" = no room), from the pristine plan board.
  private _endpointCurrentRoom(): Map<string, string> {
    const m = new Map<string, string>();
    const b = this._plan?.board;
    for (const r of b?.rooms ?? []) for (const d of r.devices) if (d.endpoint_id) m.set(d.endpoint_id, r.id ?? "");
    for (const d of b?.unroomed ?? []) if (d.endpoint_id) m.set(d.endpoint_id, "");
    return m;
  }

  // The other Alexa endpoints of the same physical device (its HA copy), from the pristine board.
  private _twinsOf(endpointId: string): { endpoint_id: string; room_id: string | null }[] {
    const b = this._plan?.board;
    for (const d of [...(b?.rooms ?? []).flatMap((r) => r.devices), ...(b?.unroomed ?? [])])
      if (d.endpoint_id === endpointId) return d.twins ?? [];
    return [];
  }

  private _deviceName(endpointId: string): string {
    const b = this._plan?.board;
    for (const d of [...(b?.rooms ?? []).flatMap((r) => r.devices), ...(b?.unroomed ?? [])])
      if (d.endpoint_id === endpointId) return d.name;
    return endpointId;
  }

  private _norm(s: string): string {
    return (s || "").trim().toLowerCase();
  }

  // Does an Alexa room already exist for this HA area name?
  private _areaHasRoom(area: string): boolean {
    return (this._plan?.board.rooms ?? []).some((r) => !!r.id && this._norm(r.name) === this._norm(area));
  }

  // The full change list: the plan + everything staged inline, plus a checkable "rename to
  // match the room" op for every accepted Echo move (Chorus-style name-follows-room).
  private _effectiveGroups(): PlanGroup[] {
    const groups = this._mergedGroups();
    const renames = this._renameOps(groups, this._accepted);
    if (!renames.length) return groups;
    const out = [...groups];
    const at = out.findIndex((g) => g.key === "place");
    out.splice(at >= 0 ? at + 1 : out.length, 0, {
      key: "rename", title: "Rename Echos to match their room", destructive: false, ops: renames,
    });
    return out;
  }

  // Rename ops for the accepted moves of Echos (Amazon devices only — a Sonos takes its name
  // from the Sonos app, and HA devices from HA). Name = the room part swapped for the target
  // room; clashes get a " 2" suffix. A move that's unchecked drops its rename with it.
  private _renameOps(groups: PlanGroup[], accepted: Set<string>): PlanOp[] {
    const b = this._plan?.board;
    if (!b) return [];
    const all = [...(b.rooms ?? []).flatMap((r) => r.devices), ...(b.unroomed ?? [])];
    const byEp = new Map(all.filter((d) => d.endpoint_id).map((d) => [d.endpoint_id as string, d]));
    const roomNames = (b.rooms ?? []).map((r) => r.name);
    const roomById = new Map((b.rooms ?? []).filter((r) => r.id).map((r) => [r.id as string, r.name]));
    const taken = new Set(all.map((d) => d.name));
    const ops: PlanOp[] = [];
    for (const o of groups.flatMap((g) => g.ops)) {
      const a = o.action;
      if (a.kind !== "move" || !a.endpoint_id || !accepted.has(o.id)) continue;
      const d = byEp.get(a.endpoint_id);
      if (!d || !isAmazon(d) || !d.is_speaker) continue; // Echos only — not Fire TVs / phones
      const target = (a.to && roomById.get(a.to as string)) || (a.area as string) || "";
      const name = roomRename(d.name, roomNames, target, taken);
      if (!name) continue;
      taken.add(name); // two Echos moving into one room get distinct names
      ops.push({
        id: `rename:${a.endpoint_id}`, group: "rename",
        title: `Rename ${d.name} → ${name}`, detail: "",
        suggested: true, destructive: false,
        action: { kind: "rename_device", endpoint_id: a.endpoint_id, name },
      });
    }
    return ops;
  }

  private _mergedGroups(): PlanGroup[] {
    const groups = this._plan?.groups ?? [];
    const touched = Object.keys(this._userMove);
    const prefRooms = Object.keys(this._userPref);
    const removeOps = Object.values(this._userRemove);
    if (touched.length === 0 && prefRooms.length === 0 && removeOps.length === 0) return groups;
    const cur = this._endpointCurrentRoom();
    const synth: PlanOp[] = [];
    const extraCreates: PlanOp[] = [];
    for (const [eid, value] of Object.entries(this._userMove)) {
      const current = cur.get(eid) ?? "";
      if (value === current) continue; // reverted / no change
      if (value.startsWith("#area#")) {
        // Move into an HA area: place there, creating the room first if Alexa lacks it.
        const area = value.slice(6);
        synth.push({
          id: `move:${eid}`, group: "place", title: `Put ${this._deviceName(eid)} in ${area}`,
          detail: this._areaHasRoom(area) ? "" : "creates the room",
          suggested: true, destructive: false,
          action: { kind: "move", endpoint_id: eid, from: current || null, to: "", area },
        });
        if (!this._areaHasRoom(area) && !extraCreates.some((o) => o.id === `room:create:${area}`)) {
          extraCreates.push({
            id: `room:create:${area}`, group: "rooms", title: `Create room ${area}`, detail: "for its devices",
            suggested: true, destructive: false,
            action: { kind: "room_op", op: "create", name: area },
          });
        }
      } else {
        synth.push({
          id: `move:${eid}`, group: "place", title: `Move ${this._deviceName(eid)}`, detail: "",
          suggested: true, destructive: false,
          action: { kind: "move", endpoint_id: eid, from: current || null, to: value },
        });
      }
    }
    // The user's explicit preferred-speaker picks become "preferred" ops, replacing any the
    // plan auto-proposed for that room.
    const prefSynth: PlanOp[] = prefRooms.map((roomId) => ({
      id: `pref:${roomId}`, group: "speakers",
      title: `Set the main speaker in ${this._roomName(roomId)}`, detail: "",
      suggested: true, destructive: false,
      action: { kind: "preferred", room_id: roomId, endpoint_id: this._userPref[roomId] },
    }));
    const prefRoomsSet = new Set(prefRooms);

    // User-staged inline removals, bucketed by their group key. An op replaces any base op of
    // the same id (a user removal that coincides with a plan-suggested one).
    const removeByGroup = new Map<string, PlanOp[]>();
    for (const o of removeOps) (removeByGroup.get(o.group) ?? removeByGroup.set(o.group, []).get(o.group)!).push(o);
    const removeIds = new Set(removeOps.map((o) => o.id));
    const REMOVE_TITLES: Record<string, string> = {
      cleanup_devices: "Delete devices", cleanup_endpoints: "Delete from Alexa", expose: "Exposure",
    };

    const touchedSet = new Set(touched);
    const drop = (o: PlanOp) => o.action.kind === "move" && !!o.action.endpoint_id && touchedSet.has(o.action.endpoint_id);
    const dropPref = (o: PlanOp) => o.action.kind === "preferred" && !!o.action.room_id && prefRoomsSet.has(o.action.room_id);
    const haveCreate = new Set(groups.flatMap((g) => g.ops).map((o) => o.id));
    const newCreates = extraCreates.filter((o) => !haveCreate.has(o.id));
    const seenRemoveGroups = new Set<string>();
    let sawPlace = false;
    let sawSpeakers = false;
    const withRemovals = (g: PlanGroup, ops: PlanOp[]): PlanOp[] => {
      const extra = removeByGroup.get(g.key);
      if (!extra) return ops;
      seenRemoveGroups.add(g.key);
      return [...ops.filter((o) => !removeIds.has(o.id)), ...extra];
    };
    const out = groups.map((g) => {
      if (g.key === "rooms") return { ...g, ops: withRemovals(g, [...g.ops, ...newCreates]) };
      if (g.key === "speakers") {
        sawSpeakers = true;
        return { ...g, ops: withRemovals(g, [...g.ops.filter((o) => !dropPref(o)), ...prefSynth]) };
      }
      if (g.key === "place") {
        sawPlace = true;
        return { ...g, ops: withRemovals(g, [...g.ops.filter((o) => !drop(o)), ...synth]) };
      }
      return { ...g, ops: withRemovals(g, g.ops) };
    });
    if (!groups.some((g) => g.key === "rooms") && newCreates.length)
      out.unshift({ key: "rooms", title: "Rooms", destructive: false, ops: newCreates });
    if (!sawPlace && synth.length)
      out.push({ key: "place", title: "Put devices in their room", destructive: false, ops: synth });
    if (!sawSpeakers && prefSynth.length)
      out.push({ key: "speakers", title: "Preferred speaker", destructive: false, ops: prefSynth });
    // Removal groups the plan didn't already have.
    for (const [key, ops] of removeByGroup)
      if (!seenRemoveGroups.has(key))
        out.push({ key, title: REMOVE_TITLES[key] ?? "Remove", destructive: true, ops });
    return out;
  }

  private _roomName(roomId: string): string {
    return (this._plan?.board.rooms ?? []).find((r) => r.id === roomId)?.name ?? roomId;
  }

  // The room's effective preferred speaker: the user's pick, else an accepted plan op, else current.
  private _effectivePreferred(room: BoardRoom): string | null {
    if (room.id && room.id in this._userPref) return this._userPref[room.id];
    const op = (this._plan?.groups ?? [])
      .flatMap((g) => g.ops)
      .find((o) => o.action.kind === "preferred" && o.action.room_id === room.id && this._accepted.has(o.id));
    return op ? (op.action.endpoint_id as string) : room.preferred_id;
  }

  private _onSetPreferred(roomId: string, endpointId: string): void {
    this._userPref = { ...this._userPref, [roomId]: endpointId };
    this._accepted = new Set(this._accepted).add(`pref:${roomId}`);
  }

  // Dropdown targets: every HA area (the source of truth, even without an Alexa room yet)
  // plus any Alexa-only rooms. HA areas that lack an Alexa room carry a "#area#" sentinel.
  private _homeRooms(): Array<{ value: string; name: string }> {
    return (this._plan?.board.rooms ?? [])
      .filter((r) => r.id || r.in_ha)
      .map((r) => ({ value: (r.id as string) || `#area#${r.name}`, name: r.name }));
  }

  // Every op needed to remove a device, by what it actually is: an Amazon device is
  // deregistered, a smart-home endpoint is forgotten, an HA-exposed device is un-exposed. A
  // merged device ALSO stops exposing its HA copy, so removing it clears both. Empty if there's
  // nothing removable (e.g. an unsynced HA row).
  private _removalOps(d: BoardDevice): PlanOp[] {
    const unexpose = (entity_id: string, title: string): PlanOp => ({
      id: `expose:${entity_id}`, group: "expose",
      title, detail: "removes the Home Assistant copy",
      suggested: true, destructive: true,
      action: { kind: "expose", entity_id, to: false },
    });
    if (d.source === "ha" && d.entity_id) return [unexpose(d.entity_id, `Stop sending ${d.name} to Alexa`)];
    if (!d.endpoint_id) return [];
    const ops: PlanOp[] = [
      d.source === "echo"
        ? {
            id: `rmdev:${d.endpoint_id}`, group: "cleanup_devices",
            title: `Delete ${d.name}`, detail: "removes this device from Alexa",
            suggested: true, destructive: true,
            action: { kind: "remove_device", endpoint_id: d.endpoint_id },
          }
        : {
            id: `rmep:${d.endpoint_id}`, group: "cleanup_endpoints",
            title: `Delete ${d.name}`, detail: "removes this from Alexa",
            suggested: true, destructive: true,
            action: { kind: "remove_endpoint", endpoint_id: d.endpoint_id },
          },
    ];
    if (d.twin_entity_id) ops.push(unexpose(d.twin_entity_id, `Stop sending ${d.name}'s Home Assistant copy`));
    return ops;
  }

  private _onRemove(d: BoardDevice): void {
    const ops = this._removalOps(d);
    if (!ops.length) return;
    const staged = { ...this._userRemove };
    const accepted = new Set(this._accepted);
    const on = !(ops[0].id in staged); // toggle the whole device together
    for (const op of ops) {
      if (on) {
        staged[op.id] = op;
        accepted.add(op.id);
      } else {
        delete staged[op.id];
        accepted.delete(op.id);
      }
    }
    this._userRemove = staged;
    this._accepted = accepted;
  }

  private _onHomeMove(endpointId: string, value: string): void {
    const current = this._endpointCurrentRoom().get(endpointId) ?? "";
    this._userMove = { ...this._userMove, [endpointId]: value };
    const acc = new Set(this._accepted);
    const moveId = `move:${endpointId}`;
    if (value === current) acc.delete(moveId);
    else acc.add(moveId);
    if (value.startsWith("#area#")) {
      const area = value.slice(6);
      if (!this._areaHasRoom(area)) acc.add(`room:create:${area}`);
    }
    // A fresh move of an Echo pre-checks its match-the-room rename (uncheck it in the review
    // to keep the current name). Re-evaluated on every pick, so the name tracks the target.
    const renameId = `rename:${endpointId}`;
    acc.delete(renameId);
    if (value !== current && this._renameOps(this._mergedGroups(), acc).some((o) => o.id === renameId))
      acc.add(renameId);
    this._accepted = acc;
  }

  private _planEndpointCount(): number {
    const rooms = this._plan?.board.rooms ?? [];
    const unroomed = this._plan?.board.unroomed ?? [];
    return (
      rooms.reduce((n, r) => n + r.devices.filter((d) => d.endpoint_id).length, 0) +
      unroomed.filter((d) => d.endpoint_id).length
    );
  }

  private async _applyPlan(): Promise<void> {
    if (this._applying || !this._plan) return;
    this._applying = true;
    const plan = this._plan;
    const norm = (s: string) => (s || "").trim().toLowerCase();
    const svc = (name: string, data: Record<string, unknown>) =>
      this.hass.callService("alexa_organizer", name, data);
    const ws = (msg: Record<string, unknown>) => this.hass.connection.sendMessagePromise(msg);
    const mark = (id: string, s: string) => (this._opStatus = { ...this._opStatus, [id]: s });
    const run = async (id: string, fn: () => Promise<unknown>) => {
      mark(id, "running");
      try {
        await fn();
        mark(id, "done");
      } catch {
        mark(id, "error");
      }
    };
    try {
      const accepted = this._effectiveGroups()
        .flatMap((g) => g.ops)
        .filter((o) => this._accepted.has(o.id));
      this._applyTotal = accepted.length;
      this._lastErrors = 0;
      this._justSynced = false;
      const willExposeNew = accepted.some((o) => o.action.kind === "expose" && o.action.to === true);

      // Threaded across lanes: HA area (normalized) → its room id (existing + freshly made).
      const roomForArea = new Map<string, string>();
      for (const r of plan.board.rooms ?? []) if (r.id) roomForArea.set(norm(r.name), r.id);

      // Run the queue lane by lane; ops within a lane are independent → in parallel.
      for (const { lane, ops } of planLanes(accepted)) {
        if (lane === "expose") {
          // Write each exposure change as an explicit label — accepted → its target, opted-out
          // → the opposite (pin current) — then one reconcile. Explicit labels are needed so a
          // hide against policy (e.g. un-exposing a media_player Alexa already has) actually sticks.
          const exposeAll = this._effectiveGroups().flatMap((g) => g.ops).filter((o) => o.action.kind === "expose");
          ops.forEach((o) => mark(o.id, "running"));
          try {
            for (const o of exposeAll) {
              const decided = this._accepted.has(o.id) ? (o.action.to as boolean) : !(o.action.to as boolean);
              await ws({ type: "alexa_organizer/set", entity_id: o.action.entity_id, expose: decided });
            }
            await ws({ type: "alexa_organizer/apply", force: true });
            ops.forEach((o) => mark(o.id, "done"));
          } catch {
            ops.forEach((o) => mark(o.id, "error"));
          }
        } else if (lane === "create_room") {
          await Promise.all(
            ops.map((op) =>
              run(op.id, async () => {
                const res = (await ws({ type: "alexa_organizer/create_room", name: op.action.name })) as {
                  ok: boolean;
                  id?: string;
                  reason?: string;
                };
                if (!res.ok || !res.id) throw new Error(res.reason || "create failed");
                roomForArea.set(norm(op.action.name as string), res.id);
              })
            )
          );
        } else if (lane === "rename_room") {
          await Promise.all(
            ops.map((op) => run(op.id, () => svc("room_op", { action: "rename", id: op.action.id, name: op.action.name })))
          );
        } else if (lane === "place") {
          await Promise.all(
            ops.map((op) =>
              run(op.id, () => {
                const a = op.action;
                let to = (a.to as string) || "";
                if (!to && a.area) {
                  to = roomForArea.get(norm(a.area)) ?? "";
                  if (!to) throw new Error("room not created"); // don't strand: skip if create failed
                }
                const move = (endpoint_id: unknown, from: unknown) => {
                  const data: Record<string, unknown> = { endpoint_id };
                  if (from) data.from = from;
                  if (to) data.to = to;
                  return svc("move_device", data);
                };
                // One physical device: move it, then carry its HA copy to the same room so the
                // two never split (skip a twin that's already there).
                return (async () => {
                  await move(a.endpoint_id, a.from);
                  for (const t of this._twinsOf(a.endpoint_id as string))
                    if ((t.room_id ?? "") !== to) await move(t.endpoint_id, t.room_id);
                })();
              })
            )
          );
        } else if (lane === "rename") {
          await Promise.all(
            ops.map((op) =>
              run(op.id, () => svc("rename_device", { endpoint_id: op.action.endpoint_id, name: op.action.name }))
            )
          );
        } else if (lane === "preferred") {
          await Promise.all(
            ops.map((op) => run(op.id, () => svc("set_preferred_speaker", { room_id: op.action.room_id, endpoint_id: op.action.endpoint_id })))
          );
        } else if (lane === "remove") {
          const devs = ops.filter((o) => o.action.kind === "remove_device");
          const eps = ops.filter((o) => o.action.kind === "remove_endpoint");
          if (devs.length) {
            devs.forEach((o) => mark(o.id, "running"));
            try {
              await svc("alexa_devices", { apply: true, endpoint_ids: devs.map((o) => o.action.endpoint_id) });
              devs.forEach((o) => mark(o.id, "done"));
            } catch {
              devs.forEach((o) => mark(o.id, "error"));
            }
          }
          await Promise.all(eps.map((op) => run(op.id, () => svc("forget_endpoint", { endpoint_id: op.action.endpoint_id }))));
        } else if (lane === "delete_room") {
          await Promise.all(ops.map((op) => run(op.id, () => svc("room_op", { action: "delete", id: op.action.id }))));
        }
      }

      // Remember failures before the reload clears per-op status (the hero reports them).
      this._lastErrors = Object.values(this._opStatus).filter((st) => st === "error").length;
      // Wait for Alexa to reflect newly-exposed devices, then recompute the plan.
      if (willExposeNew) {
        const baseline = this._planEndpointCount();
        for (let i = 0; i < 12; i++) {
          await new Promise((r) => setTimeout(r, 4000));
          await this._loadPlan();
          if (this._planEndpointCount() > baseline) break;
        }
      } else {
        await this._loadPlan();
      }
      this._reviewOpen = false;
      this._openRow = null;
      if (!this._lastErrors) {
        this._justSynced = true; // the "Done" moment, then back to the calm state
        setTimeout(() => (this._justSynced = false), 6000);
      }
    } finally {
      this._applying = false;
    }
  }

  private _planView(): TemplateResult {
    const p = this._plan;
    if (!p) return this._skeleton();
    return html`
      ${this._hero()}
      ${!p.available
        ? html`<div class="notice">
            ${svgIcon("alert")}
            <span>
              <b>Alexa isn't connected.</b> Sign in to Alexa Media Player or Alexa Devices in Home
              Assistant to organize rooms and speakers. Until then, this only manages what Alexa sees.
            </span>
          </div>`
        : nothing}
      ${this._planBoard()}
    `;
  }

  // Loading: the page's real shape, shimmering — no spinner, no layout jump.
  private _skeleton(): TemplateResult {
    const card = (rows: number) => html`
      <section class="room skel-card">
        <div class="skel skel-title"></div>
        ${Array.from({ length: rows }, () => html`<div class="skel-row"><div class="skel skel-dot"></div><div class="skel skel-line"></div></div>`)}
      </section>`;
    return html`
      <div class="hero"><div class="skel skel-medal"></div><div class="herotext"><div class="skel skel-title"></div><div class="skel skel-line short"></div></div></div>
      <div class="rooms">${card(4)}${card(2)}${card(3)}${card(5)}${card(2)}${card(3)}</div>
    `;
  }

  // The one status line — sticky, so it's always there to sync from.
  private _hero(): TemplateResult {
    const p = this._plan!;
    const n = this._acceptedCount;
    if (this._applying) {
      const done = Object.values(this._opStatus).filter((s) => s === "done" || s === "error").length;
      const total = Math.max(this._applyTotal, 1);
      return html`
        <div class="hero busy">
          <div class="medal m-accent">${svgIcon("sync", "spin")}</div>
          <div class="herotext">
            <div class="herotitle">Syncing with Alexa…</div>
            <div class="herosub">${Math.min(done, total)} of ${total} done</div>
            <div class="progress"><span style="width:${(Math.min(done, total) / total) * 100}%"></span></div>
          </div>
        </div>`;
    }
    if (this._lastErrors > 0 && n > 0) {
      return html`
        <div class="hero">
          <div class="medal m-warn">${svgIcon("alert")}</div>
          <div class="herotext">
            <div class="herotitle">${this._lastErrors} change${this._lastErrors === 1 ? "" : "s"} didn't go through</div>
            <div class="herosub">They're still in the plan — give them another try.</div>
          </div>
          <button class="primary" @click=${() => (this._reviewOpen = true)}>Review &amp; Sync</button>
        </div>`;
    }
    if (n === 0) {
      const counts = this._houseCounts();
      return html`
        <div class="hero ${this._justSynced ? "celebrate" : ""}">
          <div class="medal m-ok">${svgIcon("check")}</div>
          <div class="herotext">
            <div class="herotitle">${this._justSynced ? "Done — Alexa matches your house" : "Alexa matches your house"}</div>
            <div class="herosub">${counts.rooms} rooms · ${counts.devices} devices</div>
          </div>
        </div>`;
    }
    return html`
      <div class="hero">
        <div class="medal m-accent"><span class="medalnum">${n}</span></div>
        <div class="herotext">
          <div class="herotitle">${n} change${n === 1 ? "" : "s"} to make Alexa match your house</div>
          <div class="herosub">${this._changeSummary()}</div>
        </div>
        <button class="primary" ?disabled=${!p} @click=${() => (this._reviewOpen = true)}>Review &amp; Sync</button>
      </div>`;
  }

  // "5 moves · 2 rooms · 3 removals" — what the pending changes add up to.
  private _changeSummary(): string {
    const nouns: Record<string, [string, string]> = {
      expose: ["exposure change", "exposure changes"], rooms: ["room", "rooms"], place: ["move", "moves"],
      rename: ["rename", "renames"], speakers: ["speaker", "speakers"], cleanup: ["removal", "removals"],
      rooms_delete: ["room to delete", "rooms to delete"],
    };
    const by = new Map<string, number>();
    for (const g of this._effectiveGroups()) {
      const k = g.key.startsWith("cleanup_") ? "cleanup" : g.key;
      const c = g.ops.filter((o) => this._accepted.has(o.id)).length;
      if (c) by.set(k, (by.get(k) ?? 0) + c);
    }
    return [...by].map(([k, c]) => `${c} ${(nouns[k] ?? ["change", "changes"])[c === 1 ? 0 : 1]}`).join(" · ");
  }

  private _houseCounts(): { rooms: number; devices: number } {
    const b = this._plan?.board;
    const rooms = (b?.rooms ?? []).filter((r) => r.id).length;
    const devices = [...(b?.rooms ?? []).flatMap((r) => r.devices), ...(b?.unroomed ?? [])].filter((d) => d.endpoint_id).length;
    return { rooms, devices };
  }

  // Review: a sheet over the page (a bottom sheet on phones) — the plan, grouped, opt-out.
  private _reviewSheet(): TemplateResult {
    const n = this._acceptedCount;
    const close = () => !this._applying && (this._reviewOpen = false);
    return html`
      <div class="scrim" @click=${close}></div>
      <div class="sheet" role="dialog" aria-modal="true" aria-label="Review changes">
        <div class="sheethead">
          <div>
            <h2>Review changes</h2>
            <div class="herosub">Untick anything you don't want. Nothing changes until you sync.</div>
          </div>
          <button class="iconbtn" title="Close" ?disabled=${this._applying} @click=${close}>${svgIcon("close")}</button>
        </div>
        <div class="sheetbody">${this._effectiveGroups().map((g) => this._reviewGroup(g))}</div>
        <div class="sheetfoot">
          <button class="primary wide" ?disabled=${this._applying || n === 0} @click=${this._applyPlan}>
            ${this._applying ? "Syncing…" : `Sync ${n} change${n === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    `;
  }

  private _toggleGroupExpand(key: string): void {
    const next = new Set(this._expandedGroups);
    next.has(key) ? next.delete(key) : next.add(key);
    this._expandedGroups = next;
  }

  private _toggleGroup(g: PlanGroup, on: boolean): void {
    const next = new Set(this._accepted);
    for (const o of g.ops) (on ? next.add(o.id) : next.delete(o.id));
    this._accepted = next;
  }

  private _reviewGroup(g: PlanGroup): TemplateResult {
    const total = g.ops.length;
    const sel = g.ops.filter((o) => this._accepted.has(o.id)).length;
    const open = this._expandedGroups.has(g.key);
    return html`
      <div class="rgroup ${g.destructive ? "danger" : ""} ${open ? "open" : ""}">
        <div class="rghead">
          <input
            type="checkbox"
            aria-label="Include all: ${g.title}"
            .checked=${sel === total && total > 0}
            .indeterminate=${sel > 0 && sel < total}
            ?disabled=${this._applying}
            @change=${(e: Event) => this._toggleGroup(g, (e.target as HTMLInputElement).checked)}
          />
          <button class="rgtitle" aria-expanded=${open} @click=${() => this._toggleGroupExpand(g.key)}>
            <span class="rgicon">${svgIcon(GROUP_ICON[g.key] ?? "device")}</span>
            <span class="rgname">${g.title}</span>
            <span class="rgcount">${sel === total ? total : `${sel} of ${total}`}</span>
            ${svgIcon("chevron", "chev")}
          </button>
        </div>
        ${open
          ? html`<div class="rgbody">
              ${g.ops.map(
                (o) => html`
                  <label class="rop">
                    ${this._statusDisc(this._opStatus[o.id])}
                    <input
                      type="checkbox"
                      .checked=${this._accepted.has(o.id)}
                      ?disabled=${this._applying}
                      @change=${() => this._toggleOp(o.id)}
                    />
                    <span class="roptext">
                      <span class="roptitle">${o.title}</span>
                      ${o.detail ? html`<span class="ropdetail">${o.detail}</span>` : nothing}
                    </span>
                  </label>
                `
              )}
            </div>`
          : nothing}
      </div>
    `;
  }

  private _planBoard(): TemplateResult {
    const p = this._plan!;
    const laid = projectBoard(p.board, this._effectiveGroups(), this._accepted);
    return html`
      <div class="rooms">
        ${laid.rooms.map((r) => this._previewRoom(r))}
        ${laid.unroomed.length
          ? this._previewRoom(
              { id: null, name: "Not in a room", in_alexa: false, in_ha: false, preferred_id: null, devices: laid.unroomed },
              true
            )
          : nothing}
      </div>
    `;
  }

  private _previewRoom(room: BoardRoom, unroomed = false): TemplateResult {
    const buckets = this._boardBuckets(room.devices);
    const count = buckets.reduce((n, b) => n + b.devices.length, 0);
    const tag = unroomed
      ? html`<span class="rtag">Alexa can't reach these by room</span>`
      : room._creating
        ? html`<span class="rtag new">New room</span>`
        : !room.id && room.in_ha
          ? html`<span class="rtag">Not in Alexa yet</span>`
          : room.id && !room.in_ha
            ? html`<span class="rtag">Only in Alexa</span>`
            : nothing;
    return html`
      <section class="room ${unroomed ? "unroomed" : ""}">
        <header class="roomhead">
          <h2>${room.name}</h2>
          <span class="rcount">${count}</span>
          ${tag}
        </header>
        ${count === 0 ? html`<p class="empty">Nothing here yet.</p>` : nothing}
        ${buckets.map(
          (bk) => html`
            <div class="group kind-${bk.kind}">
              <h3>${bk.label}</h3>
              ${bk.devices.map((d) => this._deviceRow(d, room))}
            </div>
          `
        )}
      </section>
    `;
  }

  private _toggleRow(key: string): void {
    this._openRow = this._openRow === key ? null : key;
  }

  // A calm, one-glance row: icon, name, one quiet detail line, and the state that matters.
  // Controls (room, main speaker, remove) live behind a tap, iOS-style.
  private _deviceRow(d: BoardDevice, room: BoardRoom): TemplateResult {
    const key = d.endpoint_id ?? d.entity_id ?? d.name;
    const open = this._openRow === key;
    // The device is rendered under its EFFECTIVE room, so the dropdown reflects that —
    // an HA-area room with no Alexa id yet uses its "#area#" sentinel value.
    const selected = room.id ?? (room.in_ha ? `#area#${room.name}` : "");
    const canBeMain = d.is_speaker && !!d.endpoint_id && !!room.id && !d._removing;
    const isMain = canBeMain && this._effectivePreferred(room) === d.endpoint_id;
    // Alexa reports the targeting mode as "ALWAYS"; staging a pick writes ALWAYS too.
    const always = (room.id && room.id in this._userPref ? "ALWAYS" : room.targeting) === "ALWAYS";
    const rmOp = d.protected ? null : (this._removalOps(d)[0] ?? null);
    const rmStaged = !!rmOp && rmOp.id in this._userRemove;
    const editable = !!d.endpoint_id || !!rmOp;

    // One quiet line of detail: what's about to change first, then what it is.
    const detail: TemplateResult[] = [];
    if (d._removing) detail.push(html`<span class="d-danger">Will be removed</span>`);
    if (d.endpoint_id) {
      const from = this._endpointCurrentRoom().get(d.endpoint_id) ?? "";
      if (from !== selected && !d._removing)
        detail.push(html`<span class="d-change">Moving from ${from ? this._roomName(from) : "no room"}</span>`);
      const was = this._deviceName(d.endpoint_id);
      if (was !== d.name) detail.push(html`<span class="d-change">Was “${was}”</span>`);
    }
    if (!d.synced) detail.push(html`<span class="d-change">New to Alexa</span>`);
    if (d.source === "ha" && d.exposed === false) detail.push(html`<span>Hidden from Alexa</span>`);
    if (d.speaker_note === "ha_proxy") detail.push(html`<span>Home Assistant only · Alexa can't play here</span>`);
    if (d.source !== "ha" && d.manufacturer) detail.push(html`<span>${d.manufacturer}</span>`);

    return html`
      <div class="row ${open ? "open" : ""} ${d._removing ? "removing" : ""}">
        <button class="rowmain" ?disabled=${!editable} aria-expanded=${open} @click=${() => this._toggleRow(key)}>
          <span class="medal sm">${svgIcon(deviceIcon(d))}</span>
          <span class="rowtext">
            <span class="name">${d.name}</span>
            ${detail.length ? html`<span class="detail">${joinDot(detail)}</span>` : nothing}
          </span>
          ${isMain
            ? always
              ? html`<span class="badge play" title="A plain “play music” in this room plays here">${svgIcon("note")} Plays here</span>`
              : html`<span class="badge warn" title="Music only plays here when you say the room's name">Only if named</span>`
            : nothing}
          ${editable ? svgIcon("chevron", "chev") : nothing}
        </button>
        ${open
          ? html`<div class="rowedit">
              ${d.endpoint_id && !d._removing
                ? html`<label class="field">
                    <span>Room</span>
                    <select
                      class="roomsel"
                      ?disabled=${this._applying}
                      @change=${(e: Event) => this._onHomeMove(d.endpoint_id as string, (e.target as HTMLSelectElement).value)}
                    >
                      <option value="" ?selected=${selected === ""}>No room</option>
                      ${this._homeRooms().map(
                        (r) => html`<option value=${r.value} ?selected=${selected === r.value}>${r.name}</option>`
                      )}
                    </select>
                  </label>`
                : nothing}
              ${canBeMain && !(isMain && always)
                ? html`<button
                    class="chipbtn"
                    ?disabled=${this._applying}
                    title="Make a plain “play music” in ${room.name} play on this speaker"
                    @click=${() => this._onSetPreferred(room.id as string, d.endpoint_id as string)}
                  >
                    ${svgIcon("note")} ${isMain ? "Always play here" : "Make main speaker"}
                  </button>`
                : nothing}
              ${rmOp
                ? html`<button
                    class="chipbtn danger ${rmStaged ? "on" : ""}"
                    ?disabled=${this._applying}
                    @click=${() => this._onRemove(d)}
                  >
                    ${svgIcon("trash")} ${rmStaged ? "Keep it" : "Remove"}
                  </button>`
                : nothing}
              ${d.protected ? html`<span class="hint">${svgIcon("lock")} Protected — never removed</span>` : nothing}
            </div>`
          : nothing}
      </div>
    `;
  }

  private _boardBuckets(
    devices: BoardDevice[]
  ): Array<{ label: string; kind: string; devices: BoardDevice[] }> {
    const buckets = new Map<
      string,
      { label: string; kind: string; order: number; devices: BoardDevice[] }
    >();
    // An HA-bridged media_player that just duplicates a native device of the same name (a
    // Sonos/Echo that HA re-exposes to Alexa) adds nothing — Alexa uses the native one. Hide
    // the copy whether it came in as a SPEAKER or as a TV. A copy with NO native twin (a media
    // player that exists ONLY in HA) is kept — the user can't see it any other way.
    const nrm = (s: string) => (s || "").trim().toLowerCase();
    const isHaCopy = (d: BoardDevice) => (d.manufacturer ?? "").trim().toLowerCase() === "home assistant";
    const nativeNames = new Set(devices.filter((d) => !isHaCopy(d) && d.endpoint_id).map((d) => nrm(d.name)));
    for (const d of devices) {
      if (isHaCopy(d) && d.domain === "media_player" && nativeNames.has(nrm(d.name))) continue;
      let key: string, label: string, kind: string, order: number;
      if (d.is_speaker) {
        // Real, playable Alexa speakers (native — Echo, or Sonos via the Sonos skill).
        [key, label, kind, order] = ["spk_alexa", "Speakers", "speakers", 1];
      } else if (d.speaker_note === "ha_proxy") {
        // A speaker only Home Assistant knows about — Alexa can't play to it. Dimmed.
        [key, label, kind, order] = ["spk_hacopy", "Home Assistant only", "hacopy", 1.5];
      } else if (d.source === "echo" || d.source === "alexa") {
        // Non-speaker Alexa devices (a Fire TV, etc.): header = the reported manufacturer,
        // verbatim (fallback to a generic label when blank).
        label = d.manufacturer?.trim() || (d.source === "echo" ? "Echo" : "Alexa-only");
        kind = isAmazon(d) ? "echo" : "alexa";
        order = isAmazon(d) ? 90 : 91;
        key = "brand:" + label;
      } else {
        const i = d.domain ? kindIndex(d.domain) : KIND_GROUPS.length - 1;
        [key, label, kind, order] = ["k" + i, KIND_GROUPS[i].label, KIND_GROUPS[i].label.toLowerCase().split(" ")[0], i];
      }
      const b = buckets.get(key);
      if (b) b.devices.push(d);
      else buckets.set(key, { label, kind, order, devices: [d] });
    }
    return [...buckets.values()].sort((a, b) => a.order - b.order);
  }

  private _statusDisc(s?: string): TemplateResult {
    if (s === "done") return html`<span class="state done">${svgIcon("check")}</span>`;
    if (s === "error") return html`<span class="state error">${svgIcon("alert")}</span>`;
    if (s === "running") return html`<span class="state running"></span>`;
    return html`<span class="state pending"></span>`;
  }

  static override styles = css`
    /* ── Tokens. Everything rides on Home Assistant's theme variables (so light/dark just
       work); colour appears only in the kind icons, section labels, and status medal. ── */
    :host {
      --ao-text: var(--primary-text-color, #1c1c1e);
      --ao-muted: var(--secondary-text-color, #6e6e73);
      --ao-card: var(--card-background-color, #fff);
      --ao-page: var(--primary-background-color, #f2f2f7);
      --ao-line: var(--divider-color, rgba(0, 0, 0, 0.1));
      --ao-accent: var(--primary-color, #03a9f4);
      --ao-ok: var(--success-color, #34a853);
      --ao-warn: var(--warning-color, #f5a524);
      --ao-danger: var(--error-color, #e5484d);
      --ao-radius: 18px;
      display: block;
      min-height: 100%;
      background: var(--ao-page);
      color: var(--ao-text);
      -webkit-font-smoothing: antialiased;
    }
    .wrap {
      max-width: 1320px;
      margin: 0 auto;
      padding: 12px 20px 72px;
      box-sizing: border-box;
    }
    button {
      font: inherit;
      color: inherit;
    }
    .ic {
      width: 20px;
      height: 20px;
      fill: currentColor;
      flex: none;
    }

    /* ── Header ── */
    .top {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 2px 14px;
    }
    .brand {
      width: 38px;
      height: 38px;
      flex: none;
    }
    .titles {
      min-width: 0;
      flex: 1;
    }
    h1 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .sub {
      margin: 1px 0 0;
      color: var(--ao-muted);
      font-size: 0.85rem;
    }
    .iconbtn {
      width: 38px;
      height: 38px;
      flex: none;
      display: inline-grid;
      place-items: center;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--ao-muted);
      cursor: pointer;
    }
    .iconbtn:hover:not(:disabled) {
      background: color-mix(in srgb, var(--ao-text) 8%, transparent);
      color: var(--ao-text);
    }
    .iconbtn:disabled {
      opacity: 0.4;
      cursor: default;
    }

    /* ── Status hero: sticky, so Sync is always one tap away ── */
    .hero {
      position: sticky;
      top: 8px;
      z-index: 4;
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 18px;
      padding: 16px 18px;
      background: var(--ao-card);
      border: 1px solid var(--ao-line);
      border-radius: var(--ao-radius);
      box-shadow: 0 6px 24px -12px rgba(0, 0, 0, 0.25);
    }
    .herotext {
      flex: 1;
      min-width: 0;
    }
    .herotitle {
      font-size: 1.08rem;
      font-weight: 650;
      letter-spacing: -0.005em;
    }
    .herosub {
      margin-top: 2px;
      color: var(--ao-muted);
      font-size: 0.85rem;
    }
    .progress {
      height: 6px;
      margin-top: 10px;
      border-radius: 99px;
      background: var(--ao-line);
      overflow: hidden;
    }
    .progress span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--ao-accent);
      transition: width 0.4s ease;
    }
    /* The medal: an icon in a soft disc of its own colour. Used by the hero (large) and
       every device row (small, in its kind's colour). */
    .medal {
      --c: var(--kind, var(--ao-muted));
      width: 46px;
      height: 46px;
      flex: none;
      display: grid;
      place-items: center;
      border-radius: 50%;
      color: var(--c);
      background: color-mix(in srgb, var(--c) 15%, transparent);
    }
    .medal .ic {
      width: 26px;
      height: 26px;
    }
    .medal.m-ok {
      --c: var(--ao-ok);
    }
    .medal.m-accent {
      --c: var(--ao-accent);
    }
    .medal.m-warn {
      --c: var(--ao-warn);
    }
    .medalnum {
      font-size: 1.15rem;
      font-weight: 700;
    }
    .medal.sm {
      width: 34px;
      height: 34px;
    }
    .medal.sm .ic {
      width: 19px;
      height: 19px;
    }
    .hero.celebrate .medal {
      animation: pop 0.6s cubic-bezier(0.2, 1.4, 0.4, 1);
    }
    .hero.celebrate .herotitle {
      color: var(--ao-ok);
    }
    @keyframes pop {
      0% {
        transform: scale(0.55);
      }
      100% {
        transform: scale(1);
      }
    }
    .spin {
      animation: spin 1.1s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* ── Buttons ── */
    .primary {
      flex: none;
      border: none;
      border-radius: 99px;
      padding: 10px 20px;
      font-size: 0.92rem;
      font-weight: 650;
      background: var(--ao-accent);
      color: var(--text-primary-color, #fff);
      cursor: pointer;
      box-shadow: 0 4px 14px -6px color-mix(in srgb, var(--ao-accent) 80%, transparent);
    }
    .primary:hover:not(:disabled) {
      filter: brightness(1.06);
    }
    .primary:disabled {
      opacity: 0.45;
      cursor: default;
      box-shadow: none;
    }
    .primary.wide {
      width: 100%;
      padding: 13px 20px;
      font-size: 1rem;
    }
    .chipbtn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid var(--ao-line);
      border-radius: 99px;
      padding: 6px 13px 6px 10px;
      background: var(--ao-card);
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
    }
    .chipbtn .ic {
      width: 17px;
      height: 17px;
    }
    .chipbtn:hover:not(:disabled) {
      border-color: var(--ao-accent);
      color: var(--ao-accent);
    }
    .chipbtn.danger:hover:not(:disabled) {
      border-color: var(--ao-danger);
      color: var(--ao-danger);
    }
    .chipbtn.danger.on {
      background: var(--ao-danger);
      border-color: var(--ao-danger);
      color: #fff;
    }
    button:focus-visible,
    select:focus-visible,
    input:focus-visible {
      outline: 2px solid var(--ao-accent);
      outline-offset: 2px;
    }

    .notice {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin: -4px 0 18px;
      padding: 12px 16px;
      border-radius: 14px;
      background: color-mix(in srgb, var(--ao-warn) 13%, transparent);
      color: var(--ao-text);
      font-size: 0.88rem;
      line-height: 1.45;
    }
    .notice .ic {
      color: var(--ao-warn);
    }

    /* ── Rooms: cards packed into columns (masonry) ── */
    .rooms {
      columns: 360px;
      column-gap: 16px;
    }
    .room {
      display: flow-root;
      break-inside: avoid;
      margin: 0 0 16px;
      padding: 16px 12px 8px;
      background: var(--ao-card);
      border: 1px solid var(--ao-line);
      border-radius: var(--ao-radius);
    }
    .room.unroomed {
      background: transparent;
      border-style: dashed;
    }
    .roomhead {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 4px 10px;
      padding: 0 6px 4px;
    }
    .roomhead h2 {
      margin: 0;
      font-size: 1.12rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .rcount {
      color: var(--ao-muted);
      font-size: 0.85rem;
      font-variant-numeric: tabular-nums;
    }
    .rtag {
      margin-left: auto;
      color: var(--ao-muted);
      font-size: 0.75rem;
      font-weight: 600;
    }
    .rtag.new {
      color: var(--ao-accent);
    }
    .empty {
      margin: 6px 6px 10px;
      color: var(--ao-muted);
      font-size: 0.85rem;
    }

    /* Kind sections: a coloured label + hairline. No tinted boxes, no rails. */
    .group {
      --kind: var(--ao-muted);
    }
    .group h3 {
      margin: 12px 6px 2px;
      padding-bottom: 5px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: var(--kind);
      border-bottom: 1px solid color-mix(in srgb, var(--kind) 30%, transparent);
    }
    .kind-lighting { --kind: #d08700; }
    .kind-speakers { --kind: #2f6fed; }
    .kind-media    { --kind: #d0457d; }
    .kind-climate  { --kind: #0f9d9d; }
    .kind-scenes   { --kind: #7c4dde; }
    .kind-other    { --kind: #6b7280; }
    .kind-echo     { --kind: #b06f2e; }
    .kind-alexa    { --kind: #9333ea; }
    .kind-hacopy   { --kind: #8e949c; }
    .group.kind-hacopy {
      opacity: 0.7;
    }

    /* ── Device rows: calm by default; tap to edit ── */
    .row {
      border-radius: 14px;
    }
    .row.open {
      background: color-mix(in srgb, var(--ao-text) 4%, transparent);
    }
    .rowmain {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 8px 6px;
      border: none;
      border-radius: 14px;
      background: transparent;
      text-align: left;
      cursor: pointer;
    }
    .rowmain:disabled {
      cursor: default;
    }
    .rowmain:hover:not(:disabled) {
      background: color-mix(in srgb, var(--ao-text) 4%, transparent);
    }
    .rowtext {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .name {
      font-size: 0.95rem;
      font-weight: 550;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .detail {
      margin-top: 1px;
      color: var(--ao-muted);
      font-size: 0.8rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .d-change {
      color: var(--ao-accent);
      font-weight: 600;
    }
    .d-danger {
      color: var(--ao-danger);
      font-weight: 600;
    }
    .row.removing .name {
      text-decoration: line-through;
      color: var(--ao-muted);
    }
    .row.removing .medal {
      filter: grayscale(1);
      opacity: 0.6;
    }
    .chev {
      width: 20px;
      height: 20px;
      color: var(--ao-muted);
      opacity: 0.55;
      transition: transform 0.2s ease;
    }
    .open > .rowmain .chev,
    .rgroup.open .rgtitle .chev {
      transform: rotate(180deg);
    }
    /* With a mouse, rows stay calm: the disclosure chevron appears on hover (and stays on the
       open row). Touch screens keep it visible so rows still read as tappable. */
    @media (hover: hover) {
      .rowmain .chev {
        opacity: 0;
        transition: opacity 0.15s ease, transform 0.2s ease;
      }
      .rowmain:hover .chev,
      .rowmain:focus-visible .chev,
      .row.open .rowmain .chev {
        opacity: 0.55;
      }
    }
    .badge {
      flex: none;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 3px 9px 3px 7px;
      border-radius: 99px;
      font-size: 0.74rem;
      font-weight: 650;
      white-space: nowrap;
    }
    .badge .ic {
      width: 14px;
      height: 14px;
    }
    .badge.play {
      color: #2f6fed;
      background: color-mix(in srgb, #2f6fed 13%, transparent);
    }
    .badge.warn {
      padding-left: 9px;
      color: var(--ao-warn);
      background: color-mix(in srgb, var(--ao-warn) 15%, transparent);
    }
    .rowedit {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 10px;
      padding: 2px 10px 12px 52px;
    }
    .field {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.84rem;
      color: var(--ao-muted);
      font-weight: 600;
    }
    .roomsel {
      max-width: 220px;
      padding: 6px 10px;
      border: 1px solid var(--ao-line);
      border-radius: 10px;
      background: var(--ao-card);
      color: var(--ao-text);
      font: inherit;
      font-size: 0.88rem;
    }
    .hint {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--ao-muted);
      font-size: 0.8rem;
    }
    .hint .ic {
      width: 16px;
      height: 16px;
    }

    /* ── Review sheet ── */
    .scrim {
      position: fixed;
      inset: 0;
      z-index: 10;
      background: rgba(0, 0, 0, 0.42);
      animation: fade 0.18s ease;
    }
    .sheet {
      position: fixed;
      z-index: 11;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: min(640px, calc(100vw - 32px));
      max-height: min(82vh, 780px);
      display: flex;
      flex-direction: column;
      background: var(--ao-card);
      border-radius: 22px;
      box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.45);
      animation: rise 0.22s cubic-bezier(0.2, 0.9, 0.3, 1);
    }
    .sheethead {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 20px 20px 12px 24px;
      border-bottom: 1px solid var(--ao-line);
    }
    .sheethead > div {
      flex: 1;
    }
    .sheethead h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 700;
    }
    .sheetbody {
      overflow-y: auto;
      padding: 6px 12px;
    }
    .sheetfoot {
      padding: 14px 20px 20px;
      border-top: 1px solid var(--ao-line);
    }
    .rgroup {
      border-bottom: 1px solid var(--ao-line);
    }
    .rgroup:last-child {
      border-bottom: none;
    }
    .rghead {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 4px 6px 12px;
    }
    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      flex: none;
      margin: 0;
      accent-color: var(--ao-accent);
    }
    .rgtitle {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 6px;
      border: none;
      border-radius: 10px;
      background: none;
      text-align: left;
      cursor: pointer;
    }
    .rgtitle:hover {
      background: color-mix(in srgb, var(--ao-text) 4%, transparent);
    }
    .rgicon {
      display: inline-grid;
      color: var(--ao-accent);
    }
    .rgroup.danger .rgicon,
    .rgroup.danger .rgname {
      color: var(--ao-danger);
    }
    .rgname {
      flex: 1;
      font-weight: 650;
    }
    .rgcount {
      color: var(--ao-muted);
      font-size: 0.85rem;
      font-variant-numeric: tabular-nums;
    }
    .rgbody {
      padding: 0 8px 10px 40px;
    }
    .rop {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 4px;
      cursor: pointer;
    }
    .roptext {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .roptitle {
      font-size: 0.9rem;
    }
    .ropdetail {
      color: var(--ao-muted);
      font-size: 0.8rem;
    }
    .state {
      width: 18px;
      height: 18px;
      flex: none;
      display: inline-grid;
      place-items: center;
      border-radius: 50%;
      box-sizing: border-box;
    }
    .state .ic {
      width: 18px;
      height: 18px;
    }
    .state.pending::after {
      content: "";
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--ao-line);
    }
    .state.running {
      border: 2px solid var(--ao-line);
      border-top-color: var(--ao-accent);
      animation: spin 0.7s linear infinite;
    }
    .state.done {
      color: var(--ao-ok);
    }
    .state.error {
      color: var(--ao-danger);
    }
    @keyframes fade {
      from {
        opacity: 0;
      }
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translate(-50%, -46%);
      }
    }

    /* ── Loading skeleton ── */
    .skel {
      border-radius: 8px;
      background: linear-gradient(90deg, var(--ao-line) 25%, color-mix(in srgb, var(--ao-line) 45%, transparent) 50%, var(--ao-line) 75%);
      background-size: 300% 100%;
      animation: shimmer 1.4s ease infinite;
    }
    .skel-medal {
      width: 46px;
      height: 46px;
      border-radius: 50%;
    }
    .skel-title {
      width: 40%;
      height: 16px;
      margin: 4px 6px 12px;
    }
    .herotext .skel-title {
      width: 50%;
      margin: 0 0 8px;
    }
    .skel-line {
      flex: 1;
      height: 12px;
    }
    .skel-line.short {
      width: 30%;
      flex: none;
    }
    .skel-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 6px;
    }
    .skel-dot {
      width: 34px;
      height: 34px;
      border-radius: 50%;
    }
    @keyframes shimmer {
      from {
        background-position: 100% 0;
      }
      to {
        background-position: 0 0;
      }
    }

    /* ── Phones ── */
    @media (max-width: 600px) {
      .wrap {
        padding: 6px 10px 64px;
      }
      .hero {
        flex-wrap: wrap;
        padding: 14px;
      }
      .hero .primary {
        width: 100%;
      }
      .sheet {
        left: 0;
        right: 0;
        top: auto;
        bottom: 0;
        width: 100%;
        transform: none;
        max-height: 88vh;
        border-radius: 22px 22px 0 0;
        animation: slideup 0.24s cubic-bezier(0.2, 0.9, 0.3, 1);
      }
      .rowedit {
        padding-left: 10px;
      }
    }
    @keyframes slideup {
      from {
        transform: translateY(100%);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation: none !important;
        transition: none !important;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "alexa-panel": AlexaPanel;
  }
}
