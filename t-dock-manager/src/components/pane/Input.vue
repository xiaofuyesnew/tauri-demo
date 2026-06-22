<template>
  <div class="container">
    pane4 content
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
const count = ref(0);
onMounted(() => {
  console.log('Input mounted111111111111111111111');
})
</script>

<style scoped lang="scss">

</style>