// Pure view-layer types + layout for the aggregated board. No Lit/DOM here, so the
// relocation logic is unit-testable with Node's native TS support (see test/).

export interface BoardDevice {
  name: string;
  source: "ha" | "alexa" | "echo";
  endpoint_id: string | null;
  entity_id: string | null;
  domain: string | null;
  exposed: boolean | null;
  room_id: string | null;
  area?: string | null;
  is_speaker: boolean;
  is_preferred: boolean;
  synced: boolean;
  protected: boolean;
  suggested_remove: boolean;
  _removing?: boolean; // projected: this device will be removed by an accepted op
}

export interface BoardRoom {
  id: string | null;
  name: string;
  in_alexa: boolean;
  in_ha: boolean;
  preferred_id: string | null;
  targeting?: string | null; // playMusicTargetingType: ALL_THE_TIME | ONLY_WHEN_GROUP_NAME_IS_SPOKEN
  devices: BoardDevice[];
  _creating?: boolean; // projected: this room will be created by an accepted op
}

export interface BoardData {
  available: boolean;
  reason?: string;
  rooms?: BoardRoom[];
  unroomed?: BoardDevice[];
}

// ── The one opinionated plan (mirrors the backend `assemble_plan` output) ──────

export interface PlanAction {
  kind: "expose" | "room_op" | "move" | "move_to_area" | "preferred" | "remove_device" | "remove_endpoint";
  entity_id?: string;
  to?: boolean | string; // expose → bool; move → target room id
  from?: string | null;
  endpoint_id?: string;
  room_id?: string;
  area?: string; // move_to_area → HA area name (room created if needed)
  op?: "create" | "rename" | "delete";
  id?: string;
  name?: string;
}

export interface PlanOp {
  id: string;
  group: string;
  title: string;
  detail: string;
  suggested: boolean;
  destructive: boolean;
  action: PlanAction;
}

export interface PlanGroup {
  key: string;
  title: string;
  destructive: boolean;
  ops: PlanOp[];
}

export interface Plan {
  available: boolean;
  reason?: string;
  board: BoardData;
  in_sync: boolean;
  counts: Record<string, number>;
  groups: PlanGroup[];
}

/**
 * Project the ACCEPTED ops onto the board to show the future state: relocate moved
 * devices, mark removed ones (`_removing`), and reflect exposure flips. Pure; never
 * mutates the input, so the pristine board is preserved for computing real diffs.
 */
export function projectBoard(
  board: BoardData,
  groups: PlanGroup[],
  accepted: Set<string>
): { rooms: BoardRoom[]; unroomed: BoardDevice[] } {
  const norm = (s: string) => (s || "").trim().toLowerCase();
  const idMoves: Record<string, string> = {}; // endpoint → existing room id ("" = no room)
  const areaMoves: Record<string, string> = {}; // endpoint → HA area (norm) to place/create into
  const removing = new Set<string>();
  const exposeTo = new Map<string, boolean>();
  const willCreate = new Set<string>(); // norm area names an accepted op will create
  for (const g of groups) {
    for (const o of g.ops) {
      if (!accepted.has(o.id)) continue;
      const a = o.action;
      if ((a.kind === "move" || a.kind === "move_to_area") && a.endpoint_id) {
        if (a.kind === "move" && a.to) idMoves[a.endpoint_id] = a.to as string;
        else if (a.area) areaMoves[a.endpoint_id] = norm(a.area);
        else idMoves[a.endpoint_id] = ""; // to no room (e.g. a vacuum pulled out)
      } else if ((a.kind === "remove_device" || a.kind === "remove_endpoint") && a.endpoint_id) {
        removing.add(a.endpoint_id);
      } else if (a.kind === "expose" && a.entity_id) {
        exposeTo.set(a.entity_id, a.to as boolean);
      } else if (a.kind === "room_op" && a.op === "create" && a.name) {
        willCreate.add(norm(a.name));
      }
    }
  }
  // First relocate the plain id-moves; then move the area-moves to the room whose NAME
  // matches the area (works even for an HA-area room that has no Alexa id yet).
  const laid = layoutBoard(board.rooms ?? [], board.unroomed ?? [], idMoves);
  const roomByName = new Map(laid.rooms.map((r) => [norm(r.name), r]));
  const pull = (eid: string): BoardDevice | undefined => {
    for (const r of laid.rooms) {
      const i = r.devices.findIndex((d) => d.endpoint_id === eid);
      if (i >= 0) return r.devices.splice(i, 1)[0];
    }
    const j = laid.unroomed.findIndex((d) => d.endpoint_id === eid);
    return j >= 0 ? laid.unroomed.splice(j, 1)[0] : undefined;
  };
  for (const [eid, an] of Object.entries(areaMoves)) {
    const dev = pull(eid);
    if (!dev) continue;
    const room = roomByName.get(an);
    if (room) room.devices.push(dev);
    else laid.unroomed.push(dev);
  }
  const annotate = (d: BoardDevice): BoardDevice => ({
    ...d,
    _removing: d.endpoint_id ? removing.has(d.endpoint_id) : false,
    exposed: d.entity_id && exposeTo.has(d.entity_id) ? exposeTo.get(d.entity_id)! : d.exposed,
  });
  return {
    rooms: laid.rooms.map((r) => ({
      ...r,
      _creating: r._creating || willCreate.has(norm(r.name)),
      devices: r.devices.map(annotate),
    })),
    unroomed: laid.unroomed.map(annotate),
  };
}

/**
 * Relocate devices with a STAGED move to their target room, for display only.
 *
 * `moves` maps an endpoint id → target room id ("" means "no room"). A device with a
 * pending move is removed from its current card and shown under the target room's card
 * (or unroomed). Devices with no pending move — including HA rows that aren't synced to
 * Alexa yet (no endpoint id, placed by area) — stay exactly where the backend put them.
 *
 * The input board is not mutated: callers keep `_board` pristine so the apply path can
 * still resolve each device's ORIGINAL room for the move's `from`.
 */
export function layoutBoard(
  rooms: BoardRoom[],
  unroomed: BoardDevice[],
  moves: Record<string, string>
): { rooms: BoardRoom[]; unroomed: BoardDevice[] } {
  const isStaged = (d: BoardDevice): boolean => !!d.endpoint_id && d.endpoint_id in moves;
  const target = (d: BoardDevice): string => moves[d.endpoint_id as string];

  const movers = [...rooms.flatMap((r) => r.devices), ...unroomed].filter(isStaged);

  const newRooms = rooms.map((r) => {
    // Keep devices that aren't moving away; drop ones staged to a different room.
    const kept = r.devices.filter((d) => !isStaged(d) || target(d) === r.id);
    // Pull in devices staged INTO this room from elsewhere.
    const incoming = movers.filter((d) => target(d) === r.id && !r.devices.includes(d));
    return { ...r, devices: [...kept, ...incoming] };
  });

  const newUnroomed = [
    ...unroomed.filter((d) => !isStaged(d) || target(d) === ""),
    ...movers.filter((d) => target(d) === "" && !unroomed.includes(d)),
  ];

  return { rooms: newRooms, unroomed: newUnroomed };
}
