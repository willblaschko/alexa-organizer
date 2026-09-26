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
}

export interface BoardRoom {
  id: string | null;
  name: string;
  in_alexa: boolean;
  in_ha: boolean;
  preferred_id: string | null;
  devices: BoardDevice[];
}

export interface BoardData {
  available: boolean;
  reason?: string;
  rooms?: BoardRoom[];
  unroomed?: BoardDevice[];
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
