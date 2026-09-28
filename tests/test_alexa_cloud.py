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


def test_room_sync_fuzzy_rename_folds_variant_into_ha_area():
    # HA "Media" is the truth; Alexa "Media Room" is a variant → rename it to match (suggested).
    ops = ac.plan_room_sync(["Media"], [_group("g1", "Media Room", members=2)])
    assert ops == [
        {"op": "rename", "id": "g1", "from": "Media Room", "to": "Media", "suggested": True, "fuzzy": True}
    ]


def test_room_sync_fuzzy_matches_either_direction():
    # HA name longer than the Alexa group name still folds (subset either way).
    ops = ac.plan_room_sync(["Living Room"], [_group("g1", "Living", members=1)])
    assert ops == [
        {"op": "rename", "id": "g1", "from": "Living", "to": "Living Room", "suggested": True, "fuzzy": True}
    ]


def test_room_sync_no_fuzzy_on_unrelated_names():
    ops = ac.plan_room_sync(["Kitchen"], [_group("g1", "Garage", members=0)])
    kinds = {(o["op"], o.get("name") or o.get("to")) for o in ops}
    assert ("create", "Kitchen") in kinds
    assert ("delete", "Garage") in kinds
    assert not any(o["op"] == "rename" for o in ops)  # no false merge


def test_room_sync_exact_match_wins_over_fuzzy():
    # "Bedroom" exact-matches the group; "Bed" must NOT fuzzy-steal it → "Bed" creates.
    ops = ac.plan_room_sync(["Bedroom", "Bed"], [_group("g1", "Bedroom", members=1)])
    assert {"op": "create", "name": "Bed", "suggested": False} in ops
    assert not any(o["op"] == "rename" for o in ops)


def test_room_sync_consolidates_numbered_duplicates_into_ha_area():
    # HA has ONE "Media Room"; Alexa churned it into "Media Room 2/3". Fold both in:
    # rename the fuller one to the HA name (canonical), merge-delete the rest (suggested).
    groups = [_group("g2", "Media Room 2", members=3), _group("g3", "Media Room 3", members=1)]
    ops = ac.plan_room_sync(["Media Room"], groups)
    renames = [o for o in ops if o["op"] == "rename"]
    deletes = [o for o in ops if o["op"] == "delete"]
    assert renames == [{"op": "rename", "id": "g2", "from": "Media Room 2", "to": "Media Room", "suggested": True, "fuzzy": True}]
    assert deletes == [{"op": "delete", "id": "g3", "name": "Media Room 3", "empty": False, "suggested": True, "merge": True}]


def test_room_sync_numbered_room_that_is_its_own_ha_area_is_kept():
    # "Bedroom 2" is a real second bedroom (its own HA area) → exact match, no folding.
    ops = ac.plan_room_sync(["Bedroom", "Bedroom 2"], [_group("g1", "Bedroom"), _group("g2", "Bedroom 2")])
    assert ops == []


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


def test_annotate_protects_this_device_and_audible():
    # Q's rule: never remove "This Device" (the app you're on) or Audible registrations.
    rows = {r["name"]: r for r in ac.annotate_devices([_dev("This Device"), _dev("Will's Audible for iPhone")])}
    assert rows["This Device"]["protected"] and rows["This Device"]["suggested_remove"] is False
    assert rows["Will's Audible for iPhone"]["protected"] and rows["Will's Audible for iPhone"]["suggested_remove"] is False


def test_board_never_flags_protected_name_duplicate():
    # Two "This Device" HA-proxy endpoints: the duplicate must NOT be suggested for removal,
    # and both are protected — the protection applies on the board/plan path, not just cleanup.
    board = ac.build_board(
        [],
        [
            _ep("e1", "This Device", "TV", manufacturer="Home Assistant"),
            _ep("e2", "This Device", "TV", manufacturer="Home Assistant"),
        ],
        [_bgroup("g1", "Bedroom", member_ids=["e1", "e2"])],
    )
    for d in _rooms(board)["Bedroom"]["devices"]:
        assert d["protected"] is True and d["suggested_remove"] is False


def test_annotate_flags_companion_app_cruft():
    rows = {r["name"]: r for r in ac.annotate_devices([_dev("Will's 3rd Android Device"), _dev("Kitchen")])}
    assert rows["Will's 3rd Android Device"]["suggested_remove"] is True
    assert rows["Kitchen"]["suggested_remove"] is False  # a real Echo


