<template>
    <div
        ref="paneContainer"
        class="pane-container"
        :style="getStyle"
        @click="setCurActive(pane.id)"
    >
        <div ref="paneTitle" class="pane-title" :class="{'active': curActive == pane.id}" @mousedown="mousedownEvent" @contextmenu="contextmenuEvent">
            <div class="title-container" v-ellipsis-title>
                <img class="drag-mark" src="@/assets/image/drag_mark.png" alt="">
                <img class="image" v-if="getPaneImage(pane.data.active)" :src="getPaneImage(pane.data.active)" alt="">
                <span>{{ pane.data.active }}</span>
            </div>

            <div class="btn-container" data-nodrag>
                <div v-if="!pane.float" class="btn" title="Menu" data-nodrag @click.stop="handleMenu">
                    <img src="@/assets/image/bottom.png" alt="" data-nodrag draggable="false">
                </div>
                <div v-if="!pane.float" class="btn" title="Auto Hide" data-nodrag @click.stop="handlePin">
                    <img src="@/assets/image/pin.png" alt="" data-nodrag draggable="false">
                </div>
                <div class="btn" title="Close" data-nodrag @click.stop="handleClose">
                    <img src="@/assets/image/close.png" alt="" data-nodrag draggable="false">
                </div>
            </div>
        </div>

        <div ref="paneContent" class="pane-content" :data-id="pane.id + '_' + pane.data.active">
            <!-- <keep-alive>
                <component :is="getPaneComp(pane.data.active || pane.dada.group[0])" ></component>
            </keep-alive> -->
        </div>

        <div ref="paneFooter" v-if="pane.data.group && pane.data.group.length > 1" class="pane-footer">
            <span
                v-for="tab in pane.data.group"
                v-ellipsis-title
                :key="tab"
                :class="['tab-item', { 'active': tab == pane.data.active }, { 'highlight': sortEndTab == tab }]"
                :data-tab="tab"
                @click="handleToggleActive(tab)"
            >
                <img v-if="getPaneImage(tab)" class="image" :src="getPaneImage(tab)" alt="" style="pointer-events: none;">
                <span style="pointer-events: none;">{{ tab }}</span>
            </span>
        </div>


        <teleport to="body">
            <dock-indicator ref="dockIndicator" v-if="showIndicator" :dragId="curDragId" :targetId="pane.id" :isFloat="pane.float" v-model:onlyShowMask="onlyShowMask"></dock-indicator>
        </teleport>

        <teleport to="body" v-if="showMenu">
            <div ref="menuRef" class="custom-pane-menu" :style="menuStyle">
                <div class="menu-item" @click.stop="handleClose">
                    <div class="check hidden"></div>
                    <span class="underline">C</span>lose
                </div>
                <div class="menu-item" @click.stop="handleFloating">
                    <div v-if="pane.float" class="check">✔</div>
                    <div v-else class="check hidden"></div>
                    <span class="underline">F</span>loating
                </div>
                <div v-if="!pane.float" class="menu-item" @click.stop="handlePin">
                    <div class="check hidden"></div>
                    <span class="underline">A</span>uto Hide
                </div>
            </div>
        </teleport>
    </div>
</template>

<script setup>
import Resizer from './Resizer.vue'
import DockIndicator from './DockIndicator.vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, reactive } from 'vue';
import { useLayout } from './layout.js';
import { getPaneComp, getPaneImage } from './useAssociatedComponents.js';
import emitter from './eventBus';

const {
    setPaneFloat,
    unSetPaneFloat,
    setFloatTabFloat,
    setFloatPaneToNewFloat,
    setFloatPanePosition,
    toggleActive,
    setCurActive,
    setTabFloat,
    setPanePin,
    isChildPane,
    getFloatRoot,
    tabSort,
    closePane,
    closeTabInPane,
    closeFloatPane,
    indicatorInFloat,

    curDragId, curActive, curLayoutData, indicatorHover, floatPaneIdPrefix, clearMenu
} = useLayout();

const props = defineProps({
    pane: {
        type: Object,
        default: () => {}
    },
    hasHeader: {
        type: Boolean,
        default: false
    }
})

