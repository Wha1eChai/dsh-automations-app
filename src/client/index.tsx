import { lazy } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { AppDescriptor } from '@wha1echai/dsh-webpage/client'
import type { ClientRpc } from './vendor/runtime.js'

import { en, zh } from './locales.js'

export const AutomationsAppBody = lazy(async () => {
  const module = await import('./AutomationsApp.js')
  return { default: module.AutomationsApp }
})

const descriptor = Object.freeze({
  id: 'wha1echai.automations',
  label: 'Automations',
  description: 'Unattended rules over titanwings/dsh-automation.',
  order: 40,
  categories: ['ops', 'automations'],
  surface: 'panel',
}) satisfies AppDescriptor

const LOCALE_NAMESPACE = 'automations'
const APP_ID = 'wha1echai.automations'

export const name = '@wha1echai/dsh-automations-app'
export const inject = ['pages', 'slots', 'locale', 'sessions', 'connection']

type AutomationsContext = ClientContext & {
  connection: { readonly rpc: ClientRpc }
}

export function apply(ctx: AutomationsContext): void {
  ctx.effect(() => {
    const unregisterLocale = ctx.locale.register(LOCALE_NAMESPACE, { zh, en })
    const unregisterPage = ctx.pages.register(descriptor)
    const unregisterApp = ctx.slots.inject('webpage.app', () => ctx.slots.register({
      name: 'webpage.app',
      key: APP_ID,
      locale: LOCALE_NAMESPACE,
      children: {
        'wha1echai.automations.actions': { kind: 'list', scope: 'root' },
      },
      inject: () => ({
        hooks: { sessions: ctx.sessions.list },
        rpc: ctx.connection.rpc,
      }),
    }, AutomationsAppBody))

    return () => {
      unregisterApp()
      unregisterPage()
      unregisterLocale()
    }
  }, 'dsh-automations-app: composition')
}

export type { AutomationsAppProps } from './AutomationsApp.js'
