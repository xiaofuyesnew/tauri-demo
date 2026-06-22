import { createApp } from 'vue'
import App from './App.vue'
import DockManagerPlugin from '../t-dock-manager/dist/dock-manager-plugin.es.js'
import '../t-dock-manager/dist/index.css'
import { setupStore } from './store'
import { setupRouter } from './router'
import SimplePopover from './components/workspace/SimplePopover'

const app = createApp(App)

app.use(DockManagerPlugin)
app.component('ElPopover', SimplePopover)

setupStore(app)

setupRouter(app)

app.mount('#app')
