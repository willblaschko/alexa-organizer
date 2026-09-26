"""Pure planners/heuristics in alexa_cloud (no Home Assistant needed).

alexa_cloud imports HA lazily inside its async functions, so importing it flat and
calling the pure functions (room-sync plan, room name-match, device annotation) works.
"""
import alexa_cloud as ac


def _group(gid, name, members=0):
    return {
        "id": gid,
        "friendlyName": {"value": {"text": name}},
        "memberDevices": {"items": [{"id": f"m{i}"} for i in range(members)]},
    }


# ── plan_room_sync ────────────────────────────────────────────────────────────

def test_room_sync_rename_on_case_or_spelling():
    ops = ac.plan_room_sync(["Dining Room"], [_group("g1", "Dining room")])
    assert ops == [{"op": "rename", "id": "g1", "from": "Dining room", "to": "Dining Room", "suggested": True}]


def test_room_sync_exact_match_is_a_noop():
    assert ac.plan_room_sync(["Kitchen"], [_group("g1", "Kitchen")]) == []


def test_room_sync_create_is_suggested_off():
    ops = ac.plan_room_sync(["Office"], [])
    assert ops == [{"op": "create", "name": "Office", "suggested": False}]


def test_room_sync_delete_only_empty_ghosts_suggested():
    groups = [_group("g1", "Ghost", members=0), _group("g2", "Party", members=3)]
    ops = ac.plan_room_sync([], groups)
    by_id = {o["id"]: o for o in ops}
    assert by_id["g1"] == {"op": "delete", "id": "g1", "name": "Ghost", "empty": True, "suggested": True}
    assert by_id["g2"]["suggested"] is False and by_id["g2"]["empty"] is False


# ── _suggest_room ─────────────────────────────────────────────────────────────

def test_suggest_room_exact_and_prefix():
    rooms = [{"id": "k", "name": "Kitchen"}, {"id": "mr", "name": "Media Room"}]
    assert ac._suggest_room("Kitchen", rooms) == "k"
    assert ac._suggest_room("Media Room Echo Show 5", rooms) == "mr"


def test_suggest_room_longest_wins():
    rooms = [{"id": "b", "name": "Bedroom"}, {"id": "b2", "name": "Bedroom 2"}]
    # "Bedroom 2 Dot" should prefer the longer "Bedroom 2" over "Bedroom".
    assert ac._suggest_room("Bedroom 2 Dot", rooms) == "b2"


def test_suggest_room_no_partial_word_match():
    rooms = [{"id": "b", "name": "Bed"}]
    assert ac._suggest_room("Bedroom Light", rooms) is None  # "Bedroom" must not match "Bed"


# ── annotate_devices / categorize_devices ─────────────────────────────────────

def _dev(name, category="ALEXA_VOICE_ENABLED"):
    return {"id": name, "name": name, "category": category}


def test_annotate_protects_amp_and_application():
    rows = ac.annotate_devices([_dev("Will's Alexa Media Player"), _dev("Alexa Web", "APPLICATION")])
    assert all(r["protected"] for r in rows)


def test_annotate_flags_companion_app_cruft():
    rows = {r["name"]: r for r in ac.annotate_devices([_dev("Will's 3rd Android Device"), _dev("Kitchen")])}
    assert rows["Will's 3rd Android Device"]["suggested_remove"] is True
    assert rows["Kitchen"]["suggested_remove"] is False  # a real Echo


def test_annotate_flags_duplicate_names():
    rows = ac.annotate_devices([_dev("Echo Buds"), _dev("Echo Buds"), _dev("Echo Buds")])
    # first kept, the 2nd and 3rd flagged as duplicates
    assert [r["suggested_remove"] for r in rows] == [False, True, True]


def test_categorize_derives_from_annotation():
    cats = ac.categorize_devices([_dev("Kitchen"), _dev("Will's Alexa Media Player"), _dev("Will's Audible for iPhone")])
    assert [d["name"] for d in cats["keep"]] == ["Kitchen"]
    assert [d["name"] for d in cats["protected"]] == ["Will's Alexa Media Player"]
    assert [d["name"] for d in cats["junk"]] == ["Will's Audible for iPhone"]


# ── build_board (the aggregated room-centric join) ────────────────────────────


def _ep(eid, name, category="", chrs="", device_type=None):
    leg = {"chrsIdentifier": {"entityId": chrs}}
    if device_type is not None:
        leg["dmsIdentifier"] = {"deviceType": {"value": {"text": device_type}}}
    return {
        "id": eid,
        "friendlyNameObject": {"value": {"text": name}},
        "displayCategories": {"primary": {"value": category}},
        "legacyIdentifiers": leg,
    }


