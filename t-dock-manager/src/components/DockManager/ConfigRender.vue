<template>
  <!-- autoHide -->
  <template v-if="config.id == 'root'">
    <auto-hide-bar v-if="config.autoHidePane && config.autoHidePane.length" :autoHidePane="config.autoHidePane"></auto-hide-bar>
  </template>

  <div 
    :class="`config-container ${config.direction}`"
    :style="containerStyle"
    :id="config.id"
  >
    <!-- pane区域内容 -->
    <pane v-if="config.type == 'pane'" :pane="config"></pane>

    <!-- window区域占位内容 -->
    <template v-if="config.type == 'window'">
      <window-render v-if="windowLayout.data" :config="windowLayout.data"></window-render>
      <empty-window v-else>
        <template v-slot:emptyWindow>
          <slot name="emptyWindow"></slot>
        </template>
      </empty-window>
    </template>

    <template v-if="config.children && config.children.length">


      <template v-for="(child, index) in config.children" :key="child.id">
        <config-render 
            :config="child" 
        >
          <template v-slot:emptyWindow>
            <slot name="emptyWindow"></slot>
          </template>
        </config-render>

        <splitter v-if="config.children.length - 1 > index" :direction="child.direction" :prev="child.id" :next="config.children[index + 1].id"></splitter>
      </template>
    </template>
  </div>

  <!-- 浮动pane区域内容 -->
  <template v-if="config.floatPane && config.floatPane.length">
    <!-- <pane v-for="pane in config.floatPane" :key="pane.id" :id="pane.id" :pane="pane"></pane> -->
    <float-render v-for="config in config.floatPane" :key="config.id" :config="config"></float-render>
  </template>

  
  <template v-if="config.id == 'root' && curDragId">
    <!-- 顶部停靠指示器 -->
    <teleport to="body">
      <dock-indicator :dragId="curDragId" targetId="root"></dock-indicator>
    </teleport>
  </template>
</template>

<script setup>
import { computed, nextTick, onMounted, watch } from 'vue';
import EmptyWindow from './EmptyWindow.vue';
import WindowRender from './WindowRender.vue';
import Splitter from './Splitter.vue';
import Pane from './Pane.vue';
import FloatRender from './FloatRender.vue';
import AutoHideBar from './AutoHideBar.vue';
import DockIndicator from './DockIndicator.vue';
import { useLayout } from './layout.js';

defineOptions({
    name: 'ConfigRender'
})

const props = defineProps({
  config: {
    type: Object,
    required: true
  }
});

const { updateBaseData, curDragId, spliterGap, defaultWidth, windowLayout } = useLayout();

const gap = spliterGap.value + 'px';

const containerStyle = computed(() => {
  let { direction, size } = props.config;
  const map = {
    'column': 'row',
    'row': 'column'
  }
  direction = props.config.id == 'root' ? map[direction] : direction;

  if (props.config.id == 'window') {
    return {
      flex: 1
    }
  } else if (direction == 'column') {
    return { 
      // flex: size,
      height: '100%',
      width: size ? ((size + '').endsWith('%') ? size : `${size}px`) : `${defaultWidth.value}px`, 

      // display: 'flex',
      flexDirection: direction
    };
  } else if (direction == 'row') {
    return {
      flex: size || 1,
      width: '100%',
      // height: size ? ((size + '').endsWith('%') ? size : `${size}px`) : `${defaultWidth.value}px`, 
      // display: 'flex',
      flexDirection: direction,
    }
  } else {
    return {
      flex: 1,
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: direction
    };
  }
});

onMounted(() => {
  if (props.config.id == 'root') {
    const resizeObserver = new ResizeObserver(entries => {
      updateBaseData();
    })
    resizeObserver.observe(document.getElementById('root'));
  }
})

</script>

<style lang="scss" scoped>
.config-container {
    box-sizing: border-box;
    // border: 1px solid #ccc;
    min-height: 10px; /* 防止空容器不显示边框 */
    // gap: v-bind(gap);
    overflow: hidden;
    display: flex;
}

/* 可选：添加不同类型容器的区分样式 */
/* .column {
  background-color: rgba(255, 200, 200, 0.2);
}

.row {
  background-color: rgba(200, 200, 255, 0.2);
} */
</style>