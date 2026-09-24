"""Minimal pytest-free runner (pytest isn't installed on the dev Mac).

Puts the integration dir on sys.path, then imports every tests/test_*.py and runs
its `test_*` functions, reporting PASS/FAIL per test. CI still uses real pytest
(.github/workflows/validate.yml); this is just for the local loop. Only the PURE
modules (const, policy, engine) are exercised here — nothing that imports
homeassistant.
"""
import importlib.util
import os
import sys
import traceback

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.join(os.path.dirname(HERE), "custom_components", "alexa_organizer")
for p in (PKG, HERE):
    if p not in sys.path:
        sys.path.insert(0, p)

passed = failed = 0
failures = []
for fname in sorted(os.listdir(HERE)):
    if not (fname.startswith("test_") and fname.endswith(".py")):
        continue
    spec = importlib.util.spec_from_file_location(fname[:-3], os.path.join(HERE, fname))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    for name in sorted(dir(mod)):
        if not name.startswith("test_"):
            continue
        fn = getattr(mod, name)
        if not callable(fn):
            continue
        try:
            fn()
            passed += 1
        except Exception:  # noqa: BLE001
            failed += 1
            failures.append(f"{fname}::{name}\n{traceback.format_exc()}")

for f in failures:
    print("FAIL", f)
print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
