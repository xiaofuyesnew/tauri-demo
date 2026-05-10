import { createPinia } from 'pinia'
import { createPlugin } from '@tauri-store/pinia'

const pinia = createPinia()

export function setupStore(app) {
  app.use(pinia)
  pinia.use(createPlugin())
}

export { useGlobalStore } from './global'
export default pinia