# Tauri Components Demo

本项目用于验证一种桌面端工作区方案：主窗口使用 `t-dock-manager` 的 DockManager 布局，布局中的窗口组件可以从主窗口分离到独立 Tauri 窗口，也可以从独立窗口回到主窗口，并且所有窗口之间的数据保持同步。

## 组成

- `Vue 3`：前端视图层。
- `Pinia`：应用状态管理。
- `@tauri-store/pinia`：在多个 Tauri 窗口之间同步 Pinia store。
- `Tauri 2`：桌面窗口、动态 WebviewWindow 和权限能力。
- `t-dock-manager`：主窗口内的 dock 布局管理。

## 重要边界

不要修改 `t-dock-manager` 的任何源码。

当前项目只把 `t-dock-manager` 当作只读上游包使用，集成入口必须来自其构建产物：

- `t-dock-manager/dist/dock-manager-plugin.es.js`
- `t-dock-manager/dist/index.css`

如果需要改变业务行为、窗口生命周期、状态同步或 Tauri 权限，请修改当前应用的 `src/` 或 `src-tauri/`，不要修改 `t-dock-manager/` 下的源码。

## 目标要求

1. 主体界面使用 `t-dock-manager` 提供的 DockManager 布局。
2. DockManager 中的窗口组件可以从主窗口分离到 Tauri 独立窗口。
3. 独立窗口中的组件可以回到主窗口的 DockManager 布局中。
4. 主窗口和所有独立窗口之间的数据通信必须保持同步。
5. 子窗口点击系统关闭按钮时，应正常关闭，并把对应组件恢复到主窗口。

## 实现原理

### 1. DockManager 只负责主窗口内布局

`t-dock-manager` 本身不直接管理 Tauri 子窗口。它负责主窗口内的 dock 布局、tab 显示、tab 隐藏和组件挂载。

主窗口通过 `DockManager` 渲染工作区，并通过 `windowList` 注册窗口类型到 Vue 组件的映射：

```js
{
  name: 'OverviewPanel',
  comp: DockedOverviewPanel,
}
```

当前实现中，每个 dock tab 的 `id` 与 Pinia store 中的 panel `id` 保持一致，例如：

- `overview`
- `signals`
- `console`

这个稳定 ID 是分离、回归、状态同步和窗口 label 的基础。

### 2. 分离不是移动 DOM，而是切换状态

分离流程由应用层控制：

1. 用户在 dock 内点击 `Detach`。
2. `workspaceStore.detachPanel(id)` 将 panel 的 `placement` 改成 `detached`。
3. 主窗口监听 store 状态变化。
4. 主窗口调用 `dockManager.toggleWindowDisplay(tab, false)`，从 DockManager 中隐藏该 tab。
5. 主窗口调用 Tauri `new WebviewWindow(...)`，打开 `#/detached/:id` 路由。

DockManager 中的组件实例不会被直接搬到子窗口。子窗口会基于同一个 panel id 重新渲染同一个业务组件。

### 3. 独立窗口通过路由重新渲染组件

子窗口 URL 形如：

```text
#/detached/overview
```

`DetachedWindow.vue` 从路由参数中读取 panel id，然后从 `workspaceStore` 获取对应数据，并渲染：

```vue
<WorkspacePanel :panel-id="panel.id" mode="detached" />
```

因此，主窗口内和独立窗口内看到的是同一类业务组件，但由不同 Webview 分别渲染。

### 4. 回归主窗口同样由状态驱动

独立窗口回归流程：

1. 用户点击 `Return`，或点击系统窗口关闭按钮。
2. 子窗口调用 `workspaceStore.dockPanel(id)`，把 panel 的 `placement` 改成 `docked`。
3. 子窗口调用 `destroyCurrentWindow()` 销毁当前 Tauri 窗口。
4. 主窗口监听到 store 状态变化。
5. 主窗口调用 `dockManager.toggleWindowDisplay(tab, true)`，把 tab 加回 DockManager。

