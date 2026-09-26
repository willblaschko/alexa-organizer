import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  layoutBoard,
  projectBoard,
  type BoardData,
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

interface AlexaDevice {
  id: string;
  name: string;
  protected: boolean;
  suggested_remove: boolean;
}

interface AlexaDevices {
  available: boolean;
  reason?: string;
  devices?: AlexaDevice[];
}

interface RoomOp {
  op: "create" | "rename" | "delete";
  id?: string;
  name?: string;
  from?: string;
  to?: string;
  empty?: boolean;
  suggested: boolean;
}

interface RoomPlan {
  available: boolean;
  reason?: string;
  ops?: RoomOp[];
}

interface DeviceRoom {
  id: string;
  name: string;
  room_id: string | null;
  room_name: string | null;
  suggested_room_id?: string | null;
}

interface DeviceRoomsData {
  available: boolean;
  reason?: string;
  rooms?: Array<{ id: string; name: string }>;
  devices?: DeviceRoom[];
}

interface AssignOp {
  id: string;
  name: string;
  from_id?: string | null;
  from_name?: string | null;
  to_id: string;
  to_name: string;
}

interface AssignPlan {
  available: boolean;
  reason?: string;
  assigns?: AssignOp[];
  no_room?: number;
  unmatched?: number;
}

interface SmarthomeCandidate {
  id: string;
  name: string;
  duplicate: boolean;
  matched: boolean;
  suggested_remove: boolean;
}

interface SmarthomeData {
  available: boolean;
  reason?: string;
  candidates?: SmarthomeCandidate[];
}

interface SpeakerCandidate {
  endpointId: string;
  name: string;
}

interface RoomSpeaker {
  room_id: string;
  room_name: string;
  current_id: string | null;
  candidates: SpeakerCandidate[];
}

interface RoomSpeakers {
  available: boolean;
  reason?: string;
  rooms?: RoomSpeaker[];
}


interface Row {
  entity_id: string;
  name: string;
  domain: string;
  area: string | null;
  desired: boolean;
  exposed: boolean;
  reason: string;
  overridden: boolean;
  ghost: boolean;
}

interface Summary {
  expose: number;
  live_remove: number;
  ghost_remove: number;
}

interface Inventory {
  rows: Row[];
  summary: Summary;
  unavailable?: string;
}

// Short per-row kind chips (rows are grouped by ROOM, so the domain is a tag, not a
// heading). DOMAIN_ORDER also sets the within-room sort (speakers, then lights, …).
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
const NO_ROOM = "No room";

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

