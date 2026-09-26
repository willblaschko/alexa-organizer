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
