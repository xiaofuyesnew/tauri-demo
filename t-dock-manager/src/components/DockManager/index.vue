<template>
    <div class="dock-manager">
        <ConfigRender v-if="curLayoutData" :config="curLayoutData">
            <template v-slot:emptyWindow>
                <slot name="emptyWindow"></slot>
            </template>
        </ConfigRender>


        <div class="comp-park">
            <template v-for="paneComp in paneTabList" :key="paneComp.comp">
                <teleport :disabled="!paneTarget[paneComp.id + '_' + paneComp.comp]" :to="paneTarget[paneComp.id + '_' + paneComp.comp]">
                    <keep-alive>
                        <component :is="getPaneComp(paneComp.comp)"></component>
                    </keep-alive>
                </teleport>
            </template>

            <template v-for="windowComp in windowTabList" :key="windowComp.id">
                <teleport :disabled="!windowTarget[windowComp.id]" :to="windowTarget[windowComp.id]">
                    <component :is="getWindowComp(windowComp.type)"></component>
                </teleport>
            </template>
        </div>
    </div>
</template>

<script setup>
import { nextTick, provide, reactive, watch, useSlots, onMounted, computed, unref, isReactive, toRaw } from 'vue';
import ConfigRender from './ConfigRender.vue';
import { useLayout } from './layout.js';
import { registerPaneList, registerWindowList } from './useAssociatedComponents.js';
import '../../assets/style/index.css'
import emitter from './eventBus.js';

const {
    curLayoutData,
    layoutData,
    isPaneOpend,
    togglePaneOpen,
    openWindowByName,
    setWindowLayout,
    copyWindow,
    getAllWindowTab,
    resetLayout,
    generateRandomId,
    windowTabList,
    paneTabList,
    windowLayout,
    getCurrentActivePane,
    toggleWindowActive,
    toggleWindowDisplay,
    setWindowLayoutByFilter,
    floatPaneIdPrefix,
} = useLayout();

const props = defineProps({
    paneList: {
        type: Array,
        default: () => []
    },
    windowList: {
        type: Array,
        default: () => []
    },
    defaultLayout: {
        type: Object,
        default: () => {}
    },
    logoImg: {
        type: String,
        default: ''
    },
    logoText: {
        type: String,
        default: ''
    },
    topIndicator: {
        type: String,
        default: '/src/assets/image/DockIndicator_Top.png'
    },
    rightIndicator: {
        type: String,
        default: '/src/assets/image/DockIndicator_Right.png'
    },
    bottomIndicator: {
        type: String,
        default: '/src/assets/image/DockIndicator_Bottom.png'
    },
    leftIndicator: {
        type: String,
        default: '/src/assets/image/DockIndicator_Left.png'
    },
    centerIndicator: {
        type: String,
        default: '/src/assets/image/DockIndicator_Center.png'
    }
})

provide('logoImg', props.logoImg);
provide('logoText', props.logoText);

provide('topIndicatorImg', props.topIndicator);
provide('rightIndicatorImg', props.rightIndicator);
provide('bottomIndicatorImg', props.bottomIndicator);
provide('leftIndicatorImg', props.leftIndicator);
provide('centerIndicatorImg', props.centerIndicator);

const fillId = (layout) => {
    layout.id = 'root';

    function fillChildren(children) {
        if (!children) return;

        children.forEach(child => {
            // 处理浮动面板的顶级id
            if (layout.floatPane.includes(child)) {
                if (!child.id) {
                    child.id = floatPaneIdPrefix.value + generateRandomId();
                } else {
                    if (!child.id.startsWith(floatPaneIdPrefix.value)) {
                        child.id = floatPaneIdPrefix.value + child.id;
                    }
                }
            }
            if (!child.id) {
                if (child.type == 'window') {
                    child.id = 'window';
                } else {
                    child.id = generateRandomId();
                }
            }

            if (child.children && child.children.length) {
                fillChildren(child.children);
            }

        })
    }

    fillChildren(layout.children);
    fillChildren(layout.floatPane);

    if (layout.autoHidePane) {
        layout.autoHidePane.forEach(item => {
            item.id = generateRandomId();
            if (item.group) {
                item.group.forEach(g => {
                    g.id = generateRandomId();
                })
            }
        })
    }
}

/**
 * 设置默认布局
 */
const setDefaultLayout = (layout) => {
    layout = unref(layout);
    layout = isReactive(layout) ? toRaw(layout) : layout;
    fillId(layout);
    layoutData.value = JSON.parse(JSON.stringify(layout));
}

