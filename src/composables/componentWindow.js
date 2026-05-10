import {onMounted, onUnmounted} from 'vue'
import {WebviewWindow} from '@tauri-apps/api/webviewWindow'
import {getCurrentWindow} from '@tauri-apps/api/window'

export function useComponentWindow() {
  onMounted(async () => {
    const currentWindow = getCurrentWindow()
    console.log(currentWindow)
    const unlisten = await currentWindow.listen('close-requested', async (e) => {
      e.preventDefault()
    })
  })
}