def test_annotate_flags_duplicate_names():
    rows = ac.annotate_devices([_dev("Echo Buds"), _dev("Echo Buds"), _dev("Echo Buds")])
    # first kept, the 2nd and 3rd flagged as duplicates
    assert [r["suggested_remove"] for r in rows] == [False, True, True]


def test_categorize_derives_from_annotation():
    # Audible is now protected (kept), so a phone "Android Device" reg is the junk example.
    cats = ac.categorize_devices([_dev("Kitchen"), _dev("Will's Alexa Media Player"), _dev("Will's 3rd Android Device")])
    assert [d["name"] for d in cats["keep"]] == ["Kitchen"]
    assert [d["name"] for d in cats["protected"]] == ["Will's Alexa Media Player"]
    assert [d["name"] for d in cats["junk"]] == ["Will's 3rd Android Device"]


# ── build_board (the aggregated room-centric join) ────────────────────────────


def _ep(eid, name, category="", chrs="", device_type=None, manufacturer=None, serial=None, description=None):
    leg = {"chrsIdentifier": {"entityId": chrs}}
    if device_type is not None:
        leg["dmsIdentifier"] = {"deviceType": {"value": {"text": device_type}}}
    e = {
        "id": eid,
        "friendlyNameObject": {"value": {"text": name}},
        "displayCategories": {"primary": {"value": category}},
        "legacyIdentifiers": leg,
    }
    if manufacturer is not None:
        e["manufacturer"] = {"value": {"text": manufacturer}}
    if serial is not None:
        e["serialNumber"] = {"value": {"text": serial}}
    if description is not None:
        e["description"] = {"value": {"text": description}}
    return e


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


def _sroom(name, devices, preferred_id=None):
    return {"id": "r", "name": name, "preferred_id": preferred_id, "devices": devices}


def _sdev(name, endpoint_id, is_speaker=True):
    return {"name": name, "endpoint_id": endpoint_id, "is_speaker": is_speaker}


def test_preferred_default_single_speaker_wins():
    room = _sroom("Kitchen", [_sdev("Kitchen Echo", "e1"), _sdev("Kitchen Light", "e2", is_speaker=False)])
    assert ac._preferred_default(room) == "e1"


def test_preferred_default_multiple_prefers_room_name_match():
    room = _sroom("Office", [_sdev("Sonos Play", "s1"), _sdev("Office Dot", "e2")])
    assert ac._preferred_default(room) == "e2"


def test_preferred_default_multiple_ambiguous_is_none():
    room = _sroom("Den", [_sdev("Sonos Play", "s1"), _sdev("Living Dot", "e2")])
    assert ac._preferred_default(room) is None


def test_preferred_default_none_when_already_set_or_no_speakers():
    assert ac._preferred_default(_sroom("Kitchen", [_sdev("Kitchen Echo", "e1")], preferred_id="e1")) is None
    assert ac._preferred_default(_sroom("Kitchen", [_sdev("Kitchen Light", "e2", is_speaker=False)])) is None


# ── assemble_plan (the one opinionated plan) ──────────────────────────────────


def _bdev(name, source="ha", endpoint_id=None, room_id=None, area=None,
          is_speaker=False, suggested_remove=False, protected=False):
    return {
        "name": name, "source": source, "endpoint_id": endpoint_id, "entity_id": None,
        "domain": "light", "exposed": True, "room_id": room_id, "area": area,
        "is_speaker": is_speaker, "is_preferred": False, "synced": endpoint_id is not None,
        "protected": protected, "suggested_remove": suggested_remove,
    }


def _broom(rid, name, devices, preferred_id=None):
    return {"id": rid, "name": name, "in_alexa": rid is not None, "in_ha": True,
            "preferred_id": preferred_id, "devices": devices}


def _invrow(entity_id, name, desired, exposed, area="Kitchen", ghost=False):
    return {"entity_id": entity_id, "name": name, "domain": "light", "area": area,
            "desired": desired, "exposed": exposed, "reason": "", "overridden": False, "ghost": ghost}


def _groups(plan):
    return {g["key"]: g for g in plan["groups"]}


