<template>
    <div
        class="float-render"
        :id="config.id"
        :class="{'float-render-root': paneArr.length == 1 && isFloatRoot, 'float-render-root-withheader': paneArr.length > 1 && isFloatRoot}"
        :style="containerStyle"
    >

        <div
            v-if="paneArr.length > 1 && isFloatRoot"
            ref="floatHeader"
            class="float-render-header"
            :class="{'active': isCurrent}"
            @click="handleClickHeader"
            @contextmenu="handleContextMenu"
        >
            <div class="btn" title="Close" data-nodrag @click.stop="handleClose">
                <img src="@/assets/image/close.png" alt="" data-nodrag draggable="false">
            </div>
        </div>


        <!-- <div v-if="config.type == 'pane'">{{ config.data.active }}</div> -->

        <pane v-if="config.type == 'pane'" :pane="config" :hasHeader="hasHeader"></pane>

        <template v-for="(child, index) in config.children" :key="child.id">
            <float-render :config="child" />

            <splitter
                v-if="config.children.length - 1 > index"
                float
                :direction="child.direction"
                :prev="child.id"
                :next="config.children[index + 1].id"
            >
            </splitter>
        </template>

        <resizer v-if="isFloatRoot" :dockId="config.id"></resizer>

        <teleport to="body" v-if="showMenu">
            <div ref="menuRef" class="custom-pane-menu" :style="menuStyle">
                <div class="menu-item" @click.stop="handleClose">
                    <div class="check hidden"></div>
                    <span class="underline">C</span>lose
                </div>
                <div class="menu-item" @click.stop="handleFloating">
                    <div class="check">✔</div>
                    <span class="underline">F</span>loating
                </div>
            </div>
        </teleport>
    </div>
</template>

<script setup>
import { useLayout } from './layout.js';
import { computed, watch, ref, onMounted, nextTick, onBeforeUnmount, reactive } from 'vue';
import Resizer from './Resizer.vue';
import Pane from './Pane.vue';
import Splitter from './Splitter.vue';
import emitter from './eventBus';

const {
    curDragId,
    spliterGap,
    defaultWidth,
    floatPaneIdPrefix,
    curActive,
    clearMenu,

    setCurActive,
    setFloatPanePosition,
    getFloatRoot,
    getFloatById,
    getAllPaneInFloat,
    closeFloatPane,
    unSetRootPaneFloat
} = useLayout();

defineOptions({
    name: 'FloatRender'
});

const props = defineProps({
    config: {
        type: Object,
        default: () => {}
    }
});

const gap = spliterGap.value + 'px';

const floatHeader = ref(null);

const isFloatRoot = computed(() => {
    return props.config.id.startsWith(floatPaneIdPrefix.value);
});

const isDraggingHeader = ref(false);
const startX = ref(0);
const startY = ref(0);

const paneArr = ref([]);
const hasHeader = computed(() => {
    return paneArr.value.length > 1;
})

watch(() => props.config, () => {
    const floatRootId = getFloatRoot(props.config.id);
    paneArr.value = getAllPaneInFloat(floatRootId);
}, { immediate: true, deep: true });

watch(() => floatHeader.value, () => {
    if (floatHeader.value) {
        // 有header时，header用于拖拽锚点，pane的拖拽只能用于生成新的浮动窗口
        // 无header时，pane的title作为拖拽锚点，拖拽事件在pane组件中处理
        floatHeader.value.addEventListener('mousedown', mousedownEvent);
    }
}, { immediate: true })

watch(() => clearMenu.value, (newVal) => {
    if (newVal && showMenu.value) {
        showMenu.value = false;
    }
})


const isCurrent = computed(() => {
    return curActive.value && paneArr.value.some(i => i.id == curActive.value);
});

