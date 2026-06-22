<template>
    <div ref="resizerBox" class="resizer-box">
        <div class="resizer resizer-n"></div>
        <div class="resizer resizer-e"></div>
        <div class="resizer resizer-s"></div>
        <div class="resizer resizer-w"></div>
        <div class="resizer resizer-ne"></div>
        <div class="resizer resizer-se"></div>
        <div class="resizer resizer-sw"></div>
        <div class="resizer resizer-nw"></div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useLayout } from './layout.js';
import emitter from './eventBus';

const props = defineProps({
    dockId: {
        type: String,
        default: ''
    }
})

onMounted(() => {
    bindResizeEvent();
})

let { defaultlayout, getById, floatDockResize, setCurActiveByRootId } = useLayout();

const isResizing = ref(false);
const startX = ref(0);
const startY = ref(0);
const currentResizer = ref(null);
const resizerBox = ref(null);

const bindResizeEvent = () => {

    if (resizerBox.value) {
        const resizers = resizerBox.value.querySelectorAll('.resizer');
        resizers.forEach(resizer => {
            resizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                currentResizer.value = e.target;
                isResizing.value = true;
                startX.value = e.clientX;
                startY.value = e.clientY;

                document.addEventListener('mousemove', mousemoveEvent);
                document.addEventListener('mouseup', mouseupEvent);
            })
        })
    }
}

const mousemoveEvent = e => {
    if (!isResizing.value) {
        return;
    }
    setCurActiveByRootId(props.dockId);

    let moveX = e.clientX - startX.value;
    let moveY = e.clientY - startY.value;

    let direction = ''
    // 处理拖拽宽度变化
    if (currentResizer.value.classList.contains('resizer-n')) { // 顶部
        direction = 'n';
    }  else if (currentResizer.value.classList.contains('resizer-e')) { // 右侧
        direction = 'e';
    } else if (currentResizer.value.classList.contains('resizer-s')) { // 底部
        direction = 's';
    } else if (currentResizer.value.classList.contains('resizer-w')) { // 左侧
        direction = 'w';
    } else if (currentResizer.value.classList.contains('resizer-ne')) { // 右上角
        direction = 'ne';
    } else if (currentResizer.value.classList.contains('resizer-se')) { // 右下角
        direction = 'se';
    } else if (currentResizer.value.classList.contains('resizer-sw')) { // 左下角
        direction = 'sw';
    } else if (currentResizer.value.classList.contains('resizer-nw')) { // 左上角
        direction = 'nw';
    }

    floatDockResize(props.dockId, direction, {x: moveX, y: moveY});
    emitter.emit('layoutChange', {
        type: 'floatPaneResize',
        id: props.dockId
    })

    startX.value = e.clientX;
    startY.value = e.clientY;
}

const mouseupEvent = e => {
    isResizing.value = false;
    document.removeEventListener('mousemove', mousemoveEvent);
    document.removeEventListener('mouseup', mouseupEvent);
}
</script>

<style lang="scss" scoped>
.resizer-box {
    z-index: 100;
    .resizer {
        box-sizing: border-box;
        position: absolute;
    }

    .resizer-n {
        width: 100%;
        height: 5px;
        top: -2px;
        left: 0;
        cursor: n-resize;
    }

    .resizer-e {
        width: 5px;
        height: 100%;
        top: 0;
        right: -2px;
        cursor: e-resize;
    }

    .resizer-s {
        width: 100%;
        height: 5px;
        bottom: -2px;
        left: 0;
        cursor: s-resize;
    }

    .resizer-w {
        width: 5px;
        height: 100%;
        top: 0;
        left: -2px;
        cursor: w-resize;
    }

    .resizer-ne {
        width: 9px;
        height: 9px;
        top: -4px;
        right: -4px;
        cursor: ne-resize;
    }

    .resizer-se {
        width: 9px;
        height: 9px;
        bottom: -4px;
        right: -4px;
        cursor: se-resize;
    }

    .resizer-sw {
        width: 9px;
        height: 9px;
        bottom: -4px;
        left: -4px;
        cursor: sw-resize;
    }

    .resizer-nw {
        width: 9px;
        height: 9px;
        top: -4px;
        left: -4px;
        cursor: nw-resize;
    }
}
</style>