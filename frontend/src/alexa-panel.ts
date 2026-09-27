import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  projectBoard,
  type BoardDevice,
  type BoardRoom,
  type Plan,
  type PlanGroup,
  type PlanOp,
} from "./board-layout.js";
import { planLanes } from "./queue.js";

// Minimal shape of the objects HA hands a custom panel.
interface HomeAssistant {
  connection: {
    sendMessagePromise<T>(msg: Record<string, unknown>): Promise<T>;
  };
  callService(domain: string, service: string, data?: Record<string, unknown>): Promise<unknown>;
}

// Short per-device kind chips shown in the board (the domain is a tag, not a heading).
const DOMAIN_CHIP: Record<string, string> = {
  media_player: "Speaker",
  light: "Light",
  switch: "Switch",
  climate: "Climate",
  scene: "Scene",
  script: "Script",
  cover: "Cover",
  fan: "Fan",
  vacuum: "Vacuum",
  lock: "Lock",
  camera: "Camera",
  input_boolean: "Toggle",
};

// Opinionated within-room type grouping. Lighting collapses light + switch (a
// switch or plug driving a light is, to a voice user, a light). Order here is the
// order sections appear in each room; any domain not listed falls into "Other".
const KIND_GROUPS: ReadonlyArray<{ label: string; domains: readonly string[] }> = [
  { label: "Lighting", domains: ["light", "switch"] },
  { label: "Speakers", domains: ["media_player"] },
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

  override connectedCallback(): void {
    super.connectedCallback();
    void this._loadPlan(); // the one opinionated plan drives the whole screen
  }

  protected override render(): TemplateResult {
    return html`
      <div class="wrap">
        <header>
          <div class="titles">
            <h1>Alexa Organizer</h1>
            <p class="sub">Home Assistant is your house. This keeps Alexa matched to it.</p>
          </div>
        </header>
        ${this._planView()}
      </div>
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
      this._accepted = new Set(
        (p.groups ?? []).flatMap((g) => g.ops).filter((o) => o.suggested).map((o) => o.id)
      );
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

  private _effectiveGroups(): PlanGroup[] {
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

  // The removal op for a device, by what it actually is: an Amazon device is deregistered,
  // a smart-home endpoint is forgotten, and an HA-exposed device is un-exposed (stop sending
  // it to Alexa). Returns null if there's nothing removable (e.g. an unsynced HA row).
  private _removalOp(d: BoardDevice): PlanOp | null {
    if (d.source === "ha" && d.entity_id) {
      return {
        id: `expose:${d.entity_id}`, group: "expose",
        title: `Stop sending ${d.name} to Alexa`, detail: "removes the Home Assistant copy",
        suggested: true, destructive: true,
        action: { kind: "expose", entity_id: d.entity_id, to: false },
      };
    }
    if (!d.endpoint_id) return null;
    if (d.source === "echo") {
      return {
        id: `rmdev:${d.endpoint_id}`, group: "cleanup_devices",
        title: `Delete ${d.name}`, detail: "removes this device from Alexa",
        suggested: true, destructive: true,
        action: { kind: "remove_device", endpoint_id: d.endpoint_id },
      };
    }
    return {
      id: `rmep:${d.endpoint_id}`, group: "cleanup_endpoints",
      title: `Delete ${d.name}`, detail: "removes this from Alexa",
      suggested: true, destructive: true,
      action: { kind: "remove_endpoint", endpoint_id: d.endpoint_id },
    };
  }

  private _onRemove(d: BoardDevice): void {
    const op = this._removalOp(d);
    if (!op) return;
    const staged = { ...this._userRemove };
    const accepted = new Set(this._accepted);
    if (op.id in staged) {
      delete staged[op.id]; // toggle off — keep the device
      accepted.delete(op.id);
    } else {
      staged[op.id] = op;
      accepted.add(op.id);
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
                const data: Record<string, unknown> = { endpoint_id: a.endpoint_id };
                if (a.from) data.from = a.from;
                if (to) data.to = to;
                return svc("move_device", data);
              })
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
    } finally {
      this._applying = false;
    }
  }

  private _planView(): TemplateResult {
    const p = this._plan;
    if (!p) return html`<p class="muted">Computing your plan…</p>`;
    return html`
      ${this._hero()}
      ${this._reviewOpen ? this._reviewSheet() : nothing}
      ${!p.available
        ? html`<div class="banner warn">
            Connect Alexa to organize rooms &amp; devices — this needs the Alexa Media Player or
            Alexa Devices integration signed in. Showing Home Assistant exposure only for now.
          </div>`
        : nothing}
      ${this._planBoard()}
    `;
  }

  private _hero(): TemplateResult {
    const p = this._plan!;
    const n = this._acceptedCount;
    if (p.available && n === 0) {
      return html`<div class="hero ok"><span class="tick">✓</span> Alexa matches your house</div>`;
    }
    return html`
      <div class="hero">
        <div class="herotext">
          <strong>${n}</strong> change${n === 1 ? "" : "s"} to make Alexa match your house
        </div>
        <button class="apply" ?disabled=${this._applying || n === 0} @click=${() => (this._reviewOpen = true)}>
          ${this._applying ? "Syncing…" : "Review & Sync"}
        </button>
      </div>
    `;
  }

  private _reviewSheet(): TemplateResult {
    const n = this._acceptedCount;
    return html`
      <div class="reviewsheet">
        <div class="reviewhead">
          <h2>Review changes</h2>
          <button class="link" ?disabled=${this._applying} @click=${() => (this._reviewOpen = false)}>Close</button>
        </div>
        ${this._effectiveGroups().map((g) => this._reviewGroup(g))}
        <div class="reviewfoot">
          <button class="apply" ?disabled=${this._applying || n === 0} @click=${this._applyPlan}>
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
      <div class="reviewgroup ${g.destructive ? "danger" : ""}">
        <div class="grouphead">
          <input
            type="checkbox"
            .checked=${sel === total && total > 0}
            .indeterminate=${sel > 0 && sel < total}
            ?disabled=${this._applying}
            @change=${(e: Event) => this._toggleGroup(g, (e.target as HTMLInputElement).checked)}
          />
          <button class="grouptitle" @click=${() => this._toggleGroupExpand(g.key)}>
            <span class="chev ${open ? "open" : ""}">▸</span>
            ${g.title}
            <span class="gcount">${sel}${sel !== total ? ` of ${total}` : ""}</span>
          </button>
        </div>
        ${open
          ? html`<div class="groupbody">
              ${g.ops.map(
                (o) => html`
                  <label class="reviewop">
                    ${this._statusDisc(this._opStatus[o.id])}
                    <input
                      type="checkbox"
                      .checked=${this._accepted.has(o.id)}
                      ?disabled=${this._applying}
                      @change=${() => this._toggleOp(o.id)}
                    />
                    <span class="optitle">${o.title}</span>
                    ${o.detail ? html`<span class="opdetail">${o.detail}</span>` : nothing}
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
      ${laid.rooms.map((r) => this._previewRoom(r))}
      ${laid.unroomed.length
        ? this._previewRoom({
            id: null, name: "No room", in_alexa: false, in_ha: false, preferred_id: null,
            devices: laid.unroomed,
          })
        : nothing}
    `;
  }

  private _previewRoom(room: BoardRoom): TemplateResult {
    return html`
      <section class="room card">
        <h2 class="rhead">${room.name} <span class="count">${room.devices.length}</span></h2>
        <div class="kindgrid">
          ${this._boardBuckets(room.devices).map(
            (bk) => html`
              <div class="kindgroup group kind-${bk.kind}">
                <h3 class="gcap">${bk.label}</h3>
                <div class="rows">${bk.devices.map((d) => this._previewDeviceRow(d, room))}</div>
              </div>
            `
          )}
        </div>
      </section>
    `;
  }

  private _previewDeviceRow(d: BoardDevice, room: BoardRoom): TemplateResult {
    // Badge the manufacturer Alexa reports, verbatim ("Amazon", "Sonos, Inc.", …) — no brand
    // mapping. Only when it's blank do we fall back to the source-derived generic label.
    const chip =
      d.source === "ha"
        ? `HA · ${DOMAIN_CHIP[d.domain ?? ""] ?? d.domain ?? "HA"}`
        : d.manufacturer?.trim() || (d.source === "echo" ? "Echo" : "Alexa-only");
    // The device is rendered under its EFFECTIVE room, so the dropdown reflects that —
    // an HA-area room with no Alexa id yet uses its "#area#" sentinel value.
    const selected = room.id ?? (room.in_ha ? `#area#${room.name}` : "");
    // Preferred-speaker control: only for a speaker that's a member of a real Alexa room.
    const canBeMain = d.is_speaker && !!d.endpoint_id && !!room.id && !d._removing;
    const isMain = canBeMain && this._effectivePreferred(room) === d.endpoint_id;
    // Alexa reports the targeting mode as "ALWAYS" (verified live); staging a pick will write
    // ALWAYS too. (The old "ALL_THE_TIME" spelling was wrong and made every room read "only
    // when named" even when it already played here by default.)
    const always =
      (room.id && room.id in this._userPref ? "ALWAYS" : room.targeting) === "ALWAYS";
    // Inline delete: never for protected devices (This Device / Audible / the AMP session).
    const rmOp = d.protected ? null : this._removalOp(d);
    const rmStaged = !!rmOp && rmOp.id in this._userRemove;
    return html`
      <div class="row ${d._removing ? "removing" : ""}">
        <div class="info">
          <div class="name ${d._removing ? "strike" : ""}">${d.name}</div>
          <div class="meta">
            <span class="kind">${chip}</span>
            ${d.speaker_note === "ha_proxy"
              ? html`<span
                  class="warnpill"
                  title="This is a copy of the speaker bridged from Home Assistant. Alexa can’t play music to the copy, so pick the matching speaker above (the real one) as the room’s main instead."
                  >copy · can’t play here</span
                >`
              : nothing}
            ${d.source === "ha" && d.exposed === false ? html`<span class="reason">hidden</span>` : nothing}
            ${!d.synced ? html`<span class="reason">will sync to Alexa</span>` : nothing}
            ${d._removing ? html`<span class="reason danger">will be removed</span>` : nothing}
          </div>
        </div>
        ${canBeMain
          ? isMain
            ? always
              ? html`<span class="mainbadge" title="A plain “play music” in this room plays on this speaker">♪ plays here</span>`
              : html`<span
                    class="reason"
                    title="Right now music only comes here when you say the room name, e.g. “play music in ${room.name}”. A plain “play music” plays on whichever Echo you spoke to."
                    >only if you say “${room.name}”</span
                  ><button
                    class="mainbtn warn"
                    ?disabled=${this._applying}
                    title="Make a plain “play music” in this room play on this speaker by default"
                    @click=${() => this._onSetPreferred(room.id as string, d.endpoint_id as string)}
                  >
                    always play here
                  </button>`
            : html`<button
                class="mainbtn"
                ?disabled=${this._applying}
                title="Make this the room's speaker for “play music here”"
                @click=${() => this._onSetPreferred(room.id as string, d.endpoint_id as string)}
              >
                make main
              </button>`
          : nothing}
        ${d.endpoint_id && !d._removing
          ? html`<select
              class="roomsel"
              ?disabled=${this._applying}
              @change=${(e: Event) => this._onHomeMove(d.endpoint_id as string, (e.target as HTMLSelectElement).value)}
            >
              <option value="" ?selected=${selected === ""}>(no room)</option>
              ${this._homeRooms().map(
                (r) => html`<option value=${r.value} ?selected=${selected === r.value}>${r.name}</option>`
              )}
            </select>`
          : nothing}
        ${rmOp
          ? html`<button
              class="rmbtn ${rmStaged ? "staged" : ""}"
              ?disabled=${this._applying}
              title=${rmStaged ? "Keep this device" : "Delete this from Alexa (staged for review)"}
              @click=${() => this._onRemove(d)}
            >
              ${rmStaged ? "keep" : "remove"}
            </button>`
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
    // A Home Assistant copy of a speaker whose real (native) twin is already shown here adds
    // nothing — hide it. Only a copy with NO native twin (a speaker that exists ONLY in HA)
    // is worth showing (still not playable, but the user can't see it any other way).
    const nrm = (s: string) => (s || "").trim().toLowerCase();
    const nativeSpeakerNames = new Set(devices.filter((d) => d.is_speaker).map((d) => nrm(d.name)));
    for (const d of devices) {
      if (d.speaker_note === "ha_proxy" && nativeSpeakerNames.has(nrm(d.name))) continue;
      let key: string, label: string, kind: string, order: number;
      if (d.is_speaker) {
        // Real, playable Alexa speakers (native — Echo, or Sonos via the Sonos skill). The
        // per-row chip still shows the maker (Amazon / Sonos, Inc.); the section names the source.
        [key, label, kind, order] = ["spk_alexa", "From Alexa (playable)", "speakers", 1];
      } else if (d.speaker_note === "ha_proxy") {
        // Home Assistant copies of a speaker — Alexa can't play to them. Grouped + dimmed so
        // it's obvious they're duplicates from HA, not something to set as the main.
        [key, label, kind, order] = ["spk_hacopy", "From Home Assistant (copies)", "hacopy", 1.5];
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
    if (s === "done") return html`<span class="state done">✓</span>`;
    if (s === "error") return html`<span class="state error">✗</span>`;
    if (s === "running") return html`<span class="state running"></span>`;
    return html`<span class="state pending"></span>`;
  }


  static override styles = css`
    :host {
      display: block;
      background: var(--primary-background-color, #f5f5f5);
      min-height: 100%;
      color: var(--primary-text-color, #212121);
    }
    .wrap {
      max-width: 900px;
      margin: 0 auto;
      padding: 16px 16px 88px;
      box-sizing: border-box;
    }
    header {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 24px;
      align-items: flex-start;
      justify-content: space-between;
      padding: 8px 4px 16px;
    }
    h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }
    .sub {
      margin: 4px 0 0;
      max-width: 46ch;
      color: var(--secondary-text-color, #727272);
      font-size: 0.85rem;
      line-height: 1.4;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .chip {
      font-size: 0.8rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 999px;
      white-space: nowrap;
    }
    .chip.add {
      background: color-mix(in srgb, var(--success-color, #4caf50) 18%, transparent);
      color: var(--success-color, #2e7d32);
    }
    .chip.live {
      background: color-mix(in srgb, var(--warning-color, #ff9800) 20%, transparent);
      color: var(--warning-color, #e65100);
    }
    .chip.ghost {
      background: var(--divider-color, #e0e0e0);
      color: var(--secondary-text-color, #616161);
    }
    .chip.ok {
      background: color-mix(in srgb, var(--success-color, #4caf50) 14%, transparent);
      color: var(--success-color, #2e7d32);
    }
    button.apply {
      border: none;
      border-radius: 8px;
      padding: 8px 18px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      background: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
    }
    button.apply:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .banner {
      border-radius: 8px;
      padding: 10px 14px;
      margin: 4px 0 12px;
      font-size: 0.88rem;
      line-height: 1.4;
    }
    .banner.err {
      background: color-mix(in srgb, var(--error-color, #f44336) 14%, transparent);
      color: var(--error-color, #c62828);
    }
    .banner.warn {
      background: color-mix(in srgb, var(--warning-color, #ff9800) 16%, transparent);
      color: var(--warning-color, #e65100);
    }
    .link {
      background: none;
      border: none;
      color: inherit;
      font: inherit;
      font-weight: 700;
      text-decoration: underline;
      cursor: pointer;
      padding: 0;
    }
    section {
      margin-bottom: 20px;
    }
    /* A room is a Chorus-style card; its kind-groups are tinted nested boxes. */
    section.room.card {
      margin-bottom: 26px;
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 12px;
      padding: 12px 14px 14px;
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
    }
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--primary-text-color, #212121);
      margin: 4px 4px 6px;
    }
    .room .rhead {
      margin: 2px 2px 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--divider-color, #ececec);
    }
    h3 {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
      color: var(--secondary-text-color, #727272);
      margin: 14px 4px 6px;
    }
    .kindgroup:first-of-type h3 {
      margin-top: 6px;
    }
    .count {
      font-weight: 400;
      opacity: 0.7;
    }
    /* Standalone card list (used by the cleanup / device sections). */
    .rows {
      background: var(--card-background-color, #fff);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
    }
    /* Within a room, each kind is a plain grouped-list section: an uppercase header with a
       hairline, then its rows. No tinted rounded boxes / colored rails. Masonry packs the
       sections into ~260px columns (CSS multi-column) so short sections fill the height. */
    .kindgrid {
      column-width: 260px;
      column-gap: 22px;
    }
    .room .kindgroup {
      --kind: var(--secondary-text-color, #6b7280);
      min-width: 0;
      margin: 0 0 18px;
      display: flow-root; /* own block-formatting context — no margin-clip at a column top */
      -webkit-column-break-inside: avoid;
      break-inside: avoid; /* keep a section together within a column */
    }
    /* Color-coded section header: the kind's color as the LABEL + hairline only — no box,
       no rail, no tinted fill (that reads as AI-generated). */
    .room .kindgroup .gcap {
      color: var(--kind);
      margin: 0;
      padding-bottom: 5px;
      border-bottom: 2px solid color-mix(in srgb, var(--kind) 55%, transparent);
    }
    .room .kind-lighting { --kind: #d08700; }
    .room .kind-speakers { --kind: #2f6fed; }
    .room .kind-climate  { --kind: #0f9d9d; }
    .room .kind-scenes   { --kind: #7c4dde; }
    .room .kind-other    { --kind: #6b7280; }
    .room .kind-echo     { --kind: #b06f2e; }
    .room .kind-alexa    { --kind: #9333ea; }
    .room .kind-hacopy   { --kind: #9aa0a6; }
    /* HA copies of a speaker: present for clarity, but visibly secondary to the real ones. */
    .room .kindgroup.kind-hacopy { opacity: 0.7; }
    .room .kindgroup .rows {
      background: transparent;
      border-radius: 0;
      box-shadow: none;
      overflow: visible;
    }
    .room .kindgroup .row {
      /* In a narrow masonry column, let the dropdown wrap below the name instead of
         crushing it — the device name keeps a full line, the room picker drops under it. */
      flex-wrap: wrap;
      gap: 4px 10px;
      padding: 9px 2px;
    }
    .room .kindgroup .row:last-child {
      border-bottom: none;
    }
    .room .kindgroup .row .info {
      flex: 1 1 60%;
    }
    .room .kindgroup .roomsel {
      max-width: 100%;
      margin-left: auto;
    }
    /* Per-device inline controls in the board */
    .rowctl {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    /* Preferred-speaker control on a speaker row. "make main" to set it; a plain-words
       badge marks the one that answers "play music here" — no mystery star. */
    .mainbtn {
      flex: none;
      border: 1px solid var(--divider-color, #cfcfcf);
      background: var(--card-background-color, #fff);
      color: var(--secondary-text-color, #666);
      border-radius: 999px;
      padding: 4px 10px;
      font: inherit;
      font-size: 0.72rem;
      cursor: pointer;
      white-space: nowrap;
    }
    .mainbtn:hover {
      border-color: var(--primary-color, #2f6fed);
      color: var(--primary-color, #2f6fed);
    }
    /* Already the preferred speaker, but only when the room is named — nudge to make it always. */
    .mainbtn.warn {
      border-color: color-mix(in srgb, var(--warning-color, #e0a72e) 60%, transparent);
      color: var(--warning-color, #b8860b);
    }
    .mainbadge {
      flex: none;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--primary-color, #2f6fed);
      white-space: nowrap;
    }
    .rmbtn {
      flex: none;
      border: 1px solid var(--divider-color, #cfcfcf);
      background: var(--card-background-color, #fff);
      color: var(--secondary-text-color, #888);
      border-radius: 999px;
      padding: 4px 10px;
      font: inherit;
      font-size: 0.72rem;
      cursor: pointer;
      white-space: nowrap;
    }
    .rmbtn:hover {
      border-color: var(--error-color, #d33);
      color: var(--error-color, #d33);
    }
    .rmbtn.staged {
      border-color: var(--error-color, #d33);
      color: #fff;
      background: var(--error-color, #d33);
    }
    .rm {
      border: 1px solid var(--divider-color, #d0d0d0);
      background: var(--card-background-color, #fff);
      color: var(--secondary-text-color, #999);
      border-radius: 8px;
      padding: 5px 9px;
      font-size: 12px;
      cursor: pointer;
    }
    .rm.on {
      color: #fff;
      background: var(--error-color, #d33);
      border-color: var(--error-color, #d33);
    }
    .headright {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .viewtoggle {
      display: inline-flex;
      border: 1px solid var(--divider-color, #d0d0d0);
      border-radius: 9px;
      overflow: hidden;
    }
    .viewtoggle button {
      border: none;
      background: var(--card-background-color, #fff);
      color: var(--secondary-text-color, #777);
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .viewtoggle button.on {
      background: var(--primary-color, #2f6fed);
      color: #fff;
    }
    /* Plan view: hero status + review sheet */
    .hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-left: 4px solid var(--primary-color, #2f6fed);
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 18px;
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
    }
    .hero.ok {
      border-left-color: var(--success-color, #2e7d32);
      color: var(--success-color, #2e7d32);
      font-weight: 600;
    }
    .hero .tick {
      font-size: 1.2rem;
      margin-right: 6px;
    }
    .hero .herotext {
      font-size: 1.05rem;
    }
    .hero .herotext strong {
      font-size: 1.35rem;
    }
    .hero .apply {
      flex-shrink: 0;
    }
    .reviewsheet {
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 12px;
      padding: 10px 16px 16px;
      margin-bottom: 18px;
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
    }
    .reviewhead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--divider-color, #ececec);
      padding-bottom: 8px;
      margin-bottom: 6px;
    }
    .reviewhead h2 {
      margin: 4px 0;
    }
    .reviewgroup {
      padding: 4px 0;
      border-bottom: 1px solid var(--divider-color, #f0f0f0);
    }
    .grouphead {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 2px;
    }
    .grouphead input {
      width: 17px;
      height: 17px;
      flex-shrink: 0;
    }
    .grouptitle {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--primary-text-color, #212121);
      text-align: left;
    }
    .reviewgroup.danger .grouptitle {
      color: var(--error-color, #d33);
    }
    .chev {
      display: inline-block;
      transition: transform 0.15s ease;
      opacity: 0.6;
      font-size: 0.8rem;
    }
    .chev.open {
      transform: rotate(90deg);
    }
    .gcount {
      font-weight: 400;
      color: var(--secondary-text-color, #888);
      font-size: 0.85rem;
    }
    .groupbody {
      padding: 2px 0 6px 26px;
    }
    .reviewop {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 4px;
      cursor: pointer;
    }
    .reviewop input {
      width: 17px;
      height: 17px;
      flex-shrink: 0;
    }
    .reviewop .optitle {
      flex: 1;
      min-width: 0;
    }
    .reviewop .opdetail {
      color: var(--secondary-text-color, #888);
      font-size: 0.82rem;
    }
    .reviewfoot {
      display: flex;
      justify-content: flex-end;
      padding-top: 12px;
    }
    .name.strike {
      text-decoration: line-through;
      opacity: 0.6;
    }
    .reason.danger {
      color: var(--error-color, #d33);
    }
    .warnpill {
      color: var(--warning-color, #b76e00);
      background: color-mix(in srgb, var(--warning-color, #b76e00) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--warning-color, #b76e00) 35%, transparent);
      border-radius: 999px;
      padding: 0 7px;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: help;
      white-space: nowrap;
    }
    .row.removing {
      opacity: 0.7;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-bottom: 1px solid var(--divider-color, #ececec);
    }
    .row:last-child {
      border-bottom: none;
    }
    .info {
      flex: 1;
      min-width: 0;
    }
    .name {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.95rem;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--primary-color, #03a9f4);
      flex: none;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      color: var(--secondary-text-color, #727272);
      margin-top: 3px;
    }
    .kind {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 1px 6px;
      border-radius: 4px;
      background: var(--divider-color, #e8e8e8);
      color: var(--secondary-text-color, #616161);
    }
    .reason.label {
      color: var(--primary-color, #0288d1);
      font-weight: 600;
    }
    button.toggle {
      flex: none;
      width: 54px;
      border: 1px solid var(--divider-color, #cfcfcf);
      border-radius: 999px;
      padding: 5px 0;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      background: var(--card-background-color, #fff);
      color: var(--secondary-text-color, #9e9e9e);
    }
    button.toggle.on {
      background: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
      border-color: var(--primary-color, #03a9f4);
    }
    button.toggle:disabled {
      opacity: 0.6;
      cursor: default;
    }
    .row.ghost {
      opacity: 0.72;
    }
    .row.ghost .name {
      font-family: var(--code-font-family, monospace);
      font-size: 0.82rem;
      font-weight: 400;
    }
    .tag {
      flex: none;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 999px;
      background: var(--divider-color, #e0e0e0);
      color: var(--secondary-text-color, #616161);
    }
    .muted {
      color: var(--secondary-text-color, #727272);
      font-size: 0.82rem;
      line-height: 1.4;
      margin: 0 4px 8px;
    }
    .alexa-exp {
      margin-top: 22px;
    }
    .exp-divider {
      margin-top: 34px;
      padding-top: 18px;
      border-top: 2px solid var(--divider-color, #ddd);
    }
    .exp-heading {
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0 4px 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .exp {
      font-size: 0.58rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
      background: var(--warning-color, #ff9800);
      color: #fff;
      padding: 2px 6px;
      border-radius: 4px;
      vertical-align: 2px;
    }
    .ghostbtn {
      background: var(--secondary-background-color, #e0e0e0) !important;
      color: var(--primary-text-color, #212121) !important;
    }
    .applybar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      margin: 10px 0 14px;
    }
    .chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .applybtns {
      display: flex;
      gap: 8px;
      margin-left: auto;
      align-items: center;
    }
    .minus {
      flex: none;
      width: 14px;
      text-align: center;
      font-weight: 700;
      color: var(--error-color, #c62828);
    }
    .tag.remove {
      background: color-mix(in srgb, var(--error-color, #f44336) 15%, transparent);
      color: var(--error-color, #c62828);
    }
    button.toggle.rem {
      width: auto;
      padding: 5px 12px;
      background: var(--error-color, #c62828);
      color: #fff;
      border-color: var(--error-color, #c62828);
    }
    button.toggle.keepbtn {
      width: auto;
      padding: 5px 12px;
    }
    .row.removing .name {
      color: var(--error-color, #c62828);
    }
    .roomsel {
      flex: none;
      max-width: 190px;
      padding: 5px 8px;
      border-radius: 8px;
      border: 1px solid var(--divider-color, #cfcfcf);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      font: inherit;
      font-size: 0.85rem;
    }
    .row.moving {
      background: color-mix(in srgb, var(--primary-color, #03a9f4) 8%, transparent);
    }
    .row.moving .name {
      color: var(--primary-color, #0288d1);
    }
    .deltabar {
      position: fixed;
      bottom: 16px;
      /* Centered on the tool (host), not the viewport — set from JS. */
      left: var(--ac-bar-left, 50%);
      transform: translateX(-50%);
      width: var(--ac-bar-width, min(680px, calc(100vw - 32px)));
      z-index: 20;
      overflow: hidden;
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #ddd);
      border-radius: 14px;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
    }
    .deltabar .flare {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(
        100deg,
        transparent 35%,
        color-mix(in srgb, var(--primary-color, #03a9f4) 22%, transparent) 50%,
        color-mix(in srgb, var(--success-color, #4caf50) 18%, transparent) 60%,
        transparent 72%
      );
      background-size: 220% 100%;
      animation: flare-sweep 3s linear infinite;
    }
    .deltabar.busy .flare {
      animation-duration: 1.1s;
    }
    @keyframes flare-sweep {
      from {
        background-position: 220% 0;
      }
      to {
        background-position: -120% 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .deltabar .flare {
        animation: none;
      }
    }
    .deltabar-inner {
      position: relative;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 14px;
    }
    .delta-count {
      font-weight: 600;
      font-size: 0.95rem;
    }
    .headernote {
      align-self: center;
    }
    .deltadetails {
      position: relative;
      max-height: 42vh;
      overflow-y: auto;
      padding: 6px 14px 12px;
      border-top: 1px solid var(--divider-color, #eee);
    }
    .dline {
      font-size: 0.82rem;
      padding: 3px 0;
      display: flex;
      gap: 6px;
      align-items: baseline;
    }
    .plus {
      color: var(--success-color, #2e7d32);
      font-weight: 700;
      width: 14px;
      text-align: center;
      flex: none;
    }
    .state {
      flex: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
      line-height: 1;
      box-sizing: border-box;
    }
    .state.pending {
      width: 8px;
      height: 8px;
      margin: 0 5px;
      background: var(--divider-color, #cfcfcf);
    }
    .state.running {
      border: 2px solid var(--divider-color, #ddd);
      border-top-color: var(--primary-color, #03a9f4);
      animation: spin 0.7s linear infinite;
    }
    .state.done {
      background: var(--success-color, #2e7d32);
      color: #fff;
    }
    .state.error {
      background: var(--error-color, #c62828);
      color: #fff;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    .rows.scroll {
      max-height: 240px;
      overflow-y: auto;
      margin-top: 4px;
    }
    code {
      background: var(--divider-color, #eee);
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 0.85em;
    }
    [hidden] {
      display: none !important;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "alexa-panel": AlexaPanel;
  }
}
