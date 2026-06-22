<template>
    <div
        ref="windowContainer"
        class="window-container"
        :class="{'maximize': isMaximize }"
        @click.stop="handleToggleActive(null)"
        @mouseleave="handleMouseLeave"
    >
        <div ref="header" class="header">
            <div class="tab-container">
                <span
                    class="tab-item"
                    v-for="tab in window.tab"
                    :key="tab.id"
                    :class="{ 'active': tab.id == windowLayout.active, 'tab-active': window.active == window.tab.indexOf(tab) }"
                    v-ellipsis-title
                    @click.stop="handleToggleActive(tab)"
                    @contextmenu="e => handleContextMenu(e, tab)"
                    @mousedown.stop="e => handleMousedown(e, tab)"
                >
                    <img class="image" v-if="getWindowImage(tab.type)" :src="getWindowImage(tab.type)" alt="">
                    <span data-title>{{ tab.title + (isMaximize && tab.id == windowLayout.active ? ' [Maximized]' : '') }}</span>
                    <img class="close-image" title="" src="@/assets/image/close.png" alt="" data-nodrag draggable="false" @click.stop="handleClose(tab)">
                </span>
            </div>

            <div class="btn-container">
                <el-popover
                    ref="menuPopover"
                    placement="bottom-start"
                    trigger="click"
                    popper-class="custom-popover"
                    :hide-after="0"
                    :show-arrow="false"
                    :offset="0"
                >
                    <template #reference>
                        <div class="btn" title="Open Window" data-nodrag @click="e => e.stopPropagation()">
                            <img src="@/assets/image/bottom.png" alt="" data-nodrag draggable="false">
                        </div>
                    </template>

                    <div class="menu-item" v-for="tab in window.tab" :key="tab.id" @click.stop="handleToggleActiveInWindow(tab)">
                        <img class="image" v-if="getWindowImage(tab.type)" :src="getWindowImage(tab.type)" alt="" style="margin-right: 3px;">
                        <span>{{ tab.title + (isMaximize && tab.id == windowLayout.active ? ' [Maximized]' : '') }}</span>
                    </div>
                </el-popover>
            </div>
        </div>

        <div ref="mainContent" class="main-content" :data-id="window.tab[window.active].id">
            <!-- <keep-alive>
                <component :is="getWindowComp(window.tab[window.active].type)" ></component>
            </keep-alive> -->

            <div class="mask" :style="maskStyle">
                <div class="top"></div>
                <div class="right"></div>
                <div class="bottom"></div>
                <div class="left"></div>
            </div>
        </div>
    </div>

    <teleport to="body" v-if="showMenu">
        <div class="custom-window-menu" :style="menuStyle">
            <div class="menu-item" @click="handleMaximize">
                <div v-if="windowLayout.maximize" class="check">✔</div>
                <img v-else src="" alt="" width="16">
                Maximize
            </div>

            <div class="split-line" v-if="window.tab.length > 1 || getAdjacentWindow(props.window)"></div>

            <div class="menu-item" v-if="window.tab.length > 1" @click="handleNewHorizontalTab">
                <img src="@/assets/image/tile horizontal.png" alt="">
                New horizontal tab group
            </div>
            <div class="menu-item" v-if="window.tab.length > 1" @click="handleNewVerticalTab">
                <img src="@/assets/image/tile vertical.png" alt="">
                New vertical tab group
            </div>
            <div class="menu-item" v-if="getAdjacentWindow(props.window)" @click="handleMoveNext">
                <img src="" alt="" width="16">
                Move to next tab group
            </div>
            <div class="menu-item" v-if="getAdjacentWindow(props.window)" @click="handleMovePrevious">
                <img src="" alt="" width="16">
                Move to previous tab group
            </div>

            <div class="split-line"></div>

            <div class="menu-item" @click="handleHide">
                <img src="" alt="" width="16">
                Hide
            </div>
            <div class="menu-item" v-if="getAllWindowTab().length > 1" @click="handleHideAllOther">
                <img src="" alt="" width="16">
                Hide all but this
            </div>
            <div class="menu-item" v-if="getAllWindowTab().length > 1" @click="handleHideAll">
                <img src="" alt="" width="16">
                Hide all
            </div>
        </div>
    </teleport>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { getWindowComp, getWindowImage } from './useAssociatedComponents.js';