@customElement("alexa-panel")
export class AlexaPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public narrow = false;

  @state() private _rows: Row[] = [];
  @state() private _summary: Summary = { expose: 0, live_remove: 0, ghost_remove: 0 };
  @state() private _loading = true;
  @state() private _busy = false;
  @state() private _held = false;
  @state() private _unavailable: string | null = null;
  @state() private _alexa: AlexaDevices | null = null;
  @state() private _alexaBusy = false;
  @state() private _alexaRemove = new Set<string>(); // endpoint ids toggled for removal
  @state() private _detailsOpen = false;
  @state() private _roomPlan: RoomPlan | null = null;
  @state() private _roomBusy = false;
  @state() private _roomInclude = new Set<string>(); // op keys to apply
  @state() private _roomStatus: Record<string, string> = {}; // op key -> pending/running/done/error
  @state() private _deviceRooms: DeviceRoomsData | null = null;
  @state() private _deviceRoomsBusy = false;
  @state() private _moves: Record<string, string> = {}; // endpoint id -> target room id ("" = unassigned)
  @state() private _moveStatus: Record<string, string> = {};
  @state() private _assignPlan: AssignPlan | null = null;
  @state() private _assignBusy = false;
  @state() private _assignInclude = new Set<string>(); // endpoint ids to assign
  @state() private _assignStatus: Record<string, string> = {};
  @state() private _shPlan: SmarthomeData | null = null;
  @state() private _shBusy = false;
  @state() private _shRemove = new Set<string>(); // endpoint ids to forget
  @state() private _shStatus: Record<string, string> = {};
  @state() private _speakers: RoomSpeakers | null = null;
  @state() private _speakerBusy = false;
  @state() private _speakerPick: Record<string, string> = {}; // room id -> chosen speaker endpoint id
  @state() private _speakerStatus: Record<string, string> = {};
  @state() private _syncing = false; // post-apply: waiting for Alexa to reflect newly-exposed devices
  @state() private _view: "plan" | "board" | "classic" = "plan";
  @state() private _board: BoardData | null = null;
  @state() private _boardBusy = false;
  @state() private _plan: Plan | null = null;
  @state() private _planBusy = false;
  @state() private _accepted = new Set<string>(); // plan op ids the user will apply
  @state() private _reviewOpen = false;
  @state() private _opStatus: Record<string, string> = {}; // op id -> pending/running/done/error
  @state() private _applying = false;
  @state() private _userMove: Record<string, string> = {}; // endpoint id -> room id ("" = no room)
  @state() private _expandedGroups = new Set<string>(); // review groups shown expanded

  private _ro?: ResizeObserver;
  private _onResize = (): void => this._positionBar();

  override connectedCallback(): void {
    super.connectedCallback();
    void this._load();
    void this._loadPlan(); // plan is the default view; computes the whole opinion
    window.addEventListener("resize", this._onResize);
    this._ro = new ResizeObserver(() => this._positionBar());
    this._ro.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("resize", this._onResize);
    this._ro?.disconnect();
  }

  protected override updated(): void {
    this._positionBar();
  }

  // Center the floating toast on the TOOL (this panel's content box), not the viewport —
  // HA's sidebar offsets the viewport center. Width is a fixed % of the tool width.
  private _positionBar(): void {
    const r = this.getBoundingClientRect();
    if (!r.width) return;
    this.style.setProperty("--ac-bar-left", `${Math.round(r.left + r.width / 2)}px`);
    this.style.setProperty("--ac-bar-width", `${Math.max(300, Math.round(r.width * 0.6))}px`);
  }

  private async _load(): Promise<void> {
    this._loading = true;
    try {
      const inv = await this.hass.connection.sendMessagePromise<Inventory>({
        type: "alexa_organizer/inventory",
      });
      this._ingest(inv);
    } finally {
      this._loading = false;
    }
  }

  private _ingest(inv: Inventory): void {
    this._rows = inv.rows;
    this._summary = inv.summary;
    this._unavailable = inv.unavailable ?? null;
  }

  private async _toggle(row: Row): Promise<void> {
    if (row.ghost || this._busy) return;
    this._busy = true;
    try {
      const inv = await this.hass.connection.sendMessagePromise<Inventory>({
        type: "alexa_organizer/set",
        entity_id: row.entity_id,
        expose: !row.desired,
      });
      this._ingest(inv);
    } finally {
      this._busy = false;
    }
  }

  private async _apply(force: boolean): Promise<void> {
    if (this._busy) return;
    this._busy = true;
    try {
      const res = await this.hass.connection.sendMessagePromise<{
        held: boolean;
        inventory: Inventory;
      }>({ type: "alexa_organizer/apply", force });
      this._held = res.held;
      this._ingest(res.inventory);
    } finally {
      this._busy = false;
    }
  }

  private async _previewAlexa(): Promise<void> {
    if (this._alexaBusy) return;
    this._alexaBusy = true;
    try {
      const res = await this.hass.connection.sendMessagePromise<AlexaDevices>({
        type: "alexa_organizer/alexa_devices",
      });
      this._alexa = res;
      // Seed the removal set from the generic suggestions (never protected).
      this._alexaRemove = new Set(
        (res.devices ?? []).filter((d) => d.suggested_remove && !d.protected).map((d) => d.id)
      );
    } finally {
      this._alexaBusy = false;
    }
  }

  private _toggleDevice(d: AlexaDevice): void {
    if (d.protected) return;
    const next = new Set(this._alexaRemove);
    if (next.has(d.id)) next.delete(d.id);
    else next.add(d.id);
    this._alexaRemove = next;
  }

  private async _applyAlexaSelected(): Promise<void> {
    if (this._alexaBusy || this._alexaRemove.size === 0) return;
    this._alexaBusy = true;
    try {
      await this.hass.callService("alexa_organizer", "alexa_devices", {
        apply: true,
        endpoint_ids: [...this._alexaRemove],
      });
      const res = await this.hass.connection.sendMessagePromise<AlexaDevices>({
        type: "alexa_organizer/alexa_devices",
      });
      this._alexa = res;
      const present = new Set((res.devices ?? []).map((d) => d.id));
      this._alexaRemove = new Set([...this._alexaRemove].filter((id) => present.has(id)));
    } finally {
      this._alexaBusy = false;
    }
  }

  private get _nothingToDo(): boolean {
    const s = this._summary;
    return s.expose + s.live_remove + s.ghost_remove === 0;
  }

  // Group by HA Area (a 1:1 mirror of the rooms in HA), then by opinionated type
  // group within each room. Entities with no area fall into "No room" (last).
  private _rooms(): Array<{ area: string; groups: Array<{ label: string; rows: Row[] }> }> {
    const byArea = new Map<string, Row[]>();
    for (const r of this._rows) {
      if (r.ghost) continue;
      const key = r.area ?? "";
      const arr = byArea.get(key);
      if (arr) arr.push(r);
      else byArea.set(key, [r]);
    }
    const areas = [...byArea.keys()].sort((a, b) => {
      if (a === "") return 1; // "No room" last
      if (b === "") return -1;
      return a.localeCompare(b);
    });
    return areas.map((a) => {
      const buckets: Row[][] = KIND_GROUPS.map(() => []);
      for (const r of byArea.get(a)!) buckets[kindIndex(r.domain)].push(r);
      const groups = KIND_GROUPS.map((g, i) => ({
        label: g.label,
        rows: buckets[i].slice().sort((x, y) => x.name.localeCompare(y.name)),
      })).filter((g) => g.rows.length > 0);
      return { area: a === "" ? NO_ROOM : a, groups };
    });
  }

  private get _ghosts(): Row[] {
    return this._rows.filter((r) => r.ghost);
  }

  protected override render(): TemplateResult {
    if (this._loading) {
      return html`<div class="wrap"><p class="muted">Loading exposure…</p></div>`;
    }
    const s = this._summary;
    return html`
      <div class="wrap">
        <header>
          <div class="titles">
            <h1>Alexa Organizer</h1>
            <p class="sub">Home Assistant is your house. This keeps Alexa matched to it.</p>
          </div>
          <div class="headright">
            <div class="viewtoggle">
              <button class=${this._view === "plan" ? "on" : ""} @click=${() => (this._view = "plan")}>
                Home
              </button>
              <button class=${this._view === "board" ? "on" : ""} @click=${() => (this._view = "board")}>
                Board
              </button>
              <button class=${this._view === "classic" ? "on" : ""} @click=${() => (this._view = "classic")}>
                Advanced
              </button>
            </div>
            ${this._view !== "plan"
              ? html`<span class="chip ok headernote" ?hidden=${this._hasPending}>In sync</span>`
              : nothing}
          </div>
        </header>

        ${this._unavailable
          ? html`<div class="banner err">
              Can't read Alexa exposure (${this._unavailable}). Nothing was changed.
            </div>`
          : nothing}

        ${this._held
          ? html`<div class="banner warn">
              Held ${s.live_remove} live removal(s) for safety — additions and stale cleanup
              were applied. Review the list, then
              <button class="link" @click=${() => this._apply(true)}>force apply</button>.
            </div>`
          : nothing}

        ${this._view === "plan"
          ? this._planView()
          : this._view === "board"
          ? html`
              ${this._boardSection()}
              ${this._ghosts.length ? this._ghostSection() : nothing}
              <div class="exp-divider">
                <h2 class="exp-heading">Rooms <span class="exp">experimental</span></h2>
                <p class="muted">
                  Manage the Alexa room list itself — rename to match Home Assistant, clear ghost
                  rooms, create missing ones.
                </p>
              </div>
              ${this._roomSection()}
            `
          : html`
              ${this._rooms().map((room) => this._exposureCard(room))}
              ${this._ghosts.length ? this._ghostSection() : nothing}
              <div class="exp-divider">
                <h2 class="exp-heading">Alexa cleanup &amp; sync <span class="exp">experimental</span></h2>
                <p class="muted">
                  Reach into Alexa's own rooms and device list to match Home Assistant — rename and
                  clean up rooms, snap devices into them, and clear stale registrations. Needs Alexa
                  Media Player or the core Alexa Devices integration logged in.
                </p>
              </div>
              ${this._roomSection()}
              ${this._assignSection()}
              ${this._deviceRoomsSection()}
              ${this._speakerSection()}
              ${this._alexaSection()}
              ${this._shSection()}
            `}
      </div>
      ${this._view !== "plan" && (this._hasPending || this._syncing) ? this._deltaBar() : nothing}
    `;
  }

  private _exposureCard(room: {
    area: string;
    groups: Array<{ label: string; rows: Row[] }>;
  }): TemplateResult {
    return html`
      <section class="room card">
        <h2 class="rhead">
          ${room.area}
          <span class="count">${room.groups.reduce((n, g) => n + g.rows.length, 0)}</span>
        </h2>
        ${room.groups.map(
          (g) => html`
            <div class="kindgroup group kind-${g.label.toLowerCase().split(" ")[0]}">
              <h3 class="gcap">${g.label}</h3>
              <div class="rows">${g.rows.map((r) => this._row(r))}</div>
            </div>
          `
        )}
      </section>
    `;
  }

  private get _hasExposure(): boolean {
    return !this._nothingToDo;
  }

  private get _hasPending(): boolean {
    return (
      this._hasExposure ||
      this._alexaRemove.size > 0 ||
      this._roomInclude.size > 0 ||
      this._moveCount > 0 ||
      this._assignInclude.size > 0 ||
      this._shRemove.size > 0 ||
      this._speakerCount > 0
    );
  }

  private async _applyAll(): Promise<void> {
    if (
      this._busy ||
      this._alexaBusy ||
      this._roomBusy ||
      this._deviceRoomsBusy ||
      this._assignBusy ||
      this._shBusy ||
      this._speakerBusy ||
      this._syncing ||
      this._boardBusy
    )
      return;
    // Dependency order: expose/create endpoints & rooms first, place devices into rooms,
    // then set each room's preferred speaker (needs its speakers present), and finally the
    // destructive cleanups (deregister / forget) so nothing organized gets pulled early.
    const exposedNew = this._summary.expose; // capture before the diff collapses
    if (this._hasExposure) await this._apply(false);
    if (this._roomInclude.size > 0) await this._applyRoomOps();
    if (this._assignInclude.size > 0) await this._applyAssigns();
    if (this._moveCount > 0) await this._applyMoves();
    if (this._speakerCount > 0) await this._applySpeakers();
    if (this._alexaRemove.size > 0) await this._applyAlexaSelected();
    if (this._shRemove.size > 0) await this._applySh();
    // B-lite: if we just exposed new devices, wait for Alexa's smart-home sync to catch up,
    // then refresh the open plans so the new endpoints surface for review — never auto-placed.
    if (exposedNew > 0) await this._syncAndRefresh();
    else if (this._board) await this._loadBoard(); // reflect applied moves/speakers/removals
  }

  private get _alexaEndpointCount(): number {
    if (this._board?.rooms) {
      const inRooms = this._board.rooms.reduce(
        (n, r) => n + r.devices.filter((d) => d.endpoint_id).length,
        0
      );
      return inRooms + (this._board.unroomed ?? []).filter((d) => d.endpoint_id).length;
    }
    return (this._deviceRooms?.devices ?? []).length;
  }

  private async _syncAndRefresh(): Promise<void> {
    // Only worth waiting if something is open to refresh the new devices into.
    if (!this._board && !this._deviceRooms && !this._assignPlan && !this._speakers) return;
    this._syncing = true;
    try {
      if (this._board || this._deviceRooms) {
        const baseline = this._alexaEndpointCount;
        // Bounded poll (~48s): re-read the endpoint list until Alexa shows a new endpoint,
        // then stop. Timing out is fine — we refresh with whatever synced so far.
        for (let i = 0; i < 12; i++) {
          await new Promise((r) => setTimeout(r, 4000));
          if (this._board) await this._loadBoard();
          else await this._loadDeviceRooms();
          if (this._alexaEndpointCount > baseline) break;
        }
      } else {
        // Nothing to signal on — give Alexa a short beat, then refresh.
        await new Promise((r) => setTimeout(r, 8000));
      }
      // Refresh everything open so the new endpoints appear everywhere for review.
      if (this._board) await this._loadBoard();
      if (this._deviceRooms) await this._loadDeviceRooms();
      if (this._assignPlan) await this._loadAssignPlan();
      if (this._speakers) await this._loadSpeakers();
      if (this._roomPlan) await this._loadRoomPlan();
    } finally {
      this._syncing = false;
    }
  }

  // ── Aggregated board (the default view) ─────────────────────────────────────

  private async _loadBoard(): Promise<void> {
    if (this._boardBusy) return;
    this._boardBusy = true;
    try {
      this._board = await this.hass.connection.sendMessagePromise<BoardData>({
        type: "alexa_organizer/board",
      });
    } finally {
      this._boardBusy = false;
    }
  }

  // ── The plan (default view): compute the whole opinion, review, one sync ─────

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

  // The plan's groups with the user's manual room moves layered in: a touched device's
  // suggested place op is replaced by (or created as) a move to the chosen room.
  private _effectiveGroups(): PlanGroup[] {
    const groups = this._plan?.groups ?? [];
    const touched = Object.keys(this._userMove);
    if (touched.length === 0) return groups;
    const cur = this._endpointCurrentRoom();
    const synth: PlanOp[] = [];
    for (const [eid, to] of Object.entries(this._userMove)) {
      const current = cur.get(eid) ?? "";
      if (to === current) continue; // reverted / no change
      synth.push({
        id: `move:${eid}`, group: "place", title: `Move ${this._deviceName(eid)}`, detail: "",
        suggested: true, destructive: false,
        action: { kind: "move", endpoint_id: eid, from: current || null, to },
      });
    }
    const touchedSet = new Set(touched);
    const drop = (o: PlanOp) => o.action.kind === "move" && !!o.action.endpoint_id && touchedSet.has(o.action.endpoint_id);
    let sawPlace = false;
    const out = groups.map((g) => {
      if (g.key !== "place") return g;
      sawPlace = true;
      return { ...g, ops: [...g.ops.filter((o) => !drop(o)), ...synth] };
    });
    if (!sawPlace && synth.length) {
      out.push({ key: "place", title: "Put devices in their room", destructive: false, ops: synth });
    }
    return out;
  }

  private _homeRooms(): Array<{ id: string; name: string }> {
    return (this._plan?.board.rooms ?? [])
      .filter((r) => r.id)
      .map((r) => ({ id: r.id as string, name: r.name }));
  }

  private _onHomeMove(endpointId: string, value: string): void {
    const current = this._endpointCurrentRoom().get(endpointId) ?? "";
    this._userMove = { ...this._userMove, [endpointId]: value };
    const acc = new Set(this._accepted);
    const id = `move:${endpointId}`;
    if (value === current) acc.delete(id);
    else acc.add(id);
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
          // Opt-outs pin the current state via a label; then one reconcile (the review is consent).
          const exposeAll = plan.groups.flatMap((g) => g.ops).filter((o) => o.action.kind === "expose");
          for (const o of exposeAll.filter((o) => !this._accepted.has(o.id)))
            await ws({ type: "alexa_organizer/set", entity_id: o.action.entity_id, expose: !(o.action.to as boolean) });
          ops.forEach((o) => mark(o.id, "running"));
          try {
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
        ${this._boardBuckets(room.devices).map(
          (bk) => html`
            <div class="kindgroup group kind-${bk.kind}">
              <h3 class="gcap">${bk.label}</h3>
              <div class="rows">${bk.devices.map((d) => this._previewDeviceRow(d, room))}</div>
            </div>
          `
        )}
      </section>
    `;
  }

  private _previewDeviceRow(d: BoardDevice, room: BoardRoom): TemplateResult {
    const chip =
      d.source === "ha"
        ? `HA · ${DOMAIN_CHIP[d.domain ?? ""] ?? d.domain ?? "HA"}`
        : d.source === "echo"
          ? "Echo"
          : "Alexa-only";
    const preferred = !!(room.preferred_id && d.endpoint_id === room.preferred_id);
    // The device is rendered under its EFFECTIVE room, so the dropdown reflects that.
    const selected = room.id ?? "";
    return html`
      <div class="row ${d._removing ? "removing" : ""}">
        <div class="info">
          <div class="name ${d._removing ? "strike" : ""}">
            ${preferred ? html`<span class="star on">★</span> ` : nothing}${d.name}
          </div>
          <div class="meta">
            <span class="kind">${chip}</span>
            ${d.source === "ha" && d.exposed === false ? html`<span class="reason">hidden</span>` : nothing}
            ${!d.synced ? html`<span class="reason">will sync to Alexa</span>` : nothing}
            ${d._removing ? html`<span class="reason danger">will be removed</span>` : nothing}
          </div>
        </div>
        ${d.endpoint_id && !d._removing
          ? html`<select
              class="roomsel"
              ?disabled=${this._applying}
              @change=${(e: Event) => this._onHomeMove(d.endpoint_id as string, (e.target as HTMLSelectElement).value)}
            >
              <option value="" ?selected=${selected === ""}>(no room)</option>
              ${this._homeRooms().map(
                (r) => html`<option value=${r.id} ?selected=${selected === r.id}>${r.name}</option>`
              )}
            </select>`
          : nothing}
      </div>
    `;
  }

  private _rowFor(entityId: string): Row | undefined {
    return this._rows.find((r) => r.entity_id === entityId);
  }

  private async _toggleExpose(entityId: string, expose: boolean): Promise<void> {
    if (this._busy) return;
    this._busy = true;
    try {
      const inv = await this.hass.connection.sendMessagePromise<Inventory>({
        type: "alexa_organizer/set",
        entity_id: entityId,
        expose,
      });
      this._ingest(inv);
    } finally {
      this._busy = false;
    }
  }

  private _onBoardMove(endpointId: string, currentRoomId: string, value: string): void {
    const next = { ...this._moves };
    if (value === currentRoomId) delete next[endpointId];
    else next[endpointId] = value;
    this._moves = next;
  }

  private _onBoardPreferred(roomId: string, endpointId: string, currentPreferred: string | null): void {
    const next = { ...this._speakerPick };
    if (endpointId === (currentPreferred ?? "")) delete next[roomId];
    else next[roomId] = endpointId;
    this._speakerPick = next;
  }

  private _toggleBoardRemove(d: BoardDevice): void {
    if (!d.endpoint_id || d.protected) return;
    if (d.source === "echo") {
      const next = new Set(this._alexaRemove);
      next.has(d.endpoint_id) ? next.delete(d.endpoint_id) : next.add(d.endpoint_id);
      this._alexaRemove = next;
    } else {
      const next = new Set(this._shRemove);
      next.has(d.endpoint_id) ? next.delete(d.endpoint_id) : next.add(d.endpoint_id);
      this._shRemove = next;
    }
  }

  // Bucket a room's devices into the colored kind-boxes: HA kinds by domain, plus
  // Alexa-only and Echo as their own boxes.
  private _boardBuckets(
    devices: BoardDevice[]
  ): Array<{ label: string; kind: string; devices: BoardDevice[] }> {
    const buckets = new Map<
      string,
      { label: string; kind: string; order: number; devices: BoardDevice[] }
    >();
    for (const d of devices) {
      let key: string, label: string, kind: string, order: number;
      if (d.source === "echo") [key, label, kind, order] = ["echo", "Echo", "echo", 90];
      else if (d.source === "alexa") [key, label, kind, order] = ["alexa", "Alexa-only", "alexa", 91];
      else {
        const i = d.domain ? kindIndex(d.domain) : KIND_GROUPS.length - 1;
        [key, label, kind, order] = ["k" + i, KIND_GROUPS[i].label, KIND_GROUPS[i].label.toLowerCase().split(" ")[0], i];
      }
      const b = buckets.get(key);
      if (b) b.devices.push(d);
      else buckets.set(key, { label, kind, order, devices: [d] });
    }
    return [...buckets.values()].sort((a, b) => a.order - b.order);
  }

  private _boardSection(): TemplateResult {
    const b = this._board;
    if (b?.available === false) {
      // Alexa not connected — fall back to HA exposure cards so exposure still works.
      return html`
        <div class="banner warn">
          Alexa not connected (${b.reason ?? "no session"}). Showing Home Assistant exposure only —
          switch to Classic for the full toolset once a session is available.
        </div>
        ${this._rooms().map((room) => this._exposureCard(room))}
      `;
    }
    if (!b) return html`<p class="muted">Loading Alexa board…</p>`;
    const rooms = (b.rooms ?? [])
      .filter((r) => r.id)
      .map((r) => ({ id: r.id as string, name: r.name }));
    // Render the FUTURE state: project staged moves onto the layout so a device shows
    // under its target room's card (pending), like Chorus's working layout. `_board`
    // stays pristine so the apply path resolves each move's original `from` room.
    const laid = layoutBoard(b.rooms ?? [], b.unroomed ?? [], this._moves);
    return html`
      ${laid.rooms.map((room) => this._boardRoomCard(room, rooms))}
      ${laid.unroomed.length ? this._boardUnroomed(laid.unroomed, rooms) : nothing}
    `;
  }

  private _boardRoomCard(
    room: BoardRoom,
    rooms: Array<{ id: string; name: string }>
  ): TemplateResult {
    const badge =
      room.in_ha && room.in_alexa
        ? html`<span class="chip ok">HA · Alexa</span>`
        : room.in_ha
          ? html`<span class="chip warn">HA area · not in Alexa</span>`
          : html`<span class="chip warn">Alexa room · no HA area</span>`;
    return html`
      <section class="room card">
        <h2 class="rhead">
          ${room.name} <span class="count">${room.devices.length}</span> ${badge}
        </h2>
        ${this._boardBuckets(room.devices).map(
          (bk) => html`
            <div class="kindgroup group kind-${bk.kind}">
              <h3 class="gcap">${bk.label}</h3>
              <div class="rows">${bk.devices.map((d) => this._boardDeviceRow(d, room, rooms))}</div>
            </div>
          `
        )}
      </section>
    `;
  }

  private _boardUnroomed(
    devices: BoardDevice[],
    rooms: Array<{ id: string; name: string }>
  ): TemplateResult {
    const fake: BoardRoom = {
      id: null, name: "No room", in_alexa: false, in_ha: false, preferred_id: null, devices,
    };
    return html`
      <section class="room card">
        <h2 class="rhead">No room <span class="count">${devices.length}</span></h2>
        ${this._boardBuckets(devices).map(
          (bk) => html`
            <div class="kindgroup group kind-${bk.kind}">
              <h3 class="gcap">${bk.label}</h3>
              <div class="rows">${bk.devices.map((d) => this._boardDeviceRow(d, fake, rooms))}</div>
            </div>
          `
        )}
      </section>
    `;
  }

  private _boardDeviceRow(
    d: BoardDevice,
    room: BoardRoom,
    rooms: Array<{ id: string; name: string }>
  ): TemplateResult {
    const chip =
      d.source === "ha"
        ? `HA · ${DOMAIN_CHIP[d.domain ?? ""] ?? d.domain ?? "HA"}`
        : d.source === "echo"
          ? "Echo"
          : "Alexa-only";
    const haRow = d.entity_id ? this._rowFor(d.entity_id) : undefined;
    const exposed = haRow ? haRow.desired : d.exposed;
    const pendingExpose = haRow ? haRow.desired !== haRow.exposed : false;
    const effPreferred = room.id ? this._speakerPick[room.id] ?? room.preferred_id : null;
    const staged = d.endpoint_id ? d.endpoint_id in this._moves : false;
    const selectedRoom = staged ? this._moves[d.endpoint_id as string] : d.room_id ?? "";
    const removing = d.endpoint_id
      ? this._alexaRemove.has(d.endpoint_id) || this._shRemove.has(d.endpoint_id)
      : false;
    const busy = this._busy || this._boardBusy;
    return html`
      <div class="row ${staged ? "moving" : ""} ${removing ? "removing" : ""}">
        <div class="info">
          <div class="name">
            ${d.name} ${pendingExpose ? html`<span class="dot" title="pending"></span>` : nothing}
          </div>
          <div class="meta">
            <span class="kind">${chip}</span>
            ${!d.synced ? html`<span class="reason">⚠ not synced to Alexa yet</span>` : nothing}
          </div>
        </div>
        <div class="rowctl">
          ${d.source === "ha" && d.entity_id
            ? html`<button
                class="toggle ${exposed ? "on" : "off"}"
                ?disabled=${busy}
                @click=${() => this._toggleExpose(d.entity_id as string, !exposed)}
                title=${exposed ? "Exposed to Alexa — click to hide" : "Hidden — click to expose"}
              >
                ${exposed ? "On" : "Off"}
              </button>`
            : nothing}
          ${d.is_speaker && d.endpoint_id && room.id
            ? html`<button
                class="star ${effPreferred === d.endpoint_id ? "on" : ""}"
                ?disabled=${busy}
                title="Preferred speaker for this room"
                @click=${() =>
                  this._onBoardPreferred(room.id as string, d.endpoint_id as string, room.preferred_id)}
              >
                ★
              </button>`
            : nothing}
          ${d.endpoint_id
            ? html`<select
                class="roomsel"
                ?disabled=${busy}
                @change=${(e: Event) =>
                  this._onBoardMove(
                    d.endpoint_id as string,
                    d.room_id ?? "",
                    (e.target as HTMLSelectElement).value
                  )}
              >
                <option value="" ?selected=${selectedRoom === ""}>(no room)</option>
                ${rooms.map(
                  (r) => html`<option value=${r.id} ?selected=${selectedRoom === r.id}>${r.name}</option>`
                )}
              </select>`
            : nothing}
          ${d.endpoint_id && !d.protected && (d.suggested_remove || d.source !== "ha")
            ? html`<button
                class="rm ${removing ? "on" : ""}"
                ?disabled=${busy}
                title=${d.source === "echo" ? "Deregister this device" : "Remove this endpoint"}
                @click=${() => this._toggleBoardRemove(d)}
              >
                ${removing ? "Removing" : "Remove"}
              </button>`
            : nothing}
        </div>
      </div>
    `;
  }

  private async _loadRoomPlan(): Promise<void> {
    if (this._roomBusy) return;
    this._roomBusy = true;
    try {
      const plan = await this.hass.connection.sendMessagePromise<RoomPlan>({
        type: "alexa_organizer/room_plan",
      });
      this._roomPlan = plan;
      const ops = plan.ops ?? [];
      this._roomInclude = new Set(ops.filter((o) => o.suggested).map((o) => this._opKey(o)));
      this._roomStatus = {};
    } finally {
      this._roomBusy = false;
    }
  }

  private _opKey(o: RoomOp): string {
    return `${o.op}|${o.id ?? o.name}`;
  }

  private _toggleRoomOp(o: RoomOp): void {
    const k = this._opKey(o);
    const next = new Set(this._roomInclude);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    this._roomInclude = next;
  }

  private async _applyRoomOps(): Promise<void> {
    const rank: Record<string, number> = { rename: 0, delete: 1, create: 2 };
    const ops = (this._roomPlan?.ops ?? [])
      .filter((o) => this._roomInclude.has(this._opKey(o)))
      .sort((a, b) => rank[a.op] - rank[b.op]);
    for (const o of ops) {
      const k = this._opKey(o);
      this._roomStatus = { ...this._roomStatus, [k]: "running" };
      const data: Record<string, unknown> = { action: o.op };
      if (o.id) data.id = o.id;
      if (o.op === "rename") data.name = o.to;
      if (o.op === "create") data.name = o.name;
      try {
        await this.hass.callService("alexa_organizer", "room_op", data);
        this._roomStatus = { ...this._roomStatus, [k]: "done" };
      } catch {
        this._roomStatus = { ...this._roomStatus, [k]: "error" };
      }
    }
    await this._loadRoomPlan();
  }

  private _statusDisc(s?: string): TemplateResult {
    if (s === "done") return html`<span class="state done">✓</span>`;
    if (s === "error") return html`<span class="state error">✗</span>`;
    if (s === "running") return html`<span class="state running"></span>`;
    return html`<span class="state pending"></span>`;
  }

  private _roomSection(): TemplateResult {
    const p = this._roomPlan;
    return html`
      <section class="alexa-exp">
        <h2>Alexa rooms <span class="exp">experimental</span></h2>
        <p class="muted">
          Mirror your Home Assistant areas into Alexa's rooms — rename to match, clear the ghost
          rooms, and (opt-in) create the missing ones. Toggle each op On/Off; Apply runs them
          from the bar below.
        </p>
        ${!p
          ? html`<button class="apply" ?disabled=${this._roomBusy} @click=${this._loadRoomPlan}>
              ${this._roomBusy ? "Loading…" : "Preview room sync"}
            </button>`
          : p.available === false
            ? html`<div class="banner warn">
                Unavailable: ${p.reason ?? "no session"}. Needs Alexa Media Player logged in.
              </div>`
            : this._roomPlanBody(p.ops ?? [])}
      </section>
    `;
  }

  private _roomPlanBody(ops: RoomOp[]): TemplateResult {
    if (!ops.length) {
      return html`<p class="muted">Your Alexa rooms already match your HA areas. Nothing to do.</p>`;
    }
    const group = (label: string, list: RoomOp[]): TemplateResult | typeof nothing =>
      list.length
        ? html`<div class="kindgroup">
            <h3>${label} <span class="count">${list.length}</span></h3>
            <div class="rows">${list.map((o) => this._opRow(o))}</div>
          </div>`
        : nothing;
    return html`
      ${group("Rename to match HA", ops.filter((o) => o.op === "rename"))}
      ${group("Ghost rooms", ops.filter((o) => o.op === "delete"))}
      ${group("Missing rooms (opt-in)", ops.filter((o) => o.op === "create"))}
    `;
  }

  private _opRow(o: RoomOp): TemplateResult {
    const k = this._opKey(o);
    const included = this._roomInclude.has(k);
    const busy = this._busy || this._alexaBusy || this._roomBusy;
    return html`
      <div class="row ${o.op === "delete" && included ? "removing" : ""}">
        ${this._statusDisc(this._roomStatus[k])}
        <div class="info">
          <div class="name">${o.op === "rename" ? html`${o.from} → ${o.to}` : o.name}</div>
          <div class="meta">
            <span class="kind">${o.op}</span>
            ${o.op === "delete" ? (o.empty ? "empty — no HA area" : "has devices") : nothing}
          </div>
        </div>
        <button
          class="toggle ${included ? "on" : "off"}"
          ?disabled=${busy}
          @click=${() => this._toggleRoomOp(o)}
          title=${included ? "Will apply — click to skip" : "Skipped — click to include"}
        >
          ${included ? "On" : "Off"}
        </button>
      </div>
    `;
  }

  private async _loadSmarthome(): Promise<void> {
    if (this._shBusy) return;
    this._shBusy = true;
    try {
      const plan = await this.hass.connection.sendMessagePromise<SmarthomeData>({
        type: "alexa_organizer/smarthome_cleanup",
      });
      this._shPlan = plan;
      this._shRemove = new Set(
        (plan.candidates ?? []).filter((c) => c.suggested_remove).map((c) => c.id)
      );
      this._shStatus = {};
    } finally {
      this._shBusy = false;
    }
  }

  private _toggleSh(id: string): void {
    const next = new Set(this._shRemove);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this._shRemove = next;
  }

  private async _applySh(): Promise<void> {
    for (const id of [...this._shRemove]) {
      this._shStatus = { ...this._shStatus, [id]: "running" };
      try {
        await this.hass.callService("alexa_organizer", "forget_endpoint", { endpoint_id: id });
        this._shStatus = { ...this._shStatus, [id]: "done" };
      } catch {
        this._shStatus = { ...this._shStatus, [id]: "error" };
      }
    }
    if (this._shPlan) await this._loadSmarthome();
  }

  private _shSection(): TemplateResult {
    const p = this._shPlan;
    return html`
      <section class="alexa-exp">
        <h2>Duplicate &amp; stray endpoints <span class="exp">experimental</span></h2>
        <p class="muted">
          Alexa smart-home endpoints that are duplicates (same name twice) or don't match a
          live HA entity. Duplicates are pre-checked to remove; strays (maybe other-source) are
          left for you to opt in.
        </p>
        ${!p
          ? html`<button class="apply" ?disabled=${this._shBusy} @click=${this._loadSmarthome}>
              ${this._shBusy ? "Loading…" : "Preview cleanup"}
            </button>`
          : p.available === false
            ? html`<div class="banner warn">
                Unavailable: ${p.reason ?? "no session"}. Needs Alexa Media Player or Alexa Devices.
              </div>`
            : this._shBody(p.candidates ?? [])}
      </section>
    `;
  }

  private _shBody(cands: SmarthomeCandidate[]): TemplateResult {
    if (!cands.length) {
      return html`<p class="muted">No duplicate or stray endpoints — clean.</p>`;
    }
    const row = (c: SmarthomeCandidate): TemplateResult => {
      const on = this._shRemove.has(c.id);
      const busy = this._busy || this._shBusy;
      return html`<div class="row ${on ? "removing" : ""}">
        ${this._statusDisc(this._shStatus[c.id])}
        <div class="info">
          <div class="name">${c.name || "(unnamed)"}</div>
          <div class="meta"><span class="kind">${c.duplicate ? "duplicate" : "stray"}</span></div>
        </div>
        <button class="toggle ${on ? "rem" : "keepbtn"}" ?disabled=${busy}
          @click=${() => this._toggleSh(c.id)}>${on ? "Remove" : "Keep"}</button>
      </div>`;
    };
    const dups = cands.filter((c) => c.duplicate);
    const strays = cands.filter((c) => !c.duplicate);
    return html`
      ${dups.length
        ? html`<div class="kindgroup">
            <h3>Duplicates <span class="count">${dups.length}</span></h3>
            <div class="rows">${dups.map(row)}</div>
          </div>`
        : nothing}
      ${strays.length
        ? html`<div class="kindgroup">
            <h3>Strays — not from HA <span class="count">${strays.length}</span></h3>
            <div class="rows">${strays.map(row)}</div>
          </div>`
        : nothing}
    `;
  }

  private async _loadAssignPlan(): Promise<void> {
    if (this._assignBusy) return;
    this._assignBusy = true;
    try {
      const plan = await this.hass.connection.sendMessagePromise<AssignPlan>({
        type: "alexa_organizer/assign_plan",
      });
      this._assignPlan = plan;
      this._assignInclude = new Set((plan.assigns ?? []).map((a) => a.id)); // all on by default
      this._assignStatus = {};
    } finally {
      this._assignBusy = false;
    }
  }

  private _toggleAssign(id: string): void {
    const next = new Set(this._assignInclude);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this._assignInclude = next;
  }

  private async _applyAssigns(): Promise<void> {
    const ops = (this._assignPlan?.assigns ?? []).filter((a) => this._assignInclude.has(a.id));
    for (const a of ops) {
      this._assignStatus = { ...this._assignStatus, [a.id]: "running" };
      const data: Record<string, unknown> = { endpoint_id: a.id, to: a.to_id };
      if (a.from_id) data.from = a.from_id;
      try {
        await this.hass.callService("alexa_organizer", "move_device", data);
        this._assignStatus = { ...this._assignStatus, [a.id]: "done" };
      } catch {
        this._assignStatus = { ...this._assignStatus, [a.id]: "error" };
      }
    }
    await this._loadAssignPlan();
  }

  private _assignSection(): TemplateResult {
    const p = this._assignPlan;
    return html`
      <section class="alexa-exp">
        <h2>Snap exposed devices to rooms <span class="exp">experimental</span></h2>
        <p class="muted">
          Put each exposed HA device into its area's Alexa room (HA area is the truth, matched by
          name). Suggestions are pre-checked — toggle any off; applies from the bar below.
        </p>
        ${!p
          ? html`<button class="apply" ?disabled=${this._assignBusy} @click=${this._loadAssignPlan}>
              ${this._assignBusy ? "Loading…" : "Preview assignments"}
            </button>`
          : p.available === false
            ? html`<div class="banner warn">
                Unavailable: ${p.reason ?? "no session"}. Needs Alexa Media Player or Alexa Devices.
              </div>`
            : this._assignBody(p)}
      </section>
    `;
  }

  private _assignBody(p: AssignPlan): TemplateResult {
    const assigns = p.assigns ?? [];
    if (!assigns.length) {
      return html`<p class="muted">
        Nothing to assign${p.no_room ? ` (${p.no_room} need a room created first — run room sync)` : ""}.
      </p>`;
    }
    return html`
      <div class="kindgroup">
        <h3>Assign to room <span class="count">${assigns.length}</span></h3>
        <div class="rows">
          ${assigns.map((a) => {
            const on = this._assignInclude.has(a.id);
            const busy = this._busy || this._alexaBusy || this._roomBusy || this._assignBusy;
            return html`<div class="row ${on ? "moving" : ""}">
              ${this._statusDisc(this._assignStatus[a.id])}
              <div class="info">
                <div class="name">${a.name}</div>
                <div class="meta">→ ${a.to_name}</div>
              </div>
              <button class="toggle ${on ? "on" : "off"}" ?disabled=${busy}
                @click=${() => this._toggleAssign(a.id)}>${on ? "On" : "Off"}</button>
            </div>`;
          })}
        </div>
      </div>
      <p class="muted">
        ${p.no_room ? `${p.no_room} more need their room created first (room sync). ` : ""}
        ${p.unmatched ? `${p.unmatched} endpoints didn't match a live HA entity (left alone).` : ""}
      </p>
    `;
  }

  private async _loadDeviceRooms(): Promise<void> {
    if (this._deviceRoomsBusy) return;
    this._deviceRoomsBusy = true;
    try {
      this._deviceRooms = await this.hass.connection.sendMessagePromise<DeviceRoomsData>({
        type: "alexa_organizer/device_rooms",
      });
      // Snap: pre-stage the name-matched room suggestions (each still overridable via the dropdown).
      const moves: Record<string, string> = {};
      for (const d of this._deviceRooms.devices ?? []) {
        if (d.suggested_room_id) moves[d.id] = d.suggested_room_id;
      }
      this._moves = moves;
      this._moveStatus = {};
    } finally {
      this._deviceRoomsBusy = false;
    }
  }

  private _currentRoom(d: DeviceRoom): string {
    return d.room_id ?? "";
  }

  private _onRoomChange(d: DeviceRoom, value: string): void {
    const next = { ...this._moves };
    if (value === this._currentRoom(d)) delete next[d.id];
    else next[d.id] = value;
    this._moves = next;
  }

  private get _moveCount(): number {
    return Object.keys(this._moves).length;
  }

  private async _loadSpeakers(): Promise<void> {
    if (this._speakerBusy) return;
    this._speakerBusy = true;
    try {
      this._speakers = await this.hass.connection.sendMessagePromise<RoomSpeakers>({
        type: "alexa_organizer/room_speakers",
      });
      this._speakerPick = {};
      this._speakerStatus = {};
    } finally {
      this._speakerBusy = false;
    }
  }

  private _onSpeakerChange(r: RoomSpeaker, value: string): void {
    const next = { ...this._speakerPick };
    if (value === (r.current_id ?? "")) delete next[r.room_id];
    else next[r.room_id] = value;
    this._speakerPick = next;
  }

  private get _speakerCount(): number {
    return Object.keys(this._speakerPick).length;
  }

  private async _applySpeakers(): Promise<void> {
    for (const [roomId, endpointId] of Object.entries(this._speakerPick)) {
      if (!endpointId) continue; // a room's preferred speaker can't be "none"
      this._speakerStatus = { ...this._speakerStatus, [roomId]: "running" };
      try {
        await this.hass.callService("alexa_organizer", "set_preferred_speaker", {
          room_id: roomId,
          endpoint_id: endpointId,
        });
        this._speakerStatus = { ...this._speakerStatus, [roomId]: "done" };
      } catch {
        this._speakerStatus = { ...this._speakerStatus, [roomId]: "error" };
      }
    }
    await this._loadSpeakers();
  }

  private _speakerSection(): TemplateResult {
    const sp = this._speakers;
    return html`
      <section class="alexa-exp">
        <h2>Preferred speaker <span class="exp">experimental</span></h2>
        <p class="muted">
          In a room with more than one speaker, pick which one answers "play music here" — an
          Echo, a Sonos, whatever Alexa sees in the room. Rooms with a single speaker are
          skipped. Applies from the bar below.
        </p>
        ${!sp
          ? html`<button class="apply" ?disabled=${this._speakerBusy} @click=${this._loadSpeakers}>
              ${this._speakerBusy ? "Loading…" : "Load speakers"}
            </button>`
          : sp.available === false
            ? html`<div class="banner warn">
                Unavailable: ${sp.reason ?? "no session"}. Needs Alexa Media Player logged in.
              </div>`
            : this._speakerBody(sp)}
      </section>
    `;
  }

  private _speakerBody(sp: RoomSpeakers): TemplateResult {
    const rooms = (sp.rooms ?? []).filter((r) => r.candidates.length > 1);
    if (!rooms.length) {
      return html`<div class="rows">
        <div class="row">
          <div class="info">
            <div class="name muted">No room has more than one speaker to choose between.</div>
          </div>
        </div>
      </div>`;
    }
    return html`
      <div class="kindgroup group kind-speakers">
        <div class="rows">${rooms.map((r) => this._speakerRow(r))}</div>
      </div>
    `;
  }

  private _speakerRow(r: RoomSpeaker): TemplateResult {
    const staged = r.room_id in this._speakerPick;
    const selected = staged ? this._speakerPick[r.room_id] : r.current_id ?? "";
    const busy = this._speakerBusy || this._busy;
    return html`
      <div class="row ${staged ? "moving" : ""}">
        ${this._statusDisc(this._speakerStatus[r.room_id])}
        <div class="info"><div class="name">${r.room_name}</div></div>
        <select
          class="roomsel"
          ?disabled=${busy}
          @change=${(e: Event) => this._onSpeakerChange(r, (e.target as HTMLSelectElement).value)}
        >
          <option value="" ?selected=${selected === ""}>(none)</option>
          ${r.candidates.map(
            (c) =>
              html`<option value=${c.endpointId} ?selected=${selected === c.endpointId}>
                ${c.name}
              </option>`
          )}
        </select>
      </div>
    `;
  }

  // The endpoint's CURRENT room, resolved from whichever view is loaded (board or classic).
  private _endpointRoom(id: string): string | null {
    for (const room of this._board?.rooms ?? []) {
      if (room.devices.some((d) => d.endpoint_id === id)) return room.id;
    }
    return (this._deviceRooms?.devices ?? []).find((d) => d.id === id)?.room_id ?? null;
  }

  private async _applyMoves(): Promise<void> {
    for (const [id, to] of Object.entries(this._moves)) {
      this._moveStatus = { ...this._moveStatus, [id]: "running" };
      const from = this._endpointRoom(id);
      const data: Record<string, unknown> = { endpoint_id: id };
      if (from) data.from = from;
      if (to) data.to = to;
      try {
        await this.hass.callService("alexa_organizer", "move_device", data);
        this._moveStatus = { ...this._moveStatus, [id]: "done" };
      } catch {
        this._moveStatus = { ...this._moveStatus, [id]: "error" };
      }
    }
    if (this._deviceRooms) await this._loadDeviceRooms();
  }

  private _deviceRoomsSection(): TemplateResult {
    const dr = this._deviceRooms;
    return html`
      <section class="alexa-exp">
        <h2>Devices in rooms <span class="exp">experimental</span></h2>
        <p class="muted">
          Which Alexa room each device sits in. Devices whose name matches a room are
          pre-snapped to it (highlighted) — override any with the dropdown; moves apply from
          the bar below.
        </p>
        ${!dr
          ? html`<button class="apply" ?disabled=${this._deviceRoomsBusy} @click=${this._loadDeviceRooms}>
              ${this._deviceRoomsBusy ? "Loading…" : "Load device rooms"}
            </button>`
          : dr.available === false
            ? html`<div class="banner warn">
                Unavailable: ${dr.reason ?? "no session"}. Needs Alexa Media Player logged in.
              </div>`
            : this._deviceRoomsBody(dr)}
      </section>
    `;
  }

  private _deviceRoomsBody(dr: DeviceRoomsData): TemplateResult {
    const rooms = dr.rooms ?? [];
    const byRoom = new Map<string, DeviceRoom[]>();
    for (const d of dr.devices ?? []) {
      const key = d.room_name ?? "Unassigned";
      const arr = byRoom.get(key);
      if (arr) arr.push(d);
      else byRoom.set(key, [d]);
    }
    const names = [...byRoom.keys()].sort((a, b) =>
      a === "Unassigned" ? 1 : b === "Unassigned" ? -1 : a.localeCompare(b)
    );
    return html`
      ${names.map(
        (rn) => html`
          <div class="kindgroup">
            <h3>${rn} <span class="count">${byRoom.get(rn)!.length}</span></h3>
            <div class="rows">${byRoom.get(rn)!.map((d) => this._deviceRoomRow(d, rooms))}</div>
          </div>
        `
      )}
    `;
  }

  private _deviceRoomRow(d: DeviceRoom, rooms: Array<{ id: string; name: string }>): TemplateResult {
    const staged = d.id in this._moves;
    const selected = staged ? this._moves[d.id] : this._currentRoom(d);
    const busy = this._busy || this._alexaBusy || this._roomBusy || this._deviceRoomsBusy;
    return html`
      <div class="row ${staged ? "moving" : ""}">
        ${this._statusDisc(this._moveStatus[d.id])}
        <div class="info"><div class="name">${d.name}</div></div>
        <select
          class="roomsel"
          ?disabled=${busy}
          @change=${(e: Event) => this._onRoomChange(d, (e.target as HTMLSelectElement).value)}
        >
          <option value="" ?selected=${selected === ""}>(unassigned)</option>
          ${rooms.map(
            (r) => html`<option value=${r.id} ?selected=${selected === r.id}>${r.name}</option>`
          )}
        </select>
      </div>
    `;
  }

  private _alexaSection(): TemplateResult {
    const a = this._alexa;
    if (!a) {
      return html`
        <section class="alexa-exp">
          <h2>Alexa devices <span class="exp">experimental</span></h2>
          <p class="muted">
            Review the device registrations on your Amazon account — your real Echos, plus the
            phantom app installs and duplicates that pile up. Needs Alexa Media Player logged in.
          </p>
          <button class="apply" ?disabled=${this._alexaBusy} @click=${this._previewAlexa}>
            ${this._alexaBusy ? "Loading…" : "Load devices"}
          </button>
        </section>
      `;
    }
    if (a.available === false) {
      return html`
        <section class="alexa-exp">
          <h2>Alexa devices <span class="exp">experimental</span></h2>
          <div class="banner warn">
            Unavailable: ${a.reason ?? "no session"}. Install and log into Alexa Media Player.
          </div>
        </section>
      `;
    }
    const devices = a.devices ?? [];
    const remove = devices.filter((d) => this._alexaRemove.has(d.id));
    const keep = devices.filter((d) => !d.protected && !this._alexaRemove.has(d.id));
    const prot = devices.filter((d) => d.protected);
    return html`
      <section class="alexa-exp">
        <h2>Alexa devices <span class="exp">experimental</span></h2>
        <p class="muted">
          Toggle each device <b>Keep</b> or <b>Remove</b>. The removal suggestions are generic
          (companion-app entries and duplicate names) — you decide. Protected devices, and your
          Alexa Media Player session, can't be removed.
        </p>
        ${remove.length ? this._deviceGroup("Removing", remove, "remove") : nothing}
        ${keep.length ? this._deviceGroup("Keeping", keep, "keep") : nothing}
        ${prot.length ? this._deviceGroup("Protected", prot, "protected") : nothing}
      </section>
    `;
  }

  private _deviceGroup(
    label: string,
    devices: AlexaDevice[],
    mode: "remove" | "keep" | "protected"
  ): TemplateResult {
    return html`
      <div class="kindgroup">
        <h3>${label} <span class="count">${devices.length}</span></h3>
        <div class="rows">
          ${devices.map(
            (d) => html`
              <div class="row ${mode === "remove" ? "removing" : ""}">
                ${mode === "remove" ? html`<span class="minus">−</span>` : nothing}
                <div class="info"><div class="name">${d.name}</div></div>
                ${mode === "protected"
                  ? html`<span class="tag">protected</span>`
                  : html`<button
                      class="toggle ${mode === "remove" ? "rem" : "keepbtn"}"
                      ?disabled=${this._alexaBusy}
                      @click=${() => this._toggleDevice(d)}
                      title=${mode === "remove" ? "Set to remove — click to keep" : "Keeping — click to remove"}
                    >
                      ${mode === "remove" ? "Remove" : "Keep"}
                    </button>`}
              </div>
            `
          )}
        </div>
      </div>
    `;
  }

  private _deltaBar(): TemplateResult {
    const s = this._summary;
    const dev = this._alexaRemove.size + this._shRemove.size;
    const rooms = this._roomInclude.size;
    const moves = this._moveCount + this._assignInclude.size;
    const spk = this._speakerCount;
    const busy =
      this._busy ||
      this._alexaBusy ||
      this._roomBusy ||
      this._deviceRoomsBusy ||
      this._assignBusy ||
      this._shBusy ||
      this._speakerBusy ||
      this._syncing ||
      this._boardBusy;
    return html`
      <div class="deltabar ${busy ? "busy" : ""}">
        <div class="flare"></div>
        <div class="deltabar-inner">
          <div class="chips">
            <span class="chip add" ?hidden=${!s.expose}>+${s.expose} expose</span>
            <span class="chip live" ?hidden=${!s.live_remove}>−${s.live_remove} unexpose</span>
            <span class="chip ghost" ?hidden=${!s.ghost_remove}>−${s.ghost_remove} stale</span>
            <span class="chip live" ?hidden=${!dev}>−${dev} device${dev === 1 ? "" : "s"}</span>
            <span class="chip add" ?hidden=${!rooms}>${rooms} room${rooms === 1 ? "" : "s"}</span>
            <span class="chip add" ?hidden=${!moves}>${moves} move${moves === 1 ? "" : "s"}</span>
            <span class="chip add" ?hidden=${!spk}>${spk} speaker${spk === 1 ? "" : "s"}</span>
          </div>
          <div class="applybtns">
            <button class="link" @click=${() => (this._detailsOpen = !this._detailsOpen)}>
              ${this._detailsOpen ? "Hide" : "Details"}
            </button>
            <button class="apply" ?disabled=${busy} @click=${this._applyAll}>
              ${this._syncing ? "Waiting for Alexa…" : busy ? "Applying…" : "Apply all"}
            </button>
          </div>
        </div>
        ${this._detailsOpen ? this._deltaDetails() : nothing}
      </div>
    `;
  }

  private _deltaDetails(): TemplateResult {
    const changed = this._rows.filter((r) => r.desired !== r.exposed);
    const devNames = (this._alexa?.devices ?? [])
      .filter((d) => this._alexaRemove.has(d.id))
      .map((d) => d.name)
      .sort();
    const shNames = (this._shPlan?.candidates ?? [])
      .filter((c) => this._shRemove.has(c.id))
      .map((c) => c.name || "(unnamed)");
    const roomOps = (this._roomPlan?.ops ?? []).filter((o) => this._roomInclude.has(this._opKey(o)));
    const assigns = (this._assignPlan?.assigns ?? []).filter((a) => this._assignInclude.has(a.id));
    const moves = Object.entries(this._moves);
    const speakerRooms = this._speakers?.rooms ?? [];
    const speakers = Object.entries(this._speakerPick).map(([roomId, epId]) => {
      const room = speakerRooms.find((r) => r.room_id === roomId);
      return {
        room: room?.room_name ?? roomId,
        speaker: room?.candidates.find((c) => c.endpointId === epId)?.name ?? epId,
      };
    });
    const roomName = (id: string): string =>
      (this._deviceRooms?.rooms ?? []).find((r) => r.id === id)?.name ?? "(unassigned)";
    const devName = (id: string): string =>
      (this._deviceRooms?.devices ?? []).find((d) => d.id === id)?.name ?? id;
    const empty =
      !changed.length &&
      !this._ghosts.length &&
      !devNames.length &&
      !shNames.length &&
      !roomOps.length &&
      !assigns.length &&
      !moves.length &&
      !speakers.length;
    return html`
      <div class="deltadetails">
        ${changed.map(
          (r) => html`<div class="dline">
            <span class="${r.desired ? "plus" : "minus"}">${r.desired ? "+" : "−"}</span>
            ${r.desired ? "expose" : "unexpose"} · ${r.name}
          </div>`
        )}
        ${this._ghosts.map(
          (r) => html`<div class="dline"><span class="minus">−</span> clean stale · ${r.entity_id}</div>`
        )}
        ${devNames.map(
          (n) => html`<div class="dline"><span class="minus">−</span> remove device · ${n}</div>`
        )}
        ${shNames.map(
          (n) => html`<div class="dline"><span class="minus">−</span> remove endpoint · ${n}</div>`
        )}
        ${roomOps.map(
          (o) => html`<div class="dline">
            <span class="${o.op === "create" ? "plus" : "minus"}">
              ${o.op === "create" ? "+" : o.op === "delete" ? "−" : "~"}
            </span>
            ${o.op} room · ${o.op === "rename" ? html`${o.from} → ${o.to}` : o.name}
          </div>`
        )}
        ${assigns.map(
          (a) => html`<div class="dline">
            <span class="plus">~</span> assign · ${a.name} → ${a.to_name}
          </div>`
        )}
        ${moves.map(
          ([id, to]) => html`<div class="dline">
            <span class="plus">~</span> move · ${devName(id)} → ${to ? roomName(to) : "(unassigned)"}
          </div>`
        )}
        ${speakers.map(
          (s) => html`<div class="dline">
            <span class="plus">~</span> speaker · ${s.room} → ${s.speaker}
          </div>`
        )}
        ${empty ? html`<div class="dline muted">No pending changes.</div>` : nothing}
      </div>
    `;
  }

  private _row(r: Row): TemplateResult {
    const pending = r.desired !== r.exposed;
    return html`
      <div class="row">
        <div class="info">
          <div class="name">
            ${r.name}
            ${pending ? html`<span class="dot" title="pending"></span>` : nothing}
          </div>
          <div class="meta">
            <span class="kind">${DOMAIN_CHIP[r.domain] ?? r.domain}</span>
            <span class="reason ${r.overridden ? "label" : ""}">${r.reason}</span>
          </div>
        </div>
        <button
          class="toggle ${r.desired ? "on" : "off"}"
          ?disabled=${this._busy}
          @click=${() => this._toggle(r)}
          title=${r.desired ? "Exposed to Alexa — click to hide" : "Hidden — click to expose"}
        >
          ${r.desired ? "On" : "Off"}
        </button>
      </div>
    `;
  }

  private _ghostSection(): TemplateResult {
    return html`
      <section class="ghosts">
        <h2>Stale records <span class="count">${this._ghosts.length}</span></h2>
        <p class="muted">
          Exposed to Alexa but no longer in Home Assistant (Sonos re-discovery churn). Apply
          cleans these — it can't break anything, the devices are already gone.
        </p>
        <div class="rows">
          ${this._ghosts.map(
            (r) => html`<div class="row ghost">
              <div class="info">
                <div class="name">${r.entity_id}</div>
                <div class="meta"><span class="reason">${r.reason}</span></div>
              </div>
              <span class="tag">will clean</span>
            </div>`
          )}
        </div>
      </section>
    `;
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
    /* Inside a room card: each kind is a tinted box with an accent rail. */
    .room .kindgroup {
      --kind: var(--secondary-text-color, #6b7280);
      border: 1px solid color-mix(in srgb, var(--kind) 30%, transparent);
      border-left: 3px solid var(--kind);
      border-radius: 10px;
      background: color-mix(in srgb, var(--kind) 7%, var(--card-background-color, #fff));
      padding: 4px 10px 8px;
      margin-top: 10px;
    }
    .room .kindgroup:first-of-type {
      margin-top: 0;
    }
    .room .kindgroup .gcap {
      color: var(--kind);
      margin: 8px 2px 6px;
    }
    .room .kindgroup .rows {
      background: transparent;
      border-radius: 0;
      box-shadow: none;
      overflow: visible;
    }
    .room .kindgroup .row {
      border-bottom-color: color-mix(in srgb, var(--kind) 18%, transparent);
    }
    .room .kind-lighting { --kind: #e0a72e; }
    .room .kind-speakers { --kind: #2f6fed; }
    .room .kind-climate  { --kind: #129d9d; }
    .room .kind-scenes   { --kind: #6a4bd8; }
    .room .kind-other    { --kind: #6b7280; }
    .room .kind-echo     { --kind: #b06f2e; }
    .room .kind-alexa    { --kind: #9333ea; }
    /* Per-device inline controls in the board */
    .rowctl {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .star {
      border: 1px solid var(--divider-color, #d0d0d0);
      background: var(--card-background-color, #fff);
      color: var(--secondary-text-color, #999);
      border-radius: 8px;
      width: 30px;
      height: 30px;
      font-size: 15px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
    }
    .star.on {
      color: #f5b301;
      border-color: #f5b301;
      background: color-mix(in srgb, #f5b301 14%, var(--card-background-color, #fff));
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
      font-size: 0.78rem;
      color: var(--secondary-text-color, #727272);
      margin-top: 2px;
    }
    .kind {
      display: inline-block;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 1px 6px;
      margin-right: 6px;
      border-radius: 4px;
      background: var(--divider-color, #e8e8e8);
      color: var(--secondary-text-color, #616161);
      vertical-align: 1px;
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
