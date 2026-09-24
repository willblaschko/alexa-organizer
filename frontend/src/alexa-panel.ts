import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";

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

  override connectedCallback(): void {
    super.connectedCallback();
    void this._load();
  }

  private async _load(): Promise<void> {
    this._loading = true;
    try {
      const inv = await this.hass.connection.sendMessagePromise<Inventory>({
        type: "alexa_curator/inventory",
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
        type: "alexa_curator/set",
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
      }>({ type: "alexa_curator/apply", force });
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
        type: "alexa_curator/alexa_devices",
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
      await this.hass.callService("alexa_curator", "alexa_devices", {
        apply: true,
        endpoint_ids: [...this._alexaRemove],
      });
      const res = await this.hass.connection.sendMessagePromise<AlexaDevices>({
        type: "alexa_curator/alexa_devices",
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
            <h1>Alexa Curator</h1>
            <p class="sub">
              Grouped by your Home Assistant areas. Controls what Alexa sees — organize the
              actual rooms &amp; groups in the Alexa app.
            </p>
          </div>
          <span class="chip ok headernote" ?hidden=${this._hasPending}>In sync</span>
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

        ${this._rooms().map(
          (room) => html`
            <section class="room">
              <h2>
                ${room.area}
                <span class="count">${room.groups.reduce((n, g) => n + g.rows.length, 0)}</span>
              </h2>
              ${room.groups.map(
                (g) => html`
                  <div class="kindgroup">
                    <h3>${g.label}</h3>
                    <div class="rows">${g.rows.map((r) => this._row(r))}</div>
                  </div>
                `
              )}
            </section>
          `
        )}
        ${this._ghosts.length ? this._ghostSection() : nothing}
        ${this._alexaSection()}
      </div>
      ${this._hasPending ? this._deltaBar() : nothing}
    `;
  }

  private get _hasExposure(): boolean {
    return !this._nothingToDo;
  }

  private get _hasPending(): boolean {
    return this._hasExposure || this._alexaRemove.size > 0;
  }

  private async _applyAll(): Promise<void> {
    if (this._busy || this._alexaBusy) return;
    if (this._hasExposure) await this._apply(false);
    if (this._alexaRemove.size > 0) await this._applyAlexaSelected();
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
    const dev = this._alexaRemove.size;
    const busy = this._busy || this._alexaBusy;
    return html`
      <div class="deltabar ${busy ? "busy" : ""}">
        <div class="flare"></div>
        <div class="deltabar-inner">
          <div class="chips">
            <span class="chip add" ?hidden=${!s.expose}>+${s.expose} expose</span>
            <span class="chip live" ?hidden=${!s.live_remove}>−${s.live_remove} unexpose</span>
            <span class="chip ghost" ?hidden=${!s.ghost_remove}>−${s.ghost_remove} stale</span>
            <span class="chip live" ?hidden=${!dev}>−${dev} device${dev === 1 ? "" : "s"}</span>
          </div>
          <div class="applybtns">
            <button class="link" @click=${() => (this._detailsOpen = !this._detailsOpen)}>
              ${this._detailsOpen ? "Hide" : "Details"}
            </button>
            <button class="apply" ?disabled=${busy} @click=${this._applyAll}>
              ${busy ? "Applying…" : "Apply all"}
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
        ${!changed.length && !this._ghosts.length && !devNames.length
          ? html`<div class="dline muted">No pending changes.</div>`
          : nothing}
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
    section.room {
      margin-bottom: 26px;
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
    .rows {
      background: var(--card-background-color, #fff);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
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
      margin-top: 30px;
      border-top: 1px dashed var(--divider-color, #ccc);
      padding-top: 16px;
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
    .deltabar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 20;
      overflow: hidden;
      background: var(--card-background-color, #fff);
      border-top: 1px solid var(--divider-color, #ddd);
      box-shadow: 0 -3px 14px rgba(0, 0, 0, 0.14);
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
      justify-content: space-between;
      gap: 16px;
      max-width: 900px;
      margin: 0 auto;
      padding: 12px 16px;
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
      max-width: 900px;
      margin: 0 auto;
      max-height: 42vh;
      overflow-y: auto;
      padding: 4px 16px 12px;
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
