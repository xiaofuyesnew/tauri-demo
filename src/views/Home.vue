<script setup>
import CompMain from '@/components/CompMain.vue'
import CompA from '@/components/CompA.vue'
import CompB from '@/components/CompB.vue'
import CompC from '@/components/CompC.vue'
import { useGlobalStore } from '@/store/global'
import { storeToRefs } from 'pinia'

const globalStore = useGlobalStore()
const { componentsList } = storeToRefs(globalStore)

console.log(window.location)
</script>

<template>
  <main class="container">
    <CompMain />
    <CompA v-if="!componentsList.includes('CompA')" :status="componentsList.includes('CompA') ? 'win' : 'comp'" />
    <CompB v-if="!componentsList.includes('CompB')" :status="componentsList.includes('CompB') ? 'win' : 'comp'" />
    <CompC v-if="!componentsList.includes('CompC')" :status="componentsList.includes('CompC') ? 'win' : 'comp'" />
  </main>
</template>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
  display: flex;
}
</style>