这里不使用 `close()` 作为最终关闭动作，因为 Tauri 的 `close()` 会再次触发 `close-requested`。当前实现使用 `destroy()` 进行最终销毁，避免关闭事件循环。

### 5. 多窗口状态同步

所有窗口都使用同一个 Pinia store：

```js
const workspaceStore = useWorkspaceStore()
await workspaceStore.$tauri.start()
```

`@tauri-store/pinia` 负责把 store 状态同步到多个 Tauri 窗口。当前同步的数据包括：

- panel 的 docked/detached 状态。
- 全局共享计数器 `sharedCounter`。
- 每个 panel 自己的计数器 `panelCounters`。
- 多窗口活动日志 `messages`。

## 关键文件

- `src/main.js`：注册 `t-dock-manager/dist` 插件和样式。
- `src/views/Home.vue`：主窗口，承载 DockManager，并负责分离/回归状态同步。
- `src/views/DetachedWindow.vue`：独立窗口页面，负责子窗口渲染和关闭回归。
- `src/store/workspace.js`：工作区状态，包括 panel 列表、计数器和消息。
- `src/composables/detachedWindows.js`：Tauri 子窗口创建、聚焦、关闭和销毁封装。
- `src/composables/tauriStore.js`：启动 `@tauri-store/pinia` 同步。
- `src/components/workspace/workspace-config.js`：DockManager 的 pane/window/layout 配置。
- `src/components/workspace/WorkspacePanel.vue`：可在主 dock 或独立窗口中渲染的业务组件。
- `src/components/workspace/WorkspaceNavigator.vue`：主窗口左侧工作区状态面板。
- `src-tauri/capabilities/default.json`：动态窗口创建、聚焦、关闭和销毁权限。

## Tauri 权限要求

动态子窗口需要在 capability 中允许所有相关窗口使用窗口 API：

```json
{
  "windows": ["*"],
  "permissions": [
    "core:default",
    "opener:default",
    "core:webview:allow-create-webview-window",
    "core:window:allow-close",
    "core:window:allow-destroy",
    "core:window:allow-set-focus"
  ]
}
```

其中 `core:window:allow-destroy` 很关键。Tauri v2 的 `onCloseRequested()` 在没有阻止默认行为时会调用 `destroy()`，如果缺少该权限，点击系统关闭按钮可能无法真正关闭子窗口。

当前实现显式拦截子窗口关闭请求：

1. `event.preventDefault()` 阻止默认关闭。
2. 先把 panel 状态恢复为 `docked`。
3. 再调用 `destroy()` 销毁当前窗口。

这样可以保证窗口关闭和组件回归主窗口是同一个确定流程。

## 验证手册

### 1. 构建检查

```powershell
pnpm build
```

如果当前环境的 `pnpm` 触发非交互安装检查，也可以使用：

```powershell
npm.cmd run build
```

### 2. Tauri 配置检查

```powershell
cd src-tauri
cargo check
```

该命令可以验证 capability 权限名称是否被当前 Tauri 版本接受。

### 3. 启动完整桌面应用

```powershell
pnpm tauri dev
```

需要验证 Tauri 独立窗口时，必须启动完整 Tauri 应用。只运行 Vite 页面只能验证前端渲染，不能完整验证 Tauri `WebviewWindow` 行为。

### 4. 主窗口布局验证

启动后检查：

- 主窗口显示 DockManager 工作区。
- 左侧显示 `Dock Workspace` 面板。
- 主 dock 中显示 `Overview`、`Signals`、`Console` 三个 tab。
- tab 内容中显示 `Shared counter`、`Panel counter` 和 activity feed。

### 5. 分离窗口验证

任选一个 tab，例如 `Overview`：