def test_plan_expose_shows_are_prechecked_hides_are_opt_in():
    # Showing a new device is safe (pre-checked); HIDING a currently-exposed one is a
    # loss of voice control → opt-in (unchecked), so scripts/lights aren't auto-hidden.
    rows = [_invrow("light.new", "New", True, False), _invrow("light.old", "Old", False, True),
            _invrow("light.ok", "OK", True, True), _invrow("light.dead", "Dead", False, True, ghost=True)]
    plan = ac.assemble_plan({"rooms": [], "unroomed": []}, rows, [])
    ops = {o["action"]["entity_id"]: o for o in _groups(plan)["expose"]["ops"]}
    assert ops["light.new"].get("suggested") is True and ops["light.new"]["action"]["to"] is True
    assert ops["light.old"].get("suggested") is False and ops["light.old"]["action"]["to"] is False
    assert plan["in_sync"] is False  # the pre-checked show still counts


def test_plan_place_device_into_its_area_room():
    dev = _bdev("Kitchen Lamp", "ha", endpoint_id="e1", room_id=None, area="Kitchen")
    plan = ac.assemble_plan({"rooms": [_broom("k", "Kitchen", [])], "unroomed": [dev]}, [], [])
    ops = _groups(plan)["place"]["ops"]
    assert ops[0]["action"] == {"kind": "move", "endpoint_id": "e1", "from": None, "to": "k"}


def test_plan_no_move_when_already_in_room():
    dev = _bdev("Kitchen Lamp", "ha", endpoint_id="e1", room_id="k", area="Kitchen")
    plan = ac.assemble_plan({"rooms": [_broom("k", "Kitchen", [dev])], "unroomed": []}, [], [])
    assert "place" not in _groups(plan)


def test_plan_preferred_speaker_proposed():
    echo = _bdev("Kitchen Echo", "echo", endpoint_id="e1", room_id="k", is_speaker=True)
    plan = ac.assemble_plan({"rooms": [_broom("k", "Kitchen", [echo])], "unroomed": []}, [], [])
    assert _groups(plan)["speakers"]["ops"][0]["action"] == {
        "kind": "preferred", "room_id": "k", "endpoint_id": "e1"
    }


def test_plan_cleanup_devices_and_endpoints():
    junk = _bdev("Old Phone", "echo", endpoint_id="e1", suggested_remove=True)
    dup = _bdev("Dup Light", "alexa", endpoint_id="e2", suggested_remove=True)
    stray = _bdev("Weird Thing", "alexa", endpoint_id="e3", suggested_remove=False)
    plan = ac.assemble_plan({"rooms": [], "unroomed": [junk, dup, stray]}, [], [])
    g = _groups(plan)
    assert g["cleanup_devices"]["ops"][0]["action"] == {"kind": "remove_device", "endpoint_id": "e1"}
    assert g["cleanup_devices"]["destructive"] is True
    eops = {o["action"]["endpoint_id"]: o for o in g["cleanup_endpoints"]["ops"]}
    assert eops["e2"]["suggested"] is True and eops["e3"]["suggested"] is False


def test_plan_rooms_create_rename_and_delete_split():
    room_ops = [
        {"op": "create", "name": "Office", "suggested": False},
        {"op": "rename", "id": "g1", "from": "Media Room", "to": "Media", "suggested": False, "fuzzy": True},
        {"op": "delete", "id": "g2", "name": "Ghost", "empty": True, "suggested": True},
    ]
    plan = ac.assemble_plan({"rooms": [], "unroomed": []}, [], room_ops)
    g = _groups(plan)
    assert {o["action"]["op"] for o in g["rooms"]["ops"]} == {"create", "rename"}
    assert g["rooms_delete"]["ops"][0]["action"] == {"kind": "room_op", "op": "delete", "id": "g2"}
    assert g["rooms_delete"]["destructive"] is True


