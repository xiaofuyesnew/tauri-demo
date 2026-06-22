# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TWebDock (`t-dock-manager`) is a Vue 3 library that provides Visual Studio-style docking layout management — panels can be docked (left/right/top/bottom/center), floated, auto-hidden, and persisted. Published as `@techtao/t-dock-manager` on npm.

## Commands

```bash
npm run dev      # Start Vite dev server (demo app at localhost:5173)
npm run build    # Build library to dist/ (ES, UMD, CJS formats)
npm run preview  # Preview built package
```

No test runner or linter is configured.

## Architecture

### Entry Points

- **Library export** (`src/index.js`): Exports the Vue plugin (with `install()`) and `DockManager` component for named import.
- **Dev entry** (`src/main.js` → `App.vue`): Demo application showing the dock manager in action.
- **Plugin install** (`src/core/plugin.js`): Registers `DockManager` as a global component and installs custom directives.

### Core Layout Engine — `src/components/DockManager/layout.js`

This is the central file (~4900 lines). It's a single large composable (`useLayout()`) managing all reactive layout state via Vue Composition API. Key concepts:

- **Layout tree**: A recursive tree where each node has `id`, `type` (`pane`/`window`/`root`), `direction` (`row`/`column`), `size` (px or %), and `children`.
- **Float panes**: Stored in `floatPane[]` on the root node — absolutely positioned overlays with z-index management.
- **Auto-hide panes**: Stored in `autoHidePane[]` — collapsible sidebar panels that slide in from edges.
- **Window layout**: A separate tree for the window area, with `tab[]` arrays holding window instances and `active` index tracking.

The composable exports layout CRUD operations, pane/window toggle methods, drag state, and layout serialization for persistence.

### Component Hierarchy

```
DockManager (index.vue)          — Root: owns layout state, teleports pane/window components
  └─ ConfigRender.vue            — Recursively renders the layout tree
       ├─ Pane.vue               — Dockable panel with tabs, context menu, drag support
       ├─ WindowRender.vue       — Recursively renders window tree
       │    └─ WindowContainer.vue — Window tab bar + content area
       ├─ Splitter.vue           — Drag handle between siblings for resizing
       ├─ FloatRender.vue        — Floating pane wrapper (draggable, resizable via Resizer.vue)
       ├─ AutoHideBar.vue        — Edge bar showing auto-hide pane triggers
       └─ AutoHidePane.vue       — Slide-in panel for auto-hidden panes
```

### Component Registration — `src/components/useAssociatedComponents.js`

Demo-only file that statically imports all pane/window components and their icons. Consumers of the library register their own components via `registerPaneList()` and `registerWindowList()` passed as props to `DockManager`.

### Teleport Pattern

`DockManager` uses Vue `<teleport>` to render pane and window content components. Components are kept alive in a hidden `.comp-park` div and teleported into their target containers when the layout places them. This preserves component state across layout changes.

### Event Bus — `src/components/DockManager/eventBus.js`

Uses `mitt` for cross-component events: `layoutChange`, `openNewWindow`, `closeWindow`, etc.

### Theming — `src/assets/style/index.css`

CSS custom properties (variables) on `.dock-manager` for all colors. Override `--t-dock-manager-*` variables to theme.

## Key Props and Exposed API

`DockManager` accepts: `paneList`, `windowList`, `defaultLayout`, and indicator images.

Exposed methods via `defineExpose()`: `setDefaultLayout()`, `getCurrentLayout()`, `setCurrentLayout()`, `resetLayout()`, `togglePaneOpen()`, `openWindowByName()`, `copyWindow()`, `getAllWindowTab()`, `registerPaneList()`, `registerWindowList()`.

Emits: `layoutChange`, `openNewWindow`, `hideWindow`.

## Build Configuration

- **Vite library mode** outputs three formats: ES, UMD, CJS → `dist/dock-manager-plugin.{es,umd,cjs}.js`
- **Vue is external** (not bundled) — consumers must provide Vue 3
- **Path alias**: `@` → `src/`
- **Target**: ES2020
- **Dependencies**: `vue`, `element-plus`, `mitt`
