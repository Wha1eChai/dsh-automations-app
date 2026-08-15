import { afterEach, describe, expect, it, vi } from 'vitest'
import { apply as applyHost } from '../src/index.js'
import { apply as applyInvariant, inject as invariantInject, name as invariantName } from '../src/invariant.js'
import { apply, AutomationsAppBody, inject, name } from '../src/client/index.js'
import { en, zh } from '../src/client/locales.js'

describe('Automations App composition', () => {
  afterEach(() => vi.restoreAllMocks())

  it('registers metadata, locale, and the lazy App body in one effect', () => {
    const unregisterPage = vi.fn()
    const unregisterLocale = vi.fn()
    const unregisterApp = vi.fn()
    const pageRegister = vi.fn(() => unregisterPage)
    const localeRegister = vi.fn(() => unregisterLocale)
    const slotRegister = vi.fn(() => unregisterApp)
    const slotInject = vi.fn((_name: string, callback: () => (() => void)) => callback())
    const list = { getSnapshot: () => undefined, subscribe: () => () => {} }
    const rpc = { call: vi.fn() }
    const cleanups: Array<() => void> = []
    const effect = vi.fn((execute: () => () => void) => {
      cleanups.push(execute())
    })

    apply({
      pages: { register: pageRegister },
      locale: { register: localeRegister },
      slots: { inject: slotInject, register: slotRegister },
      sessions: { list },
      connection: { rpc },
      effect,
    } as never)

    expect(name).toBe('@wha1echai/dsh-automations-app')
    expect(inject).toEqual(['pages', 'slots', 'locale', 'sessions', 'connection'])
    expect(pageRegister).toHaveBeenCalledWith(expect.objectContaining({
      id: 'wha1echai.automations',
      surface: 'panel',
    }))
    expect(localeRegister).toHaveBeenCalledWith('automations', { zh, en })
    expect(slotRegister).toHaveBeenCalledWith(expect.objectContaining({
      name: 'webpage.app',
      key: 'wha1echai.automations',
    }), AutomationsAppBody)

    const face = (slotRegister.mock.calls[0]![0] as { inject(): { hooks: { sessions: unknown }; rpc: unknown } }).inject()
    expect(face.hooks.sessions).toBe(list)
    expect(face.rpc).toBe(rpc)

    cleanups[0]!()
    expect(unregisterApp).toHaveBeenCalledOnce()
    expect(unregisterPage).toHaveBeenCalledOnce()
    expect(unregisterLocale).toHaveBeenCalledOnce()
  })

  it('keeps English keys identical to the Chinese source of truth', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
  })
})

describe('Automations App host and invariant entries', () => {
  it('contributes no host behavior and reserves package ownership', async () => {
    expect(applyHost).not.toThrow()
    expect(invariantName).toBe('dsh-automations-app-invariant')
    expect(invariantInject).toEqual(['invariants'])
    const register = vi.fn(() => () => {})
    const disposer = await applyInvariant({ invariants: { register } } as never)
    expect(register).toHaveBeenCalledWith('@wha1echai/dsh-automations-app', expect.any(Function))
    register.mock.calls[0]![1]()
    disposer()
  })
})
