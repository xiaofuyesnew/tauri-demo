<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { destroyCurrentWindow, onCurrentWindowCloseRequested } from '@/composables/detachedWindows'
import { startTauriStore } from '@/composables/tauriStore'
import WorkspacePanel from '@/components/workspace/WorkspacePanel.vue'
import { useWorkspaceStore } from '@/store/workspace'

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const panelId = computed(() => String(route.params.id || ''))
const panel = computed(() => workspaceStore.getPanel(panelId.value))
const isClosing = ref(false)
let unlistenClose

async function returnToMainDock() {
  isClosing.value = true
  if (panel.value) {
    workspaceStore.dockPanel(panel.value.id)
  }
  await destroyCurrentWindow()
}

onMounted(async () => {
  workspaceStore.ensurePanels()
  await startTauriStore(workspaceStore)

  unlistenClose = await onCurrentWindowCloseRequested(async (event) => {
    event.preventDefault()

    if (!isClosing.value) {
      await returnToMainDock()
    }
  })
})

onBeforeUnmount(() => {
  if (typeof unlistenClose === 'function') {
    unlistenClose()
  }
})

watch(
  () => panel.value?.placement,
  async (placement) => {
    if (placement === 'docked' && !isClosing.value) {
      isClosing.value = true
      await destroyCurrentWindow()
    }
  },
)
</script>

<template>
  <main class="detached-view">
    <WorkspacePanel
      v-if="panel"
      :panel-id="panel.id"
      mode="detached"
    />
    <section v-else class="missing">
      <h1>Panel not found</h1>
      <button type="button" @click="returnToMainDock">
        Close
      </button>
    </section>
  </main>
</template>

<style scoped lang="scss">
.detached-view {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  background: #f7f8fa;
}

.missing {
  height: 100%;
  display: grid;
  place-content: center;
  gap: 12px;
  color: #1f2937;

  h1 {
    margin: 0;
    font-size: 18px;
  }
}
</style>
