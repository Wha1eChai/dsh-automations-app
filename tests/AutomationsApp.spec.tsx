// @vitest-environment jsdom

import { Suspense } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { SessionListState } from '@deepseek-ai/dsh-client-runtime/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AutomationsAppBody } from '../src/client/index.js'
import { AutomationsApp, type AutomationsAppProps } from '../src/client/AutomationsApp.js'
import { en } from '../src/client/locales.js'
import type { AutomationSnapshot, AutomationViewModel } from '../src/client/vendor/protocol.js'

function state(current: string | undefined): SessionListState {
  return {
    ids: current === undefined ? [] : [current],
    byId: {},
    current: current as SessionListState['current'],
    phase: 'ready',
    subagentsByParent: {},
    jobsBySession: {},
    currentAddress: undefined,
  }
}

function automation(overrides: Partial<AutomationViewModel> = {}): AutomationViewModel {
  return {
    id: 'auto-1',
    revision: 1,
    name: 'Nightly',
    prompt: 'do work',
    status: 'active',
    schedule: { kind: 'daily', time: '02:00' },
    scheduleSummary: 'daily 02:00',
    timeZone: 'UTC',
    permission: 'read-only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function snapshot(automations: readonly AutomationViewModel[] = []): AutomationSnapshot {
  return {
    scope: { cwd: '/tmp' },
    automations,
    runs: [],
    serverNow: '2026-01-01T00:00:00.000Z',
  }
}

function props(
  current: string | undefined,
  rpc: AutomationsAppProps['rpc'],
  renderSlot = vi.fn(() => null),
): AutomationsAppProps {
  return {
    appId: 'wha1echai.automations',
    appPath: '/',
    search: '',
    hash: '',
    navigate: vi.fn(),
    close: vi.fn(),
    renderSlot: renderSlot as unknown as AutomationsAppProps['renderSlot'],
    t: key => en[key],
    useSessions: select => select(state(current)),
    rpc,
  } as AutomationsAppProps
}

describe('AutomationsApp', () => {
  afterEach(cleanup)

  it('asks for a live session when none is selected', () => {
    render(<AutomationsApp {...props(undefined, { call: vi.fn() })} />)
    expect(screen.getByRole('article').getAttribute('data-route')).toBe('no-session')
    expect(screen.getByText('A live session is required to read automations.')).toBeTruthy()
  })

  it('shows a loading state then an empty list', async () => {
    let release: ((value: { ok: true; value: AutomationSnapshot }) => void) | undefined
    const call = vi.fn(() => new Promise<{ ok: true; value: AutomationSnapshot }>(resolve => {
      release = resolve
    }))
    render(<AutomationsApp {...props('session-1', { call })} />)
    await waitFor(() => expect(screen.getByText('Connecting to the automation host…')).toBeTruthy())
    release!({ ok: true, value: snapshot() })
    await waitFor(() => expect(screen.getByText('No automations')).toBeTruthy())
  })

  it('explains how to install the Host when RPC fails', async () => {
    const call = vi.fn(async () => {
      throw new Error('no channel')
    })
    render(<AutomationsApp {...props('session-1', { call })} />)
    await waitFor(() => expect(screen.getByText('Install titanwings/dsh-automation#v0.1.5 to list or run scheduled tasks.')).toBeTruthy())
    expect(screen.getByRole('article').getAttribute('data-route')).toBe('host-missing')
  })

  it('lists automations and hides empty actions', async () => {
    const call = vi.fn(async () => ({
      ok: true,
      value: snapshot([
        automation(),
        automation({ id: 'auto-2', name: 'Weekly', status: 'paused', scheduleSummary: 'weekly' }),
      ]),
    }))
    render(<AutomationsApp {...props('session-1', { call })} />)
    await waitFor(() => expect(screen.getByText('Nightly')).toBeTruthy())
    expect(screen.getByText('Weekly')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Resume' })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Run now' })).toHaveLength(2)
    expect(screen.queryByRole('heading', { name: 'Extension actions' })).toBeNull()
  })

  it('renders contributed actions when the slot has children', async () => {
    const call = vi.fn(async () => ({ ok: true, value: snapshot() }))
    const renderSlot = vi.fn(() => <button type="button">Kind action</button>)
    render(<AutomationsApp {...props('session-1', { call }, renderSlot)} />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Kind action' })).toBeTruthy())
    expect(renderSlot).toHaveBeenCalledWith('wha1echai.automations.actions', { appPath: '/' })
  })

  it('pauses, resumes, and runs now, swallowing RPC failures', async () => {
    const call = vi.fn(async (_channel: string, endpoint: string) => {
      if (endpoint === 'snapshot') {
        return {
          ok: true,
          value: snapshot([
            automation(),
            automation({ id: 'auto-2', name: 'Weekly', status: 'paused' }),
          ]),
        }
      }
      throw new Error('busy')
    })
    render(<AutomationsApp {...props('session-1', { call })} />)
    await waitFor(() => expect(screen.getByText('Nightly')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Run now' })[0]!)
    await waitFor(() => expect(call.mock.calls.some(entry => entry[1] === 'mutate')).toBe(true))
    expect(call.mock.calls.some(entry => entry[1] === 'run-now')).toBe(true)
    expect(screen.getByText('Nightly')).toBeTruthy()
  })

  it('lazy-loads the Automations body through the client entry', async () => {
    const call = vi.fn(async () => ({ ok: true, value: snapshot() }))
    render(
      <Suspense fallback={<div>loading</div>}>
        <AutomationsAppBody {...props('session-1', { call })} />
      </Suspense>,
    )
    await waitFor(() => expect(screen.getByText('No automations')).toBeTruthy())
  })
})
