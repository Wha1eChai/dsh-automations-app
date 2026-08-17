# dsh-automations-app

[English](README.md) | 中文

历史示例。包名 `@dshapps/automations-app`。App ID `dshapps.automations`，`surface: 'panel'`。已被 [ADR 0007](https://github.com/dshapps/dsh-webpage/blob/main/docs/adr/0007-automations-are-trigger-to-agent-loop.md) 取代，并从常驻 web profile 拿掉。

这是社区 [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) Host 上面的一块面板。那个 Host 是可选的，从不自动安装。App 走已有的 `/dsh-automation` RPC 通道；它不启动 agent。ADR 0007 记录了：独立 cron 表单不是 Automations App。

改编的协议/运行时子集（v0.1.5）的 MIT 归属见 [NOTICE](NOTICE)。Host 调度器没有 vendored。

## 做什么

- `/apps/dshapps.automations` — 列出当前会话的 automations
- Host 已安装时：暂停 / 继续 / 立即运行
- Host 缺失时，面板会提示安装 `titanwings/dsh-automation#v0.1.5`
- pack 只插入本插件

## 要求

- DSH `0.1.0-rc.6`
- Node `^22.19.0 || >=24.0.0`
- pnpm `11.7.0`
- profile 里先有 `@dshapps/webpage` `0.2.0`
- 可选：titanwings Host，用来提供活着的 RPC 通道。这个 App 不会自己把那个插件加进 profile。

## 安装

这一家都还没上 npm。构建后打包这个 App，再加到已经有 `@dshapps/webpage` 的 web profile：

```powershell
dsh plugin --profile web add .\dshapps-webpage-0.2.0.tgz
dsh plugin --profile web add .\dshapps-automations-app-0.2.0.tgz
```

## 校验

```powershell
corepack pnpm@11.7.0 install --frozen-lockfile
corepack pnpm@11.7.0 run verify
```

有些机器上嵌套的 `pnpm run` 会按 `packageManager: pnpm@11.7.0` 解析到 pnpm `11.0.9`，这时直接跑：`node scripts/check.mjs --lint`、`node scripts/check.mjs --pack`，以及 `node node_modules/vitest/vitest.mjs run --coverage`。

## 这一家

平台仓库 [dsh-webpage](https://github.com/dshapps/dsh-webpage) 放内核、写作合同和文档。新 App 从 [dsh-app-template](https://github.com/dshapps/dsh-app-template) 起步。App 故意各自独立成库。

使用 [MIT License](LICENSE)。
