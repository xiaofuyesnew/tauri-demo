import { defineStore } from 'pinia'
import { ref } from 'vue'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'

export const useGlobalStore = defineStore('global', () => {
  const componentsList = ref([])
  const counter = ref(0)

  function increment() {
    counter.value++
  }

  async function openComponent(componentName) {
    const existingWindow = await WebviewWindow.getByLabel(componentName)
    if (existingWindow) {
      await existingWindow.setFocus()
      return
    }

    const newWindow = new WebviewWindow(componentName, {
      url: `${window.location.origin}/#/${componentName}`,
      width: 800,
      height: 600,
      title: componentName,
    })

    newWindow.once('tauri://created', () => {
      console.log('Profile window created successfully')
      componentsList.value.push(componentName)
    })
    newWindow.once('tauri://error', (e) => {
      console.error('Failed to create profile window:', e)
    })
  }

  return { componentsList, counter, increment, openComponent }
})
