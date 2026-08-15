import { describe, expect, it, vi } from 'vitest'
import { unwrapRpcResult, type AutomationSnapshot } from '../src/client/vendor/protocol.js'
import { createAutomationRuntime } from '../src/client/vendor/runtime.js'

function snapshot(name = 'Nightly'): AutomationSnapshot {
  return {
    scope: { cwd: '/tmp' },
    automations: [{
      id: 'auto-1',
      revision: 1,
      name,
      prompt: 'do work',
      status: 'active',
      schedule: { kind: 'daily', time: '02:00' },
      scheduleSummary: 'daily 02:00',
      timeZone: 'UTC',
      permission: 'read-only',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }],
    runs: [],
    serverNow: '2026-01-01T00:00:00.000Z',
  }
}

describe('unwrapRpcResult', () => {
  it('returns the value on a well-formed success envelope', () => {
    expect(unwrapRpcResult({ ok: true, value: 7 })).toBe(7)
  })

  it('throws the host message or a fallback on failure', () => {
    expect(() => unwrapRpcResult({ ok: false, error: { code: 'x', message: 'nope' } })).toThrow('nope')
    expect(() => unwrapRpcResult({ ok: false, error: undefined })).toThrow('The automation request failed.')
  })

  it('rejects malformed envelopes', () => {
    expect(() => unwrapRpcResult(null)).toThrow('invalid response')
    expect(() => unwrapRpcResult('x')).toThrow('invalid response')
    expect(() => unwrapRpcResult({ ok: true })).toThrow('invalid response')
    expect(() => unwrapRpcResult({ ok: false })).toThrow('invalid response')
  })
})

describe('createAutomationRuntime', () => {
  it('loads a snapshot and coalesces concurrent refresh', async () => {
    const call = vi.fn(async () => ({ ok: true, value: snapshot() }))
    const runtime = createAutomationRuntime({ call }, 'session-1')
    const first = runtime.refresh()
    const second = runtime.refresh()
    await Promise.all([first, second])
    expect(call).toHaveBeenCalledOnce()
    expect(runtime.source.getSnapshot().phase).toBe('ready')
    expect(runtime.source.getSnapshot().snapshot?.automations[0]?.name).toBe('Nightly')
  })

  it('keeps the previous snapshot while reloading and on a later error', async () => {
    const call = vi.fn()
      .mockResolvedValueOnce({ ok: true, value: snapshot('First') })
      .mockRejectedValueOnce('host down')
    const runtime = createAutomationRuntime({ call }, 'session-1')
    await runtime.refresh()
    await expect(runtime.refresh()).rejects.toBe('host down')
    const state = runtime.source.getSnapshot()
    expect(state.phase).toBe('error')
    expect(state.error).toBe('host down')
    expect(state.snapshot?.automations[0]?.name).toBe('First')
  })

  it('records a first-load error without a snapshot', async () => {
    const call = vi.fn(async () => {
      throw new Error('missing host')
    })
    const runtime = createAutomationRuntime({ call }, 'session-1')
    await expect(runtime.refresh()).rejects.toThrow('missing host')
    expect(runtime.source.getSnapshot()).toEqual({ phase: 'error', error: 'missing host' })
  })

  it('mutates then refreshes, waiting out a pending poll first', async () => {
    let releaseSnapshot: ((value: { ok: true; value: AutomationSnapshot }) => void) | undefined
    const pending = new Promise<{ ok: true; value: AutomationSnapshot }>(resolve => {
      releaseSnapshot = resolve
    })
    const call = vi.fn()
      .mockImplementationOnce(() => pending)
      .mockResolvedValueOnce({ ok: true, value: undefined })
      .mockResolvedValueOnce({ ok: true, value: snapshot('After') })
    const runtime = createAutomationRuntime({ call }, 'session-1')
    const firstRefresh = runtime.refresh()
    const mutate = runtime.mutateAutomation('auto-1', 'pause')
    releaseSnapshot!({ ok: true, value: snapshot('Before') })
    await firstRefresh
    await mutate
    expect(call).toHaveBeenNthCalledWith(2, '/dsh-automation', 'mutate', {
      sessionId: 'session-1',
      automationId: 'auto-1',
      mutation: 'pause',
    })
    expect(runtime.source.getSnapshot().snapshot?.automations[0]?.name).toBe('After')
  })

  it('ignores a failed in-flight poll before applying a mutation refresh', async () => {
    let rejectSnapshot: ((error: Error) => void) | undefined
    const pending = new Promise<never>((_resolve, reject) => {
      rejectSnapshot = reject
    })
    const call = vi.fn()
      .mockImplementationOnce(() => pending)
      .mockResolvedValueOnce({ ok: true, value: undefined })
      .mockResolvedValueOnce({ ok: true, value: snapshot('Recovered') })
    const runtime = createAutomationRuntime({ call }, 'session-1')
    const firstRefresh = runtime.refresh()
    const mutate = runtime.mutateAutomation('auto-1', 'resume')
    rejectSnapshot!(new Error('stale poll'))
    await expect(firstRefresh).rejects.toThrow('stale poll')
    await mutate
    expect(runtime.source.getSnapshot().snapshot?.automations[0]?.name).toBe('Recovered')
  })

  it('runs now through the same mutate-then-refresh path', async () => {
    const call = vi.fn()
      .mockResolvedValueOnce({ ok: true, value: snapshot() })
      .mockResolvedValueOnce({ ok: true, value: undefined })
      .mockResolvedValueOnce({ ok: true, value: snapshot('Ran') })
    const runtime = createAutomationRuntime({ call }, 'session-1')
    await runtime.refresh()
    await runtime.runNow('auto-1')
    expect(call).toHaveBeenNthCalledWith(2, '/dsh-automation', 'run-now', {
      sessionId: 'session-1',
      automationId: 'auto-1',
    })
  })

  it('notifies subscribers and lets them unsubscribe', async () => {
    const call = vi.fn(async () => ({ ok: true, value: snapshot() }))
    const runtime = createAutomationRuntime({ call }, 'session-1')
    const listener = vi.fn()
    const stop = runtime.source.subscribe(listener)
    await runtime.refresh()
    expect(listener).toHaveBeenCalled()
    stop()
    listener.mockClear()
    await runtime.refresh()
    expect(listener).not.toHaveBeenCalled()
  })
})
