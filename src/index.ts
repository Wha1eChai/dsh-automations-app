/** Owner data passed to Automations App action contributions. */
export interface AutomationsAppOwner {
  readonly appPath: string
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'dshapps.automations.actions': {
      kind: 'list'
      scope: 'root'
      owner: AutomationsAppOwner
    }
  }
}

/** Host-side lifecycle entry; the App is a client composition contribution. */
export function apply(): void {}
