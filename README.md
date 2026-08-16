# dsh-automations-app

Historical example. Package `@dshapps/automations-app`. App ID `dshapps.automations`, `surface: 'panel'`. Superseded by [ADR 0007](https://github.com/Wha1eChai/dsh-webpage/blob/main/docs/adr/0007-automations-are-trigger-to-agent-loop.md) and removed from the standing web profile.

This is a panel over the community [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) Host. That Host is optional and is never auto-installed. The App talks to the existing `/dsh-automation` RPC channel; it does not start an agent. ADR 0007 records that a future Automations App would be a recipe — trigger plus prompt plus permission boundary producing a new Session — not a cron form.

See [NOTICE](NOTICE) for the MIT attribution of the adapted protocol/runtime subset (v0.1.5). The Host scheduler is not vendored.

## What it does

- `/apps/dshapps.automations` — list automations for the current session
- Pause / resume / Run now, when the Host is installed
- If the Host is missing, the panel says to install `titanwings/dsh-automation#v0.1.5`
- The pack inserts only this plugin

## Requirements

- DSH `0.1.0-rc.6`
- Node `^22.19.0 || >=24.0.0`
- pnpm `11.7.0`
- `@dshapps/webpage` `0.2.0` present in the profile first
- Optional: titanwings Host for a live RPC channel. This App does not add that plugin to a profile by itself.

## Install

Nothing in this family is published to npm yet. Pack this App after a build, then add the tarball to a web profile that already has `@dshapps/webpage`:

```powershell
dsh plugin --profile web add .\dshapps-webpage-0.2.0.tgz
dsh plugin --profile web add .\dshapps-automations-app-0.2.0.tgz
```

## Verify

```powershell
corepack pnpm@11.7.0 install --frozen-lockfile
corepack pnpm@11.7.0 run verify
```

On machines where nested `pnpm run` resolves pnpm `11.0.9` against `packageManager: pnpm@11.7.0`, invoke the scripts directly: `node scripts/check.mjs --lint`, `node scripts/check.mjs --pack`, and `node node_modules/vitest/vitest.mjs run --coverage`.

## Family

The platform repository [dsh-webpage](https://github.com/Wha1eChai/dsh-webpage) holds the kernel, the authoring contract, and the docs. Start a new App from [dsh-app-template](https://github.com/Wha1eChai/dsh-app-template). Apps live in their own repositories on purpose.