import { useLayout } from './layout.js';
import emitter from './eventBus.js';

const {
    windowLayout,
    closeWindow,
    getAdjacentWindow,
    tabMoveToNext,
    tabMoveToPrevious,
    getAllWindowTab,
    closeAllWindow,
    closeAllOtherWindow,
    newHorizontalTab,
    newVerticalTab,
    dropTab,
    windowList,

    dragWindowTab, clearMenu
} = useLayout();

const props = defineProps({
    window: {
        type: Object,
        default: () => {}
    }
})

watch(() => clearMenu.value, (newVal) => {
    if (newVal && showMenu.value) {
        showMenu.value = false;
    }
})

onMounted(() => {
    document.addEventListener('mousemove', mousemoveEvent);
    document.addEventListener('mouseup', mouseupEvent);
})

onBeforeUnmount(() => {
    document.removeEventListener('mousemove', mousemoveEvent);
    document.removeEventListener('mouseup', mouseupEvent);
})

const menuPopover = ref(null);

const showMenu = ref(false);
const menuStyle = reactive({
    left: 0,
    top: 0,
})
const curContextTab = ref(null);

const isMaximize = computed(() => {
    return windowLayout.value.maximize && props.window.tab.some(item => item.id == windowLayout.value.maximize)
})

const handleToggleActive = (tab) => {
    tab = tab || props.window.tab[props.window.active];
    if (windowLayout.value.active == tab.id && props.window.active == props.window.tab.indexOf(tab)) {
        return;
    }
    windowLayout.value.active = tab.id;
    props.window.active = props.window.tab.indexOf(tab);
}

const handleToggleActiveInWindow = (tab, e) => {
    menuPopover.value.hide();
    
    if (props.window.tab.length < 2) {
        return;
    }
    if (windowLayout.value.active == tab.id && props.window.active == props.window.tab.indexOf(tab)) {
        return;
    }
    windowLayout.value.active = tab.id;
    props.window.active = props.window.tab.indexOf(tab);
}

const handleClose = (tab) => {
    closeWindow(props.window.id, tab);
    emitter.emit('layoutChange', {
        type: 'windowClose',
        id: props.window.id
    })
}

const handleContextMenu = (e, tab) => {
    handleToggleActive(tab);
    curContextTab.value = tab;
    e.preventDefault();
    showMenu.value = true;
    menuStyle.left = e.clientX + 'px';
    menuStyle.top = e.clientY + 'px';

    document.addEventListener('click', clickEvent, { capture: true });
}

const clickEvent = (e) => {
    const windowMenu = document.querySelector('.custom-window-menu');
    if (!windowMenu) return;
    if (!windowMenu.contains(e.target)) {
        showMenu.value = false;
        curContextTab.value = null;
        document.removeEventListener('click', clickEvent, { capture: true });
    }
}

const handleMaximize = () => {
    showMenu.value = false;
    if (windowLayout.value.maximize) {
        windowLayout.value.maximize = '';
    } else {
        windowLayout.value.maximize = curContextTab.value.id;
    }
}

const handleMoveNext = () => {
    showMenu.value = false;
    tabMoveToNext(props.window, curContextTab.value);
    emitter.emit('layoutChange', {
        type: 'windowTabToNext',
        id: props.window.id
    })
}

const handleMovePrevious = () => {
    showMenu.value = false;
    tabMoveToPrevious(props.window, curContextTab.value);
    emitter.emit('layoutChange', {
        type: 'windowTabToPrevious',
        id: props.window.id
    })
}

const handleHide = () => {
    showMenu.value = false;
    closeWindow(props.window.id, curContextTab.value);
    emitter.emit('layoutChange', {
        type: 'windowClose',
        id: props.window.id
    })
}

const handleHideAll = () => {
    showMenu.value = false;
    closeAllWindow();
    emitter.emit('layoutChange', {
        type: 'windowAllClose'
    })
}

const handleHideAllOther = () => {
    showMenu.value = false;
    closeAllOtherWindow(curContextTab.value);
    emitter.emit('layoutChange', {
        type: 'windowAllCloseExcept',
        id: curContextTab.value.id
    })
}

