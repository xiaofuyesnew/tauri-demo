import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { isTauri } from '@tauri-apps/api/core'

function isTauriRuntime() {
  return isTauri()
}

function getDetachedUrl(id) {
  return `${window.location.origin}${window.location.pathname}#/detached/${id}`
}

export async function openDetachedWindow(panel) {
  const label = `detached-${panel.id}`
  const url = getDetachedUrl(panel.id)

  if (!isTauriRuntime()) {
    window.open(url, label, 'width=900,height=640')
    return
  }

  const existingWindow = await WebviewWindow.getByLabel(label)
  if (existingWindow) {
    await existingWindow.setFocus()
    return
  }

  const webview = new WebviewWindow(label, {
    url,
    width: 900,
    height: 640,
    title: `${panel.title} - detached`,
  })

  await new Promise((resolve, reject) => {
    webview.once('tauri://created', resolve)
    webview.once('tauri://error', reject)
  })
}

export async function closeCurrentWindow() {
  if (!isTauriRuntime()) {
    window.close()
    return
  }

  await getCurrentWindow().close()
}

export async function destroyCurrentWindow() {
  if (!isTauriRuntime()) {
    window.close()
    return
  }

  await getCurrentWindow().destroy()
}

export async function onCurrentWindowCloseRequested(callback) {
  if (!isTauriRuntime()) return undefined

  const currentWindow = getCurrentWindow()

  if (typeof currentWindow.onCloseRequested === 'function') {
    return currentWindow.onCloseRequested(callback)
  }

  return currentWindow.listen('close-requested', callback)
}