def test_plan_places_into_canonical_renamed_room():
    # Media Room 2 (g2) is renamed to the HA area "Media Room"; a device in the duplicate
    # Media Room 3 (g3) with HA area "Media Room" must move to g2 (canonical), not stay.
    devA = _bdev("Speaker A", "ha", endpoint_id="e1", room_id="g2", area="Media Room")
    devB = _bdev("Speaker B", "ha", endpoint_id="e2", room_id="g3", area="Media Room")
    rooms = [_broom("g2", "Media Room 2", [devA]), _broom("g3", "Media Room 3", [devB])]
    room_ops = [
        {"op": "rename", "id": "g2", "from": "Media Room 2", "to": "Media Room", "suggested": True, "fuzzy": True},
        {"op": "delete", "id": "g3", "name": "Media Room 3", "empty": False, "suggested": True, "merge": True},
    ]
    plan = ac.assemble_plan({"rooms": rooms, "unroomed": []}, [], room_ops)
    g = _groups(plan)
    moves = {o["action"]["endpoint_id"]: o["action"]["to"] for o in g["place"]["ops"]}
    assert moves == {"e2": "g2"}  # devA already canonical (no move); devB folds in


def test_plan_creates_and_places_for_ha_area_with_no_alexa_room():
    # Guest Bedroom is an HA area with devices but no Alexa room yet. The queue creates the
    # room (create_room lane, SUGGESTED) then places the device (place lane), threading the
    # id via `area`. So the plan carries BOTH a suggested create and an area-tagged move.
    light = _bdev("Guest Bedroom Main Lights", "ha", endpoint_id="e1", room_id=None, area="Guest Bedroom")
    area_room = {"id": None, "name": "Guest Bedroom", "in_alexa": False, "in_ha": True,
                 "preferred_id": None, "devices": []}
    plan = ac.assemble_plan({"rooms": [area_room], "unroomed": [light]}, [], [])
    g = _groups(plan)
    create = [o for o in g["rooms"]["ops"] if o["action"].get("op") == "create"]
    assert create and create[0]["action"]["name"] == "Guest Bedroom" and create[0]["suggested"] is True
    move = g["place"]["ops"][0]
    assert move["action"] == {"kind": "move", "endpoint_id": "e1", "from": None, "to": "", "area": "Guest Bedroom"}


def test_plan_dedupes_ha_mediaplayer_that_alexa_has_natively():
    # A Sonos/Echo exposed from HA (source ha, media_player) that ALSO exists as an
    # Alexa-native (echo) device is a duplicate → propose un-exposing the HA copy (opt-in).
    ha = _bdev("Bedroom", "ha", endpoint_id="e_ha", room_id="b")
    ha["domain"] = "media_player"
    ha["entity_id"] = "media_player.bedroom"
    echo = _bdev("Bedroom", "echo", endpoint_id="e_echo", room_id="b", is_speaker=True)
    plan = ac.assemble_plan({"rooms": [_broom("b", "Bedroom", [ha, echo])], "unroomed": []}, [], [])
    ops = [o for o in _groups(plan)["expose"]["ops"] if o["action"].get("entity_id") == "media_player.bedroom"]
    assert ops and ops[0]["action"] == {"kind": "expose", "entity_id": "media_player.bedroom", "to": False}
    assert ops[0]["suggested"] is False  # opt-in (a removal / loss)


def test_plan_keeps_ha_mediaplayer_with_no_native_twin():
    # A Sonos with NO Alexa-native endpoint (only the HA exposure) must NOT be un-exposed.
    ha = _bdev("Backyard", "ha", endpoint_id="e_ha", room_id="b")
    ha["domain"] = "media_player"
    ha["entity_id"] = "media_player.backyard"
    plan = ac.assemble_plan({"rooms": [_broom("b", "Backyard", [ha])], "unroomed": []}, [], [])
    exposeg = next((g for g in plan["groups"] if g["key"] == "expose"), {"ops": []})
    assert not any(o["action"].get("entity_id") == "media_player.backyard" for o in exposeg["ops"])


def test_plan_vacuum_is_pulled_out_of_its_room():
    # A vacuum in a room answers to "turn on <room>" — pull it out (exposed, but not a
    # room member). Move op targets "" (no room = remove from the group).
    vac = _bdev("Downstairs Vacuum", "ha", endpoint_id="v1", room_id="mr", area="Media Room")
    vac["domain"] = "vacuum"
    plan = ac.assemble_plan({"rooms": [_broom("mr", "Media Room", [vac])], "unroomed": []}, [], [])
    ops = _groups(plan)["place"]["ops"]
    assert ops == [{
        "id": "move:v1", "group": "place", "title": ops[0]["title"], "detail": ops[0]["detail"],
        "suggested": True, "destructive": False,
        "action": {"kind": "move", "endpoint_id": "v1", "from": "mr", "to": ""},
    }]


