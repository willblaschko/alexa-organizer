"""Config flow for Alexa Organizer — a single, account-free instance.

Phase 1 has nothing to configure (the policy is hardcoded); it just needs to be
enabled once. Stored per-type/per-entity policy state arrives with the Phase 2
UI, at which point this grows an OptionsFlow.
"""
from __future__ import annotations

from homeassistant import config_entries

from .const import DOMAIN


class AlexaCuratorConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Single-instance setup."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            return self.async_create_entry(title="Alexa Organizer", data={})
        return self.async_show_form(step_id="user")
