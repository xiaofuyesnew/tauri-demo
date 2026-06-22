<!-- 停靠指示器 -->
<template>
    <template v-if="!onlyShowMask">
        <template v-if="targetId == 'root'">
            <img ref="topIndicator" draggable="false" :style="topStyle" data-target="root" data-direction="top" :src="topIndicatorImg" class="dock-indicator dock-indicator-top" alt="">
            <img ref="rightIndicator" draggable="false" :style="rightStyle" data-target="root" data-direction="right" :src="rightIndicatorImg" class="dock-indicator dock-indicator-right" alt="">
            <img ref="bottomIndicator" draggable="false" :style="bottomStyle" data-target="root" data-direction="bottom" :src="bottomIndicatorImg" class="dock-indicator dock-indicator-bottom" alt="">
            <img ref="leftIndicator" draggable="false" :style="leftStyle" data-target="root" data-direction="left" :src="leftIndicatorImg" class="dock-indicator dock-indicator-left" alt="">
        </template>

        <div v-else class="dock-indicator-complex" :style="centerStyle" :id="dragId">
            <img ref="topIndicator" draggable="false" data-direction="top" :src="topIndicatorImg" class="dock-indicator-top" alt="">
            <img ref="rightIndicator" draggable="false" data-direction="right" :src="rightIndicatorImg" class="dock-indicator-right" alt="">
            <img ref="bottomIndicator" draggable="false" data-direction="bottom" :src="bottomIndicatorImg" class="dock-indicator-bottom" alt="">
            <img ref="leftIndicator" draggable="false" data-direction="left" :src="leftIndicatorImg" class="dock-indicator-left" alt="">
            <img ref="centerIndicator" draggable="false" data-direction="center" :src="centerIndicatorImg" class="dock-indicator-center" alt="">
        </div>
    </template>


    <teleport to="body">
        <div v-if="!disableMask" class="drop-mask" :style="maskStyle"></div>

        <div v-if="onlyShowMask" class="full-mask drop-mask" :style="fullMaskStyle"></div>
    </teleport>
</template>

<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useLayout } from './layout.js';
import emitter from './eventBus';

const props = defineProps({
    dragId: {
        type: String,
        default: ''
    },
    targetId: {
        type: String,
        default: ''
    },
    onlyShowMask: {
        type: Boolean,
        default: false
    },
    isFloat: {
        type: Boolean,
        default: false
    }
})

const topIndicatorImg = inject('topIndicatorImg', '/src/assets/image/DockIndicator_Top.png');
const rightIndicatorImg = inject('rightIndicatorImg', '/src/assets/image/DockIndicator_Right.png');
const bottomIndicatorImg = inject('bottomIndicatorImg', '/src/assets/image/DockIndicator_Bottom.png');
const leftIndicatorImg = inject('leftIndicatorImg', '/src/assets/image/DockIndicator_Leftpng');
const centerIndicatorImg = inject('centerIndicatorImg', '/src/assets/image/DockIndicator_Center.png');

const emit = defineEmits(['update:onlyShowMask']);

const { insertPane, insertPaneToFloat, setIndicatorHover, defaultWidth, defaultHeight } = useLayout();

const topIndicator = ref(null);
const rightIndicator = ref(null);
const bottomIndicator = ref(null);
const leftIndicator = ref(null);
const centerIndicator = ref(null);

const disableMask = ref(true);
const targetDom = computed(() => {
    
    return `#${props.targetId}`;
})
let maskStyle = ref({});
let fullMaskStyle = ref({});


watch(() => props.onlyShowMask, (val) => {
    
    if (val) {
        const targetRect = document.getElementById(props.targetId).getBoundingClientRect();
        fullMaskStyle.value = {
            top: targetRect.top + 'px',
            left: targetRect.left + 'px',
            width: targetRect.width + 'px',
            height: targetRect.height + 'px',
        }
    }
}, { immediate: true })

// 处理pane的footer上的drop
const footerMouseupEvent = (e) => {
    e.stopPropagation();

    if (props.onlyShowMask) {
        if (props.dragId) {
            
            insertPane(props.dragId, props.targetId, 'center');
            emit('update:onlyShowMask', false);
            emitter.emit('layoutChange', {
                type: 'paneInsert'
            })
        }
    }
}

onMounted(() => {
    calcTargetRect();
    bindEvent();

    document.addEventListener('mouseup', footerMouseupEvent);

})

onBeforeUnmount(() => {
    unbindEvent();
    document.removeEventListener('mouseup', footerMouseupEvent);
})