const containerStyle = computed(() => {
  let { direction, size } = props.config;
  
  const map = {
    'column': 'row',
    'row': 'column'
  }
  direction = isFloatRoot.value ? map[direction] : direction;

  if (isFloatRoot.value) {
    return {
        position: 'absolute',
        flexDirection: direction,
        left: `${props.config.style.left}px`,
        top: `${props.config.style.top}px`,
        width: `${props.config.style.width}px`,
        height: `${props.config.style.height}px`,
        zIndex: `${props.config.style.zIndex}`,
    };
  } else if (direction == 'column') {
    return { 
      height: '100%',
      width: size ? ((size + '').endsWith('%') ? size : `${size}px`) : `100%`, 
      flexDirection: direction
    };
  } else if (direction == 'row') {
    return {
      width: '100%',
      flex: size || 1,
    //   height: size ? ((size + '').endsWith('%') ? size : `${size}px`) : `100%`, 
      flexDirection: direction
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

const handleClickHeader = () => {
    if (isCurrent.value) {
        return;
    }

    setCurActive(paneArr.value[0].id);
}

let showMenu = ref(false)
let menuStyle = reactive({
    left: 0,
    top: 0,
})
let menuRef = ref(null);

const handleContextMenu = (e) => {
    menuStyle.left = e.clientX + 'px';
    menuStyle.top = e.clientY + 'px';

    showMenu.value = true
}

const handleClickOutside = (e) => {
    if (!menuRef.value || !menuRef.value.contains(e.target)) {
        showMenu.value = false;
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
    if (floatHeader.value) {
        floatHeader.value.removeEventListener('mousedown', mousedownEvent);
    }
})

const mousedownEvent = (e) => {
    if ('nodrag' in e.target.dataset) {
        return true;
    }
    
    isDraggingHeader.value = true;
    startX.value = e.clientX;
    startY.value = e.clientY;

    document.addEventListener('mousemove', mousemoveEvent);
    document.addEventListener('mouseup', mouseupEvent);
    handleClickHeader();
}

const mousemoveEvent = (e) => {
    if (!isDraggingHeader.value) {
        return;
    }

    nextTick(() => {
        const left = props.config.style.left += e.clientX - startX.value;
        const top = props.config.style.top += e.clientY - startY.value;
        setFloatPanePosition(props.config.id, {
            left,
            top
        });
        startX.value = e.clientX;
        startY.value = e.clientY;
        emitter.emit('layoutChange', {
            type: 'floatPaneMove',
            id: props.config.id
        })
    })
}

const mouseupEvent = (e) => {
    isDraggingHeader.value = false;
    document.removeEventListener('mousemove', mousemoveEvent);
    document.removeEventListener('mouseup', mouseupEvent);  
    setTimeout(() => {
        curDragId.value = '';
    })
}

const handleClose = () => {
    showMenu.value = false;
    closeFloatPane(props.config.id);
    emitter.emit('layoutChange', {
        type: 'floatPaneClose',
        id: props.config.id
    })
}

const handleFloating = () => {
    showMenu.value = false;
    unSetRootPaneFloat(props.config.id);
    emitter.emit('layoutChange', {
        type: 'floatPaneFixed',
        id: props.config.id
    })
}
</script>

<style lang="scss" scoped>
.float-render {
    user-select: none;
    background-color: #fff;
    box-sizing: border-box;
    min-height: 10px; /* 防止空容器不显示边框 */
    gap: v-bind(gap);
    overflow: hidden;
    display: flex;

    &.float-render-root {
        overflow: unset;
        border: 1px solid var(--color-7);
    }

    &.float-render-root-withheader{
        padding-top: 25px;
        border: 1px solid var(--color-7);
    }

    .float-render-header {
        position: absolute;
        height: 25px;
        width: 100%;
        transform: translateY(-25px);
        background-color: #E6E6E6;
        display: flex;
        align-items: center;
        justify-content: flex-end;

        &:hover {
            background: var(--pane-header-active-bg-color);
        }

        &.active {
            background: var(--pane-header-active-bg-color);
        }

        .btn {
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid transparent;
            margin-right: 5px;


            &:hover {
                border: 1px solid #000080;
                background: var(--pane-header-active-bg-color);
            }
        }
    }
}
</style>