1. 点击 tab 内容右上角的 `Detach`。
2. `Overview` tab 应从主 DockManager 中消失。
3. 应弹出一个新的 Tauri 子窗口。
4. 子窗口标题应类似 `Overview - detached`。
5. 子窗口中应显示同一个 `Overview` 组件内容。

### 6. 数据同步验证

在主窗口和子窗口之间交替操作：

1. 在主窗口点击 `Increment shared`。
2. 子窗口中的 `Shared counter` 应同步变化。
3. 在子窗口点击 `Increment panel`。
4. 主窗口中的 activity feed 应同步出现记录。
5. 对同一个 panel 的 `Panel counter` 应保持一致。

### 7. Return 回归验证

在子窗口中点击 `Return`：

1. 子窗口应关闭。
2. 对应 tab 应回到主 DockManager。
3. 左侧 `Dock Workspace` 中对应 panel 的状态应变回 `docked`。
4. 之前同步的数据不应丢失。

### 8. 系统关闭按钮验证

再次分离一个 tab，然后点击子窗口右上角系统关闭按钮：

1. 子窗口应正常关闭。
2. 对应 tab 应回到主 DockManager。
3. 主窗口仍可继续操作该 tab。
4. 不应出现无法关闭、关闭后 tab 丢失、重复打开同一窗口等问题。

### 9. 重复分离验证

对同一个 panel 重复执行：

1. 分离。
2. 回归。
3. 再分离。
4. 再点击主窗口中相同 panel 的分离入口。

预期行为：

- 同一个 panel 不应创建多个相同 label 的子窗口。
- 如果子窗口已存在，应聚焦已有窗口。
- 主窗口中不应出现重复 tab。

## 常见问题

### 子窗口点击系统关闭按钮无法关闭

优先检查：

- `src-tauri/capabilities/default.json` 是否包含 `core:window:allow-destroy`。
- 子窗口关闭逻辑是否使用 `destroy()` 作为最终关闭动作。
- 修改 capability 后是否重新启动了 Tauri 应用。

### 数据不同步

优先检查：

- 主窗口和子窗口是否都执行了 `workspaceStore.$tauri.start()`。
- `src-tauri/capabilities/pinia.json` 是否允许 `windows: ["*"]`。
- 是否启动的是完整 Tauri 应用，而不是单独的 Vite 页面。

### DockManager 内 tab 没有回归

优先检查：

- panel 的 `id` 是否和 DockManager tab 的 `id` 一致。
- 主窗口是否监听了 panel `placement` 状态变化。
- 回归时是否调用了 `workspaceStore.dockPanel(id)`。
- 主窗口是否调用 `dockManager.toggleWindowDisplay(tab, true)`。

## 设计原则

- `t-dock-manager` 只负责 dock 布局，不承担 Tauri 窗口生命周期。
- 应用层负责 panel 状态、Tauri 子窗口创建、关闭、回归和数据同步。
- 分离/回归通过状态驱动，不直接跨 Webview 移动 DOM。
- 所有可分离组件都必须有稳定 ID。
- 所有窗口都必须通过同一个 store 同步共享状态。

## 迁移指南

本节用于把这套主 dock + Tauri 独立窗口 + 多窗口状态同步方案迁移到已有项目中。

### 1. 迁移前检查

目标项目需要具备以下条件：

- 使用 Vue 3。
- 使用 Pinia，或可以迁移到 Pinia 管理可分离组件状态。
- 使用 Tauri 2。
- 可以引入 `@tauri-store/pinia`。
- 可以访问 `t-dock-manager/dist` 构建产物。
- 可分离的业务组件可以通过 props 或 store 获得数据，不强依赖单一窗口内的 DOM 上下文。

如果现有项目没有 Pinia，建议先完成 Pinia 状态层迁移，再接入窗口分离能力。

### 2. 引入 t-dock-manager 构建产物

把 `t-dock-manager` 作为只读上游包放入目标项目，或通过内部包管理方式提供其 `dist` 产物。

在目标项目入口注册插件和样式：