const handleNewHorizontalTab = () => {
    showMenu.value = false;
    newHorizontalTab(props.window, curContextTab.value);
    emitter.emit('layoutChange', {
        type: 'newHorizontalTab'
    })
}

const handleNewVerticalTab = () => {
    showMenu.value = false;
    newVerticalTab(props.window, curContextTab.value);
    emitter.emit('layoutChange', {
        type: 'newVerticalTab'
    })
}

// 处理tab的拖拽事件

const windowContainer = ref(null);
const header = ref(null);
const mainContent = ref(null);
const direction = ref('');

const handleMousedown = (e, tab) => {
    e.stopPropagation();
    
    dragWindowTab.value = tab;
}

const handleMouseLeave = (e) => {
    drawMask();
}

const mousemoveEvent = (e) => {
    if (!dragWindowTab.value) return;
    
    dropDetectEvent(e);
    
    const windowDom = document.querySelector('#window');
    windowDom && windowDom.classList.add('dragging');
}

const mouseupEvent = (e) => {
    
    const windowDom = document.querySelector('#window');
    windowDom && windowDom.classList.remove('dragging');

    drawMask();
    
    if (direction.value && dragWindowTab.value) {
        dropTab(props.window, direction.value);
        direction.value = '';
        emitter.emit('layoutChange', {
            type: 'windowTabDrop'
        })
    } else {
        setTimeout(() => {
            dragWindowTab.value = null;
        })
    }
    

}

const dropDetectEvent = (e) => {
    const windowContainerRect = windowContainer.value.getBoundingClientRect();
    const headerRect = header.value.getBoundingClientRect();
    const mainRect = mainContent.value.getBoundingClientRect();
    // 判断鼠标进入windowContainer
    if (e.clientX < windowContainerRect.left || e.clientX > windowContainerRect.right || e.clientY < windowContainerRect.top || e.clientY > windowContainerRect.bottom) {
        direction.value = '';
        return;
    }

    // 拖拽源window如果只有一个tab，则不允许嗅探自身window
    if (props.window.tab.includes(dragWindowTab.value) && props.window.tab.length <= 1) {
        direction.value = '';
        return;
    }

    
    if (e.clientX >= headerRect.left && e.clientX <= headerRect.right && e.clientY >= headerRect.top && e.clientY <= headerRect.bottom) {
        // 判断鼠标进入header，将dragWindowTab插入到tab中
        // 不能插入到自身的center
        if (!props.window.tab.includes(dragWindowTab.value)) {
            direction.value = 'center';
            drawMask('center');
        } else {
            direction.value = '';
            drawMask();
        }

    } else if (e.clientX >= mainRect.left && e.clientX <= mainRect.right && e.clientY >= mainRect.top && e.clientY <= mainRect.bottom) {
        // 判断鼠标进入mainContent，将dragWindowTab插入到mainContent的四个方向
        const baseDetectDistance = 100; // 标准嗅探距离
        // 计算鼠标到各边的距离
        const distances = {
            top: e.clientY - mainRect.top,
            right: mainRect.width - (e.clientX - mainRect.left),
            bottom: mainRect.height - (e.clientY - mainRect.top),
            left: e.clientX - mainRect.left
        }
        // 找出最小距离的边
        const closestEdge = Object.keys(distances).reduce((a, b) => 
            distances[a] < distances[b] ? a : b
        );
        // 获取嗅探距离
        let detectDistance = baseDetectDistance;
        if (closestEdge == 'top' || closestEdge == 'bottom') {
            detectDistance = mainRect.height / 2 > baseDetectDistance ? baseDetectDistance : mainRect.height / 2;
        } else if (closestEdge == 'left' || closestEdge == 'right') {
            detectDistance = mainRect.width / 2 > baseDetectDistance ? baseDetectDistance : mainRect.width / 2;
        }
        // 判断是否在嗅探距离内
        if (distances[closestEdge] < detectDistance) {
            drawMask(closestEdge);
            direction.value = closestEdge;
        } else {
            drawMask();
            direction.value = '';
        }
    } else {
        drawMask();
        direction.value = '';
    }

    
}

const maskStyle = ref({})

