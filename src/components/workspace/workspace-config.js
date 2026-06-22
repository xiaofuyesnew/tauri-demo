import { defineComponent, h, markRaw } from 'vue'
import WorkspacePanel from './WorkspacePanel.vue'
import WorkspaceNavigator from './WorkspaceNavigator.vue'

function createDockedPanel(id, name) {
  return markRaw(defineComponent({
    name,
    setup() {
      return () => h(WorkspacePanel, {
        panelId: id,
        mode: 'docked',
      })
    },
  }))
}

export const workspacePaneList = [
  {
    name: 'Workspace',
    img: '',
    comp: markRaw(WorkspaceNavigator),
  },
]

export const workspaceWindowList = [
  {
    name: 'OverviewPanel',
    img: '',
    comp: createDockedPanel('overview', 'DockedOverviewPanel'),
  },
  {
    name: 'SignalsPanel',
    img: '',
    comp: createDockedPanel('signals', 'DockedSignalsPanel'),
  },
  {
    name: 'ConsolePanel',
    img: '',
    comp: createDockedPanel('console', 'DockedConsolePanel'),
  },
]

export const mainDockLayout = {
  direction: 'column',
  size: '100%',
  children: [
    {
      direction: 'column',
      size: '270px',
      type: 'pane',
      data: {
        active: 'Workspace',
        group: ['Workspace'],
      },
    },
    {
      direction: 'column',
      type: 'window',
    },
  ],
  floatPane: [],
  autoHidePane: [],
}

export function createWindowLayout(panels) {
  return {
    direction: 'row',
    size: '100%',
    children: [
      {
        active: 0,
        direction: 'column',
        size: '100%',
        tab: panels.map((panel) => ({
          id: panel.id,
          type: panel.type,
          title: panel.title,
        })),
      },
    ],
  }
}
