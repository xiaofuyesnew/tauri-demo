<template>
    <input
        type="number"
        v-model="curRow[curColumn.field]"
        class="render-number-input"
        autocomplete="off"
        @change="handleChange"
    >

    <!-- <el-input-number
        v-if="curRow && curColumn"
        v-model="curRow[curColumn.field]"
        class="render-number-input"
        :controls="false"
        @change="handleChange"
    ></el-input-number> -->
    <!-- <vxe-number-input
        v-if="curRow && curColumn"
        v-model="curRow[curColumn.field]"
        class="render-number-input"
        :control-config="{enabled: false}"
        placeholder=" "
        @change="handleChange"
    ></vxe-number-input> -->
</template>

<script setup lang="ts">
import { PropType, ref, render } from 'vue';
import { VxeGlobalRendererHandles } from 'vxe-pc-ui';
import { VxeColumnSlotTypes, VxeTableDefines } from 'vxe-table';

defineOptions({
    name: 'NumberInputRender',
});

const emit = defineEmits(['valuechange']);

const props = defineProps({
    renderParams: {
        type: Object as PropType<VxeGlobalRendererHandles.RenderTableEditParams>,
        default: () => {}
    }
})

const curColumn = ref<VxeTableDefines.ColumnInfo>();
const curRow = ref();

const handleChange = () => {
    emit('valuechange', {
        cellValue: curRow.value[curColumn.value.field],
        row: curRow.value,
        column: curColumn.value
    });
}

const load = () => {
    const { renderParams } = props;
    const { row, column } = renderParams;
    curRow.value = row;
    curColumn.value = column;
}

load();

</script>

<style lang="scss">
.render-number-input {
    -moz-appearance: textfield;
    border: none;
    outline: none;
    background-color: transparent;
    width: 100%;
    font-family: inherit;
    font-size: inherit;
    color: inherit;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
        -webkit-appearance: none;
    }

}
// .render-number-input {
//     width: 100%;
//     height: 20px;
//     border: none!important;
//     --vxe-ui-input-height-mini: 20px;
//     margin-top: -6px;

//     .vxe-number-input--input-wrapper {
//         padding: 0!important;
//         background-color: transparent;

//         .vxe-number-input--input{
//             font-size: 12px;
//             background-color: transparent!important;
//             padding: 0;
//         }

//         &.is-focus {
//             box-shadow: none;
//             background-color: #0078D7;
//         }
//     }

//     .el-input__wrapper {
//         padding: 0!important;
//         background-color: transparent;
//         box-shadow: none!important;

//         .el-input__inner {
            
//             font-size: 12px;
//             background-color: transparent!important;
//             text-align: left;
//             height: 25px;
//             color: #FFFFFF!important;
//             font-family: -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Helvetica Neue, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol;
//         }

//         &.is-focus {
//             box-shadow: none;
//             background-color: #0078D7;
//         }
//     }

// }
</style>