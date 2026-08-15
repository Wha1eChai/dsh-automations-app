export const zh = Object.freeze({
  title: '定时任务',
  description: '当前会话的无人值守规则。调度由 titanwings/dsh-automation 提供。',
  listTitle: '自动化规则',
  listEmpty: '暂无自动化规则',
  noSession: '需要一个活动会话才能读取自动化规则。',
  loading: '正在连接自动化宿主…',
  hostMissing: '需要安装 titanwings/dsh-automation#v0.1.5 才能列出或运行定时任务。',
  pause: '暂停',
  resume: '恢复',
  runNow: '立即运行',
  statusActive: '已启用',
  statusPaused: '已暂停',
  actions: '扩展操作',
})

export const en = Object.freeze({
  title: 'Automations',
  description: 'Unattended rules for the current session. Scheduling is provided by titanwings/dsh-automation.',
  listTitle: 'Automations',
  listEmpty: 'No automations',
  noSession: 'A live session is required to read automations.',
  loading: 'Connecting to the automation host…',
  hostMissing: 'Install titanwings/dsh-automation#v0.1.5 to list or run scheduled tasks.',
  pause: 'Pause',
  resume: 'Resume',
  runNow: 'Run now',
  statusActive: 'Active',
  statusPaused: 'Paused',
  actions: 'Extension actions',
})

export type AutomationsLocaleKey = keyof typeof zh

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    automations: AutomationsLocaleKey
  }
}
