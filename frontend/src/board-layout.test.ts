// Run with: node --experimental-strip-types --test src/board-layout.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutBoard, type BoardDevice, type BoardRoom } from "./board-layout.ts";

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
