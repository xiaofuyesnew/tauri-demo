<template>
    <slot name="emptyWindow">
        <div class="empty-window">
            <img :src="logoImg" class="logo-img" alt="">
            <div class="logo-text">{{ logoText }}</div>
        </div>
    </slot>
</template>

<script setup>
import { inject } from 'vue';


const logoImg = inject('logoImg', null);
const logoText = inject('logoText', null);

</script>

<style lang="scss" scoped>
.empty-window {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 60px;
    color: #959596;
    user-select: none;

    .logo-img {
        height: 80px;
    }
}
</style>