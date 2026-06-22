# TWebDock 改进清单

本文档整理了 `t-dock-manager` 库在架构、代码质量、功能和工程化方面可改进的点，按优先级和类别分类，供迭代开发时参考。

---

## 一、架构层面

### 1.1 layout.js 单文件过大（~4900 行）

**现状**：所有布局逻辑集中在 `src/components/DockManager/layout.js` 一个文件里，包括 Pane 操作、Window 操作、浮动窗口操作、AutoHide 操作、尺寸计算、布局插入等。

**问题**：
- 阅读和维护成本高，函数之间有大量重复模式
- 不同关注点混在一起，修改一处容易引发意外影响

**建议拆分方向**：
```
layout/
  ├── state.js             # 响应式状态定义（curLayoutData, windowLayout 等）
  ├── paneOperations.js    # 固定 Pane 相关操作（open/close/toggle/insert）
  ├── floatOperations.js   # 浮动 Pane 相关操作（setPaneFloat/unSetPaneFloat/position）
  ├── windowOperations.js  # Window 相关操作（open/close/layout/tab管理）
  ├── autoHideOperations.js # AutoHide 相关操作（pin/unpin/resize）
  ├── treeUtils.js         # 通用树遍历工具（getById, getParentByChildId, findInTree）
  ├── sizeUtils.js         # 尺寸计算（calcSize, updatePaneSize, reCalcSiblingSize）
  └── index.js             # useLayout() 聚合导出
```

### 1.2 模块级单例导致无法多实例

**现状**：`layout.js` 中 `curLayoutData`、`windowLayout`、`curDragId`、`curActive` 等核心状态定义在 `useLayout()` 函数**外部**（模块顶层），是全局共享的。

**问题**：同一页面无法同时使用两个 `<DockManager>` 实例，它们会共享同一份布局数据。

**建议**：将所有状态移入 `useLayout()` 内部，或改为工厂函数模式。通过 `provide/inject` 在组件树中传递实例，而非直接 `import`。

### 1.3 重复的树遍历代码

**现状**：`layout.js` 中有大量结构几乎相同的递归遍历函数：

| 函数 | 作用 |
|------|------|
| `getById(id)` | 在固定 Pane 树中按 id 查找节点 |
| `getFloatById(id)` | 在浮动 Pane 树中按 id 查找节点 |
| `getWindowById(id)` | 在 Window 树中按 id 查找节点 |
| `getByPaneName(name)` | 在固定 Pane 树中按 name 查找 |
| `getFloatByPaneName(name)` | 在浮动 Pane 树中按 name 查找 |
| `getParentByChildId(id)` | 在固定 Pane 树中找父节点 |
| `getFloatParentById(id)` | 在浮动 Pane 树中找父节点 |
| `getParentWindowByChildId(id)` | 在 Window 树中找父节点 |
| `getWindowByTabId(id)` | 在 Window 树中按 Tab id 查找 |
| `getWindowByTab(tab)` | 在 Window 树中按 Tab 引用查找 |

**建议**：抽象为通用的树工具函数：
```js
// 通用查找
const findNode = (root, predicate) => { ... }
// 通用查找父节点
const findParent = (root, childId) => { ... }
// 在所有树中查找（固定 + 浮动 + window）
const findInAnyTree = (predicate) => { ... }
```

### 1.4 `updateParent` 函数重复定义

**现状**：`closePane`、`closeFloatPane`、`setFloatPaneToNewFloat`、`unSetPaneFloat` 中各自定义了局部的 `updateParent` 函数，逻辑几乎完全相同——当父节点只剩一个子节点时，将子节点提升合并到父节点。

**建议**：抽取为共用的 `mergeUpSingleChild(nodeId, treeType)` 函数。

---

## 二、代码质量

### 2.1 `insertPane` 函数过长且分支爆炸

**现状**：`insertPane()` 函数（约 500+ 行）处理将面板插入到非浮动 Pane 的逻辑，需要处理：
- `targetId == 'root'` 还是普通 Pane
- `targetPane.direction` 是 `row` 还是 `column`
- `sourcePane.direction` 是 `row` 还是 `column`
- `direction` 是 `top` / `right` / `bottom` / `left` / `center`

共 2 × 2 × 2 × 5 = 40 种组合，大量 switch-case 嵌套，存在高度相似的代码块。

**建议**：
- 将方向抽象为轴（`horizontal` = left/right, `vertical` = top/bottom）
- 将"在前方插入"和"在后方插入"统一为带 `position` 参数的单个操作
- `root` 级别的特殊逻辑单独处理，减少分支层数

### 2.2 `newHorizontalTab` / `newVerticalTab` 高度对称重复

**现状**：这两个函数（各约 150 行）结构完全对称，只是方向参数不同（row↔column, top/bottom↔left/right）。