const drawMask = (direction) => {
    switch (direction) {
        case 'top':
            maskStyle.value = {
                display: 'block',
                width: '100%',
                height: '50%',
                top: 0,
                left: 0
            };
            break;
        case 'bottom':
            maskStyle.value = {
                display: 'block',
                width: '100%',
                height: '50%',
                bottom: 0,
                left: 0
            };
            break;
        case 'left':
            maskStyle.value = {
                display: 'block',
                width: '50%',
                height: '100%',
                top: 0,
                left: 0
            };
            break;
        case 'right':
            maskStyle.value = {
                display: 'block',
                width: '50%',
                height: '100%',
                top: 0,
                right: 0
            };
            break;
        case 'center':
            maskStyle.value = {
                display: 'block',
                width: '100%',
                height: '100%',
                top: 0,
                left: 0
            };
            break;
        default:
            maskStyle.value = {};
            break;
    }
}
</script>

<style lang="scss" scoped>
.window-container {
    width: 100%;
    height: 100%;
    display: inline-flex;
    flex-direction: column;
    border: 1px solid var(--window-container-border-color);
    background: var(--window-container-bg-color);

    &.maximize {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        z-index: 30;
    }

    .header {
        width: 100%;
        height: 25px;
        background: var(--window-container-header-bg-color);
        display: flex;
        user-select: none;

        .tab-container {
            flex: 1;
            display: flex;
            flex-wrap: nowrap;
            align-items: flex-end;
            overflow: hidden;
            margin-left: 3px;

            .tab-item {
                cursor: pointer;
                background: var(--window-tab-bg-color);
                font-size: 12px;
                padding: 1px 2px;
                border: 1px solid var(--window-tab-border-color);
                min-width: 0;
                display: flex;

                &:hover {
                    background: var(--window-tab-active-bg-color);
                    border-bottom-color: transparent;
                }

                &.active {
                    background: var(--window-tab-active-bg-color);
                }

                &.tab-active {
                    border-bottom-color: transparent;
                }

                & > img {
                    vertical-align: middle;
                }

                & > span {
                    display: inline-block;
                    vertical-align: middle;
                    margin: 0 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .close-image {
                    border: 1px solid transparent;
                    &:hover {
                        border: 1px solid var(--window-header-btn-hover-borer-color);
                        background: var(--window-header-btn-hover-bg-color);
                    }
                }
            }
        }

        .btn-container {
            display: flex;
            align-items: center;
            margin-left: auto;

            .btn {
                border: 1px solid transparent;

                & > img {
                    vertical-align: middle;
                }

                &:hover {
                    border: 1px solid var(--window-header-btn-hover-borer-color);
                    background: var(--window-header-btn-hover-bg-color);
                }
            }
        }
    }

    .main-content {
        flex: 1;
        overflow: auto;
        position: relative;
        margin: 0 5px 5px 5px;
        border: 1px solid var(--window-container-border-color);
        background: #FFF;

        .mask {
            z-index: 1;
            position: absolute;
            display: none;

            .top {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 5px;
                background: repeating-conic-gradient(
                    #000 0% 25%, 
                    #fff 25% 50%, 
                    #000 50% 75%, 
                    #fff 75% 100%
                ) 0 0 / 2px 2px;
            }

            .right {
                position: absolute;
                right: 0;
                top: 0;
                width: 5px;
                height: 100%;
                background: repeating-conic-gradient(
                    #000 0% 25%, 
                    #fff 25% 50%, 
                    #000 50% 75%, 
                    #fff 75% 100%
                ) 0 0 / 2px 2px;
            }

            .bottom {
                position: absolute;
                left: 0;
                bottom: 0;
                width: 100%;
                height: 5px;
                background: repeating-conic-gradient(
                    #000 0% 25%, 
                    #fff 25% 50%, 
                    #000 50% 75%, 
                    #fff 75% 100%
                ) 0 0 / 2px 2px;
            }

            .left {
                position: absolute;
                left: 0;
                top: 0;
                width: 5px;
                height: 100%;
                background: repeating-conic-gradient(
                    #000 0% 25%, 
                    #fff 25% 50%, 
                    #000 50% 75%, 
                    #fff 75% 100%
                ) 0 0 / 2px 2px;
            }
        }
    }
}
</style>