<script setup>
import { useWorkspaceStore } from '@/store/workspace'

const workspaceStore = useWorkspaceStore()
</script>

<template>
  <aside class="workspace-navigator">
    <div class="summary">
      <h1>Dock Workspace</h1>
      <p>Shared state: {{ workspaceStore.sharedCounter }}</p>
    </div>

    <div class="panel-list">
      <div v-for="panel in workspaceStore.panels" :key="panel.id" class="panel-row">
        <div>
          <strong>{{ panel.title }}</strong>
          <span>{{ panel.placement }}</span>
        </div>
        <button
          v-if="panel.placement === 'docked'"
          type="button"
          @click="workspaceStore.detachPanel(panel.id)"
        >
          Detach
        </button>
        <button v-else type="button" @click="workspaceStore.dockPanel(panel.id)">
          Dock
        </button>
      </div>
    </div>

    <button class="reset" type="button" @click="workspaceStore.resetWorkspace">
      Reset Demo
    </button>
  </aside>
</template>

<style scoped lang="scss">
.workspace-navigator {
  height: 100%;
  min-width: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #eef2f6;
  color: #1f2937;
}

.summary {
  h1 {
    margin: 0;
    font-size: 16px;
  }

  p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 12px;
  }
}

.panel-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-row {
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid #d1d8e2;
  border-radius: 6px;
  background: #ffffff;

  div {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  strong {
    font-size: 13px;
  }

  span {
    color: #64748b;
    font-size: 11px;
    text-transform: uppercase;
  }
}

button {
  min-height: 28px;
  padding: 0 9px;
  border: 1px solid #aab4c3;
  border-radius: 4px;
  background: #ffffff;
  color: #1f2937;
  cursor: pointer;
  white-space: nowrap;
}

button:hover {
  background: #eef2f7;
}

.reset {
  margin-top: auto;
}
</style>
