<template>
    <div class="btn-box">
        <button @click="opWindow('3D window')">打开3D window</button>
        <button @click="opWindow('Charting window')">打开Charting window</button>
        <button @click="opWindow('Function window')">打开Function window</button>
        <button @click="opWindow('Map window')">打开Map window</button>
        <button @click="copy">复制当前活动窗口</button>
        <button @click="getAllWindowTab">获取打开的文档</button>
        <button @click="toggleWindowActive">切换激活的窗口</button>
        <button @click="toggleWindowDisplay">切换文档1窗口的显示与隐藏</button>

        <br>
        <button @click="getLayout">获取当前布局数据</button>
        <button @click="resetLayout">恢复默认布局</button>
        <button @click="setDefaultlayout">设置默认布局</button>
        <button @click="modifyDefaultlayout">修改默认布局</button>

        <br>

        <button @click="isPaneOpend">获取面板1的打开状态</button>
    </div>
    <DockManager
        ref="dockManager"
        :paneList="paneList"
        :windowList="windowList"
        :defaultLayout="defaultlayout"
        topIndicator="/src/assets/t.png"
        rightIndicator="/src/assets/r.png"
        bottomIndicator="/src/assets/b.png"
        leftIndicator="/src/assets/l.png"
        centerIndicator="/src/assets/c.png"
    >
        <template #emptyWindow>
            <EmptyWindow></EmptyWindow>
        </template>
    </DockManager>
</template>

<script setup>
import EmptyWindow from '@/components/EmptyWindow/index.vue';
import DockManager from '@/components/DockManager/index.vue'
import {
    paneList,
    windowList,
    layoutAfterSelectProject,
    layoutBeforeSelectProject,
    windowLayout
} from '@/components/useAssociatedComponents.js'
import { onMounted, ref, useTemplateRef } from 'vue'

import topImg from '@/assets/t.png'
import rightImg from '@/assets/r.png'
import bottomImg from '@/assets/b.png'
import leftImg from '@/assets/l.png'
import centerImg from '@/assets/c.png'

onMounted(() => {
    // dockManager.value.setCurrentLayout(layoutAfterSelectProject)
    
    dockManager.value.setCurrentLayout(layoutAfterSelectProject)
    dockManager.value.setCurrentWindowLayout(windowLayout)

    window.addEventListener('contextmenu', e => {
        e.preventDefault()
    })
})

const defaultlayout = ref(null);

const dockManager = useTemplateRef('dockManager');

const opWindow = (name) => {
    dockManager.value.openWindowByName(name);
}

const getLayout = () => {
    let layout = dockManager.value.getCurrentLayout();
    let windowLayout = dockManager.value.getCurrentWindowLayout();

    console.log(layout);
    console.log(windowLayout);
}

const copy = () => {
    dockManager.value.copyWindow()
}

const resetLayout = () => {
    dockManager.value.resetLayout()
}

const setDefaultlayout = () => {
    defaultlayout.value = layoutBeforeSelectProject;
}

const modifyDefaultlayout = () => {
    dockManager.value.setDefaultLayout(layoutAfterSelectProject)
}

const allWindow = ref([])
const getAllWindowTab = () => {
    allWindow.value = dockManager.value.getAllWindowTab()
}

const toggleWindowActive = () => {
    getAllWindowTab()
    dockManager.value.toggleWindowActive(allWindow.value[0].id)
}

const isPaneOpend = () => {
    let isOpend = dockManager.value.isPaneOpend('面板1')
    window.alert(isOpend)
}

const target = ref(null)
const toggleWindowDisplay = () => {
    getAllWindowTab()
    let t = allWindow.value.find(i => i.title == '文档1')
    if (t) {
        target.value = t
        dockManager.value.toggleWindowDisplay(target.value, false)
    } else {
        if (target.value) {
            dockManager.value.toggleWindowDisplay(target.value, true)
        }
    }
}
</script>

<style lang="scss" scoped>
.btn-box {
    height: 100px;
}

.dock-manager {
    height: calc(100% - 100px);
}
</style>