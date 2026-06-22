# TWebDock

​基于Vue3 + Vite构建的一款容器布局管理工具，在Vue3项目中，为前端程序提供类似Visual Studio的窗口停靠、悬浮、自动隐藏以及布局管理功能。

同时，针对现代前端项目的开发流程进行了全面优化，支持响应式布局、主题定制、数据驱动和布局持久化。

**核心特性**

- 支持容器停靠（左/右/上/下/中央）、悬浮和自动隐藏

- 响应式布局适配，兼容桌面端多分辨率显示
- 基于CSS变量的主题定制系统
- 布局状态数据持久化
- 轻量级设计，无其他繁琐的依赖

**适用场景**

- 集成开发环境（IDE）界面
- 数据可视化仪表盘
- 复杂后台管理系统
- 多面板编辑工具



###### 安装方式

```javascript
npm i @techtao/t-dock-manager
```

###### 使用

```javascript
import { createApp } from 'vue'
const app = createApp(App)
import TDockManager from '@techtao/t-dock-manager'
import '@techtao/t-dock-manager/dist/index.css' 
app.use(TDockManager)
```

