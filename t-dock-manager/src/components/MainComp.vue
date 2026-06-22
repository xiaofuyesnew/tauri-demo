<template>
    <div class="main-comp" style="display: flex;">
         <!-- <config-render :config="curLayoutData"></config-render> -->
        <DockManager ref="dockManager" :config="curLayoutData"></DockManager>
    </div>
</template>

<script setup>
import { DockManager } from 'tao-dock-manager';
import 'tao-dock-manager/dist/index.css';
import { onBeforeMount, onMounted, reactive, ref, watchEffect } from 'vue';

import ConfigRender from './DockManager/ConfigRender.vue';
import { useLayout } from './DockManager/layout.js';

const { curLayoutData, layoutData } = useLayout();
const dockManager = ref();
onBeforeMount(() => {
    console.log(curLayoutData)
    curLayoutData.value = layoutData;
})


onMounted(() => {
console.log(dockManager.value);

})


</script>

<style lang="scss" scoped>
.main-comp {
    width: 100%;
    position: relative;
    overflow: hidden;

    .pane-container {
        display: flex;
        flex-direction: column;
        border-top: 1px solid #B5B9BC;
        border-bottom: 1px solid #B5B9BC;
        position: absolute;

        .pane-content {
            flex: 1;
        }

        .pane-title {
            background-color: #E6E6E6;
            user-select: none;

            &:hover {
                background-color: #F2BC25;
            }
        }

        .pane-footer {
            background-color: #E6E6E6;
            display: flex;
            flex-wrap: nowrap;

            .tab-item {
                flex: 1;
                cursor: pointer;
                white-space: nowrap;    /* 防止文本换行 */
                overflow: hidden;       /* 隐藏超出容器的内容 */
                text-overflow: ellipsis; /* 显示省略号 */

                &:hover {
                    background-color: #F2BC25;
                }
            }
        }
    }
}
</style>