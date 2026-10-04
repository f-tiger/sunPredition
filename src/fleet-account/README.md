# Shared account edge adapter

Source: f-tiger/agi-site, tools/fleet-account/{config,edge}.mjs, fleet-account-20261004.1.
Keep these files synchronized with that protocol. Registration and Google token verification live at https://baipiaoji.com; SunWatch exchanges a PKCE-bound code server-side and stores only a host-only HttpOnly session cookie. Existing subscription/Telegram and paid-access mechanisms remain independent. No extra cron, account database or client secret is needed.

Canonical entry: https://invest.agiscorecard.com/auth/account. It is noindex/no-store, excludes analytics, and requires explicit hub confirmation. Test with test/fleet-account.test.mjs and read-only test/fleet-account-live.mjs. Real Google consent is not covered by synthetic tests. Google Cloud needs the BPJ JavaScript origin; it does not need this site's callback as a Google redirect URI.
