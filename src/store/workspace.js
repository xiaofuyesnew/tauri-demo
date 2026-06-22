import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const initialPanels = [
  {
    id: 'overview',
    type: 'OverviewPanel',
    title: 'Overview',
    placement: 'docked',
  },
  {
    id: 'signals',
    type: 'SignalsPanel',
    title: 'Signals',
    placement: 'docked',
  },
  {
    id: 'console',
    type: 'ConsolePanel',
    title: 'Console',
    placement: 'docked',
  },
]

function cloneInitialPanels() {
  return initialPanels.map((panel) => ({ ...panel }))
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const panels = ref(cloneInitialPanels())
  const sharedCounter = ref(0)
  const panelCounters = ref({
    overview: 0,
    signals: 0,
    console: 0,
  })
  const messages = ref([])

  const dockedPanels = computed(() => panels.value.filter((panel) => panel.placement === 'docked'))
  const detachedPanels = computed(() => panels.value.filter((panel) => panel.placement === 'detached'))

  function ensurePanels() {
    const knownIds = new Set(panels.value.map((panel) => panel.id))
    const missingPanels = initialPanels.filter((panel) => !knownIds.has(panel.id))

    if (missingPanels.length) {
      panels.value = [
        ...panels.value,
        ...missingPanels.map((panel) => ({ ...panel })),
      ]
    }
  }

  function getPanel(id) {
    return panels.value.find((panel) => panel.id === id)
  }

  function updatePanel(id, patch) {
    panels.value = panels.value.map((panel) => {
      if (panel.id !== id) return panel
      return { ...panel, ...patch }
    })
  }

  function addMessage(source, text) {
    messages.value = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        source,
        text,
        time: new Date().toLocaleTimeString(),
      },
      ...messages.value,
    ].slice(0, 8)
  }

  function detachPanel(id) {
    const panel = getPanel(id)
    if (!panel || panel.placement === 'detached') return

    updatePanel(id, { placement: 'detached' })
    addMessage(panel.title, 'Detached to a Tauri window')
  }

  function dockPanel(id) {
    const panel = getPanel(id)
    if (!panel || panel.placement === 'docked') return

    updatePanel(id, { placement: 'docked' })
    addMessage(panel.title, 'Returned to the main dock')
  }

  function incrementShared(source) {
    sharedCounter.value += 1
    addMessage(source, `Shared counter is ${sharedCounter.value}`)
  }

  function incrementPanel(id) {
    const panel = getPanel(id)
    const nextValue = (panelCounters.value[id] || 0) + 1

    panelCounters.value = {
      ...panelCounters.value,
      [id]: nextValue,
    }

    if (panel) {
      addMessage(panel.title, `Local counter is ${nextValue}`)
    }
  }

  function resetWorkspace() {
    panels.value = cloneInitialPanels()
    sharedCounter.value = 0
    panelCounters.value = {
      overview: 0,
      signals: 0,
      console: 0,
    }
    messages.value = []
  }

  return {
    panels,
    sharedCounter,
    panelCounters,
    messages,
    dockedPanels,
    detachedPanels,
    ensurePanels,
    getPanel,
    detachPanel,
    dockPanel,
    incrementShared,
    incrementPanel,
    resetWorkspace,
  }
})
