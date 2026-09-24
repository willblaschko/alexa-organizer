"""policy.decide — the opinionated tier logic, as pure input->output cases.

No Home Assistant: decide takes primitives, so every tier rule is checked by
hand-built entities. The HA-facing desired_exposure (registry walk) is verified
on real hardware (see the plan's verification), not here.
"""
import policy


def _d(entity_id, domain, *, has_area=True, hidden=False, has_entity_category=False):
    return policy.decide(
        entity_id=entity_id,
        domain=domain,
        has_area=has_area,
        hidden=hidden,
        has_entity_category=has_entity_category,
    )


def test_tier1_media_player_with_area_exposed():
    assert _d("media_player.kitchen", "media_player") is True


def test_tier1_climate_scene_cover_fan_exposed():
    assert _d("climate.ecobee", "climate") is True
    assert _d("scene.movie_time", "scene") is True
    assert _d("cover.garage", "cover") is True
    assert _d("fan.office", "fan") is True


def test_light_with_area_exposed():
    assert _d("light.kitchen", "light", has_area=True) is True


def test_light_without_area_not_exposed():
    # Phase 1 light rule: an individual bulb needs a room to be a clean target.
    assert _d("light.random_strip", "light", has_area=False) is False


def test_hidden_entity_never_exposed_even_if_tier1():
    assert _d("media_player.kitchen", "media_player", hidden=True) is False


def test_entity_category_never_exposed():
    # Config/diagnostic entities (entity_category set) are not voice targets.
    assert _d("switch.some_led", "switch", has_entity_category=True) is False
    assert _d("number.some_config", "number", has_entity_category=True) is False


def test_script_only_exposed_when_in_voice_allowlist():
    assert _d("script.play_music_everywhere", "script") is True
    assert _d("script.music_slot_janitor", "script") is False


def test_tier3_domains_never_exposed():
    for dom in ("sensor", "binary_sensor", "number", "button", "automation", "update"):
        assert _d(f"{dom}.thing", dom) is False, dom


def test_tier2_domains_off_by_default():
    for dom in ("lock", "camera", "switch", "vacuum"):
        assert _d(f"{dom}.thing", dom) is False, dom


def test_extra_allow_overrides_a_tier2_domain():
    original = policy.EXTRA_ALLOW
    try:
        policy.EXTRA_ALLOW = frozenset({"switch.patio_string_lights"})
        assert _d("switch.patio_string_lights", "switch") is True
    finally:
        policy.EXTRA_ALLOW = original


def test_extra_deny_overrides_a_tier1_domain():
    original = policy.EXTRA_DENY
    try:
        policy.EXTRA_DENY = frozenset({"media_player.arc_surround"})
        assert _d("media_player.arc_surround", "media_player") is False
    finally:
        policy.EXTRA_DENY = original


def test_extra_deny_beats_extra_allow():
    original_allow, original_deny = policy.EXTRA_ALLOW, policy.EXTRA_DENY
    try:
        policy.EXTRA_ALLOW = frozenset({"light.x"})
        policy.EXTRA_DENY = frozenset({"light.x"})
        assert _d("light.x", "light") is False
    finally:
        policy.EXTRA_ALLOW, policy.EXTRA_DENY = original_allow, original_deny
