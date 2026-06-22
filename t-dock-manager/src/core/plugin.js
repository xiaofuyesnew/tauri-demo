import DockManager from '../components/DockManager/index.vue';
import * as directives from "../directives";


/**
 * 插件安装函数
 * @param app Vue应用实例
 * @param options 插件配置选项
 */
export function install(app, options = {}) {
    // 注册全局组件
    app.component('DockManager', DockManager);

    Object.keys(directives).forEach(key => {
        app.directive(key, directives[key]);
    });
}

export default { install };