```js
import { createApp } from 'vue'
import DockManagerPlugin from '../t-dock-manager/dist/dock-manager-plugin.es.js'
import '../t-dock-manager/dist/index.css'

const app = createApp(App)

app.use(DockManagerPlugin)
```

不要从 `t-dock-manager/src` 导入任何源码文件。业务适配层应全部写在目标项目自己的 `src/` 中。

### 3. 建立可分离组件模型

为每个可分离组件定义稳定 ID、组件类型、标题和当前位置：

```js
const panels = [
  {
    id: 'overview',
    type: 'OverviewPanel',
    title: 'Overview',
    placement: 'docked',
  },
]
```

字段建议：

- `id`：全局唯一，不能随标题或语言变化而变化。
- `type`：DockManager `windowList` 中注册的窗口类型。
- `title`：展示给用户看的 tab/window 标题。
- `placement`：`docked` 或 `detached`。

迁移时不要直接用数组下标、组件名或随机 ID 作为长期 ID，否则回归、同步和窗口复用都会变得不稳定。

### 4. 建立共享 Pinia store

把 panel 列表、业务共享数据和窗口状态放入同一个 Pinia store。

最小结构示例：

```js
export const useWorkspaceStore = defineStore('workspace', () => {
  const panels = ref([])

  function detachPanel(id) {
    updatePanel(id, { placement: 'detached' })
  }

  function dockPanel(id) {
    updatePanel(id, { placement: 'docked' })
  }

  return {
    panels,
    detachPanel,
    dockPanel,
  }
})
```

在主窗口和所有独立窗口中都启动同步：

```js
await workspaceStore.$tauri.start()
```

可以封装一个工具函数，避免重复启动：

```js
const startedStores = new WeakSet()

export async function startTauriStore(store) {
  if (!store?.$tauri?.start || startedStores.has(store)) return
  await store.$tauri.start()
  startedStores.add(store)
}
```

### 5. 配置 DockManager

目标项目需要准备三类配置：

- `paneList`：侧边栏或辅助面板。
- `windowList`：dock tab 类型到 Vue 组件的映射。
- `layout`：DockManager 初始布局。

`windowList` 中的 `name` 必须与 panel 的 `type` 一致：

```js
export const workspaceWindowList = [
  {
    name: 'OverviewPanel',
    img: '',
    comp: OverviewPanelInDock,
  },
]
```

DockManager window layout 中的 tab `id` 必须与 panel `id` 一致：

```js
{
  tab: [
    {
      id: 'overview',
      type: 'OverviewPanel',
      title: 'Overview',
    },
  ],
}
```

### 6. 改造业务组件

可分离业务组件应支持在两种模式下渲染：

- `docked`：主窗口 DockManager 内。
- `detached`：独立 Tauri 子窗口内。

推荐写法：

```vue
<WorkspacePanel panel-id="overview" mode="docked" />
<WorkspacePanel panel-id="overview" mode="detached" />
```

组件内部根据 `panelId` 从 store 获取业务数据，不直接依赖父组件传递完整对象。这样子窗口只需要知道 URL 中的 `id` 就能重新渲染。

### 7. 创建独立窗口路由

在目标项目路由中增加独立窗口页面：

```js
{
  path: '/detached/:id',
  name: 'detached-window',
  component: () => import('@/views/DetachedWindow.vue'),
}
```

子窗口 URL 使用 hash 路由时可以这样生成：