def test_plan_vacuum_with_no_room_is_left_alone():
    vac = _bdev("Robot", "ha", endpoint_id="v1", room_id=None, area="Media Room")
    vac["domain"] = "vacuum"
    plan = ac.assemble_plan({"rooms": [_broom("mr", "Media Room", [])], "unroomed": [vac]}, [], [])
    assert "place" not in _groups(plan)


def test_plan_in_sync_when_nothing_suggested():
    plan = ac.assemble_plan({"rooms": [], "unroomed": []}, [], [])
    assert plan["in_sync"] is True and plan["groups"] == []


def test_plan_stray_only_is_still_in_sync():
    stray = _bdev("Weird Thing", "alexa", endpoint_id="e3", suggested_remove=False)
    plan = ac.assemble_plan({"rooms": [], "unroomed": [stray]}, [], [])
    assert plan["in_sync"] is True  # opt-in extras don't count as "out of sync"


def test_board_matches_via_name_alias():
    board = ac.build_board(
        [_row("light.k", "kitchen_main", "light", "Kitchen", names=["kitchen_main", "Kitchen Lights"])],
        [_ep("e1", "Kitchen Lights", "LIGHT")],
        [_bgroup("g1", "Kitchen", member_ids=["e1"])],
    )
    devs = _rooms(board)["Kitchen"]["devices"]
    assert len(devs) == 1  # matched via alias — no duplicate unsynced row
    assert devs[0]["source"] == "ha" and devs[0]["entity_id"] == "light.k"


# ── preferred-speaker type selection (keyed off MANUFACTURER, not device_type) ──
def test_speaker_type_amazon_is_alexa_device():
    # Amazon's own devices (Echo/Dot/Show) => ALEXA_DEVICE.
    assert ac._speaker_type_for("Amazon") == "ALEXA_DEVICE"


def test_speaker_type_partner_is_third_party():
    # Every partner speaker is THIRD_PARTY — including Sonos/Symfonisk linked via the Sonos
    # skill, which carry an Amazon device_type but manufacturer "Sonos, Inc." (the real bug:
    # device_type presence is NOT the signal).
    assert ac._speaker_type_for("Sonos, Inc.") == "THIRD_PARTY"
    assert ac._speaker_type_for(None) == "THIRD_PARTY"
    assert ac._speaker_type_for("") == "THIRD_PARTY"


def test_ha_copy_merges_into_its_native_twin():
    # One physical Sonos = a native endpoint + an HA copy of the same name. They become ONE
    # row (the native, selectable as main) that remembers its twin so actions fan out to both.
    board = ac.build_board(
        [_row("media_player.bedroom", "Bedroom", "media_player", "Bedroom")],
        [
            _ep("e1", "Bedroom", "ALEXA_VOICE_ENABLED", device_type="A15ERDAKK5HQQG", manufacturer="Sonos, Inc."),
            _ep("e2", "Bedroom", "SPEAKER", manufacturer="Home Assistant"),  # HA copy of the Sonos
        ],
        [_bgroup("g1", "Bedroom", member_ids=["e1", "e2"])],
    )
    devs = _rooms(board)["Bedroom"]["devices"]
    assert [d["endpoint_id"] for d in devs] == ["e1"]  # one row, not two
    assert devs[0]["is_speaker"] is True and devs[0]["speaker_note"] is None
    assert devs[0]["twins"] == [{"endpoint_id": "e2", "room_id": "g1", "plays": False}]
    assert devs[0]["twin_entity_id"] == "media_player.bedroom"


def test_ha_entity_of_parses_the_bridge_description():
    assert ac._ha_entity_of("media_player.bedroom via Home Assistant") == "media_player.bedroom"
    assert ac._ha_entity_of("Sonos player in Bedroom") is None
    assert ac._ha_entity_of(None) is None


