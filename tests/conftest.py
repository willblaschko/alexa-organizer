"""Test bootstrap: expose the pure modules without importing Home Assistant.

`custom_components/alexa_curator/{const,policy,engine}.py` import only stdlib (and
lazily import homeassistant *inside* the HA-facing functions, which tests don't
call), so we add that directory to sys.path and import them as top-level modules.
The HA-bound modules (__init__.py, exposure.py) are never imported here.
"""
import os
import sys

_PKG = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "custom_components", "alexa_curator"
)
if _PKG not in sys.path:
    sys.path.insert(0, _PKG)
