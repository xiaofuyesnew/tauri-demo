<template>
    <div v-if="curOption" class="filter-container">
        <div class="filter-label">Numeric Filter</div>

        <el-select
            v-model="condition1"
            size="small"
            class="filter-select"
            placeholder=""
            fit-input-width
            :teleported="false"
            :popper-append-to-body="false"
            @change="handleChangeCondition1"
        >
            <el-option v-for="item in filterCondition" :key="item" :label="item" :value="item"></el-option>
        </el-select>

        <el-input-number
            v-model="num1"
            size="small"
            class="filter-input"
            controls-position="right"
            :precision="2"
            :value-on-clear="null"
            @change="handleChangeNum1"
        ></el-input-number>

        <div class="filter-label" style="margin-top: 5px;">2nd condition</div>

        <el-radio-group v-model="logical" size="small" @change="handleChangeLogical">
            <el-radio value="1">And</el-radio>
            <el-radio value="2">Or</el-radio>
        </el-radio-group>

        <br>

        <el-select
            v-model="condition2"
            size="small"
            class="filter-select"
            placeholder=""
            fit-input-width
            :teleported="false"
            :popper-append-to-body="false"
            @change="handleChangeCondition2"
        >
            <el-option v-for="item in filterCondition" :key="item" :label="item" :value="item"></el-option>
        </el-select>

        <el-input-number
            v-model="num2"
            size="small"
            class="filter-input"
            controls-position="right"
            :precision="2"
            @change="handleChangeNum2"
        ></el-input-number>

        <div class="filter-footer">
            <el-button size="small" @click="handleReset">重置</el-button>
            <el-button size="small" type="primary" @click="handleConfirm">确认</el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, PropType } from 'vue';
import type { VxeGlobalRendererHandles, VxeInputEvents } from 'vxe-pc-ui';
import type { VxeTableDefines } from 'vxe-table';

defineOptions({
    name: 'FilterRender',
});

const props = defineProps({
    renderParams: {
        type: Object as PropType<VxeGlobalRendererHandles.RenderTableFilterParams>,
        default: () => ({})
    }
});

const curOption = ref<VxeTableDefines.FilterOption>();

const curField = computed(() => {
  const { column } = props.renderParams || {}
  return column ? column.field : ''
})

// 条件字段
const condition1 = ref('');
const num1 = ref();
const condition2 = ref('');
const num2 = ref();

// 1表示且，2表示或
const logical = ref('2');

const filterCondition = ref([
  '',
  '==',
  '<',
  '<=',
  '>',
  '>=',
  'U'
]);


const load = () => {
    if (props.renderParams) {
        const { column, $panel } = props.renderParams;
        const option = column.filters[0];
        curOption.value = option;

        if (option.value) {
            condition1.value = option.value.condition1;
            num1.value = option.value.num1;
            condition2.value = option.value.condition2;
            num2.value = option.value.num2;
            logical.value = option.value.logical;
        }

    }
};

watch(curField, () => {
    load();
}, { immediate: true });

const handleReset = (e) => {
    condition1.value = '';
    num1.value = 0;
    condition2.value = '';
    num2.value = 0;
    logical.value = '2';

    const { $table } = props.renderParams;
    const option = curOption.value as VxeTableDefines.FilterOption;
    option.value = {
        condition1: condition1.value,
        num1: num1.value,
        condition2: condition2.value,
        num2: num2.value,
        logical: logical.value,
    }
    $table.updateFilterOptionStatus(option, false);
    $table.saveFilterPanelByEvent(e);
}
const handleConfirm = (e) => {
    const option = curOption.value;
    if (props.renderParams && option) {
        const { $table } = props.renderParams;
        const checked = (condition1.value && !isEmpty(num1.value)) || (condition2.value && !isEmpty(num2.value)) as boolean;
        
        option.value = {
            condition1: condition1.value,
            num1: num1.value,
            condition2: condition2.value,
            num2: num2.value,
            logical: logical.value,
        }
        $table.updateFilterOptionStatus(option, checked);
        $table.saveFilterPanelByEvent(e);
    }
}

const handleChangeCondition1 = (val) => {
    console.log(val);
}
const handleChangeNum1 = (val) => {
    num1.value = val;
}
const handleChangeCondition2 = (val) => {
    console.log(val);
}
const handleChangeNum2 = (val) => {
    num2.value = val;
    console.log(val);
}
const handleChangeLogical = (val) => {
    console.log(val);
}

const isEmpty = (val) => {
    return val === '' || val == undefined;
}
</script>

<style lang="scss">
.filter-container {
    padding: 8px 5px;

    .filter-label {
        font-weight: bold;
        margin-bottom: 5px;
    }

    .filter-select {
        width: 60px;
        margin-right: 5px;

        .el-select-dropdown__item {
            padding: 0 0 0 15px;
        }
    }

    .filter-input {
        .el-input__inner {
            text-align: right;
        }
    }

    .filter-footer {
        text-align: right;
        margin-top: 8px;
    }
}

</style>