```js
function getDetachedUrl(id) {
  return `${window.location.origin}${window.location.pathname}#/detached/${id}`
}
```

### 8. 封装 Tauri 子窗口 API

目标项目中建议封装这些函数：

- `openDetachedWindow(panel)`：打开或聚焦独立窗口。
- `destroyCurrentWindow()`：销毁当前窗口。
- `onCurrentWindowCloseRequested(callback)`：监听系统关闭按钮。

打开窗口时使用稳定 label：

```js
const label = `detached-${panel.id}`
```

打开前先查重：

```js
const existingWindow = await WebviewWindow.getByLabel(label)
if (existingWindow) {
  await existingWindow.setFocus()
  return
}
```

这样可以避免同一个 panel 被重复打开多个子窗口。

### 9. 主窗口同步 DockManager 与 store

主窗口需要监听 panel `placement`，并同步 DockManager 显示状态。

核心规则：

- `placement === 'detached'`：从 DockManager 隐藏 tab，并打开 Tauri 子窗口。
- `placement === 'docked'`：关闭/忽略子窗口状态，把 tab 加回 DockManager。

伪代码：

```js
watch(panelPlacementSignature, () => {
  for (const panel of panels.value) {
    if (panel.placement === 'detached') {
      dockManager.value.toggleWindowDisplay(toDockTab(panel), false)
      openDetachedWindow(panel)
    }

    if (panel.placement === 'docked') {
      dockManager.value.toggleWindowDisplay(toDockTab(panel), true)
    }
  }
})
```

实际实现中需要先读取 DockManager 当前 tab 列表，避免重复隐藏或重复添加。

### 10. 子窗口关闭与回归

子窗口页面负责两种回归入口：

- 用户点击页面内 `Return`。
- 用户点击系统窗口关闭按钮。

系统关闭按钮建议使用统一流程：

```js
unlistenClose = await onCurrentWindowCloseRequested(async (event) => {
  event.preventDefault()
  workspaceStore.dockPanel(panel.id)
  await destroyCurrentWindow()
})
```

不要在这个流程里用 `close()` 作为最终关闭动作，因为 `close()` 会再次触发 `close-requested`。

### 11. 配置 Tauri capability

目标项目需要允许动态窗口使用相关 API：

```json
{
  "windows": ["*"],
  "permissions": [
    "core:default",
    "core:webview:allow-create-webview-window",
    "core:window:allow-close",
    "core:window:allow-destroy",
    "core:window:allow-set-focus"
  ]
}
```

如果使用 `@tauri-store/pinia`，还需要确保 pinia capability 覆盖所有窗口：

```json
{
  "identifier": "pinia",
  "windows": ["*"],
  "permissions": ["pinia:default", "core:event:default"]
}
```

修改 capability 后必须重新启动 Tauri 应用。

### 12. 迁移验证清单

迁移完成后按以下顺序验证：

1. `pnpm build` 或 `npm.cmd run build` 通过。
2. `cargo check` 通过。
3. 主窗口 DockManager 正常渲染。
4. 每个可分离 tab 都能点击 `Detach`。
5. 分离后主窗口 tab 消失，子窗口出现。
6. 子窗口内业务数据正确渲染。
7. 主窗口修改共享数据，子窗口同步更新。
8. 子窗口修改共享数据，主窗口同步更新。
9. 点击 `Return` 后子窗口关闭，tab 回到主窗口。
10. 点击系统关闭按钮后子窗口关闭，tab 回到主窗口。
11. 重复分离同一个 panel 不会打开多个重复窗口。
12. 关闭主窗口时不会留下无法关闭的子窗口状态。

### 13. 迁移常见风险

- ID 不稳定：使用随机 ID 或数组下标会导致 tab 无法正确回归。
- 组件依赖父 DOM：子窗口重新渲染时拿不到主窗口 DOM，需要改成 store/props 驱动。
- 状态分散：如果业务状态留在主窗口局部组件里，子窗口无法同步。
- 权限缺失：缺少 `allow-destroy` 会导致系统关闭按钮无法关闭子窗口。
- 重复打开：没有使用稳定 window label 和 `getByLabel()` 会打开多个重复子窗口。
- 只跑 Vite：浏览器页面无法完整验证 Tauri `WebviewWindow` 行为。
- 修改 `t-dock-manager/src`：这会让迁移成本和升级风险变高，应通过应用层适配解决。
