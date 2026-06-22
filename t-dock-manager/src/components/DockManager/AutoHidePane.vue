<template>
    <div ref="paneContainer" class="pane-container" :class="{'hidden': curAutoHideActive != pane.id}" :style="containerStyle">

        <div class="pane-title" :class="{'active': curAutoHideActive == pane.id}" @contextmenu="contextmenuEvent">
            <div class="title-container" v-ellipsis-title>
                <img class="drag-mark" src="@/assets/image/drag_mark.png" alt="">
                <img class="image" v-if="getPaneImage(pane.comp)" :src="getPaneImage(pane.comp)" alt="">
                <span>{{ pane.comp }}</span>
            </div>

            <div class="btn-container" data-nodrag>
                <div class="btn" title="Menu" data-nodrag @click.stop="handleMenu">
                    <img src="@/assets/image/bottom.png" alt="" data-nodrag draggable="false">
                </div>
                <div class="btn" title="Auto Hide" data-nodrag @click.stop="handleUnpin">
                    <img src="@/assets/image/unpin.png" alt="" data-nodrag draggable="false">
                </div>
                <div class="btn" title="Close" data-nodrag @click.stop="handleClose">
                    <img src="@/assets/image/close.png" alt="" data-nodrag draggable="false">
                </div>
            </div>
        </div>

        <div class="pane-content" :data-id="pane.id + '_' + pane.comp">
            <!-- <keep-alive>
                <component :is="getPaneComp(pane.comp)"></component>
            </keep-alive> -->
        </div>
        
        <div ref="resizer" class="resizer" @mousedown="mousedownEvent" @click.stop>
            <div v-if="isDragging" ref="dragIndicator" class="drag-indicator" :style="{ width: '5px', height: '100%' }"></div>
        </div>

        <teleport to="body" v-if="showMenu">
            <div ref="menuRef" class="custom-pane-menu" :style="menuStyle">
                <div class="menu-item disabled" @click.stop>
                    <div class="check hidden"></div>
                    <span class="underline">C</span>lose
                </div>
                <div class="menu-item disabled">
                    <div class="check hidden"></div>
                    <span class="underline">F</span>loating
                </div>
                <div class="menu-item" @click.stop="handleUnpin">
                    <div class="check">✔</div>
                    <span class="underline">A</span>uto Hide
                </div>
            </div>
        </teleport>
    </div>
</template>

<script setup>
import { useLayout } from './layout.js';
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect, reactive } from 'vue';
import { getPaneComp, getPaneImage } from './useAssociatedComponents.js';
import emitter from './eventBus';

const { setCurAutoHideActive, updateAutoHideSize, setPaneUnpin, closeAutoHidePane, defaultWidth, curAutoHideActive } = useLayout();
const paneContainer = ref(null);
const rootRect = ref(null);
const autoHideBarRect = ref(null);
const barWidth = ref(20);
const resizer = ref(null);
const startX = ref(0);
const isDragging = ref(false);
const dragFlag = ref(false);
const dragDistance = ref(0);
const dragIndicator = ref(null);



const props = defineProps({
    pane: {
        type: Object,
        default: () => {}
    }
})
const containerStyle = ref({});

let showMenu = ref(false)
let menuStyle = reactive({
    left: 0,
    top: 0,
})

const handleMenu = (e) => {
    menuStyle.left = e.target.x + 'px';
    menuStyle.top = e.target.y + 18 + 'px';

    showMenu.value = true
}

const contextmenuEvent = (e) => {
    menuStyle.left = e.clientX + 'px';
    menuStyle.top = e.clientY + 'px';
    showMenu.value = true;
}

const menuRef = ref(null);

const handleClickOutside = (e) => {
    if (dragFlag.value) return;
    
    if (!menuRef.value || !menuRef.value.contains(e.target)) {
        showMenu.value = false;
    }

    const tabItem = document.querySelectorAll('[data-click-guard="true"]');
    const isInside = Array.from(tabItem).some(item => item.contains(e.target));

    if (!paneContainer.value.contains(e.target)
        && (!menuRef.value || !menuRef.value.contains(e.target))
        && curAutoHideActive.value == props.pane.id
        && !isInside) {
        setCurAutoHideActive('');
    }
}