**建议**：合并为一个 `splitWindowTab(window, tab, axis, position)` 函数，`axis` 为 `'horizontal'`/`'vertical'`，`position` 为 `'before'`/`'after'`。

### 2.3 字符串百分比与数字混用

**现状**：`size` 字段有时是 `'50%'` 字符串，有时是数字 `250`（px），操作时需要频繁 `.replace('%', '')`。整个 `layout.js` 中有 **60+ 处** `replace('%', '')`。

**建议**：统一 size 数据结构，例如：
```js
// 方案一：统一用对象
size: { value: 50, unit: '%' }
// 方案二：内部全用数值，单位由约定确定
// pane 方向为 column 时 size 为 px，row 时为 flex 比例
```

### 2.4 `JSON.parse(JSON.stringify())` 深拷贝

**位置**：`setDefaultLayout()`、`setCurrentLayout()`、`setCurrentWindowLayout()`、`resetLayout()`、`unSetRootPaneFloat()` 等。

**问题**：
- 性能不佳（对大布局树有开销）
- 无法处理 `undefined`、函数、循环引用等
- 语义不明确

**建议**：使用 `structuredClone()`（现代浏览器原生支持）或引入轻量级深拷贝工具。

### 2.5 DOM 直接操作过多

**现状**：大量 `document.getElementById()`、`document.querySelector()`、`getBoundingClientRect()` 调用散布在各组件和 layout.js 中。

**典型问题**：
- `document.getElementById('root')` — 固定 id 可能与宿主应用冲突
- `document.querySelector('#window')` — 全局选择器不安全
- `ConfigRender.vue` 中 `resizeObserver.observe(document.getElementById('root'))` — 应用 `ref` 代替

**建议**：
- 用 Vue 的 `ref` + `template ref` 替代 `getElementById`
- 将 `root` 和 `window` 改为动态生成的唯一 id 或用 data 属性选择
- 通过 `provide/inject` 传递容器 ref

### 2.6 全局事件监听未统一管理

**现状**：多个组件在 `onMounted` 中注册全局事件监听器：

| 组件 | 注册的全局事件 |
|------|---------------|
| `Pane.vue` | `document.addEventListener('mousemove', dropDetectEvent)` × 每个 Pane 实例 |
| `Pane.vue` | `document.addEventListener('click', handleClickOutside)` × 每个实例 |
| `FloatRender.vue` | `document.addEventListener('click', handleClickOutside)` × 每个实例 |
| `WindowContainer.vue` | `document.addEventListener('mousemove/mouseup')` × 每个实例 |
| `AutoHidePane.vue` | `document.addEventListener('click', handleClickOutside, { capture: true })` × 每个实例 |

**问题**：
- 面板数量多时，`mousemove` 上绑定大量监听器，每次鼠标移动都触发所有 Pane 的 `dropDetectEvent`
- 内存泄漏风险（如果卸载不完整）

**建议**：
- 将拖拽嗅探（`dropDetectEvent`）统一为单个全局监听器，通过坐标计算命中的 Pane
- 用事件委托替代每个实例单独绑定 `click` 事件

### 2.7 拼写错误

| 位置 | 错误 | 应为 |
|------|------|------|
| `layout.js` 多处变量名 | `spliterGap` | `splitterGap` |
| `Resizer.vue:30` | `defaultlayout` | `defaultLayout`（实际未使用） |
| `layout.js` 中 `getWindowByTabId` 内部 | `findWndow` | `findWindow` |
| `layout.js` 注释 | `defaulyWidth` | `defaultWidth` |
| `DockIndicator.vue:55` | `DockIndicator_Leftpng`（缺少下划线） | `DockIndicator_Left.png` |
| `AutoHidePane.vue` 事件类型 | `autonHidePaneResize` | `autoHidePaneResize` |
| `AutoHidePane.vue` 事件类型 | `autonHidePaneUnpin` | `autoHidePaneUnpin` |
| `AutoHidePane.vue` 事件类型 | `autonHidePaneClose` | `autoHidePaneClose` |
| `useAssociatedComponents.js:625` | `Tectonics tress window` | `Tectonic stress window` |

### 2.8 未使用的代码和变量

| 位置 | 说明 |
|------|------|
| `Resizer.vue:30` | `defaultlayout` 解构后从未使用 |
| `src/utils/eventBus.js` | 与 `src/components/DockManager/eventBus.js` 重复，项目中只使用后者 |
| `layout.js` 中 `calcChildrenPosition()` | 函数内引用了 `position` 属性，但布局数据中没有此字段，疑似废弃代码 |
| `layout.js:1413` | `const res = item.group.some(...)` 赋值后未使用 |
| `Pane.vue` | `import Resizer from './Resizer.vue'` 导入但未在模板中使用 |