const getStyle = computed(() => {
    if (props.pane.float) {
        if (props.pane.style) {
            return {
                left: `${props.pane.style.left}px`,
                top: `${props.pane.style.top}px`,
                width: `${props.pane.style.width}px`,
                height: `${props.pane.style.height}px`,
                zIndex: `${props.pane.style.zIndex}`,
            }
        }
    }
    return {};
})

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
    setCurActive(props.pane.id);
    
    clearMenu.value = true;
    nextTick(() => {
        menuStyle.left = e.clientX + 'px';
        menuStyle.top = e.clientY + 'px';
        showMenu.value = true;
        clearMenu.value = false;
    })
}

const menuRef = ref(null);

const handleClickOutside = (e) => {
    if (!menuRef.value || !menuRef.value.contains(e.target)) {
        showMenu.value = false;
    }
}

watch(() => clearMenu.value, () => {
    if (clearMenu.value && showMenu.value) {
        showMenu.value = false;
    }
}, { immediate: true })

onMounted(() => {
    document.addEventListener('mousemove', dropDetectEvent);
    document.addEventListener('click', handleClickOutside);

    setBorderRadius()
})

onBeforeUnmount(() => {
    document.removeEventListener('mousemove', dropDetectEvent);
    document.removeEventListener('click', handleClickOutside);
    onlyShowMask.value = false;
    showIndicator.value = false;
})

watch(() => props.pane.data.group.length, () => {
    nextTick(() => {
        bindTabDrag();
    })
}, { immediate: true })

const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);

const paneContainer = ref(null);
const paneTitle = ref(null);

const mousedownEvent = e => {
    showMenu.value = false;
    if ('nodrag' in e.target.dataset) {
        return true;
    }
    if (e.button !== 0) return;
    isDragging.value = true;
    startX.value = e.clientX;
    startY.value = e.clientY;
    // console.log(props.pane.id, '更换事件绑定');
    
    document.removeEventListener('mousemove', dropDetectEvent);
    document.addEventListener('mousemove', mousemoveEvent);
    document.addEventListener('mouseup', mouseupEvent);
    setCurActive(props.pane.id);
    curDragId.value = '';
}

const mousemoveEvent = e => {
    if (!isDragging.value) {
        return;
    }
    if(e.clientX - startX.value == 0) {
        return;
    }

    if (!curDragId.value) {
        curDragId.value = props.pane.id;
    }

    let floatRootId = '';
    if (props.hasHeader) { // 拖拽当前pane为新的浮动pane
        if (!props.pane.id.startsWith(floatPaneIdPrefix.value) && props.pane.float) {
            setFloatPaneToNewFloat(props.pane.id, e.clientX, e.clientY);
            emitter.emit('layoutChange', {
                type: 'floatPaneToNewFloat',
                id: props.pane.id
            })
        }
    } else {
        if (!props.pane.float) {
            setPaneFloat(props.pane.id, e.clientX, null, true, true);
            emitter.emit('layoutChange', {
                type: 'paneToFloat',
                id: props.pane.id
            })
        }  
    }

    floatRootId = curDragId.value;
    if (!floatRootId) {
        return;
    }

    const floatRender = curLayoutData.value.floatPane.find(item => item.id == floatRootId);

    if (!floatRender) return;
    

    let left = floatRender.style.left += e.clientX - startX.value;
    let top = floatRender.style.top += e.clientY - startY.value;

    // 限定浮动面板的拖动边界
    // 限定top >= 0，表示向上不能拖拽出整个t-dock的上边界
    // 其他方向暂时不做限制
    top = top < 0 ? 0 : top

    setFloatPanePosition(floatRender.id, {
        left,
        top
    });
    startX.value = e.clientX;
    startY.value = e.clientY;
    emitter.emit('layoutChange', {
        type: 'floatPaneMove',
        id: props.pane.id
    })

}

const mouseupEvent = e => {
    isDragging.value = false;
    showIndicator.value = false;
    setTimeout(() => {
        curDragId.value = '';
    })

    document.removeEventListener('mousemove', mousemoveEvent);
    document.removeEventListener('mouseup', mouseupEvent);
    document.addEventListener('mousemove', dropDetectEvent);
}

const showIndicator = ref(false);
let onlyShowMask = ref(false);
const dockIndicator = ref(null);