const topStyle = ref({});
const rightStyle = ref({});
const bottomStyle = ref({});
const leftStyle = ref({});
const centerStyle = ref({});
const calcTargetRect = () => {
    const target = document.getElementById(props.targetId);
    
    if (!target) {
        return;
    }
    const rect = target.getBoundingClientRect();
    const rootComp = document.getElementById('root');
    const rootRect = rootComp.getBoundingClientRect();
    
    // indicator都是相对body的定位
    topStyle.value = {
        left: rect.left + rect.width / 2 - 15 + 'px',
        top: rect.top + 15 + 'px'
    }
    rightStyle.value = {
        left: rect.left + rect.width - 45 + 'px',
        top: rect.top + rect.height / 2 - 15 + 'px'
    }
    bottomStyle.value = {
        left: rect.left + rect.width / 2 - 15 + 'px',
        top: rect.top + rect.height - 45 + 'px'
    }
    leftStyle.value = {
        left: rect.left + 15 + 'px',
        top: rect.top + rect.height / 2 - 15 + 'px'
    }
    centerStyle.value = {
        left: rect.left + rect.width / 2 - 45 + 'px',
        top: rect.top + rect.height / 2 - 45 + 'px'
    }
    

}

const bindEvent = () => {
    if (topIndicator.value) {
        topIndicator.value.addEventListener('mouseenter', mouseenterEvent);
        topIndicator.value.addEventListener('mouseleave', mouseleaveEvent);
    }
    if (rightIndicator.value) {
        rightIndicator.value.addEventListener('mouseenter', mouseenterEvent);
        rightIndicator.value.addEventListener('mouseleave', mouseleaveEvent);
    }
    if (bottomIndicator.value) {
        bottomIndicator.value.addEventListener('mouseenter', mouseenterEvent);
        bottomIndicator.value.addEventListener('mouseleave', mouseleaveEvent);
    }
    if (leftIndicator.value) {
        leftIndicator.value.addEventListener('mouseenter', mouseenterEvent);
        leftIndicator.value.addEventListener('mouseleave', mouseleaveEvent);
    }
    if (centerIndicator.value) {
        centerIndicator.value.addEventListener('mouseenter', mouseenterEvent);
        centerIndicator.value.addEventListener('mouseleave', mouseleaveEvent);
    }
}

const unbindEvent = () => {
    if (topIndicator.value) {
       topIndicator.value.removeEventListener('mouseenter', mouseenterEvent);
       topIndicator.value.removeEventListener('mouseleave', mouseleaveEvent);
    }
    if (rightIndicator.value) {
       rightIndicator.value.removeEventListener('mouseenter', mouseenterEvent);
       rightIndicator.value.removeEventListener('mouseleave', mouseleaveEvent);
    }
    if (bottomIndicator.value) {
       bottomIndicator.value.removeEventListener('mouseenter', mouseenterEvent);
       bottomIndicator.value.removeEventListener('mouseleave', mouseleaveEvent);
    }
    if (leftIndicator.value) {
       leftIndicator.value.removeEventListener('mouseenter', mouseenterEvent);
       leftIndicator.value.removeEventListener('mouseleave', mouseleaveEvent);
    }
    if (centerIndicator.value) {
        centerIndicator.value.removeEventListener('mouseenter', mouseenterEvent);
        centerIndicator.value.removeEventListener('mouseleave', mouseleaveEvent);
    }
}


const dropDirection = ref('');
const mouseenterEvent = e => {
    const direction = e.target.dataset.direction;
    if (!direction) {
        return;
    }
    dropDirection.value = direction;

    !!e.target.dataset.target

    setIndicatorHover(true);

    // 更新布局
    document.addEventListener('mouseup', mouseupEvent);

    // 绘制drop遮罩阴影
    if (disableMask.value) {
        drawMask(dropDirection.value);
    }
}

const mouseleaveEvent = e => {
    disableMask.value = true;
    document.removeEventListener('mouseup', mouseupEvent);
    setIndicatorHover(false);
}

const mouseupEvent = e => {
    if (props.isFloat) {
        insertPaneToFloat(props.dragId, props.targetId, dropDirection.value);
    } else {
        insertPane(props.dragId, props.targetId, dropDirection.value);
    }


    document.removeEventListener('mouseup', mouseupEvent);
    disableMask.value = true;
    setIndicatorHover(false);
}

