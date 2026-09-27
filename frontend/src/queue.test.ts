// Run with: node --experimental-strip-types --test src/queue.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { planLanes, laneOf, LANE_ORDER, type Lane } from "./queue.ts";
import type { PlanOp, PlanAction } from "./board-layout.ts";

function op(id: string, action: PlanAction): PlanOp {
  return { id, group: "g", title: id, detail: "", suggested: true, destructive: false, action };
}

test("laneOf maps each op kind to its dependency lane", () => {
  const cases: Array<[PlanAction, Lane]> = [
    [{ kind: "expose", entity_id: "light.x", to: true }, "expose"],
    [{ kind: "room_op", op: "create", name: "Den" }, "create_room"],
    [{ kind: "room_op", op: "rename", id: "g1", name: "Den" }, "rename_room"],
    [{ kind: "room_op", op: "delete", id: "g1" }, "delete_room"],
    [{ kind: "move", endpoint_id: "e1", to: "g1" }, "place"],
    [{ kind: "move", endpoint_id: "e2", area: "Den" }, "place"], // move by area name → still place lane
    [{ kind: "preferred", room_id: "g1", endpoint_id: "e1" }, "preferred"],
    [{ kind: "remove_device", endpoint_id: "e1" }, "remove"],
    [{ kind: "remove_endpoint", endpoint_id: "e1" }, "remove"],
  ];
  for (const [action, lane] of cases) assert.equal(laneOf(op("x", action)), lane);
});

test("planLanes returns non-empty lanes in dependency order", () => {
  const ops = [
    op("del", { kind: "room_op", op: "delete", id: "g9" }),
    op("mv", { kind: "move", endpoint_id: "e1", to: "g1" }),
    op("cr", { kind: "room_op", op: "create", name: "Den" }),
    op("exp", { kind: "expose", entity_id: "light.x", to: true }),
  ];
  const lanes = planLanes(ops).map((l) => l.lane);
  // create_room must come before place, place before delete_room, expose first.
  assert.deepEqual(lanes, ["expose", "create_room", "place", "delete_room"]);
  // and the order matches LANE_ORDER's relative order
  const idx = (l: Lane) => LANE_ORDER.indexOf(l);
  for (let i = 1; i < lanes.length; i++) assert.ok(idx(lanes[i]) > idx(lanes[i - 1]));
});

test("planLanes groups multiple ops of a kind into the same lane", () => {
  const ops = [
    op("c1", { kind: "room_op", op: "create", name: "A" }),
    op("c2", { kind: "room_op", op: "create", name: "B" }),
  ];
  const lanes = planLanes(ops);
  assert.equal(lanes.length, 1);
  assert.equal(lanes[0].lane, "create_room");
  assert.deepEqual(lanes[0].ops.map((o) => o.id), ["c1", "c2"]);
});
