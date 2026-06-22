<template>
    <div ref="splitter" class="splitter" :style="splitterStyle" :data-prev="prev" :data-next="next">
        <div v-if="isDragging" ref="dragIndicator" class="drag-indicator" :style="indicatorStyle"></div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, reactive } from 'vue';
import { useLayout } from './layout.js';
import emitter from './eventBus';

const { updatePaneSize, getById, setCurActive, updateWindowSize, spliterGap } = useLayout();

const props = defineProps({
    direction: {
        type: String,
        default: 'row'
    },
    prev: {
        type: String,
        default: ''
    },
    next: {
        type: String,
        default: ''
    },
    float: {
        type: Boolean,
        default: false
    },
    window: {
        type: Boolean,
        default: false
    }
})


const splitterStyle = computed(() => {
    let style = {};
    if (props.direction == 'column') { // 竖向拖拽条
        style = {
            width: spliterGap.value + 2 + 'px',
            height: '100%',
            cursor: 'e-resize',
        }
    } else if (props.direction == 'row') { // 横向拖拽条
        style = {
            width: '100%',
            height: spliterGap.value + 2 + 'px',
            cursor: 'n-resize',
        }
    }
    return style;
})

const indicatorStyle = computed(() => {
    let style = {};
    if (props.direction == 'column') { // 竖向拖拽条
        style = {
            width: spliterGap.value + 2 + 'px',
            height: '100%',
        }
    } else if (props.direction == 'row') { // 横向拖拽条
        style = {
            width: '100%',
            height: spliterGap.value + 2 + 'px',
        }
    }
    return style;
})

const splitter = ref(null);

const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);

const dragIndicator = ref(null);

const prevPane = ref(null);
const nextPane = ref(null);

// 拖动的安全size，即pane的最小尺寸
const rowSafeSize = ref(50);
const columnSafeSize = ref(30);

let rect = reactive({
    prev: null,
    next: null
})
let totalSize = ref({});
let dragDistance = ref(0);


const calcRect = () => {
    const prevDom = document.getElementById(props.prev);
    rect.prev = prevDom.getBoundingClientRect();
    const nextDom = document.getElementById(props.next);
    rect.next = nextDom.getBoundingClientRect();

    totalSize.value = {
        width: rect.prev.width + rect.next.width,
        height: rect.prev.height + rect.next.height
    };
}

onMounted(() => {
    splitter.value.addEventListener('mousedown', mousedownEvent);
})

const mousedownEvent = (e) => {
    startX.value = e.clientX;
    startY.value = e.clientY;
    document.addEventListener('mousemove', mousemoveEvent);
    document.addEventListener('mouseup', mouseupEvent);

    isDragging.value = true;

}

const mousemoveEvent = (e) => {
    if (!isDragging.value) {
        return;
    }
    if (!dragIndicator.value) {
        return;
    }
    calcRect();
    if (!rect.prev || !rect.next) {
        return;
    }

    setCurActive(props.next);

    
    /**
     * 判断基准方向
     * 竖向滚动条向左：基准dom为prev，要求拖动距离不能超过prev的宽度 - safeSize
     * 竖向滚动条向右，基准dom为next，要求拖动距离不能超过next的宽度 - safeSize
     * 横向滚动条向上：基准dom为prev，要求拖动距离不能超过prev的高度 - safeSize
     * 横向滚动条向下，基准dom为next，要求拖动距离不能超过next的高度 - safeSize
     */
    
    if (props.direction == 'column') { // 竖向滚动条
        let baseRect = null;
        if (e.clientX - startX.value <= 0) { // 向左拖动
            baseRect = rect.prev;
        } else if (e.clientX - startX.value > 0) { // 向右拖动
            baseRect = rect.next;
        }
        if (baseRect.width - Math.abs(e.clientX - startX.value) >= columnSafeSize.value) {
            dragIndicator.value.style.left = `${e.clientX - startX.value}px`;
            dragDistance.value = e.clientX - startX.value;
        }
    } else if (props.direction == 'row') { // 横向拖拽条
        let baseRect = null;
        if (e.clientY - startY.value <= 0) { // 向上拖动
            baseRect = rect.prev;
        } else if (e.clientY - startY.value > 0) { // 向下拖动
            baseRect = rect.next;
        }
        if (baseRect.height - Math.abs(e.clientY - startY.value) >= rowSafeSize.value) {
            dragIndicator.value.style.top = `${e.clientY - startY.value}px`;
            dragDistance.value = e.clientY - startY.value;
        }
    }
}

const mouseupEvent = (e) => {
    isDragging.value = false;
    document.removeEventListener('mousemove', mousemoveEvent);
    document.removeEventListener('mouseup', mouseupEvent);

    let prevSize = 0;
    let nextSize = 0;
    if (props.window) { // window的拖拽条
        updateWindowSize(props.prev, dragDistance.value, props.direction);
        updateWindowSize(props.next, -dragDistance.value, props.direction);
        emitter.emit('layoutChange', {
            type: 'windowResize',
            id: props.prev + ',' + props.next
        })
    } else { // pane的拖拽条
        // if (props.direction == 'column') { // 竖向滚动条，浮动面板中size为百分比，固定面板中size为px值
        //     if (props.float) {
        //         prevSize = (rect.prev.width + dragDistance.value) / totalSize.value.width * 100;
        //         nextSize = 100 - prevSize;
        //         updatePaneSize(props.prev, prevSize + '%');
        //         updatePaneSize(props.next, nextSize + '%');
        //     } else {
        //         prevSize = rect.prev.width + dragDistance.value;
        //         nextSize = totalSize.value.width - prevSize;
        //         updatePaneSize(props.prev, prevSize);
        //         updatePaneSize(props.next, nextSize);
        //     }
        // } else if (props.direction == 'row') { // 横向拖拽条，size为px值
        //     prevSize = rect.prev.height + dragDistance.value;
        //     nextSize = totalSize.value.height - prevSize;
        //     updatePaneSize(props.prev, prevSize);
        //     updatePaneSize(props.next, nextSize);
        // }

        if (props.direction == 'column') { // 竖向滚动条
            prevSize = (rect.prev.width + dragDistance.value) / rect.prev.width;
            nextSize = (rect.next.width - dragDistance.value) / rect.next.width;
        } else if (props.direction == 'row') { // 横向滚动条
            prevSize = (rect.prev.height + dragDistance.value) / rect.prev.height;
            nextSize = (rect.next.height - dragDistance.value) / rect.next.height;
        }
        updatePaneSize(props.prev, prevSize);
        updatePaneSize(props.next, nextSize);
        emitter.emit('layoutChange', {
            type: 'paneResize',
            id: props.prev + ',' + props.next
        })
    }

}

</script>

<style lang="scss" scoped>
.splitter {
    user-select: none;
    box-sizing: border-box;
    background-color: var(--splitter-bg-color);
    z-index: 20;

    .drag-indicator {
        // background-color: rgba(0, 0, 0, 0.3);
        position: relative;
        left: 0;
        top: 0;
        background: repeating-conic-gradient(
            #000 0% 25%, 
            #fff 25% 50%, 
            #000 50% 75%, 
            #fff 75% 100%
        ) 0 0 / 2px 2px;
        z-index: 1;
    }
}

</style>