const drawMask = (direction) => {
    if (!disableMask.value) {
        return;
    }
    getMaskStyle(direction);
    
    disableMask.value = false;
}

/**
 * 根据targetId和direction计算遮罩的大小和位置，大小需要与实际drop后的尺寸相同
 * @param direction 方向
 */
const getMaskStyle = (direction) => {
    if (props.targetId == 'root') { // 顶层drop
        const rootRect = document.getElementById('root').getBoundingClientRect();
        const windowRect = document.getElementById('window').getBoundingClientRect();

        const ratio = defaultHeight.value.replace('%', '') / 100;
        switch (direction) {
            case 'top': // 顶部，遮罩高度为当前window高度一半15%
                maskStyle.value = {
                    top: rootRect.top + 'px',
                    left: rootRect.left + 'px',
                    width: rootRect.width + 'px',
                    height: windowRect.height * ratio + 'px',
                }
                break;
            case 'right': // 右侧，遮罩宽度为defaultWidth
                maskStyle.value = {
                    top: rootRect.top + 'px',
                    left: rootRect.left + rootRect.width - defaultWidth.value + 'px',
                    width: defaultWidth.value + 'px',
                    height: rootRect.height + 'px',
                }
                break;
            case 'bottom': // 底部，遮罩高度为当前window高度一半15%
                maskStyle.value = {
                    top: rootRect.bottom - windowRect.height * ratio + 'px',
                    left: rootRect.left + 'px',
                    width: rootRect.width + 'px',
                    height: windowRect.height * ratio + 'px',
                }
                break;
            case 'left': // 左侧，遮罩宽度为defaultWidth
                maskStyle.value = {
                    top: rootRect.top + 'px',
                    left: rootRect.left + 'px',
                    width: defaultWidth.value + 'px',
                    height: rootRect.height + 'px'
                }
                break;            
            default:
                break;
        }
    } else { // 非顶层drop
        const targetRect = document.getElementById(props.targetId).getBoundingClientRect();

        switch (direction) {
            case 'top': // 顶部，遮罩高度为target的一半
                maskStyle.value = {
                    top: targetRect.top + 'px',
                    left: targetRect.left + 'px',
                    width: targetRect.width + 'px',
                    height: targetRect.height / 2 + 'px',
                }
                break;
            case 'right': // 右侧，遮罩宽度为target的一半
                maskStyle.value = {
                    top: targetRect.top + 'px',
                    left: targetRect.left + targetRect.width / 2 + 'px',
                    width: targetRect.width / 2 + 'px',
                    height: targetRect.height + 'px',
                }
                break;
            case 'bottom': // 底部，遮罩高度为target的一半
                maskStyle.value = {
                    top: targetRect.top + targetRect.height / 2 + 'px',
                    left: targetRect.left + 'px',
                    width: targetRect.width + 'px',
                    height: targetRect.height / 2 + 'px',
                }
                break;
            case 'left': // 左侧，遮罩宽度为target的一半
                maskStyle.value = {
                    top: targetRect.top + 'px',
                    left: targetRect.left + 'px',
                    width: targetRect.width / 2 + 'px',
                    height: targetRect.height + 'px',
                }
                break;            
            case 'center': // 中心，遮罩完全遮挡target
                maskStyle.value = {
                    top: targetRect.top + 'px',
                    left: targetRect.left + 'px',
                    width: targetRect.width + 'px',
                    height: targetRect.height + 'px',
                }
                break;            
            default:
                break;
        }
    }

}
</script>

<style lang="scss">
.dock-indicator {
    z-index: 100;
    position: absolute;
    user-select: none;
    width: 30px;
    height: 30px;
    object-fit: contain;
}

.dock-indicator-complex {
    z-index: 100;
    position: absolute;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);

    & > * {
        width: 30px;
        height: 30px;
        object-fit: contain;
    }

    .dock-indicator-top {
        grid-area: 1 / 2;
        user-select: none;
    } /* 1行2列 */
    .dock-indicator-left {
        grid-area: 2 / 1;
        user-select: none;
    } /* 2行1列 */
    .dock-indicator-center {
        grid-area: 2 / 2;
        user-select: none;
    } /* 2行2列 */
    .dock-indicator-right {
        grid-area: 2 / 3;
        user-select: none;
    } /* 2行3列 */
    .dock-indicator-bottom {
        grid-area: 3 / 2;
        user-select: none;
    } /* 3行2列 */
}
.drop-mask {
    position: absolute;
    background-color: rgba(0, 190, 230, 0.1);
    z-index: 80;
}
</style>