---

## 三、功能缺陷与边界情况

### 3.1 Auto Hide 只支持左侧

**现状**：`AutoHideBar` 和 `AutoHidePane` 都硬编码为左侧（`writing-mode: vertical-lr`，`translateX(-100%)`，从左侧滑入）。

**建议**：支持四个方向的 Auto Hide（VS Code/Visual Studio 支持上下左右），通过 `position` 参数控制。

### 3.2 浮动窗口缺少最小尺寸约束

**现状**：`floatDockResize()`（`Resizer.vue` 触发）直接修改 `width`/`height`，没有最小值检查。用户可以将浮动窗口缩到接近 0。

**建议**：在 `floatDockResize` 中添加最小宽高约束（如 `minWidth: 100, minHeight: 80`），且限制不能拖出容器边界。

### 3.3 浮动窗口拖拽只限制了上边界

**现状**：`Pane.vue:259` — `top = top < 0 ? 0 : top`，只限制了顶部边界，浮动面板可以拖出底部、左右边界。

**建议**：添加四个方向的边界限制，或至少保证窗口标题栏始终可见可抓取。

### 3.4 `isPaneOpend` 中的 `isInTree` 递归提前返回 Bug

**现状**（`layout.js:1537`）：
```js
function isInTree(tree) {
    for (const node of tree) {
        if (node.data && node.data.group && node.data.group.includes(paneName)) {
            return true;
        }
        if (node.children && node.children.length > 0) {
            return isInTree(node.children);  // ← 问题：直接 return，没检查后续兄弟节点
        }
    }
    return false;
}
```

**问题**：当第一个子节点有 `children` 但不包含目标时，函数直接返回 `false`，不会继续检查后续兄弟节点。

**修复**：
```js
if (node.children && node.children.length > 0) {
    if (isInTree(node.children)) return true;  // 找到返回 true，否则继续
}
```

### 3.5 Splitter 拖动时 `calcRect` 每帧执行

**现状**：`Splitter.vue` 的 `mousemoveEvent` 每次都调用 `calcRect()` 执行两次 `getElementById` + `getBoundingClientRect`。

**建议**：在 `mousedown` 时计算一次缓存，`mousemove` 中直接使用。

### 3.6 `closeWindow` 被连续调用时的顺序问题

**现状**：`dropTab()` 中先执行 `newHorizontalTab/newVerticalTab`（内部可能 `closeWindow`），再 `closeWindow(fromWindow.id, ...)`，如果 from 和 target 是同一个 window，可能出现问题。

**建议**：添加 fromWindow === targetWindow 的判断保护。

---

## 四、性能

### 4.1 每个 Pane 实例注册全局 mousemove 监听

**现状**：每个 `Pane.vue` 实例在 `onMounted` 中调用 `document.addEventListener('mousemove', dropDetectEvent)`。如果页面有 10 个 Pane，就有 10 个 `mousemove` 监听器同时运行。

**问题**：即使没有拖拽操作，每次鼠标移动都触发 10 次处理函数，每次都做 `getBoundingClientRect()` 计算。

**建议**：
- 只在 `curDragId` 有值时才启用嗅探
- 改为单个全局监听器 + 遍历 Pane 列表计算命中

### 4.2 `paneTabList` / `windowTabList` computed 遍历全树

**现状**：这两个 computed 属性在每次 `curLayoutData` 或 `windowLayout` 深度变化时都递归遍历整棵树。由于 `deep: true` 的 watch，任何细微变化都会触发。

**建议**：考虑维护一个增量更新的扁平索引，而非每次全量遍历。

### 4.3 `v-ellipsis-title` 指令为每个元素创建两个 Observer

**现状**：每个使用 `v-ellipsis-title` 的元素都创建一个 `ResizeObserver` 和一个 `MutationObserver`。Pane 底部 tab + Window 标题都用了这个指令。

**建议**：使用单个共享的 `ResizeObserver`（一个 observer 可 observe 多个元素），减少 Observer 实例数量。

---

## 五、工程化

### 5.1 缺少测试

**现状**：没有任何测试框架配置（无 Vitest/Jest/Cypress）。

**建议优先补充的测试**：
- `layout.js` 中树操作函数的单元测试（insertPane、closePane、setPaneFloat 等）
- 布局序列化/反序列化的 snapshot 测试
- 拖拽交互的 e2e 测试（Cypress / Playwright）

### 5.2 缺少 Lint 配置

**现状**：没有 ESLint/Prettier。代码风格不完全统一（`let` vs `const`，分号使用不一致，部分 `==` 应为 `===`）。

### 5.3 CSS 变量命名不统一

