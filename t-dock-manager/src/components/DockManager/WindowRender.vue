<template>
    <div class="window-render" :style="getStyle" :id="config.id">
        <window-container v-if="config.tab" :window="config"></window-container>

        <template v-if="config.children" v-for="(child, index) in config.children" :key="child.id">
            <window-render :config="child"></window-render>

            <splitter
                v-if="config.children.length - 1 > index"
                window
                :direction="child.direction"
                :prev="child.id"
                :next="config.children[index + 1].id"
            >
            </splitter>
        </template>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import WindowContainer from './WindowContainer.vue';
import Splitter from './Splitter.vue';
import { useLayout } from './layout.js';

const { spliterGap } = useLayout();

defineOptions({
    name: 'WindowRender'
});

const gap = spliterGap.value + 'px';

const props = defineProps({
    config: {
        type: Object,
        default: () => {}
    }
})

const getStyle = computed(() => {
    if (props.config.direction == 'column') {
        return {
            width: props.config.size,
            height: '100%',
            flexDirection: 'column'
        }
    } else if (props.config.direction == 'row') {
        return {
            width: '100%',
            height: props.config.size,
            flexDirection: 'row'
        }
    } else {
        return {};
    }

})
</script>

<style lang="scss" scoped>
.window-render {
    display: flex;
    gap: v-bind(gap);
}
</style>