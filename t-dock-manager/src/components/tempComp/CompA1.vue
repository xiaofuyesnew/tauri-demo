<template>
    <div style="width: 6000px; height: 6000px;">A1</div>

</template>

<script setup>
import { Logger } from 'sass';
import { onMounted } from 'vue';

defineOptions({
    name: 'CompA1',
})

onMounted(() => {
    console.log('onMounted');
    
})
</script>