**现状**：
- 顶层变量前缀 `--t-dock-manager-bg-color` 只有主背景色有
- 其他变量如 `--pane-header-bg-color`、`--window-tab-bg-color` 没有统一前缀
- 部分组件内直接硬编码颜色值（如 `FloatRender.vue:304` 的 `background-color: #E6E6E6`、`WindowContainer.vue:563` 的 `background: #FFF`）

**建议**：所有变量统一 `--t-dock-manager-` 前缀，消除硬编码颜色。

### 5.4 element-plus 依赖可以移除

**现状**：`element-plus` 是 `dependencies`（会被打包到库中），但只在 `WindowContainer.vue` 中使用了一个 `<el-popover>` 组件（窗口下拉菜单）。

**问题**：引入整个 `element-plus` 作为依赖对库体积和使用方负担较大。

**建议**：用自定义 Popover 组件替换（参考 `Pane.vue` 中已实现的自定义右键菜单模式），然后将 `element-plus` 移除。

### 5.5 图片资源的打包问题

**现状**：`DockIndicator.vue` 中指示器图片的默认路径为硬编码的开发路径（`/src/assets/image/DockIndicator_Top.png`），不是构建后的路径。

**建议**：改为 `import` 静态资源，让 Vite 正确处理资源路径：
```js
import topImg from '@/assets/image/DockIndicator_Top.png'
```

### 5.6 `useAssociatedComponents.js` 职责混乱

**现状**：这个文件既是库内部的组件注册器（`registerPaneList`、`registerWindowList`），又是 demo 应用的数据定义（包含所有 demo 面板/窗口组件的 import 和配置）。

**问题**：demo 代码和库代码混在一起，库构建时会包含 demo 组件。

**建议**：
- 将 demo 的组件列表和布局配置移到 `src/App.vue` 或单独的 demo 目录
- `useAssociatedComponents.js` 只保留 `registerPaneList`/`registerWindowList`/`getPaneComp`/`getWindowComp` 等纯工具函数

---

## 六、API 设计

### 6.1 事件类型不一致

**现状**：`emitter.emit('layoutChange', { type: '...' })` 中的 `type` 值没有统一命名规范：

| 混合命名 | 建议统一风格 |
|----------|-------------|
| `floatPaneToNewFloat` | `float-pane:to-new-float` 或 `floatPane.toNewFloat` |
| `paneToFloat` | `pane:to-float` |
| `tabToFloat` | `tab:to-float` |
| `floatTabToFloat` | `float-tab:to-float` |
| `autonHidePaneResize` | `auto-hide-pane:resize`（且修正拼写） |
| `windowTabDrop` | `window-tab:drop` |

**建议**：定义事件常量枚举，统一命名风格，避免字符串散落。

### 6.2 `togglePaneOpen` 的 API 语义不清

**现状**：函数名叫 `togglePaneOpen`，但功能远比 toggle 复杂——需要处理"面板当前在固定/浮动/autoHide/不存在"四种情况，并做对应的打开或关闭。

**建议**：拆分为语义明确的 API：`openPane(name)`、`closePane(name)`、`isPaneOpen(name)`，由调用者决定行为。

### 6.3 缺少类型定义

**现状**：没有 TypeScript 类型定义（`.d.ts`）。布局数据结构只能通过阅读代码理解。

**建议**：至少提供 JSDoc 或 `.d.ts` 文件描述：
- `LayoutNode` 类型（id, type, direction, size, children, data, floatPane, autoHidePane）
- `WindowLayout` 类型（maximize, active, data）
- `DockManager` 暴露的方法签名
- Props 和 Events 的类型

---

## 七、改进优先级建议

### 短期（Bug 修复 + 低成本高收益）
1. 修复 `isPaneOpend` 中 `isInTree` 的递归 Bug（3.4）
2. 修复 `DockIndicator.vue` 中的图片路径拼写错误（2.7）
3. 修复其他拼写错误（2.7）
4. 清理未使用的代码和导入（2.8）
5. 添加浮动窗口最小尺寸约束（3.2）

### 中期（架构优化）
6. 抽取通用树遍历工具函数（1.3 + 1.4）
7. 拖拽嗅探改为单监听器模式（4.1）
8. 替换 `element-plus` 依赖（5.4）
9. 分离 demo 代码和库代码（5.6）
10. 统一 CSS 变量命名，消除硬编码颜色（5.3）

### 长期（重构）
11. 拆分 `layout.js`（1.1）
12. 解决多实例问题（1.2）
13. 统一 size 数据类型（2.3）
14. 简化 `insertPane` 函数（2.1）
15. 合并 `newHorizontalTab`/`newVerticalTab`（2.2）
16. 添加测试框架和核心测试用例（5.1）
17. 添加类型定义（6.3）
18. 支持四方向 Auto Hide（3.1）