def test_echo_and_its_ha_copy_join_by_serial_even_when_names_differ():
    # Live case: the Echo was renamed "Dining Room Echo Show 5"; its HA copy still says
    # "Media Room Echo Show 5". The serial (via the HA entity's Alexa Media device) still joins them.
    board = ac.build_board(
        [],
        [
            _ep("n1", "Dining Room Echo Show 5", "ALEXA_VOICE_ENABLED", device_type="A1",
                manufacturer="Amazon", serial="G6G1"),
            _ep("h1", "Media Room Echo Show 5", "TV", manufacturer="Home Assistant",
                description="media_player.media_room_echo_show_5 via Home Assistant"),
        ],
        [_bgroup("g1", "Dining Room", member_ids=["n1", "h1"])],
        ha_serials={"media_player.media_room_echo_show_5": "G6G1"},
    )
    devs = _rooms(board)["Dining Room"]["devices"]
    assert [d["endpoint_id"] for d in devs] == ["n1"]
    assert devs[0]["twin_entity_id"] == "media_player.media_room_echo_show_5"


def test_protection_follows_the_merged_device():
    # Live case: the HA copy "This Device" is the phone registered natively as "Will's Device".
    board = ac.build_board(
        [],
        [
            _ep("n1", "Will's Device", "PHONE", device_type="A1", manufacturer="Amazon", serial="S1"),
            _ep("h1", "This Device", "TV", manufacturer="Home Assistant",
                description="media_player.this_device via Home Assistant"),
        ],
        [],
        ha_serials={"media_player.this_device": "S1"},
    )
    (d,) = board["unroomed"]
    assert d["endpoint_id"] == "n1" and d["protected"] is True and d["suggested_remove"] is False


def test_ha_copy_without_a_native_twin_stays_flagged():
    # A speaker that exists ONLY in HA can't merge — it stays its own row, not playable.
    board = ac.build_board(
        [], [_ep("e2", "Patio", "SPEAKER", manufacturer="Home Assistant")],
        [_bgroup("g1", "Patio", member_ids=["e2"])],
    )
    d = _rooms(board)["Patio"]["devices"][0]
    assert d["is_speaker"] is False and d["speaker_note"] == "ha_proxy"


def test_ambiguous_name_does_not_merge():
    # Two natives share the name → we can't tell which the HA copy belongs to: don't merge.
    board = ac.build_board(
        [],
        [
            _ep("n1", "Den", "ALEXA_VOICE_ENABLED", device_type="A1", manufacturer="Amazon"),
            _ep("n2", "Den", "ALEXA_VOICE_ENABLED", device_type="A2", manufacturer="Sonos, Inc."),
            _ep("h1", "Den", "SPEAKER", manufacturer="Home Assistant"),
        ],
        [_bgroup("g1", "Den", member_ids=["n1", "n2", "h1"])],
    )
    assert {d["endpoint_id"] for d in _rooms(board)["Den"]["devices"]} == {"n1", "n2", "h1"}


def test_plan_pulls_a_split_twin_back_to_its_device():
    # The native is in Dining Room but its HA copy was left in Media Room → move the copy over.
    echo = _bdev("Media Room Echo Show 5", "echo", endpoint_id="n1", room_id="dr")
    echo["twins"] = [{"endpoint_id": "h1", "room_id": "mr"}]
    plan = ac.assemble_plan({"rooms": [_broom("dr", "Dining Room", [echo]), _broom("mr", "Media Room", [])],
                             "unroomed": []}, [], [])
    ops = _groups(plan)["place"]["ops"]
    assert [o["action"] for o in ops] == [{"kind": "move", "endpoint_id": "h1", "from": "mr", "to": "dr"}]


def test_plan_roomless_device_adopts_its_copys_room():
    # Native has no room, its HA copy is in Kitchen → put the native in Kitchen (don't evict the copy).
    echo = _bdev("Kitchen Echo Show", "echo", endpoint_id="n1", room_id=None)
    echo["twins"] = [{"endpoint_id": "h1", "room_id": "k"}]
    plan = ac.assemble_plan({"rooms": [_broom("k", "Kitchen", [])], "unroomed": [echo]}, [], [])
    ops = _groups(plan)["place"]["ops"]
    assert [o["action"] for o in ops] == [{"kind": "move", "endpoint_id": "n1", "from": None, "to": "k"}]


