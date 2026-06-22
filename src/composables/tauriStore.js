const startedStores = new WeakSet()

export async function startTauriStore(store) {
  if (!store?.$tauri?.start || startedStores.has(store)) return

  try {
    await store.$tauri.start()
    startedStores.add(store)
  } catch (error) {
    console.warn('Tauri store sync is not available in this runtime.', error)
  }
}
