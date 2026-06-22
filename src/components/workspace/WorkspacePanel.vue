<script setup>
import { computed } from 'vue'
import { useWorkspaceStore } from '@/store/workspace'

const props = defineProps({
  panelId: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    default: 'docked',
  },
})

const workspaceStore = useWorkspaceStore()

const panel = computed(() => workspaceStore.getPanel(props.panelId))
const panelCounter = computed(() => workspaceStore.panelCounters[props.panelId] || 0)
const modeLabel = computed(() => (props.mode === 'detached' ? 'Detached window' : 'Main dock'))

function detach() {
  workspaceStore.detachPanel(props.panelId)
}

function dock() {
  workspaceStore.dockPanel(props.panelId)
}

function incrementShared() {
  workspaceStore.incrementShared(panel.value?.title || props.panelId)
}

function incrementPanel() {
  workspaceStore.incrementPanel(props.panelId)
}
</script>

<template>
  <section v-if="panel" class="workspace-panel">
    <header class="panel-header">
      <div>
        <h2>{{ panel.title }}</h2>
        <p>{{ modeLabel }}</p>
      </div>
      <button v-if="mode === 'docked'" type="button" @click="detach">
        Detach
      </button>
      <button v-else type="button" @click="dock">
        Return
      </button>
    </header>

    <div class="metric-grid">
      <div class="metric">
        <span>Shared counter</span>
        <strong>{{ workspaceStore.sharedCounter }}</strong>
        <button type="button" @click="incrementShared">
          Increment shared
        </button>
      </div>
      <div class="metric">
        <span>Panel counter</span>
        <strong>{{ panelCounter }}</strong>
        <button type="button" @click="incrementPanel">
          Increment panel
        </button>
      </div>
    </div>

    <div class="feed">
      <h3>Synced activity</h3>
      <p v-if="!workspaceStore.messages.length" class="empty">
        No activity yet.
      </p>
      <ul v-else>
        <li v-for="message in workspaceStore.messages" :key="message.id">
          <span>{{ message.time }}</span>
          <strong>{{ message.source }}</strong>
          <em>{{ message.text }}</em>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped lang="scss">
.workspace-panel {
  height: 100%;
  min-height: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f7f8fa;
  color: #1f2937;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }

  p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 12px;
  }
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.metric {
  min-width: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #d7dde6;
  border-radius: 6px;
  background: #ffffff;

  span {
    color: #64748b;
    font-size: 12px;
  }

  strong {
    font-size: 28px;
    line-height: 1;
  }
}

.feed {
  min-height: 0;
  flex: 1;
  padding: 12px;
  overflow: auto;
  border: 1px solid #d7dde6;
  border-radius: 6px;
  background: #ffffff;

  h3 {
    margin: 0 0 10px;
    font-size: 14px;
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 8px;
    list-style: none;
  }

  li {
    display: grid;
    grid-template-columns: 72px 90px minmax(0, 1fr);
    gap: 8px;
    align-items: center;
    font-size: 12px;
  }

  span {
    color: #64748b;
  }

  em {
    color: #334155;
    font-style: normal;
  }
}

.empty {
  color: #64748b;
  font-size: 12px;
}

button {
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid #aab4c3;
  border-radius: 4px;
  background: #ffffff;
  color: #1f2937;
  cursor: pointer;
}

button:hover {
  background: #eef2f7;
}
</style>