def _bgroup(gid, name, member_ids=(), preferred=None):
    g = {
        "id": gid,
        "friendlyName": {"value": {"text": name}},
        "memberDevices": {"items": [{"id": m} for m in member_ids]},
    }
    if preferred:
        g["speakerConfiguration"] = {"selectedSpeakers": [{"type": "PRIMARY", "endpointId": preferred}]}
    return g


def _row(entity_id, name, domain, area, exposed=True, desired=True, ghost=False, names=None):
    return {
        "entity_id": entity_id, "name": name, "domain": domain, "area": area,
        "exposed": exposed, "desired": desired, "ghost": ghost, "names": names,
    }


def _rooms(board):
    return {r["name"]: r for r in board["rooms"]}


def test_board_matches_ha_endpoint_into_room():
    board = ac.build_board(
        [_row("light.kitchen", "Kitchen Lights", "light", "Kitchen")],
        [_ep("e1", "Kitchen Lights", "LIGHT")],
        [_bgroup("g1", "Kitchen", member_ids=["e1"])],
    )
    room = _rooms(board)["Kitchen"]
    assert room["in_ha"] and room["in_alexa"]
    d = room["devices"][0]
    assert d["source"] == "ha" and d["entity_id"] == "light.kitchen" and d["synced"]


def test_board_unmatched_endpoint_is_alexa_source():
    board = ac.build_board([], [_ep("e1", "Old Fire TV", "TV")], [_bgroup("g1", "Den", member_ids=["e1"])])
    d = _rooms(board)["Den"]["devices"][0]
    assert d["source"] == "alexa" and d["suggested_remove"] is False


def test_board_echo_in_room_and_preferred():
    board = ac.build_board(
        [],
        [_ep("e1", "Kitchen Echo", "ALEXA_VOICE_ENABLED", device_type="A1")],
        [_bgroup("g1", "Kitchen", member_ids=["e1"], preferred="e1")],
    )
    d = _rooms(board)["Kitchen"]["devices"][0]
    assert d["source"] == "echo" and d["is_speaker"] and d["is_preferred"]


def test_board_unsynced_ha_entity_under_area_room():
    board = ac.build_board(
        [_row("light.new", "New Lamp", "light", "Office")], [], [_bgroup("g1", "Office")]
    )
    d = _rooms(board)["Office"]["devices"][0]
    assert d["source"] == "ha" and d["synced"] is False and d["endpoint_id"] is None


def test_board_room_union_ha_only_and_alexa_only():
    board = ac.build_board(
        [_row("light.g", "Garage Light", "light", "Garage")], [], [_bgroup("g1", "Basement")]
    )
    rooms = _rooms(board)
    assert rooms["Garage"]["in_ha"] and not rooms["Garage"]["in_alexa"]
    assert rooms["Basement"]["in_alexa"] and not rooms["Basement"]["in_ha"]


def test_board_duplicate_endpoint_flagged():
    board = ac.build_board(
        [_row("light.k", "Kitchen Light", "light", "Kitchen")],
        [_ep("e1", "Kitchen Light", "LIGHT"), _ep("e2", "Kitchen Light", "LIGHT")],
        [_bgroup("g1", "Kitchen", member_ids=["e1", "e2"])],
    )
    devs = {d["endpoint_id"]: d for d in _rooms(board)["Kitchen"]["devices"]}
    assert devs["e1"]["source"] == "ha" and devs["e1"]["suggested_remove"] is False
    assert devs["e2"]["suggested_remove"] is True


def test_board_unroomed_endpoint():
    board = ac.build_board([], [_ep("e1", "Stray Plug", "SMARTPLUG")], [])
    assert not board["rooms"]
    assert board["unroomed"][0]["name"] == "Stray Plug"


def test_board_matches_via_name_alias():
    board = ac.build_board(
        [_row("light.k", "kitchen_main", "light", "Kitchen", names=["kitchen_main", "Kitchen Lights"])],
        [_ep("e1", "Kitchen Lights", "LIGHT")],
        [_bgroup("g1", "Kitchen", member_ids=["e1"])],
    )
    devs = _rooms(board)["Kitchen"]["devices"]
    assert len(devs) == 1  # matched via alias — no duplicate unsynced row
    assert devs[0]["source"] == "ha" and devs[0]["entity_id"] == "light.k"