def test_plan_does_not_name_guess_a_device_that_already_has_a_room():
    # Named after Media Room but deliberately placed in Dining Room: leave it there.
    echo = _bdev("Media Room Echo Show 5", "echo", endpoint_id="n1", room_id="dr")
    plan = ac.assemble_plan({"rooms": [_broom("dr", "Dining Room", [echo]), _broom("mr", "Media Room", [])],
                             "unroomed": []}, [], [])
    assert "place" not in _groups(plan) or not _groups(plan)["place"]["ops"]


def test_set_speaker_query_inlines_enum_literal_and_always():
    q = ac._set_speaker_query("ALEXA_DEVICE")
    assert "type:ALEXA_DEVICE" in q  # enum is a LITERAL, not a $variable
    assert "$t:" not in q and "PlayMusicTargetingType" not in q  # no hidden type name declared
    assert "playMusicTargetingType:ALWAYS" in q
    assert ac._set_speaker_query("THIRD_PARTY").count("type:THIRD_PARTY") == 1


def test_set_speaker_query_rejects_unknown_type():
    # Our old wrong guesses (PRIMARY / ALL_THE_TIME) must never slip into the query.
    try:
        ac._set_speaker_query("PRIMARY")
    except ValueError:
        return
    raise AssertionError("expected ValueError for unknown speaker type")


def test_board_same_named_sonos_and_echo_both_stay_selectable():
    # A Sonos and an Echo that share a room name ("Bedroom") are DIFFERENT physical devices;
    # neither may be hidden as a main-speaker option (the name-collapse regression).
    board = ac.build_board(
        [_row("media_player.bedroom_sonos", "Bedroom", "media_player", "Bedroom")],
        [
            _ep("e1", "Bedroom", "SPEAKER"),  # the Sonos, exposed via HA (no deviceType)
            _ep("e2", "Bedroom", "ALEXA_VOICE_ENABLED", device_type="A1"),  # a native Echo named "Bedroom"
        ],
        [_bgroup("g1", "Bedroom", member_ids=["e1", "e2"])],
    )
    devs = {d["endpoint_id"]: d for d in _rooms(board)["Bedroom"]["devices"]}
    assert devs["e1"]["is_speaker"] and devs["e2"]["is_speaker"]  # both remain main-able


# ── "turn on <room>" must not start music ─────────────────────────────────────────
def test_board_marks_a_copy_that_plays_on_turn_on():
    # HA's Sonos entity has no power support, so Alexa's "turn on" becomes "play" for it.
    board = ac.build_board(
        [],
        [
            _ep("n1", "Kitchen", "ALEXA_VOICE_ENABLED", device_type="A15", manufacturer="Sonos, Inc."),
            _ep("h1", "Kitchen", "SPEAKER", manufacturer="Home Assistant",
                description="media_player.kitchen via Home Assistant"),
        ],
        [_bgroup("g1", "Kitchen", member_ids=["n1", "h1"])],
        turn_on_plays={"media_player.kitchen"},
    )
    (d,) = _rooms(board)["Kitchen"]["devices"]
    assert d["twins"] == [{"endpoint_id": "h1", "room_id": "g1", "plays": True}]


def test_plan_pulls_a_playing_copy_out_of_its_room():
    sonos = _bdev("Kitchen", "echo", endpoint_id="n1", room_id="k")
    sonos["twins"] = [{"endpoint_id": "h1", "room_id": "k", "plays": True}]
    plan = ac.assemble_plan({"rooms": [_broom("k", "Kitchen", [sonos])], "unroomed": []}, [], [])
    ops = _groups(plan)["place"]["ops"]
    assert [o["action"] for o in ops] == [{"kind": "move", "endpoint_id": "h1", "from": "k", "to": ""}]
    assert "music" in ops[0]["detail"]


def test_plan_keeps_an_ha_player_that_plays_on_turn_on_out_of_rooms():
    # Not merged (no native twin), but same rule: out of the room, never placed back in.
    spk = _bdev("Den Speaker", "ha", endpoint_id="e1", room_id="d", area="Den")
    spk["domain"], spk["turn_on_plays"] = "media_player", True
    plan = ac.assemble_plan({"rooms": [_broom("d", "Den", [spk])], "unroomed": []}, [], [])
    ops = _groups(plan)["place"]["ops"]
    assert [o["action"] for o in ops] == [{"kind": "move", "endpoint_id": "e1", "from": "d", "to": ""}]