/**
 * 获取默认布局
 */
const getDefaultLayout = () => {
    return layoutData.value;
}

/**
 * 设置当前布局
 */
const setCurrentLayout = (layout) => {
    fillId(layout);
    curLayoutData.value = JSON.parse(JSON.stringify(layout));
}

/**
 * 获取当前布局
 */
const getCurrentLayout = () => {
    return curLayoutData.value;
}

const fillWindowLayout = (layout) => {
    function fillChildren(children) {
        if (!children) return;

        children.forEach(child => {
            if (!child.id) {
                child.id = generateRandomId();
            }

            if (child.tab) {
                child.tab.forEach(t => {
                    if (!t.id) {
                        t.id = generateRandomId();
                    }
                })

                // 处理用户异常数据
                if (child.active && child.active >= child.tab.length) {
                    child.active = 0;
                }
            }

            if (child.children && child.children.length) {
                fillChildren(child.children);
            }

        })
    }

    layout.id = 'window-root';
    fillChildren([layout]);

    // 处理active
    let active = '';
    if (layout.children) {
        let index = layout.children[0].tab.length <= (layout.children[0].active || 0) ? 0 : (layout.children[0].active || 0);
        active = layout.children[0].tab[index].id;
    }

    return {
        maximize: '',
        active,
        data: layout
    }
    
}

/**
 * 设置当前window布局
 */
const setCurrentWindowLayout = (layout) => {
    layout = unref(layout);
    layout = isReactive(layout) ? toRaw(layout) : layout;
    layout = fillWindowLayout(layout)

    windowLayout.value = JSON.parse(JSON.stringify(layout));
}

/**
 * 获取当前window布局
 */
const getCurrentWindowLayout = () => {
    return windowLayout.value;
}

watch(() => props.paneList, () => {
    registerPaneList(props.paneList);
}, { deep: true, immediate: true })

watch(() => props.windowList, () => {
    registerWindowList(props.windowList);
}, { deep: true, immediate: true })

watch(() => props.defaultLayout, () => {
    if (props.defaultLayout) {
        setDefaultLayout(props.defaultLayout);
    }
}, { deep: true, immediate: true })

const paneTarget = reactive({});
const windowTarget = reactive({});

const getAllPaneTarget = async () => {
    await nextTick();
    
    paneTabList.value.forEach(pane => {
        paneTarget[pane.id + '_' + pane.comp] = document.querySelector(`[data-id="${pane.id + '_' + pane.comp}"]`);
    })
}

const getAllWindowTarget = async () => {
    await nextTick();
    windowTabList.value.forEach(window => {
        windowTarget[window.id] = document.querySelector(`[data-id=${window.id}]`);
    })
}

const getPaneComp = (type) => {
    const p = props.paneList.find(item => item.name == type);
    if (p) {
        return p.comp;
    } else {
        return null
    }
}

const getWindowComp = (type) => {
    const w = props.windowList.find(item => item.name == type);
    if (w) {
        return w.comp;
    } else {
        return null
    }
}

const getWindowList = computed(() => JSON.parse(JSON.stringify(windowTabList.value)));

watch(() => curLayoutData.value, () => {
    getAllPaneTarget();
}, { deep: true, immediate: true })

watch(() => windowLayout.value, () => {
    getAllWindowTarget();
}, { deep: true, immediate: true })

const emit = defineEmits(['layoutChange', 'openNewWindow', 'hideWindow']);

emitter.on('layoutChange', e => {
    emit('layoutChange', e);
})

emitter.on('openNewWindow', e => {
    emit('openNewWindow', e);
})

emitter.on('closeWindow', e => {
    emit('hideWindow', e)
})

defineExpose({
    setDefaultLayout,
    getDefaultLayout,
    setCurrentLayout,
    getCurrentLayout,
    registerPaneList,
    registerWindowList,
    isPaneOpend,
    togglePaneOpen,
    openWindowByName,
    setWindowLayout,
    copyWindow,
    getAllWindowTab,
    resetLayout,
    getCurrentActivePane,
    getCurrentWindowLayout,
    setCurrentWindowLayout,
    getWindowList,
    toggleWindowActive,
    toggleWindowDisplay,
    setWindowLayoutByFilter,
})
</script>

<style scoped lang="scss">
.dock-manager {
    width: 100%;
    position: relative;
    display: flex;
    background: var(--t-dock-manager-bg-color);
}

.comp-park {
    position: absolute!important;
    visibility: hidden!important;
}
</style>