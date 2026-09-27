// Dependency-ordered execution lanes for the apply queue (à la Chorus's apply.ts).
// Ops declare their kind; the scheduler buckets them into ordered lanes. Each lane
// completes before the next, so a later lane can use an earlier lane's OUTPUTS — e.g.
// a room id minted in "create_room" is consumed by "place". Ops within one lane are
// independent and run in parallel. Pure + testable; no Lit/DOM/network here.

import type { PlanOp } from "./board-layout.js";

export const LANE_ORDER = [
  "expose", // reconcile HA exposure (creates/removes endpoints) — must be first
  "create_room", // make rooms → provides room ids
  "rename_room", // rename rooms (ids stable)
  "place", // put devices in rooms (needs the room to exist; may consume a created id)
  "rename", // rename an Echo to match the room it just moved into (after its move lands)
  "preferred", // set a room's main speaker (needs it placed)
  "remove", // deregister devices / forget endpoints (destructive)
  "delete_room", // delete rooms last (after their devices have moved out)
] as const;

export type Lane = (typeof LANE_ORDER)[number];

export function laneOf(op: PlanOp): Lane {
  const a = op.action;
  switch (a.kind) {
    case "expose":
      return "expose";
    case "room_op":
      return a.op === "create" ? "create_room" : a.op === "rename" ? "rename_room" : "delete_room";
    case "move":
      return "place";
    case "rename_device":
      return "rename";
    case "preferred":
      return "preferred";
    case "remove_device":
    case "remove_endpoint":
      return "remove";
  }
}

/** Group ops into their dependency lanes, returned in execution order (empty lanes dropped). */
export function planLanes(ops: PlanOp[]): { lane: Lane; ops: PlanOp[] }[] {
  const byLane = new Map<Lane, PlanOp[]>();
  for (const op of ops) {
    const l = laneOf(op);
    const bucket = byLane.get(l);
    if (bucket) bucket.push(op);
    else byLane.set(l, [op]);
  }
  return LANE_ORDER.filter((l) => byLane.has(l)).map((l) => ({ lane: l, ops: byLane.get(l) as PlanOp[] }));
}
