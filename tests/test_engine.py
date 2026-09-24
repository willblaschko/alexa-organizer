"""engine.compute_diff / removal_is_safe / describe — the pure reconcile math."""
import engine


def test_compute_diff_add_and_remove():
    diff = engine.compute_diff({"a", "b", "c"}, {"b", "c", "d"})
    assert diff.to_add == frozenset({"a"})
    assert diff.to_remove == frozenset({"d"})
    assert diff.is_noop is False


def test_compute_diff_noop_when_equal():
    diff = engine.compute_diff({"a", "b"}, {"a", "b"})
    assert diff.to_add == frozenset()
    assert diff.to_remove == frozenset()
    assert diff.is_noop is True


def test_compute_diff_pure_add():
    diff = engine.compute_diff({"a", "b"}, set())
    assert diff.to_add == frozenset({"a", "b"})
    assert diff.to_remove == frozenset()


def test_removal_is_safe_within_threshold():
    diff = engine.compute_diff(set(), {"a", "b"})  # remove 2
    assert engine.removal_is_safe(diff, max_removals=5) is True


def test_removal_is_safe_at_threshold_boundary():
    diff = engine.compute_diff(set(), {"a", "b", "c"})  # remove exactly 3
    assert engine.removal_is_safe(diff, max_removals=3) is True


def test_removal_is_unsafe_over_threshold():
    diff = engine.compute_diff(set(), {"a", "b", "c", "d"})  # remove 4
    assert engine.removal_is_safe(diff, max_removals=3) is False


def test_additions_never_make_a_diff_unsafe():
    # Only removals count against the guard — a huge add with no removes is safe.
    diff = engine.compute_diff({f"e{i}" for i in range(100)}, set())
    assert engine.removal_is_safe(diff, max_removals=5) is True


def test_describe_noop():
    diff = engine.compute_diff({"a"}, {"a"})
    assert "already matches" in engine.describe(diff)


def test_describe_lists_changes():
    diff = engine.compute_diff({"light.kitchen"}, {"switch.old"})
    text = engine.describe(diff)
    assert "light.kitchen" in text
    assert "switch.old" in text
    assert "+1" in text and "-1" in text
