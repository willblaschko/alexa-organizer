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
    sibling_light=False,
):
    return policy.decide(
        domain=domain,
        has_area=has_area,
        hidden=hidden,
        has_entity_category=has_entity_category,
        force_expose=force_expose,
        force_hide=force_hide,
        sibling_light=sibling_light,
    )


def test_switch_with_sibling_light_is_deduped():
    # A switch on a device that already exposes a light isn't its own voice target.
    assert _d("switch", has_area=True, sibling_light=True) is False


def test_switch_without_sibling_light_still_exposed():
    assert _d("switch", has_area=True, sibling_light=False) is True


def test_labeled_switch_with_sibling_light_still_exposed():
    # An explicit alexa label wins over the dedupe.
    assert _d("switch", sibling_light=True, force_expose=True) is True


def test_light_is_never_deduped_by_a_sibling_light():
    assert _d("light", has_area=True, sibling_light=True) is True


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


# ── classify reasons (drive the UI's "why" column) ───────────────────────────

def _c(domain, **kw):
    base = dict(has_area=True, hidden=False, has_entity_category=False,
               force_expose=False, force_hide=False)
    base.update(kw)
    return policy.classify(domain=domain, **base)


def test_classify_reasons():
    assert _c("media_player") == (True, "rule: media_player")
    assert _c("light", has_area=True) == (True, "rule: light in a room")
    assert _c("light", has_area=False) == (False, "light has no room")
    assert _c("switch", has_area=False) == (False, "switch has no room")
    assert _c("media_player", hidden=True) == (False, "hidden in HA")
    assert _c("switch", has_entity_category=True) == (False, "config/diagnostic")
    assert _c("script", force_expose=True) == (True, "label: alexa")
    assert _c("media_player", force_hide=True) == (False, "label: alexa-hide")
    assert _c("sensor") == (False, "not a voice target")


def test_decide_matches_classify_boolean():
    for dom in ("media_player", "light", "switch", "sensor", "script"):
        assert _d(dom, has_area=False) == _c(dom, has_area=False)[0]