const dropDetectEvent = e => {
    // console.log(curDragId.value);

    if (!paneContainer.value) {
        return;
    }

    /**
     * 显示indicator的条件:
     * curDragId有值
     * curDragId和当前pane的id不同
     * 如果是float，curDragId不和当前pane所在根id相同
     */
    let isChild = false;
    if (props.pane.float) {
        isChild = isChildPane(props.pane.id);
    }

    // console.log(isChild);
    // console.log(curDragId.value, props.pane.id);
    const id = props.pane.isFloat ? getFloatRoot(props.pane.id) : props.pane.id;
    // console.log(curDragId.value, id, isChild + '');
    if (indicatorHover.value) { // 避免indicator的mask和footer的mask相互干扰
        onlyShowMask.value = false;        
        return;
    }


    if (curDragId.value && curDragId.value != id && !isChild) {
        // console.log('aaa', '满足嗅探条件');
        
        // 判断鼠标是否进入当前pane
        const rect = paneContainer.value.getBoundingClientRect();
        const footer = paneContainer.value.querySelector('.pane-footer');
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
            // console.log('aaa', '进入pane');
            
            if (props.pane.float) {
                indicatorInFloat.add(props.pane.id);
            }

            /**
             * 处理固定pane和浮动pane有部分重叠的情况：
             * 固定pane和浮动pane有部分重叠时，鼠标拖动进入重叠区域时，不显示固定pane上的indicator
             */
            if (!props.pane.float && indicatorInFloat.size > 0) {
                onlyShowMask.value = false;
                showIndicator.value = false;
                indicatorInFloat.clear();
                return;
            }

            if (footer) {
                const footerRect = footer.getBoundingClientRect();
                // 判断是否进入底部footer
                if (e.clientX >= footerRect.left && e.clientX <= footerRect.right && e.clientY >= footerRect.top && e.clientY <= footerRect.bottom) {
                    // console.log('进入footer');
                    onlyShowMask.value = true;
                    showIndicator.value = true;
        
                } else {
                    onlyShowMask.value = false;
                    showIndicator.value = true;
                }
            } else {
                onlyShowMask.value = false;
                showIndicator.value = true;
            }
        } else {
            onlyShowMask.value = false;
            showIndicator.value = false;
            if (props.pane.float) {
                // indicatorInFloat.delete(props.pane.id);
                indicatorInFloat.clear();
            }
        }
    } else {
        onlyShowMask.value = false;
        showIndicator.value = false;
        if (props.pane.float) {
            // indicatorInFloat.delete(props.pane.id);
            indicatorInFloat.clear();
        }
    }
}

const handleToggleActive = (tab) => {
    // console.log(tab);
    // console.log(props.pane.data.active);
    if (tab == props.pane.data.active) {
        return;
    }
    toggleActive(props.pane.id, tab);
}


const tabDragging = ref(false);
const tabStartX = ref(0);
const tabStartY = ref(0);
const dragTab = ref('');
// 底部tab拖拽事件
const bindTabDrag = () => {
    const tabs = paneContainer.value.querySelectorAll('.tab-item');
    tabs.forEach(tab => {
        tab.addEventListener('mousedown', tabMousedownEvent);
    })
}

// 底部tab拖拽排序
const sortStartTab = ref('');
const sortEndTab = ref('');

const tabMousedownEvent = (e) => {
    showMenu.value = false;
    if (e.button !== 0) return;
    
    dragTab.value = e.target.dataset.tab;   
    if (!dragTab.value) {
        return;
    }

    sortStartTab.value = dragTab.value;

    tabDragging.value = true;
    tabStartX.value = e.clientX;
    tabStartY.value = e.clientY;
    document.addEventListener('mousemove', tabMousemoveEvent);
    document.addEventListener('mouseup', tabMouseupEvent);
}



