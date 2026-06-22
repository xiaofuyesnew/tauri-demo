import { install } from './core/plugin';

// 插件默认导出
const plugin = { install };

// 导出组件(支持局部导入)
export { default as DockManager } from './components/DockManager/index.vue';

// 默认导出插件
export default plugin;