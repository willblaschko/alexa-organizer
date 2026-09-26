// Run with: node --experimental-strip-types --test src/board-layout.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  layoutBoard,
  projectBoard,
  type BoardData,
  type BoardDevice,
  type BoardRoom,
  type PlanGroup,
  type PlanOp,
} from "./board-layout.ts";

function dev(name: string, over: Partial<BoardDevice> = {}): BoardDevice {
  return {
    name,
    source: "ha",
    endpoint_id: name,
    entity_id: null,
    domain: "light",
    exposed: true,
    room_id: null,
    is_speaker: false,
    is_preferred: false,
    synced: true,
    protected: false,
    suggested_remove: false,
    ...over,
  };
}

function room(id: string | null, name: string, devices: BoardDevice[]): BoardRoom {
  return { id, name, in_alexa: id !== null, in_ha: true, preferred_id: null, devices };
}

const names = (ds: BoardDevice[]): string[] => ds.map((d) => d.name).sort();

test("a staged move relocates the device to the target room and drops it from the origin", () => {
  const rooms = [
    room("k", "Kitchen", [dev("lampA", { endpoint_id: "lampA", room_id: "k" })]),
    room("o", "Office", [dev("lampB", { endpoint_id: "lampB", room_id: "o" })]),
  ];
  const out = layoutBoard(rooms, [], { lampA: "o" });
  const byName = Object.fromEntries(out.rooms.map((r) => [r.name, r]));
  assert.deepEqual(names(byName["Kitchen"].devices), []);
  assert.deepEqual(names(byName["Office"].devices), ["lampA", "lampB"]);
});

test("a move to \"\" (no room) sends the device to unroomed", () => {
  const rooms = [room("k", "Kitchen", [dev("lampA", { endpoint_id: "lampA", room_id: "k" })])];
  const out = layoutBoard(rooms, [], { lampA: "" });
  assert.deepEqual(names(out.rooms[0].devices), []);
  assert.deepEqual(names(out.unroomed), ["lampA"]);
});

test("a device can move from unroomed into a room", () => {
  const rooms = [room("k", "Kitchen", [])];
  const unroomed = [dev("stray", { endpoint_id: "stray", room_id: null })];
  const out = layoutBoard(rooms, unroomed, { stray: "k" });
  assert.deepEqual(names(out.rooms[0].devices), ["stray"]);
  assert.deepEqual(names(out.unroomed), []);
});

test("an unsynced HA row (no endpoint id, placed by area) stays put — never dragged to unroomed", () => {
  const rooms = [
    room("k", "Kitchen", [
      dev("newLamp", { endpoint_id: null, entity_id: "light.new", room_id: null, synced: false }),
    ]),
  ];
  const out = layoutBoard(rooms, [], { lampA: "o" }); // unrelated move
  assert.deepEqual(names(out.rooms[0].devices), ["newLamp"]);
  assert.deepEqual(names(out.unroomed), []);
});

test("with no staged moves the layout matches the input grouping", () => {
  const rooms = [
    room("k", "Kitchen", [dev("lampA", { endpoint_id: "lampA", room_id: "k" })]),
    room("o", "Office", [dev("lampB", { endpoint_id: "lampB", room_id: "o" })]),
  ];
  const out = layoutBoard(rooms, [dev("stray", { endpoint_id: "stray" })], {});
  assert.deepEqual(names(out.rooms[0].devices), ["lampA"]);
  assert.deepEqual(names(out.rooms[1].devices), ["lampB"]);
  assert.deepEqual(names(out.unroomed), ["stray"]);
});

// ── projectBoard (future state from accepted plan ops) ────────────────────────

function op(id: string, action: PlanOp["action"]): PlanOp {
  return { id, group: "g", title: id, detail: "", suggested: true, destructive: false, action };
}
function board(rooms: BoardRoom[], unroomed: BoardDevice[] = []): BoardData {
  return { available: true, rooms, unroomed };
}
const find = (out: { rooms: BoardRoom[]; unroomed: BoardDevice[] }, name: string): BoardDevice =>
  [...out.rooms.flatMap((r) => r.devices), ...out.unroomed].find((d) => d.name === name)!;

test("projectBoard relocates a device for an accepted move op", () => {
  const b = board([
    room("k", "Kitchen", [dev("lampA", { endpoint_id: "lampA", room_id: "k" })]),
    room("o", "Office", []),
  ]);
  const groups: PlanGroup[] = [
    { key: "place", title: "", destructive: false, ops: [op("move:lampA", { kind: "move", endpoint_id: "lampA", to: "o" })] },
  ];
  const out = projectBoard(b, groups, new Set(["move:lampA"]));
  assert.deepEqual(names(out.rooms[0].devices), []); // left Kitchen
  assert.deepEqual(names(out.rooms[1].devices), ["lampA"]); // now in Office
});

test("projectBoard marks a device _removing for an accepted remove op, and does nothing when not accepted", () => {
  const b = board([], [dev("junk", { endpoint_id: "e1", source: "echo" })]);
  const groups: PlanGroup[] = [
    { key: "cleanup_devices", title: "", destructive: true, ops: [op("rmdev:e1", { kind: "remove_device", endpoint_id: "e1" })] },
  ];
  assert.equal(find(projectBoard(b, groups, new Set(["rmdev:e1"])), "junk")._removing, true);
  assert.equal(find(projectBoard(b, groups, new Set()), "junk")._removing, false);
});

test("projectBoard relocates a create-and-place (area) move to the matching HA-area room", () => {
  const b = board(
    [
      room("k", "Kitchen", []),
      { id: null, name: "Guest Bedroom", in_alexa: false, in_ha: true, preferred_id: null, devices: [] },
    ],
    [dev("gbLight", { endpoint_id: "e1" })]
  );
  const groups: PlanGroup[] = [
    { key: "rooms", title: "", destructive: false, ops: [op("room:create:Guest Bedroom", { kind: "room_op", op: "create", name: "Guest Bedroom" })] },
    { key: "place", title: "", destructive: false, ops: [op("move:e1", { kind: "move", endpoint_id: "e1", to: "", area: "Guest Bedroom" })] },
  ];
  const out = projectBoard(b, groups, new Set(["room:create:Guest Bedroom", "move:e1"]));
  const gb = out.rooms.find((r) => r.name === "Guest Bedroom")!;
  assert.deepEqual(gb.devices.map((d) => d.name), ["gbLight"]);
  assert.equal(gb._creating, true);
  assert.deepEqual(out.unroomed.map((d) => d.name), []);
});

test("projectBoard reflects an accepted expose op on the matching HA device", () => {
  const b = board([room("k", "Kitchen", [dev("lamp", { endpoint_id: "e1", entity_id: "light.k", exposed: false })])]);
  const groups: PlanGroup[] = [
    { key: "expose", title: "", destructive: false, ops: [op("expose:light.k", { kind: "expose", entity_id: "light.k", to: true })] },
  ];
  assert.equal(find(projectBoard(b, groups, new Set(["expose:light.k"])), "lamp").exposed, true);
});
