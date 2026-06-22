import { createApp } from 'vue'
import App from './App.vue'
import './style/reset.scss'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
const app = createApp(App)
app.use(ElementPlus)

import '@/assets/style/index.css'

// 然后注册自定义指令
import * as directives from "./directives";
Object.keys(directives).forEach(key => {
  app.directive(key, directives[key]);
});

app.mount('#app')