const tabMousemoveEvent = (e) => {
    if (!tabDragging.value) {
        return;
    }
    if (Math.abs(tabStartX.value - e.clientX) <= 10 && Math.abs(tabStartY.value - e.clientY) <= 10) {
        // 降低灵活性，防止误触，同时影响点击事件
        return;
    }
    const footer = paneContainer.value.querySelector('.pane-footer');

    if (footer) {
        const footerRect = footer.getBoundingClientRect();
        if (e.clientX >= footerRect.left && e.clientX <= footerRect.right && e.clientY >= footerRect.top && e.clientY <= footerRect.bottom) {
            // 还在当前pane的底部，进行排序操作
            // console.log('排序');
            onlyShowMask.value = true;
            showIndicator.value = true;

            // 判断鼠标在哪个tab上
            const tabs = paneContainer.value.querySelectorAll('.tab-item');
            tabs.forEach(tab => {
                const tabRect = tab.getBoundingClientRect();
                if (e.clientX >= tabRect.left && e.clientX <= tabRect.right && e.clientY >= tabRect.top && e.clientY <= tabRect.bottom) {
                    // console.log('鼠标在', tab.dataset.tab);
                    // 设置高亮的tab
                    sortEndTab.value = tab.dataset.tab;
                }
            })
            // emitter.emit('paneDrag', props.pane.id);
        } else {
            // console.log('移出了footer');
            sortEndTab.value = '';
            if (props.pane.float) {
                setFloatTabFloat(props.pane.id, dragTab.value, e.clientX, e.clientY);
                emitter.emit('layoutChange', {
                    type: 'floatTabToFloat',
                    id: props.pane.id
                })
            } else {
                setTabFloat(props.pane.id, dragTab.value, e.clientX, e.clientY);
                emitter.emit('layoutChange', {
                    type: 'tabToFloat',
                    id: props.pane.id
                })
            }
        }
    } else {
        sortEndTab.value = '';
        if (props.pane.float) {
            setFloatTabFloat(props.pane.id, dragTab.value, e.clientX, e.clientY);
            emitter.emit('layoutChange', {
                type: 'floatTabToFloat',
                id: props.pane.id
            })
        } else {
            setTabFloat(props.pane.id, dragTab.value, e.clientX, e.clientY);
            emitter.emit('layoutChange', {
                type: 'tabToFloat',
                id: props.pane.id
            })
        }
    }
    
    // setTabFloat(props.pane.id, dragTab.value, e.clientX, e.clientY);
    // nextTick(() => {
    //     dropDetectEvent(e);
    // })
}

const tabMouseupEvent = (e) => {
    if (sortEndTab.value) {       
        tabSort(props.pane.id, sortStartTab.value, sortEndTab.value);
        emitter.emit('layoutChange', {
            type: 'tabSort',
            id: props.pane.id
        })

        sortStartTab.value = '';
        sortEndTab.value = '';
    }

    tabDragging.value = false;
    document.removeEventListener('mousemove', tabMousemoveEvent);
    document.removeEventListener('mouseup', tabMouseupEvent);
    setTimeout(() => {
        curDragId.value = '';
        onlyShowMask.value = false;
        showIndicator.value = false;
    })
}

// 设置为autoHide，包括当前面板组中的所有tab
const handlePin = () => {
    showMenu.value = false;
    if (!props.pane.float) {
        setPanePin(props.pane.id);
        emitter.emit('layoutChange', {
            type: 'panePin',
            id: props.pane.id
        })
    }
}

// 只关闭当前激活的tab
const handleClose = () => {
    showMenu.value = false;
    if (props.pane.float) {
        closeFloatPane(props.pane.id);
        emitter.emit('layoutChange', {
            type: 'floatPaneClose',
            id: props.pane.id
        })
    } else {
        closeTabInPane(props.pane.id, props.pane.data.active);
        emitter.emit('layoutChange', {
            type: 'tabClose',
            id: props.pane.id
        })
    }
}

// 只浮动当前激活的tab
const handleFloating = () => {
    showMenu.value = false;
    
    if (props.pane.float) {
        // closeFloatPane(props.pane.id);
        unSetPaneFloat(props.pane.id);
        emitter.emit('layoutChange', {
            type: 'floatPaneToFixed',
            id: props.pane.id
        })
    } else {
        setPaneFloat(props.pane.id, 400, 200);
        emitter.emit('layoutChange', {
            type: 'paneToFloat',
            id: props.pane.id
        })
    }
}

// 处理圆角样式问题
const paneFooter = ref(null);
const paneContent = ref(null);

