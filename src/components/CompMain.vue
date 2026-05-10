<script setup>
import { ref, onMounted } from 'vue'
import { useGlobalStore } from '@/store/global'
import { storeToRefs } from 'pinia'
defineOptions({
  name: 'CompMain',
})

const localCounter = ref(0)

const globalStore = useGlobalStore()
const { counter } = storeToRefs(globalStore)
const { increment } = globalStore

onMounted(async () => {
  await globalStore.$tauri.start()
})

</script>

<template>
  <div class="comp">
    <div class="header">
      <div>CompMain</div>
    </div>
    <div class="content">
      <div>当前组件内: {{ localCounter }}</div>
      <button @click="localCounter++">组件内增加</button>
      <div>全局: {{ counter }}</div>
      <button @click="increment">全局增加</button>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>