onMounted(() => {
    const root = document.getElementById('root');
    rootRect.value = root.getBoundingClientRect();
    
    const bar = document.querySelector('.auto-hide-bar');
    autoHideBarRect.value = bar.getBoundingClientRect();
    barWidth.value = autoHideBarRect.value.width;

    containerStyle.value = {
        width: (props.pane.autoHideSize || defaultWidth.value) + 'px',
        top: rootRect.value.top + 'px',
    }

    document.addEventListener('click', handleClickOutside, { capture: true });
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside, { capture: true });
})

watch(() => curAutoHideActive.value, (newVal, oldVal) => {
    if (newVal == props.pane.id) {
        containerStyle.value.left = autoHideBarRect.value.width + 'px';
    } else {
        containerStyle.value.left = 0;
    }
})

watch(() => props.pane.autoHideSize, (newVal, oldVal) => {
    if (newVal) {
        containerStyle.value.width = newVal + 'px';
    }
})

const mousedownEvent = (e) => {
    isDragging.value = true;
    dragFlag.value = true;
    startX.value = e.clientX;

    // 添加禁止选中文本样式
    document.body.classList.add('no-select');

    document.addEventListener('mousemove', mousemoveEvent);
    document.addEventListener('mouseup', mouseupEvent);
}

const mousemoveEvent = (e) => {
    if (!isDragging.value) {
        return;
    }

    if (!dragIndicator.value) {
        return;
    }
    const paneWidth = props.pane.autoHideSize || defaultWidth.value;
    const safeDistance = 50;
    if (e.clientX - startX.value >= safeDistance - paneWidth) {
        dragIndicator.value.style.left = `${e.clientX - startX.value}px`;
        dragDistance.value = e.clientX - startX.value;
    }
}

const mouseupEvent = (e) => {
    e.stopPropagation();
    // 移除禁止选中文本样式
    document.body.classList.remove('no-select');
    isDragging.value = false;

    document.removeEventListener('mousemove', mousemoveEvent);
    document.removeEventListener('mouseup', mouseupEvent);

    if(dragDistance.value) {
        updateAutoHideSize(props.pane.id, (props.pane.autoHideSize || defaultWidth.value) + dragDistance.value);
        emitter.emit('layoutChange', {
            type: 'autonHidePaneResize',
            id: props.pane.id
        })
    }

    setTimeout(() => {
        dragFlag.value = false;
    })
}


// 取消autoHide
const handleUnpin = () => {
    showMenu.value = false;

    setPaneUnpin(props.pane.id, props.pane.comp);
    emitter.emit('layoutChange', {
        type: 'autonHidePaneUnpin',
        id: props.pane.id
    })
}

const handleClose = () => {
    showMenu.value = false;
    closeAutoHidePane(props.pane.id);
    emitter.emit('layoutChange', {
        type: 'autonHidePaneClose',
        id: props.pane.id
    })
}
</script>

<style lang="scss" scoped>
.pane-container {
    position: fixed;
    top: 0;
    bottom: 0;
    // left: 0;
    transition: transform 0.3s ease;
    z-index: 1000;
    // overflow: auto;
    display: flex;
    flex-direction: column;
    


    &.hidden {
        transform: translateX(-100%);
    }

    &:not(.hidden) {
        box-shadow: var(--auto-hide-pane-box-shadow);
    }

    .pane-title {
        background: var(--pane-header-bg-color);
        user-select: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 3px 0;
        font-size: 12px;

        &.active {
            background: var(--pane-header-active-bg-color);
        }

        .title-container {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-weight: bold;

            .drag-mark {
                width: 8px;
                height: 16px;
                vertical-align: middle;
            }

            .image {
                width: 15px;
                height: 15px;
                vertical-align: middle;
                margin-right: 4px;
            }

            & > span {
                vertical-align: middle;
            }
        }

        .btn-container {
            display: flex;

            .btn {
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid transparent;


                &:hover {
                    border: 1px solid var(--pane-header-btn-hover-borer-color);
                    background: var(--pane-header-btn-hover-bg-color);
                }
            }
        }
    }

    .pane-content {
        flex: 1;
        overflow: auto;
        border-radius: 0 0 8px 8px;
        background: var(--pane-content-bg-color);
        border: 1px solid var(--pane-content-border-color);
    }

    .resizer {
        position: absolute;
        top: 0;
        right: 0;
        width: 10px;
        height: 100%;
        cursor: ew-resize;
        transform: translateX(50%);

        .drag-indicator {
            background: repeating-conic-gradient(
                #000 0% 25%, 
                #fff 25% 50%, 
                #000 50% 75%, 
                #fff 75% 100%
            ) 0 0 / 2px 2px;
            position: relative;
        }
    }
}
</style>