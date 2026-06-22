<template>
  <div class="container" ref="refContainer">
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';

const arr = reactive([]);
watch(arr, (newVal, oldVal) => {
  console.log('数组发生变化:', JSON.stringify(newVal), JSON.stringify(oldVal));
  // 比较长度变化
  if (newVal.length > oldVal.length) {
    // 可能是添加了元素
    const addedIndex = newVal.length - 1;
    console.log('添加了对象，索引：', addedIndex, '值：', newVal[addedIndex]);
  } else if (newVal.length === oldVal.length) {
    // 长度不变，可能有元素被修改
    const changedIndex = newVal.findIndex((item, idx) => item !== oldVal[idx]);
    if (changedIndex !== -1) {
      console.log('修改了已有对象，索引：', changedIndex, '旧值：', oldVal[changedIndex], '新值：', newVal[changedIndex]);
    }
  } else {
    // 长度减少，可能是删除了元素
    console.log('删除了元素');
  }
}, { deep: true });
</script>

<style scoped lang="scss">

</style>