const setBorderRadius = () => {
    if (!paneContent.value) return;
    if (!paneFooter.value) {
        paneContent.value.style.borderRadius = '0 0 8px 8px';
    } else {
        const observe = new ResizeObserver(async entries => {
            await nextTick();
            if (!paneContent.value) return;
            const activeIndex = props.pane.data.group.indexOf(props.pane.data.active);
            if (activeIndex == 0) {
                paneContent.value.style.borderRadius = '0 0 8px 0';
            } else if (activeIndex === props.pane.data.group.length - 1) {
                const footerWidth = paneFooter.value.getBoundingClientRect().width;
                const tabs = paneFooter.value.querySelectorAll('.tab-item');
                let tabWidth = 0;
                for (let i = 0; i < tabs.length; i++) {
                    tabWidth += tabs[i].getBoundingClientRect().width;
                }
                
                if (footerWidth > tabWidth) {
                    paneContent.value.style.borderRadius = '0 0 8px 8px';
                } else {
                    paneContent.value.style.borderRadius = '0 0 0 8px';
                }
            } else { 
                paneContent.value.style.borderRadius = '0 0 8px 8px';
            }
        })

        observe.observe(paneFooter.value, {
            childList: true,
            subtree: true
        })
    }
}
watch([() => props.pane.data.group, () => props.pane.data.active], () => {
    setTimeout(() => {
        setBorderRadius();
    })
}, { deep: true })

</script>

<style lang="scss" scoped>
.pane-container {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    user-select: none;
    min-height: 0;

    .pane-content {
        flex: 1;
        overflow: auto;
        // border-radius: 0 0 8px 8px;
        background: var(--pane-content-bg-color);
        border: 1px solid var(--pane-content-border-color);

        // & > * {
        //     background-color: var(--color-8);
        // }
    }

    .pane-title {
        user-select: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
        padding: 3px 0;
        background: var(--pane-header-bg-color);
        color: var(--pane-header-color);

        &:hover {
            // background: linear-gradient(to bottom, #F6CF31 0%, #EBA32B 100%);
            background: var(--pane-header-active-bg-color);
            color: inherit;
        }

        &.active {
            // background: linear-gradient(to bottom, #F6CF31 0%, #EBA32B 100%);
            background: var(--pane-header-active-bg-color);
            color: inherit;
        }

        &:not(:hover):not(.active) {
            // color: var(--color-9);
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
            padding-right: 5px;

            .btn {
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid transparent;


                &:hover {
                    border-color: var(--pane-header-btn-hover-borer-color);
                    // background: linear-gradient(to bottom, #FFF1C6 0%, #FFD69A 100%);
                    background: var(--pane-header-btn-hover-bg-color);
                }
            }
        }
    }

    .pane-footer {
        display: flex;
        flex-wrap: nowrap;
        background: var(--pane-footer-bg-color);
        padding-bottom: 5px;

        .tab-item {
            font-size: 12px;
            flex: 0 1 auto;
            width: fit-content;
            cursor: pointer;
            white-space: nowrap;    /* 防止文本换行 */
            overflow: hidden;       /* 隐藏超出容器的内容 */
            text-overflow: ellipsis; /* 显示省略号 */
            border: 1px solid transparent;
            // border-top-color: #000000;
            padding: 1px 2px;
            vertical-align: middle;
            padding: 0 3px;
            color: var(--pane-footer-tab-color);

            &:hover {
                // background: linear-gradient(to bottom, #F6CF31 0%, #EBA42B 100%);
                background: var(--pane-footer-tab-hover-bg-color);
                color: inherit;
            }

            &.active {
                border-top-color: transparent;
                border-left-color: transparent;
                background: var(--pane-footer-tab-active-bg-color);
                border-color: var(--pane-footer-tab-active-border-color);
                border-top-color: transparent;
                border-radius: 0 0 8px 8px;
                margin-top: -1px;
                color: var(--pane-footer-tab-active-color);
            }

            &.highlight {
                background-color: var(--pane-footer-tab-hover-bg-color);
            }

            .image {
                vertical-align: middle;
                margin-right: 3px;
            }

            & > span {
                vertical-align: middle;
            }
        }

        .empty {
            flex: 1;
            // border-top: 1px solid #000000;
        }
    }

    &.float-pane {
        position: absolute;
    }
}
</style>