# dsh-automations-app

Webpage App shell (`wha1echai.automations`, `surface: 'panel'`) over the
[titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) Host.

This package does **not** fork official Jobs and does **not** vendor the
scheduler. It registers an addressable App and talks to the existing
`/dsh-automation` RPC channel. See [NOTICE](NOTICE) for the MIT attribution
of the adapted protocol/runtime subset (v0.1.5).

## What it does

- `/apps/wha1echai.automations` — list automations for the current session
- Pause / resume / Run now
- If the Host is not installed, the panel explains how to add
  `github:titanwings/dsh-automation#v0.1.5`

## Requirements

- DSH `0.1.0-rc.6`
- `@wha1echai/dsh-webpage` `0.1.0` installed first
- Optional: titanwings Host for a live RPC channel. This App does not add
  that plugin to a profile by itself.
