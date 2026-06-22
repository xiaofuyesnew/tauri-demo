<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { DockManager } from '../../t-dock-manager/dist/dock-manager-plugin.es.js'
import { openDetachedWindow } from '@/composables/detachedWindows'
import { startTauriStore } from '@/composables/tauriStore'
import { useWorkspaceStore } from '@/store/workspace'
import {
  createWindowLayout,
  mainDockLayout,
  workspacePaneList,
  workspaceWindowList,
} from '@/components/workspace/workspace-config'

const dockManager = ref(null)
const isReady = ref(false)
const openedDetachedIds = new Set()
const workspaceStore = useWorkspaceStore()
const { panels } = storeToRefs(workspaceStore)

function toDockTab(panel) {
  return {
    id: panel.id,
    type: panel.type,
    title: panel.title,
  }
}

function getDockedTabIds() {
  if (!dockManager.value?.getAllWindowTab) return new Set()
  return new Set(dockManager.value.getAllWindowTab().map((tab) => tab.id))
}

async function syncDockManagerWithStore() {
  if (!isReady.value || !dockManager.value) return

  await nextTick()

  const dockedTabIds = getDockedTabIds()

  for (const panel of panels.value) {
    const isDockedInManager = dockedTabIds.has(panel.id)

    if (panel.placement === 'detached') {
      if (isDockedInManager) {
        dockManager.value.toggleWindowDisplay(toDockTab(panel), false)
      }

      if (!openedDetachedIds.has(panel.id)) {
        openedDetachedIds.add(panel.id)
        openDetachedWindow(panel).catch((error) => {
          openedDetachedIds.delete(panel.id)
          workspaceStore.dockPanel(panel.id)
          console.error('Failed to open detached window.', error)
        })
      }
    }

    if (panel.placement === 'docked') {
      openedDetachedIds.delete(panel.id)

      if (!isDockedInManager) {
        dockManager.value.toggleWindowDisplay(toDockTab(panel), true)
      }
    }
  }
}

function handleHiddenWindow(tabId) {
  workspaceStore.detachPanel(tabId)
}

onMounted(async () => {
  workspaceStore.ensurePanels()
  await startTauriStore(workspaceStore)
  await nextTick()

  dockManager.value.setCurrentLayout(mainDockLayout)
  dockManager.value.setCurrentWindowLayout(createWindowLayout(workspaceStore.dockedPanels))
  isReady.value = true

  await syncDockManagerWithStore()
})

watch(
  () => panels.value.map((panel) => `${panel.id}:${panel.placement}`).join('|'),
  () => {
    syncDockManagerWithStore()
  },
)
</script>

<template>
  <main class="home-view">
    <DockManager
      ref="dockManager"
      :pane-list="workspacePaneList"
      :window-list="workspaceWindowList"
      :default-layout="mainDockLayout"
      @hide-window="handleHiddenWindow"
    />
  </main>
</template>

<style scoped lang="scss">
.home-view {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  background: #dfe4eb;

  :deep(.dock-manager) {
    width: 100%;
    height: 100%;
  }
}
</style>
