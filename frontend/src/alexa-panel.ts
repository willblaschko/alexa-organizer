import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";

// Minimal shape of the objects HA hands a custom panel.
interface HomeAssistant {
  connection: {
    sendMessagePromise<T>(msg: Record<string, unknown>): Promise<T>;
  };
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

// Friendly, ordered domain headings. Anything not listed falls to the bottom under
// its raw domain name.
const DOMAIN_LABELS: Record<string, string> = {
  media_player: "Speakers & media",
  light: "Lights",
  switch: "Switches",
  climate: "Climate",
  scene: "Scenes",
  script: "Scripts (voice scenes)",
  cover: "Covers",
  fan: "Fans",
  vacuum: "Vacuums",
  lock: "Locks",
  camera: "Cameras",
  input_boolean: "Toggles",
};
const DOMAIN_ORDER = Object.keys(DOMAIN_LABELS);

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

  private get _nothingToDo(): boolean {
    const s = this._summary;
    return s.expose + s.live_remove + s.ghost_remove === 0;
  }

  private _groups(): Array<{ domain: string; label: string; rows: Row[] }> {
    const byDomain = new Map<string, Row[]>();
    for (const r of this._rows) {
      if (r.ghost) continue;
      (byDomain.get(r.domain) ?? byDomain.set(r.domain, []).get(r.domain)!).push(r);
    }
    const domains = [...byDomain.keys()].sort((a, b) => {
      const ia = DOMAIN_ORDER.indexOf(a);
      const ib = DOMAIN_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    });
    return domains.map((d) => ({
      domain: d,
      label: DOMAIN_LABELS[d] ?? d,
      rows: byDomain.get(d)!,
    }));
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
              What Home Assistant exposes to Alexa. Organize rooms &amp; groups in the Alexa
              app — this controls the device list, not the layout.
            </p>
          </div>
          <div class="actions">
            <span class="chip add" ?hidden=${!s.expose}>+${s.expose} expose</span>
            <span class="chip live" ?hidden=${!s.live_remove}>−${s.live_remove} live</span>
            <span class="chip ghost" ?hidden=${!s.ghost_remove}>−${s.ghost_remove} stale</span>
            <span class="chip ok" ?hidden=${!this._nothingToDo}>In sync</span>
            <button
              class="apply"
              ?disabled=${this._nothingToDo || this._busy}
              @click=${() => this._apply(false)}
            >
              ${this._busy ? "Applying…" : "Apply"}
            </button>
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

        ${this._groups().map(
          (g) => html`
            <section>
              <h2>${g.label} <span class="count">${g.rows.length}</span></h2>
              <div class="rows">${g.rows.map((r) => this._row(r))}</div>
            </section>
          `
        )}
        ${this._ghosts.length ? this._ghostSection() : nothing}
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
            ${r.area ? html`<span class="area">${r.area}</span> · ` : nothing}
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
      padding: 16px;
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
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--secondary-text-color, #727272);
      margin: 0 4px 8px;
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
    .area {
      font-weight: 500;
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
