<template>
    <div ref="autoHideBarContainer" class="auto-hide-bar-container">

        <div class="auto-hide-bar">
            <div class="tab-item-group" v-for="item in autoHidePane" :key="item.id">
                <div
                    class="tab-item"
                    data-click-guard="true"
                    v-for="groupItem in item.group"
                    :key="groupItem.id"
                    :title="groupItem.comp"
                    :class="{'current': curAutoHideActive == groupItem.id}"
                    @click.capture.stop="handleToggle(groupItem)"
                >
                    <img class="image" v-if="getPaneImage(groupItem.comp)" :src="getPaneImage(groupItem.comp)" alt="">
                    {{ groupItem.comp }}
                </div>
            </div>
        </div>

        <auto-hide-pane v-for="item in compTabArr" :key="item.id" :pane="item"></auto-hide-pane>        
    </div>


</template>

<script setup>
import { ref, watch, watchEffect, reactive, onMounted, onBeforeUnmount } from 'vue';
import AutoHidePane from './AutoHidePane.vue';
import { getPaneImage } from './useAssociatedComponents.js';
import { useLayout } from './layout.js';
import emitter from './eventBus';

const { generateRandomId, setCurAutoHideActive, setCurActive, curAutoHideActive } = useLayout();

const props = defineProps({
    autoHidePane: {
        type: Array,
        default: () => []
    }
})

let compTabArr = ref([]);
const autoHideBarContainer = ref(null);

onMounted(() => {
    // document.addEventListener('click', clickEvent);
})

onBeforeUnmount(() => {
    // document.removeEventListener('click', clickEvent);
})

watchEffect(() => {
    compTabArr.value = [];
    props.autoHidePane.forEach(item => {
        compTabArr.value.push(...item.group.map(i => {
            return {
                ...i,
                id: i.id || generateRandomId()
            }
        }));
        
    })
})

const clickEvent = (e) => {
    if (!autoHideBarContainer.value.contains(e.target)) {
        setCurAutoHideActive('');
    }
}

const handleToggle = (groupItem) => {
    if (curAutoHideActive.value == groupItem.id) {
        setCurAutoHideActive('');
    } else {
        setCurAutoHideActive(groupItem.id);
        setCurActive('');
    }
}

</script>

<style lang="scss" scoped>
.auto-hide-bar-container {
    overflow-y: auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
    background: var(--auto-hide-bar-container-bg-color);

    .auto-hide-bar {
        font-size: 12px;
        padding: 2px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        position: relative;
        z-index: 1001;
        height: 100%;
        background: var(--auto-hide-bar-container-bg-color);


        .tab-item-group {
            border: 1px solid var(--auto-hide-bar-group-border-color);
            background: var(--auto-hide-bar-group-bg-color);

            .tab-item {
                width: 100%;
                user-select: none;
                cursor: default;
                writing-mode: vertical-lr;
                text-orientation: mixed;
                padding: 2px 0;
                border: 1px solid var(--auto-hide-item-border-color);
                background: var(--auto-hide-item-bg-color);
                border-radius: 2px;
                color: var(--auto-hide-item-color);

                &:hover {
                    // background: linear-gradient(to bottom, #F6CF31, #EBA32B);
                    border-color: var(--auto-hide-item-active-border-color);
                    background: var(--auto-hide-item-active-bg-color);
                }

                &.current {
                    border-color: var(--auto-hide-item-active-border-color);
                    background: var(--auto-hide-item-active-bg-color);
                }
            }
        }
    }
}
</style>