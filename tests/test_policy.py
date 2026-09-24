"""policy.decide — the opinionated tier logic + label overrides, as pure cases.

No Home Assistant: decide takes primitives, so every rule is checked by
hand-built entities. The HA-facing desired_exposure (registry + label walk) is
verified on real hardware (see the plan's verification), not here.
"""
import policy


def _d(
    domain,
    *,
    has_area=True,
    hidden=False,
    has_entity_category=False,
    force_expose=False,
    force_hide=False,
):
    return policy.decide(
        domain=domain,
        has_area=has_area,
        hidden=hidden,
        has_entity_category=has_entity_category,
        force_expose=force_expose,
        force_hide=force_hide,
    )


def test_tier1_domains_exposed():
    for dom in ("media_player", "climate", "scene", "cover", "fan", "vacuum"):
        assert _d(dom) is True, dom


def test_light_with_area_exposed():
    assert _d("light", has_area=True) is True


def test_light_without_area_not_exposed():
    assert _d("light", has_area=False) is False


def test_switch_with_area_exposed():
    # A light-switch in a room reads as a clean voice target.
    assert _d("switch", has_area=True) is True


def test_switch_without_area_not_exposed():
    # Area-less junk switches (LED indicators, integration plumbing) stay hidden.
    assert _d("switch", has_area=False) is False


def test_hidden_entity_never_exposed_even_if_tier1():
    assert _d("media_player", hidden=True) is False


def test_entity_category_never_exposed():
    assert _d("switch", has_area=True, has_entity_category=True) is False
    assert _d("number", has_entity_category=True) is False


def test_tier3_domains_never_exposed():
    for dom in ("sensor", "binary_sensor", "number", "button", "automation", "update", "script"):
        assert _d(dom) is False, dom


def test_tier2_domains_off_by_default():
    for dom in ("lock", "camera"):
        assert _d(dom) is False, dom


def test_expose_label_forces_a_tier3_entity_on():
    # This is how a voice-scene script or a voice-target input_boolean opts in.
    assert _d("script", force_expose=True) is True
    assert _d("input_boolean", force_expose=True) is True


def test_hide_label_forces_a_tier1_entity_off():
    assert _d("media_player", force_hide=True) is False


def test_hide_label_beats_expose_label():
    assert _d("light", has_area=True, force_expose=True, force_hide=True) is False


def test_expose_label_beats_hidden_and_category():
    # An explicit expose wins over the hidden/config exclusion.
    assert _d("light", has_area=False, hidden=True, force_expose=True) is True
