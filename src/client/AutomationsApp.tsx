import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SessionListState } from '@deepseek-ai/dsh-client-runtime/client'
import type { HostObservable, InjectFace, PropsLocale, PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots'
import type { WebpageAppSlotProps } from '@dshapps/webpage/client'
import { AppEmpty, AppList, AppPage, AppRow } from '@dshapps/webpage/ui'
import type { AutomationsAppOwner } from '../index.js'
import type { ClientRpc } from './vendor/runtime.js'
import { createAutomationRuntime } from './vendor/runtime.js'

interface AutomationsAppInject {
  hooks: {
    sessions: HostObservable<SessionListState>
  }
  rpc: ClientRpc
}

export type AutomationsAppProps =
  WebpageAppSlotProps
  & PropsRenderSlots<'dshapps.automations.actions'>
  & PropsLocale<'automations'>
  & InjectFace<AutomationsAppInject>

type Translate = AutomationsAppProps['t']

/** List automations for the current session, or explain why the Host is missing. */
export function AutomationsApp({ appPath, renderSlot, t, useSessions, rpc }: AutomationsAppProps): ReactNode {
  const sessionId = useSessions(state => state.current)
  const owner: AutomationsAppOwner = Object.freeze({ appPath })
  const actions = renderSlot('dshapps.automations.actions', owner)

  if (sessionId === undefined) {
    return (
      <article data-route="no-session">
        <AppPage title={t('title')} description={t('description')} actions={actions} actionsLabel={t('actions')}>
          <AppEmpty>{t('noSession')}</AppEmpty>
        </AppPage>
      </article>
    )
  }

  return <BoundList actions={actions} rpc={rpc} sessionId={sessionId} t={t} />
}

function BoundList({
  actions,
  rpc,
  sessionId,
  t,
}: {
  actions: ReactNode
  rpc: ClientRpc
  sessionId: string
  t: Translate
}): ReactNode {
  const runtime = useMemo(() => createAutomationRuntime(rpc, sessionId), [rpc, sessionId])
  const state = useSyncExternalStore(runtime.source.subscribe, runtime.source.getSnapshot, runtime.source.getSnapshot)

  useEffect(() => {
    void runtime.refresh().catch(() => undefined)
  }, [runtime])

  if (state.snapshot === undefined) {
    const empty = state.phase === 'error' ? t('hostMissing') : t('loading')
    return (
      <article data-route={state.phase === 'error' ? 'host-missing' : 'loading'}>
        <AppPage title={t('title')} description={t('description')} actions={actions} actionsLabel={t('actions')}>
          <AppEmpty>{empty}</AppEmpty>
        </AppPage>
      </article>
    )
  }

  const rows = state.snapshot.automations
  return (
    <article data-route="/">
      <AppPage title={t('listTitle')} description={t('description')} actions={actions} actionsLabel={t('actions')}>
        {rows.length === 0
          ? <AppEmpty>{t('listEmpty')}</AppEmpty>
          : (
            <AppList dense label={t('listTitle')}>
              {rows.map(item => (
                <AppRow
                  key={item.id}
                  dense
                  data-app-id={item.id}
                  title={item.name}
                  description={`${item.status === 'active' ? t('statusActive') : t('statusPaused')} · ${item.scheduleSummary}`}
                  trailing={(
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          void runtime.mutateAutomation(item.id, item.status === 'active' ? 'pause' : 'resume').catch(() => undefined)
                        }}
                      >
                        {item.status === 'active' ? t('pause') : t('resume')}
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          void runtime.runNow(item.id).catch(() => undefined)
                        }}
                      >
                        {t('runNow')}
                      </Button>
                    </>
                  )}
                />
              ))}
            </AppList>
          )}
      </AppPage>
    </article>
  )
}
