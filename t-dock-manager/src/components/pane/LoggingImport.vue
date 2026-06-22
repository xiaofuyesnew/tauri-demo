<template>
    <el-dialog v-model="showLoggingImport" width="30%" max-height="50%" padding="0" draggable @close="handleClose"
        class="project-dialog">
        <template #header>
            <div class="dialog-custom-header">
                <img src="@/assets/image/title.png" alt="title" class="title-image" />
                <span>Match files and wells</span>
            </div>
        </template>

        <div class="tab-content">
            <div class="form-row separator">
                <label>Match wells by using</label>
                <hr>
            </div>
            <div class="radio-group vertical">
                <el-radio-group v-model="matchBy">
                    <div class="radio-item">
                        <el-radio label="Well name" size="large">Well name</el-radio>
                    </div>
                    <div class="radio-item">
                        <el-radio label="UWI" size="large">UWI</el-radio>
                    </div>
                </el-radio-group>
            </div>
        </div>
        <div class="tab-content">
            <div class="form-row separator">
                <label>{{ wellNameBasedOnLabel }}</label>
                <hr>
            </div>
            <div class="radio-group vertical">
                <el-radio-group v-model="wellNameBasedOn">
                    <div class="radio-item">
                        <el-radio label="Dynamic" size="large">LAS header</el-radio>
                    </div>
                    <div class="radio-item">
                        <el-radio label="Static(recommened for big projects)" size="large">File name</el-radio>
                    </div>
                </el-radio-group>
            </div>
            <!-- 文件映射表格 -->
            <div v-show="wellNameBasedOn === 'Static(recommened for big projects)'" class="mapping-table-container">
                <el-table :data="fileMappingData" class="mapping-table" style="width: 100%" :cell-style="getCellStyle"
                    :header-cell-style="getHeaderCellStyle" ref="mappingTableRef" border resizable height="200">
                    <el-table-column prop="fileName" label="File name" :min-width="120" resizable show-overflow-tooltip>
                    </el-table-column>
                    <el-table-column prop="wellTrace" label="Well trace" :min-width="150" resizable
                        show-overflow-tooltip>
                        <template #default="{ row }">
                            <el-select v-model="row.wellTrace" placeholder="Select well trace" style="width: 100%"
                                @change="handleWellTraceChange(row)">
                                <el-option v-for="option in wellTraceOptions" :key="option.value" :label="option.label"
                                    :value="option.value">
                                </el-option>
                            </el-select>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>
        <!-- 添加按钮 -->
        <div class="button-container">
            <el-button @click="handleOk">
                <img src="@/assets/image/ok.png" alt="OK" class="button-icon" /> OK
            </el-button>
            <el-button @click="handleClose">
                <img src="@/assets/image/cancel.png" alt="Cancel" class="button-icon" /> Cancel
            </el-button>
        </div>
    </el-dialog>
    <el-dialog v-model="showInput" top="5vh" width="50%" max-height="50%" padding="0" draggable class="project-dialog"
        @close="handleCancelInput">
        <template #header>
            <div class="dialog-custom-header">
                <img src="@/assets/image/title.png" alt="title" class="title-image" />
                <span>Import well logs</span>
            </div>
        </template>
        <div class="dialog-container">
            <el-tabs v-model="activeTab" type="card" class="custom-tabs">
                <el-tab-pane name="Data">
                    <template #label>
                        <span>Data</span>
                    </template>
                    <div class="tab-content">
                        <div class="form-row separator">
                            <label>Matching</label>
                            <hr>
                        </div>
                    </div>
                    <div class="tab-content">
                        <div class="radio-group vertical">
                            <el-radio-group v-model="Matching">
                                <div class="radio-item">
                                    <el-radio label="Create" size="large">Create new logs</el-radio>
                                </div>
                                <div class="radio-item">
                                    <el-radio label="existing" size="large">Match existing logs</el-radio>
                                </div>
                                <div class="radio-item">
                                    <el-radio label="Specified" size="large">Specified(can import time series
                                        logs)</el-radio>
                                </div>
                            </el-radio-group>
                            <div class="date-display-section">
                                <div class="input-group">
                                    <label>Run date:</label>
                                    <el-input v-model="formattedRunDate" readonly disabled style="width: 180px; " />
                                </div>
                                <div class="input-group">
                                    <label>Date format:</label>
                                    <el-input v-model="dateFormatValue" readonly disabled style="width: 180px; " />
                                </div>
                                <div class="input-group">
                                    <label>Parsed date:</label>
                                </div>
                            </div>
                            <!-- 修改第一个表格区域 -->
                            <div class="tab-content" :class="{ 'disabled-section': Matching !== 'Specified' }">
                                <div class="table-button-row">
                                    <span class="left">Matched</span>
                                    <span>Load:</span>
                                    <el-button size="small" @click="handleLoadAllMatched"
                                        :disabled="Matching !== 'Specified'">All</el-button>
                                    <el-button size="small" @click="handleLoadNoneMatched"
                                        :disabled="Matching !== 'Specified'">None</el-button>
                                </div>
                                <div class="mapping-table-container">
                                    <el-table :data="displayMatchedData" class="mapping-table" style="width: 100%"
                                        :cell-style="getCellStyle" :header-cell-style="getHeaderCellStyle"
                                        ref="mappingTableRef" border resizable height="150"
                                        :class="{ 'disabled-table': Matching !== 'Specified' }">
                                        <el-table-column prop="index" label="log" :min-width="50" resizable
                                            show-overflow-tooltip>
                                            <template #default="{ $index }">
                                                {{ $index + 1 }}
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="Load" label="Load" :min-width="50" resizable
                                            show-overflow-tooltip>
                                            <template #default="{ row }">
                                                <el-checkbox v-model="row.load" @change="handleLoadChange(row)"
                                                    :disabled="Matching !== 'Specified'"></el-checkbox>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="Log Name" label="Log Name" :min-width="80" resizable
                                            show-overflow-tooltip>
                                            <template #default="{ row }">
                                                <el-input v-model="row['Log Name']"
                                                    :disabled="Matching !== 'Specified'"></el-input>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="Property template" label="Property template"
                                            :min-width="150" resizable show-overflow-tooltip>
                                            <template #default="{ row }">
                                                <el-select placeholder="Select well trace" style="width: 100%;"
                                                    :disabled="Matching !== 'Specified'">
                                                </el-select>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="Global well log" label="Global well log" :min-width="150"
                                            resizable show-overflow-tooltip>
                                            <template #default="{ row }">
                                                <el-select v-model="row.wellTrace" placeholder="Select well trace"
                                                    style="width: 100%;" @change="handleWellTraceChange(row)"
                                                    :disabled="Matching !== 'Specified'">
                                                    <el-option label="Create new regular log"
                                                        value="create_new_regular_log"></el-option>
                                                    <el-option label="Create new time series log"
                                                        value="create_new_time_series_log"></el-option>
                                                </el-select>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="Unit{File}" label="Unit{File}" :min-width="100" resizable
                                            show-overflow-tooltip>
                                            <template #default="{ row }">
                                                <el-input v-model="row['Unit{File}']"
                                                    :disabled="Matching !== 'Specified'"></el-input>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="Unit{PreVise}" label="Unit{PreVise}" :min-width="110"
                                            resizable show-overflow-tooltip>
                                        </el-table-column>
                                        <el-table-column prop="Description" label="Description" :min-width="110"
                                            resizable show-overflow-tooltip>
                                            <template #default="{ row }">
                                                <el-input v-model="row['Description']"
                                                    :disabled="Matching !== 'Specified'"></el-input>
                                            </template>
                                        </el-table-column>
                                    </el-table>
                                </div>
                            </div>
                            <!-- 修改第二个表格区域 -->
                            <div class="tab-content" :class="{ 'disabled-section': Matching !== 'Specified' }">
                                <div class="table-button-row">
                                    <span class="left">Unmatched</span>
                                    <span>Load:</span>
                                    <el-button size="small" @click="handleLoadAllUnmatched"
                                        :disabled="Matching !== 'Specified'">All</el-button>
                                    <el-button size="small" @click="handleLoadNoneUnmatched"
                                        :disabled="Matching !== 'Specified'">None</el-button>
                                </div>
                                <div class="mapping-table-container">
                                    <el-table :data="unmatchedData" class="mapping-table" style="width: 100%"
                                        :cell-style="getCellStyle" :header-cell-style="getHeaderCellStyle"
                                        ref="mappingTableRef" border resizable height="150"
                                        :class="{ 'disabled-table': Matching !== 'Specified' }">
                                        <el-table-column prop="index" label="log" :min-width="50" resizable
                                            show-overflow-tooltip>
                                            <template #default="{ $index }">
                                                {{ $index + 1 }}
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="Load" label="Load" :min-width="50" resizable
                                            show-overflow-tooltip>
                                            <template #default="{ row }">
                                                <el-checkbox v-model="row.load" @change="handleLoadChange(row)"
                                                    :disabled="Matching !== 'Specified'"></el-checkbox>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="Log Name" label="Log Name" :min-width="80" resizable
                                            show-overflow-tooltip>
                                        </el-table-column>
                                        <el-table-column prop="Property template" label="Property template"
                                            :min-width="150" resizable show-overflow-tooltip>
                                            <template #default="{ row }">
                                                <el-select placeholder="Select well trace" style="width: 100%"
                                                    :disabled="Matching !== 'Specified'">
                                                </el-select>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="Global well log" label="Global well log" :min-width="150"
                                            resizable show-overflow-tooltip>
                                            <template #default="{ row }">
                                                <el-select v-model="row.wellTrace" placeholder="Select well trace"
                                                    style="width: 100%;" @change="handleWellTraceChange(row)"
                                                    :disabled="Matching !== 'Specified'">
                                                    <el-option label="Create new regular log"
                                                        value="create_new_regular_log"></el-option>
                                                    <el-option label="Create new time series log"
                                                        value="create_new_time_series_log"></el-option>
                                                </el-select>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="Unit{File}" label="Unit{File}" :min-width="100" resizable
                                            show-overflow-tooltip>
                                        </el-table-column>
                                        <el-table-column prop="Unit{PreVise}" label="Unit{PreVise}" :min-width="110"
                                            resizable show-overflow-tooltip>
                                        </el-table-column>
                                        <el-table-column prop="Description" label="Description" :min-width="110"
                                            resizable show-overflow-tooltip>
                                        </el-table-column>
                                    </el-table>
                                </div>
                            </div>
                        </div>
                    </div>

                </el-tab-pane>
                <el-tab-pane name="Settings">
                    <template #label>
                        <span>Settings</span>
                    </template>
                    <div class="tab-content">
                        <div class="form-row separator">
                            <label>The index/first log is</label>
                            <hr>
                        </div>
                        <div class="form-row">
                            <el-select v-model="indexLogType" placeholder="Select index log type" style="width: 25%">
                                <el-option label="MD" value="MD"></el-option>
                                <el-option label="TWT" value="TWT"></el-option>
                                <el-option label="OWT" value="OWT"></el-option>
                            </el-select>
                        </div>
                        <div class="form-row separator">
                            <label>Range</label>
                            <hr>
                        </div>
                        <div class="radio-group vertical">
                            <el-radio-group v-model="Range">
                                <div class="radio-item">
                                    <el-radio label="Automatic" size="large">Automatic</el-radio>
                                </div>
                                <div class="radio-item">
                                    <el-radio label="Specified" size="large">Specified</el-radio>
                                </div>
                            </el-radio-group>
                            <div class="range-inputs">
                                <div class="input-row">
                                    <label>Start:</label>
                                    <el-input v-model="rangeStart" placeholder="Enter start value"
                                        :disabled="Range !== 'Specified'" style="width: 150px; margin-left: 10px;" />m
                                </div>
                                <div class="input-row">
                                    <label>Stop:</label>
                                    <el-input v-model="rangeStop" placeholder="Enter stop value"
                                        :disabled="Range !== 'Specified'" style="width: 150px; margin-left: 10px;" />m
                                </div>
                            </div>
                        </div>
                        <div class="form-row separator">
                            <label>When well log exists</label>
                            <hr>
                        </div>
                        <div class="radio-group vertical">
                            <el-radio-group v-model="whenWellLogExists">
                                <div class="radio-item">
                                    <el-radio label="Overwrite" size="large">Overwrite</el-radio>
                                </div>
                                <div class="radio-item">
                                    <el-radio label="Add" size="large">Add</el-radio>
                                </div>
                            </el-radio-group>
                        </div>
                        <div class="form-row separator">
                            <label>Coordinate reference system</label>
                            <hr>
                        </div>
                        <div class="coordinate-inputs">
                            <div class="input-row">
                                <label>Project Crs:</label>
                                <el-input v-model="projectCrs" placeholder="Enter project CRS" disabled
                                    style="width: 300px;" />
                            </div>
                            <div class="input-row">
                                <label>File CRS:</label>
                                <el-input v-model="fileCrs" placeholder="Enter file CRS" disabled
                                    style="width: 300px; " />
                            </div>
                            <div class="button-row">
                                <el-button disabled>Select other</el-button>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>
                <el-tab-pane name="Log attributes">
                    <template #label>
                        <span>Log attributes</span>
                    </template>
                    <div class="tab-content">
                        <div class="table-button-row">
                            <span>Load:</span>
                            <el-button size="small" @click="handleLoadAll">All</el-button>
                            <el-button size="small" @click="handleLoadNone">None</el-button>
                        </div>
                        <div class="mapping-table-container">
                            <el-table :data="unitMap" class="mapping-table" style="width: 100%"
                                :cell-style="getCellStyle" :header-cell-style="getHeaderCellStyle" ref="mappingTableRef"
                                border resizable height="200">
                                <el-table-column prop="index" label="" :min-width="50" resizable show-overflow-tooltip>
                                    <template #default="{ $index }">
                                        {{ $index + 1 }}
                                    </template>
                                </el-table-column>
                                <el-table-column prop="Load" label="Load" :min-width="50" resizable
                                    show-overflow-tooltip>
                                    <template #default="{ row }">
                                        <el-checkbox v-model="row.load" @change="handleLoadChange(row)"></el-checkbox>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="Name" label="Name" :min-width="80" resizable
                                    show-overflow-tooltip>
                                </el-table-column>
                                <el-table-column prop="Value" label="Value" :min-width="80" resizable
                                    show-overflow-tooltip>
                                </el-table-column>
                                <el-table-column prop="Attribute" label="Attribute" :min-width="80" resizable
                                    show-overflow-tooltip>
                                    <template #default="{ row }">
                                        <el-select v-model="row.attributeValue" placeholder="Select attribute"
                                            style="width: 100%" @change="handleAttributeChange(row)">
                                            <el-option v-for="option in attributeOptions" :key="option.value"
                                                :label="option.label" :value="option.value">
                                            </el-option>
                                        </el-select>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="Type" label="Type" :min-width="80" resizable
                                    show-overflow-tooltip>
                                    <template #default="{ row }">
                                        <el-select v-if="row.attributeValue === 'create_new'" v-model="row.typeValue"
                                            placeholder="Select type" style="width: 100%">
                                            <el-option v-for="option in typeOptions" :key="option.value"
                                                :label="option.label" :value="option.value">
                                            </el-option>
                                        </el-select>
                                        <el-select v-else-if="row.attributeValue"
                                            :model-value="getCorrespondingType(row.attributeValue)"
                                            placeholder="Corresponding type" style="width: 100%" disabled>
                                            <el-option :label="getCorrespondingType(row.attributeValue)"
                                                :value="getCorrespondingType(row.attributeValue)">
                                            </el-option>
                                        </el-select>
                                        <div v-else style="padding: 8px;">
                                        </div>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="Template" label="Template" :min-width="80" resizable
                                    show-overflow-tooltip>
                                    <template #default="{ row }">
                                        <el-select v-model="row.wellTrace" placeholder="Select well trace"
                                            style="width: 100%" @change="handleWellTraceChange(row)">
                                            <el-option v-for="option in wellTraceOptions" :key="option.value"
                                                :label="option.label" :value="option.value">
                                            </el-option>
                                        </el-select>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="Unit{File}" label="Unit{File}" :min-width="100" resizable
                                    show-overflow-tooltip>
                                </el-table-column>
                                <el-table-column prop="Unit{PreVise}" label="Unit{PreVise}" :min-width="110" resizable
                                    show-overflow-tooltip>
                                </el-table-column>
                                <el-table-column prop="Description" label="Description" :min-width="110" resizable
                                    show-overflow-tooltip>
                                </el-table-column>
                            </el-table>
                        </div>
                        <!-- 添加日期信息展示区域 -->
                        <div class="date-info-section">
                            <div class="date-info-row">
                                <div class="date-info-item">
                                    <label>Date format:</label>
                                    <el-input v-model="dateFormatValue" readonly disabled
                                        style="width: 200px; margin-left: 10px;" />
                                </div>
                                <div class="date-info-item">
                                    <label>File string:</label>
                                    <span class="file-string-value">{{ formattedRunDate }}</span>
                                </div>
                            </div>

                            <div class="date-info-row">
                                <div class="date-info-item">
                                    <label>Date sample:</label>
                                    <span class="date-sample-value">{{ currentDateTime }}</span>
                                </div>
                                <div class="date-info-item">
                                    <label>File value:</label>
                                    <span class="file-value-value">{{ formattedRunDate }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>
            </el-tabs>
            <div class="tab-content-information">
                <!-- 显示当前文件信息 -->
                <div class="file-additional-info" v-if="currentFileInfo && currentFileIndex < props.filePaths.length">
                    <!-- 第一行信息 -->
                    <p class="info-line">
                        {{ props.filePaths[currentFileIndex] }} ->
                        <span
                            v-if="wellNameBasedOn === 'Dynamic' || getCurrentFileMappingWellTrace() === 'create_new_well'">
                            {{ currentFileInfo.WELL || 'Unknown Well' }}
                        </span>
                        <span v-else>
                            {{ getSelectedWellName() }}
                        </span>
                    </p>

                    <!-- 第二行信息 -->
                    <p class="info-line">
                        <span>MD increases</span>
                        <span>Not wrapped</span>
                        <span>Undef={{ currentFileInfo.NULL || '-999.25' }}</span>
                        <span
                            v-if="wellNameBasedOn === 'Dynamic' || getCurrentFileMappingWellTrace() === 'create_new_well'"
                            class="missing-well-warning">
                            Missing Well '{{ currentFileInfo.WELL || "Unknown Well" }}' will be created
                        </span>
                    </p>
                </div>
                <!-- 显示文件原始内容 -->
                <div class="file-content-container" v-if="currentFileContent">
                    <h4>Headers:</h4>
                    <pre class="file-content">{{ currentFileContent }}</pre>
                </div>
                <div v-else class="loading-content">
                    Loading file content...
                </div>
            </div>
        </div>
        <!-- 添加按钮 -->
        <div class="button-container">
            <el-button @click="handleOkForAll">
                <img src="@/assets/image/ok.png" alt="OK" class="button-icon" /> OK for all
            </el-button>
            <el-button @click="handleOkForOne">
                <img src="@/assets/image/ok.png" alt="OK" class="button-icon" /> OK
            </el-button>
            <el-button @click="handleCancelInput">
                <img src="@/assets/image/cancel.png" alt="Cancel" class="button-icon" /> Cancel
            </el-button>
        </div>
    </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { ElTable, ElTableColumn, ElSelect, ElOption } from 'element-plus'
import useGeoMetaStore from "@/store/geometa";
import { readTextFile } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';
import { ProjectRecordService } from '@/api/project';
const strGeoMeta = useGeoMetaStore();
// 定义 props
const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    filePaths: {  // 修改为接收文件路径数组
        type: Array,
        default: () => []
    }
})
const inputPane = computed(() => {
    const pane = strGeoMeta.aPane.find(o => 'Input' === o.title);
    return pane ? pane.folders : [];
});
const emit = defineEmits(['update:visible', 'close'])
// 当前文件信息（从LAS文件头解析）
const currentFileInfo = ref({})
// 响应式数据
const matchBy = ref('Well name')
const wellNameBasedOn = ref('Dynamic')
//setting下拉
const indexLogType = ref('MD')
//勾选
const Range = ref('Automatic')
const whenWellLogExists = ref('Overwrite')
const Matching = ref('Create')
// 文件映射数据
const fileMappingData = ref([])
const unitMap = ref([])  // UnitMap表格数据
const rangeStart = ref('') // 起始值
const rangeStop = ref('')  // 结束值
const rangeStep = ref('')//间隔
const projectCrs = ref('<undef>') // Project CRS 值
const fileCrs = ref('Null')    // File CRS 值
const wellNameTip = ref('')

// 井轨迹选项（示例数据，实际应从后端获取）
const wellTraceOptions = ref([
    { value: 'create_new_well', label: 'Create new well' }
])
// 时间展示
const runDateValue = ref('') // Run date 值（从文件中的DATE提取）
const dateFormatValue = ref('yyyy-MM-dd HH:mm:ss') // Date format 值
//导入数据
const importData = ref({
    columnMap: {
        0: "channel_name",
        1: "depth_array",
        2: "data_array",
        3: "description",
        4: "unit",
    },
    data: [],
    alias: '',
    indexType: indexLogType.value,
    startIndex: rangeStart.value,
    endIndex: rangeStop.value,
    indexSpacing: rangeStep.value,
    indexUnit: '',
    samples: 1,
    invalidValue: '',
    dataId: ''
})
const matchedDataSummary = computed(() => {
    const summary = displayMatchedData.value.map(item => ({
        logName: item['Log Name'],
        unitFile: item['Unit{File}'],
        description: item['Description']
    }));

    summary.unshift({
        logName: indexLogType.value,
        unitFile: 'm',
        description: ''
    });

    return summary;
});
// 控制第二个对话框显示
const showInput = ref(false)
// 当前处理的文件索引
const currentFileIndex = ref(0)
// 当前文件内容
const currentFileContent = ref('')
// 是否继续处理下一个文件
const shouldContinueProcessing = ref(true)
// 活动标签页
const activeTab = ref('Data')
// 表格引用
const mappingTableRef = ref(null)
// 计算属性：根据选择的匹配方式动态改变标签
const wellNameBasedOnLabel = computed(() => {
    return matchBy.value === 'UWI' ? 'UWI based on' : 'Well name based on'
})
const matchedData = ref([])    // Matched表格数据
const unmatchedData = ref([])  // Unmatched表格数据
const columnData = ref([]); // 存储每列数据的数组
const matchTip = ref([])
// 全选Matched区域的Load复选框
const handleLoadAllMatched = () => {
    matchedData.value.forEach(item => {
        item.load = true;
    });
}

// 取消全选Matched区域的Load复选框
const handleLoadNoneMatched = () => {
    matchedData.value.forEach(item => {
        item.load = false;
    });
}

// 全选Unmatched区域的Load复选框
const handleLoadAllUnmatched = () => {
    unmatchedData.value.forEach(item => {
        item.load = true;
    });
}

// 取消全选Unmatched区域的Load复选框
const handleLoadNoneUnmatched = () => {
    unmatchedData.value.forEach(item => {
        item.load = false;
    });
}

// 添加处理Attribute变化的方法
const handleAttributeChange = (row) => {
    // 如果选择的不是"Create new"，则设置对应的Type值并清空typeValue
    if (row.attributeValue !== 'create_new') {
        row.typeValue = ''; // 清空选择值，因为我们显示的是固定对应值
    }
};

// 在响应式数据部分添加
const attributeOptions = ref([
    { value: 'sample_rate', label: 'Sample rate' },
    { value: 'run_date', label: 'Run date' },
    { value: 'log_alias', label: 'Log alias' },
    { value: 'log_type', label: 'Log type' },
    { value: 'log_source', label: 'Log source' },
    { value: 'log_version', label: 'Log version' },
    { value: 'tooltype', label: 'Tooltype' },
    { value: 'create_new', label: 'Create new' }
]);

const typeOptions = ref([
    { value: 'String', label: 'String' },
    { value: 'Continuous', label: 'Continuous' },
    { value: 'Date/Time', label: 'Date/Time' },
    { value: 'Boolean', label: 'Boolean' },
    { value: 'Discrete', label: 'Discrete' }
]);

// 添加一个计算属性来获取Attribute和Type的对应关系
const attributeTypeMap = computed(() => {
    return {
        'sample_rate': 'Date/Time',
        'run_date': 'Continuous',
        'log_alias': 'String',
        'log_type': 'String',
        'log_source': 'String',
        'log_version': 'Discrete',
        'tooltype': 'String'
    };
});
const resetFormState = () => {
    // 重置匹配选项
    matchBy.value = 'Well name';

    // 重置设置选项
    indexLogType.value = 'MD';
    Range.value = 'Automatic';
    whenWellLogExists.value = 'Overwrite';
    Matching.value = 'Create';

    // 重置范围值
    rangeStart.value = '';
    rangeStop.value = '';
    rangeStep.value = '';

    // 重置表格数据
    matchedData.value = [];
    unmatchedData.value = [];
    unitMap.value = [];

    // 重置复选框状态
    handleLoadNoneMatched(); // 取消全选Matched区域
    handleLoadNoneUnmatched(); // 取消全选Unmatched区域
    handleLoadNone(); // 取消全选Log attributes区域

};
// 计算展示用的matchedData，处理重复曲线名称
const displayMatchedData = computed(() => {
    // 获取当前选择的井 ID
    const selectedWellId = getCurrentFileMappingWellTrace();

    // 如果没有选择井或选择的是创建新井，则直接返回原始数据
    if (!selectedWellId || selectedWellId === 'create_new_well') {
        return matchedData.value;
    }

    // 查找Wells节点
    const findWellsNode = (folders) => {
        if (!Array.isArray(folders)) return null;

        for (const folder of folders) {
            if (folder.id === 'Wells') {
                return folder;
            }
            if (folder.children) {
                const result = findWellsNode(folder.children);
                if (result) return result;
            }
        }
        return null;
    };

    // 根据 ID 查找指定井节点
    const findWellNodeById = (wellsNode, wellId) => {
        if (!wellsNode || !wellsNode.children) return null;

        const findNode = (nodes, id) => {
            if (!Array.isArray(nodes)) return null;

            for (const node of nodes) {
                if (node.id === id) {
                    return node;
                }
                if (node.children) {
                    const result = findNode(node.children, id);
                    if (result) return result;
                }
            }
            return null;
        };

        return findNode(wellsNode.children, wellId);
    };

    // 查找Well logs文件夹
    const findWellLogsFolder = (wellNode) => {
        if (!wellNode || !wellNode.children) return null;

        return wellNode.children.find(child =>
            child.parentId === wellNode.id && child.label === 'Well logs'
        );
    };

    // 获取输入面板
    const inputPaneItem = strGeoMeta.aPane.find(o => 'Input' === o.title);
    if (!inputPaneItem) return matchedData.value;

    // 查找Wells节点
    const wellsNode = findWellsNode(inputPaneItem.folders);
    if (!wellsNode) return matchedData.value;

    // 根据 ID 查找目标井节点
    const wellNode = findWellNodeById(wellsNode, selectedWellId);
    if (!wellNode) return matchedData.value;

    // 查找Well logs文件夹
    const wellLogsFolder = findWellLogsFolder(wellNode);
    if (!wellLogsFolder) return matchedData.value;

    // 获取已存在的日志名称列表
    const existingLogNames = wellLogsFolder.children
        .filter(child => child.parentId === wellLogsFolder.id && !child.isFolder)
        .map(child => child.label);

    // 处理matchedData中的重复名称
    const processedData = matchedData.value.map(item => {
        // 创建新对象以避免修改原始数据
        const newItem = { ...item };

        if (newItem['Log Name']) {
            let logName = newItem['Log Name'];
            let finalLogName = logName;
            let counter = 1;

            // 检查是否已存在，如果存在则添加自增数字
            const exists = (name) => existingLogNames.includes(name);

            while (exists(finalLogName)) {
                finalLogName = `${logName}${counter}`;
                counter++;
            }

            // 更新显示名称
            newItem['Log Name'] = finalLogName;
        }

        return newItem;
    });

    return processedData;
});
// 添加一个方法来获取对应类型
const getCorrespondingType = (attributeValue) => {
    return attributeTypeMap.value[attributeValue] || '';
};
// 获取当前文件的时间
const currentDateTime = computed(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
});
// 计算属性控制对话框显示
const showLoggingImport = computed({
    get: () => props.visible,
    set: (val) => {
        emit('update:visible', val)
        if (!val) {
            emit('close')
        }
    }
})

// 获取文件名（不包含路径）
const getFileBaseName = (filePath) => {
    const fileName = filePath.split(/[\/\\]/).pop()
    // 去掉.las扩展名（不区分大小写）
    return fileName.replace(/\.las$/i, '')
}

// 获取当前文件名
const getCurrentFileName = () => {
    if (currentFileIndex.value < props.filePaths.length) {
        return getFileBaseName(props.filePaths[currentFileIndex.value])
    }
    return ''
}
const isLineAllNumbers = (line) => {
    // 去除首尾空格
    const trimmedLine = line.trim();
    // 空行不算全是数字
    if (trimmedLine === '') return false;
    // 检查是否只包含数字、空格、制表符、负号和小数点
    return /^[\d\s\t\-\+\.eE]+$/.test(trimmedLine) && /\d/.test(trimmedLine);
}

// 读取当前文件内容，显示从第一行到第一个全是数字的行之间的所有内容
const loadCurrentFileContent = async () => {
    if (currentFileIndex.value < props.filePaths.length) {
        try {
            const filePath = props.filePaths[currentFileIndex.value]
            const content = await readTextFile(filePath)

            // 解析文件头部信息
            currentFileInfo.value = parseLasHeaderInfo(content)
            // 设置STRT和STOP的初始值
            if (currentFileInfo.value.STRT) {
                rangeStart.value = currentFileInfo.value.STRT
            }
            if (currentFileInfo.value.STOP) {
                rangeStop.value = currentFileInfo.value.STOP
            }
            if (currentFileInfo.value.STEP) {
                rangeStep.value = currentFileInfo.value.STEP
            }

            // 设置Run date的值
            if (currentFileInfo.value.DATE) {
                runDateValue.value = currentFileInfo.value.DATE
            }

            // 按行分割内容
            const lines = content.split('\n')

            // 存储要显示的行
            const displayLines = []

            // 查找DEPTH行和下一个~开头的行（用于matchedData）
            let depthLineIndex = -1
            let nextTildeLineIndexForDepth = -1

            // 找到DEPTH行
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith('DEPTH') || lines[i].trim().startsWith('DEPT')) {
                    depthLineIndex = i
                    break
                }
            }

            // 如果找到了DEPTH行，查找下一个~开头的行
            if (depthLineIndex !== -1) {
                for (let i = depthLineIndex + 1; i < lines.length; i++) {
                    if (lines[i].trim().startsWith('~')) {
                        nextTildeLineIndexForDepth = i
                        break
                    }
                }

                // 提取Matched数据（DEPTH下一行到下一个~行之前）
                if (nextTildeLineIndexForDepth !== -1) {
                    const matchedLines = lines.slice(depthLineIndex + 1, nextTildeLineIndexForDepth)
                    // 过滤掉空行和只有空格的行
                    const filteredMatchedLines = matchedLines.filter(line => line.trim() !== '')

                    // 更新matchedData（DEPTH相关数据）
                    matchedData.value = filteredMatchedLines.map((line, index) => {
                        // 解析行数据，这里假设是以空格分隔的
                        const values = line.trim().split(/\s+/)
                        if (values[0] && values[0].includes('.')) {
                            const parts = values[0].split('.')
                            values.splice(0, 1, parts[0], parts[1]) // 替换第一个元素为两个元素
                        }
                        return {
                            index: index + 1,
                            load: true,
                            // 这里可以根据实际需要调整字段
                            'Log Name': values[0] || '',
                            'Unit{File}': values[1] ? values[1].replace(/\./g, '') : '',
                            'Unit{PreVise}': '',
                            'Description': values[3] || '',
                            wellTrace: 'create_new_regular_log' // 默认选择
                        }
                    })
                }
            }

            // 查找STEP行和下一个~开头的行（用于unitMap）
            let stepLineIndex = -1
            let nextTildeLineIndexForStep = -1

            // 找到STEP行
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith('STEP')) {
                    stepLineIndex = i
                    break
                }
            }
            // 如果找到了STEP行，查找下一个~开头的行
            if (stepLineIndex !== -1) {
                for (let i = stepLineIndex; i < lines.length; i++) {  // 从STEP行开始（包含STEP行）
                    if (i > stepLineIndex && lines[i].trim().startsWith('~')) {  // 从下一行开始检查~
                        nextTildeLineIndexForStep = i
                        break
                    }
                }

                // 提取UnitMap数据（从STEP行开始到下一个~行之前，包含STEP行）
                if (nextTildeLineIndexForStep !== -1) {
                    const unitMapLines = lines.slice(stepLineIndex, nextTildeLineIndexForStep)  // 包含STEP行
                    // 过滤掉空行和只有空格的行，以及以WELL和NULL开头的行
                    const filteredUnitMapLines = unitMapLines.filter(line => {
                        const trimmedLine = line.trim()
                        return trimmedLine !== '' &&
                            !trimmedLine.startsWith('WELL') &&
                            !trimmedLine.startsWith('NULL')
                    })

                    // 在现有的 unitMap 数据处理部分修改映射逻辑
                    // 更新unitMap数据（保留secondData为空的行）
                    unitMap.value = filteredUnitMapLines
                        .filter(line => {
                            const parsedData = parseLasLine(line.trim());
                            return parsedData.length >= 3 ||
                                (parsedData.length === 2 && parsedData[1] && parsedData[1].endsWith(':')); // 只保留长度大于等于3的行
                        })
                        .map((line, index) => {
                            // 使用新的解析逻辑
                            const parsedData = parseLasLine(line.trim())
                            // 从第一个部分中提取点前和点后的数据
                            let nameData = '';
                            let valueData = '';

                            if (parsedData[0]) {
                                if (parsedData[0].includes('.')) {
                                    const dotParts = parsedData[0].split('.');
                                    nameData = dotParts[0];     // 点前面的数据
                                    valueData = dotParts[1];    // 点后面的数据
                                } else {
                                    nameData = parsedData[0];   // 如果没有点，全部作为name
                                }
                            }

                            // 处理Description字段，去掉parsedData[2]中的第一个冒号
                            let description = parsedData[2] || '';
                            if (description && description.startsWith(':')) {
                                description = description.substring(1); // 去掉第一个字符（冒号）
                            }
                            return {
                                index: index + 1,
                                load: true,
                                'Name': nameData || '',              // Name为点前面的数据
                                'Value': parsedData[1] ? parsedData[1].replace(/:$/, '') : '',        // Value为点后面的数据
                                'Unit{File}': valueData || '',       // Unit{File}为点后面的数据
                                'Unit{PreVise}': '',
                                'Description': description,          // Description为parsedData[2]去掉第一个冒号
                                wellTrace: '',
                                attributeValue: 'create_new',                  // Attribute下拉值
                                typeValue: ''                        // Type下拉值
                            }
                        });
                    // 注意：不再过滤secondData为空的行
                }
            }

            // 提取数据部分（全是数字的行）
            extractColumnData(lines);
            // 显示头部信息（原来的逻辑保持不变）
            for (const line of lines) {
                displayLines.push(line)
                // 如果当前行是全是数字的行，则停止
                if (isLineAllNumbers(line)) {
                    break
                }
            }
            // 将要显示的行连接成字符串
            currentFileContent.value = displayLines.join('\n') || 'No header data found in file'
        } catch (error) {
            console.error('Error reading file:', error)
            currentFileContent.value = 'Error loading file content'
            currentFileInfo.value = {}
            matchedData.value = []
            unmatchedData.value = []
            unitMap.value = [] // 清空unitMap
            columnData.value = []; // 清空列数据
        }
    } else {
        currentFileContent.value = ''
        currentFileInfo.value = {}
        matchedData.value = []
        unmatchedData.value = []
        unitMap.value = [] // 清空unitMap
        columnData.value = []; // 清空列数据
    }
}
// 添加提取列数据的函数
const extractColumnData = (lines) => {
    // 找到第一个全是数字的行
    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (isLineAllNumbers(lines[i])) {
            startIndex = i;
            break;
        }
    }

    // 如果找到了数据开始行
    if (startIndex !== -1) {
        // 提取从开始行到文件末尾的所有数据行
        const dataLines = lines.slice(startIndex).filter(line => isLineAllNumbers(line));

        if (dataLines.length > 0) {
            // 初始化列数组
            const columns = [];

            // 处理每一行数据
            dataLines.forEach(line => {
                const values = line.trim().split(/\s+/);

                // 确保列数组有足够的空间
                while (columns.length < values.length) {
                    columns.push([]);
                }

                // 将每个值添加到对应的列数组中
                values.forEach((value, index) => {
                    columns[index].push(parseFloat(value));
                });
            });

            // 更新columnData
            columnData.value = columns;
        } else {
            columnData.value = [];
        }
    } else {
        columnData.value = [];
    }
};

// 修改parseLasLine函数，按照空格划分
const parseLasLine = (line) => {
    const trimmedLine = line.trim();
    // 按空格分割行
    const parts = trimmedLine.split(/ {2,}/);
    return parts
};
const getCellStyle = ({ row, column, rowIndex, columnIndex }) => {
    return {
        backgroundColor: 'white',
        borderBottom: '1px solid #ebeef5',
        padding: '0'
    }
}

const getHeaderCellStyle = ({ row, column, rowIndex, columnIndex }) => {
    return {
        backgroundColor: '#f5f7fa',
        fontWeight: 'bold',
        borderBottom: '1px solid #ebeef5',
        padding: '0'
    }
}

// 处理井轨迹选择变化
const handleWellTraceChange = (row) => {
    // 可以在这里处理选择变化的逻辑
}

// 从inputPane中收集井名数据
const collectWellNames = () => {
    try {
        // 直接遍历所有节点查找井
        const collectAllWells = (folders) => {  // 修复：原来是 forkers
            const wells = [];
            if (!Array.isArray(folders)) return wells;  // 修复：原来是 forkers

            folders.forEach(folder => {
                // 收集parentId为'Wells'的节点（直接子井），但排除'Wells Not Found'文件夹本身
                if (folder.parentId === 'Wells' && folder.label && folder.label !== 'Wells Not Found') {
                    wells.push({ id: folder.id, label: folder.label });
                }

                // 收集parentId为'wells_not_found'的节点（Wells Not Found下的井）
                if (folder.parentId === 'wells_not_found' && folder.label) {
                    wells.push({ id: folder.id, label: folder.label });
                }

                // 递归处理子节点
                if (folder.children && folder.children.length > 0) {
                    wells.push(...collectAllWells(folder.children));
                }
            });

            return wells;
        };

        const wells = collectAllWells(inputPane.value);

        // 更新wellTraceOptions，保留"Create new well"并添加收集到的井信息
        const options = [{ value: 'create_new_well', label: 'Create new well' }];

        wells.forEach(well => {
            // 为每个井创建选项，包含ID和标签
            options.push({
                value: well.id,
                label: well.label
            });
        });

        wellTraceOptions.value = options;
    } catch (error) {
        console.error('Error collecting well names:', error);
    }
};
// 处理文件选择变化
// 修改 formattedRunDate 计算属性
const formattedRunDate = computed(() => {
    if (!runDateValue.value) return ''

    // 尝试解析不同格式的日期
    let dateObj = null;

    // 格式1: Tuesday, July 02 2002 10:57:24
    const format1Regex = /^\w+,\s+(\w+)\s+(\d{1,2})\s+(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/
    const format1Match = runDateValue.value.match(format1Regex)

    if (format1Match) {
        const [, month, day, year, hour, minute, second] = format1Match
        // 将月份名称转换为数字
        const months = {
            'January': '01', 'February': '02', 'March': '03', 'April': '04',
            'May': '05', 'June': '06', 'July': '07', 'August': '08',
            'September': '09', 'October': '10', 'November': '11', 'December': '12'
        }
        const monthNum = months[month] || '01'
        const paddedDay = day.padStart(2, '0')
        const paddedHour = hour.padStart(2, '0')
        const paddedMinute = minute.padStart(2, '0')
        const paddedSecond = second.padStart(2, '0')

        return `${year}-${monthNum}-${paddedDay} ${paddedHour}:${paddedMinute}:${paddedSecond}`
    }

    // 格式2: 02-Jul-2002 10:57:24
    const format2Regex = /^(\d{1,2})-(\w{3})-(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/
    const format2Match = runDateValue.value.match(format2Regex)

    if (format2Match) {
        const [, day, month, year, hour, minute, second] = format2Match
        // 将月份缩写转换为数字
        const months = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        }
        const monthNum = months[month] || '01'
        const paddedDay = day.padStart(2, '0')
        const paddedHour = hour.padStart(2, '0')
        const paddedMinute = minute.padStart(2, '0')
        const paddedSecond = second.padStart(2, '0')

        return `${year}-${monthNum}-${paddedDay} ${paddedHour}:${paddedMinute}:${paddedSecond}`
    }

    // 格式3: 2002/07/02 10:57:24
    const format3Regex = /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})$/
    const format3Match = runDateValue.value.match(format3Regex)

    if (format3Match) {
        const [, year, month, day, hour, minute, second] = format3Match
        const paddedMonth = month.padStart(2, '0')
        const paddedDay = day.padStart(2, '0')
        const paddedHour = hour.padStart(2, '0')
        const paddedMinute = minute.padStart(2, '0')
        const paddedSecond = second.padStart(2, '0')

        return `${year}-${paddedMonth}-${paddedDay} ${paddedHour}:${paddedMinute}:${paddedSecond}`
    }

    // 如果无法解析，返回原始值
    return runDateValue.value
})
// 解析LAS文件头部信息
const parseLasHeaderInfo = (content) => {
    const info = {
        WELL: '',
        NULL: '-999.25',
        STRT: '',
        STOP: '',
        DATE: '',// 添加 DATE 字段
        STEP: '',
    }
    const lines = content.split('\n')
    let inHeaderSection = false
    for (const line of lines) {
        const trimmedLine = line.trim()
        // 检查是否进入头部部分
        if (trimmedLine.startsWith('~')) {
            inHeaderSection = trimmedLine.startsWith('~V') || trimmedLine.startsWith('~W')
            continue
        }
        // 如果在头部部分，解析键值对
        if (inHeaderSection && trimmedLine.includes('.')) {
            // 找到第一个点的位置
            const firstDotIndex = trimmedLine.indexOf('.')
            if (firstDotIndex !== -1) {
                const key = trimmedLine.substring(0, firstDotIndex).trim()
                let value

                // 对于DATE字段做特殊处理，保留完整值
                if (key === 'DATE') {
                    // 对于DATE，取点号之后的所有内容，然后去除可能的描述部分
                    const afterDot = trimmedLine.substring(firstDotIndex + 1)
                    // 查找最后一个冒号，这通常是描述部分的开始
                    const lastColonIndex = afterDot.lastIndexOf(':')
                    if (lastColonIndex !== -1 && lastColonIndex > 0) {
                        // 检查冒号后是否是描述文本（而非时间格式中的冒号）
                        const afterColon = afterDot.substring(lastColonIndex + 1).trim()
                        // 如果冒号后是字母，则认为是描述部分
                        if (afterColon && /[a-zA-Z]/.test(afterColon.charAt(0))) {
                            value = afterDot.substring(0, lastColonIndex).trim()
                        } else {
                            // 否则认为整个都是值
                            value = afterDot.trim()
                        }
                    } else {
                        value = afterDot.trim()
                    }
                } else {
                    // 对于其他字段使用原有逻辑
                    const firstColonIndex = trimmedLine.indexOf(':', firstDotIndex)
                    if (firstColonIndex !== -1) {
                        // 有点也有冒号: KEY . VALUE : DESCRIPTION
                        value = trimmedLine.substring(firstDotIndex + 1, firstColonIndex).trim()
                    } else {
                        // 只有点: KEY . VALUE
                        value = trimmedLine.substring(firstDotIndex + 1).trim()
                    }

                    // 对于STRT和STOP，直接提取数字部分（包括小数点和负号）
                    if (key === 'STRT' || key === 'STOP' || key === 'STEP') {
                        // 使用正则表达式提取数字部分（包括负号和小数点）
                        const numberMatch = value.match(/-?\d+\.?\d*/)
                        if (numberMatch) {
                            value = numberMatch[0]
                        } else {
                            value = '' // 如果没有找到数字，则设为空
                        }
                    } else if (key !== 'DATE') {
                        // 对于其他非DATE字段，保持原有逻辑
                        if (value.includes(' ')) {
                            value = value.split(' ')[0]
                        }
                    }
                }
                // console.log(key, value)
                if (key === 'WELL') {
                    info.WELL = value
                } else if (key === 'NULL') {
                    info.NULL = value
                } else if (key === 'STRT') {
                    info.STRT = value
                } else if (key === 'STOP') {
                    info.STOP = value
                } else if (key === 'DATE') {
                    info.DATE = value
                } else if (key === 'STEP') {
                    info.STEP = value
                }
            }
        }

        // 如果遇到数据部分则停止解析
        if (isLineAllNumbers(trimmedLine) && trimmedLine !== '') {
            break
        }
    }

    return info
}
// 获取当前文件映射的井轨迹值
const getCurrentFileMappingWellTrace = () => {
    if (currentFileIndex.value < fileMappingData.value.length) {
        return fileMappingData.value[currentFileIndex.value].wellTrace
    }
    return ''
}
// 添加一个方法来获取选中井的名称
const getSelectedWellName = () => {
    const selectedWellId = getCurrentFileMappingWellTrace();

    // 如果是创建新井，返回文件中的井名
    if (selectedWellId === 'create_new_well' || !selectedWellId) {
        return currentFileInfo.value.WELL || 'Unknown Well';
    }

    // 在 wellTraceOptions 中查找对应的井名
    const selectedWell = wellTraceOptions.value.find(option => option.value === selectedWellId);

    // 如果找到了，返回标签（井名），否则返回井ID
    return selectedWell ? selectedWell.label : selectedWellId;
};
// 监听inputPane变化，更新井名选项
watch(inputPane, () => {
    collectWellNames();
}, { immediate: true });

// 监听文件路径变化，初始化映射关系
// 在 watch props.filePaths 的处理函数中
watch(() => props.filePaths, (newFilePaths) => {
    if (newFilePaths && newFilePaths.length > 0) {
        // 初始化文件映射数据
        const initialData = newFilePaths.map(file => {
            const fileName = getFileBaseName(file)
            return {
                fileName: fileName,
                wellTrace: 'create_new_well',
                load: true
            }
        })

        fileMappingData.value = initialData
        // 根据业务逻辑分配到matched和unmatched数据中
        matchedData.value = initialData  // 示例：暂时将所有数据放到matched
        unmatchedData.value = []         // 示例：unmatched为空
    } else {
        fileMappingData.value = []
        matchedData.value = []
        unmatchedData.value = []
    }
}, { immediate: true })

// 监听当前文件索引变化，加载对应文件内容
watch(currentFileIndex, () => {
    loadCurrentFileContent();
});
//过滤数据
const filterColumnDataByRange = () => {
    if (!columnData.value || columnData.value.length === 0) {
        return [];
    }

    // 获取第一列作为索引列（通常是深度数据）
    const indexColumn = columnData.value[0];

    // 确保范围值存在且为数字
    const startValue = rangeStart.value !== '' ? parseFloat(rangeStart.value) : -Infinity;
    const stopValue = rangeStop.value !== '' ? parseFloat(rangeStop.value) : Infinity;

    // 找出符合范围条件的索引位置
    const validIndices = [];
    indexColumn.forEach((value, index) => {
        if (value >= startValue && value <= stopValue) {
            validIndices.push(index);
        }
    });

    // 根据有效索引位置过滤所有列
    const filteredColumns = columnData.value.map(column => {
        return validIndices.map(index => column[index]);
    });

    return filteredColumns;
};
//更新树结构
// 修改 updateTreeStructure 函数
const updateTreeStructure = () => {
    // 添加边界检查
    if (currentFileIndex.value >= fileMappingData.value.length || fileMappingData.value.length === 0) {
        return;
    }

    // 获取 Input 面板
    const inputPaneItem = strGeoMeta.aPane.find(o => 'Input' === o.title);
    if (!inputPaneItem) return;

    // 获取当前选择的井 ID
    let selectedWellId = '';
    if (currentFileIndex.value < fileMappingData.value.length) {
        selectedWellId = fileMappingData.value[currentFileIndex.value].wellTrace;
    }

    // 查找Wells节点
    const findWellsNode = (folders) => {
        if (!Array.isArray(folders)) return null;

        for (const folder of folders) {
            if (folder.id === 'Wells') {
                return folder;
            }
            if (folder.children) {
                const result = findWellsNode(folder.children);
                if (result) return result;
            }
        }
        return null;
    };

    // 根据 ID 查找指定井节点
    const findWellNodeById = (wellsNode, wellId) => {
        if (!wellsNode || !wellsNode.children) return null;

        const findNode = (nodes, id) => {
            if (!Array.isArray(nodes)) return null;

            for (const node of nodes) {
                if (node.id === id) {
                    return node;
                }
                if (node.children) {
                    const result = findNode(node.children, id);
                    if (result) return result;
                }
            }
            return null;
        };

        return findNode(wellsNode.children, wellId);
    };

    // 查找或创建Well logs文件夹
    const findOrCreateWellLogsFolder = (wellNode) => {
        if (!wellNode || !wellNode.children) return null;

        // 查找现有的Well logs文件夹
        let wellLogsFolder = wellNode.children.find(child =>
            child.parentId === wellNode.id && child.label === 'Well logs'
        );

        // 如果不存在，则创建
        if (!wellLogsFolder) {
            wellLogsFolder = {
                id: `${wellNode.id}_well_logs`,
                label: 'Well logs',
                parentId: wellNode.id,
                src: "/src/assets/image/global well logs.png",
                children: [],
                isFolder: true
            };
            wellNode.children.push(wellLogsFolder);
        }

        return wellLogsFolder;
    };

    // 在Well logs下添加日志项
    const addLogItems = (wellLogsFolder) => {
        if (!wellLogsFolder || !matchTip.value) return;

        // 使用displayMatchedData来获取处理后的曲线名称
        const processedLogs = displayMatchedData.value;

        // 按照导入顺序添加日志项，保持原有的顺序
        processedLogs.forEach((log, index) => {
            if (log['Log Name']) {
                const logItem = {
                    id: `${wellLogsFolder.id}_${log['Log Name']}`,
                    label: log['Log Name'],
                    parentId: wellLogsFolder.id,
                    type: 'Well logs',
                    isFolder: false,
                    dataId: importData.value.dataId
                };
                wellLogsFolder.children.push(logItem);
            }
        });

        // 在添加完日志后立即更新 Global well logs
        setTimeout(() => {
            updateGlobalWellLogsComprehensive();
        }, 0);
    };

    // 查找Wells节点
    const wellsNode = findWellsNode(inputPaneItem.folders);

    if (!wellsNode) {
        return;
    }

    let isNewWellCreated = false; // 标记是否创建了新井

    if (selectedWellId === 'create_new_well' || !selectedWellId) {
        // 创建新井的情况，使用文件中的井名
        const wellName = wellNameTip.value || 'Unknown Well';

        const savedSearchesIndex = wellsNode.children.findIndex(child =>
            child.label === 'Saved searches'
        );

        // 查找或创建"Wells Not Found"文件夹
        let wellsNotFoundFolder = wellsNode.children.find(child =>
            child.parentId === 'Wells' && child.label === 'Wells Not Found'
        );

        if (!wellsNotFoundFolder) {
            wellsNotFoundFolder = {
                id: 'wells_not_found',
                label: 'Wells Not Found',
                parentId: 'Wells',
                src: "/src/assets/image/not_found.png",
                children: [],
                isFolder: true
            };

            if (savedSearchesIndex !== -1) {
                wellsNode.children.splice(savedSearchesIndex + 1, 0, wellsNotFoundFolder);
            } else {
                wellsNode.children.push(wellsNotFoundFolder);
            }
        }

        // 在Wells Not Found下创建新井
        const timestamp = new Date().getTime();
        const uniqueId = `well_${wellName.replace(/\s+/g, '_')}_${timestamp}_${currentFileIndex.value}`;

        const newWellNode = {
            id: uniqueId,
            label: wellName,
            parentId: 'wells_not_found',
            children: [{
                id: `Surverys and plans-`,
                parentId: '',
                label: "Surverys and plans",
                type: "Well",
                src: "/src/assets/image/folder_page.png",
                sort: 1,
                children: []
            }],
            isFolder: true
        };
        wellsNotFoundFolder.children.push(newWellNode);
        isNewWellCreated = true;

        // 创建或查找Well logs文件夹并添加日志项
        const wellLogsFolder = findOrCreateWellLogsFolder(newWellNode);
        addLogItems(wellLogsFolder);
    } else {
        // 使用已选择的井（根据 ID 查找）
        const wellNode = findWellNodeById(wellsNode, selectedWellId);

        if (wellNode) {
            // 创建或查找Well logs文件夹并添加日志项
            const wellLogsFolder = findOrCreateWellLogsFolder(wellNode);
            addLogItems(wellLogsFolder);
        }
    }

    // 更新 store 中的数据
    const inputPaneInStore = strGeoMeta.aPane.find(o => 'Input' === o.title);
    if (inputPaneInStore) {
        const updatedFolders = JSON.parse(JSON.stringify(inputPaneItem.folders));
        inputPaneInStore.folders.splice(0, inputPaneInStore.folders.length, ...updatedFolders);
    }

    // 如果创建了新井，则更新井名下拉选项
    if (isNewWellCreated) {
        setTimeout(() => {
            collectWellNames();
        }, 100);
    }
    updateGlobalWellLogsComprehensive();
};
// 关闭对话框
const handleClose = () => {
    resetFormState();
    emit('update:visible', false)
    emit('close')
}

// 处理OK按钮点击
const handleOk = () => {
    // 关闭当前对话框
    emit('close')
    // 重置状态
    currentFileIndex.value = 0
    shouldContinueProcessing.value = true

    // 如果有文件，显示第二个对话框
    if (props.filePaths.length > 0) {
        showInput.value = true
        loadCurrentFileContent();
    }
}
// 处理OK for all按钮点击
const handleOkForAll = async () => {
    // 关闭弹窗
    showInput.value = false;
    //console.log('开始处理所有文件，总数:', props.filePaths.length);
    // 循环处理所有文件
    while (currentFileIndex.value < props.filePaths.length) {
        //console.log(`处理文件 ${currentFileIndex.value + 1}/${props.filePaths.length}`);
        try {
            // 等待当前文件内容加载完成
            await new Promise((resolve, reject) => {
                // 设置超时机制
                const timeout = setTimeout(() => {
                    reject(new Error('文件加载超时'));
                }, 10000); // 10秒超时

                // 监听 currentFileContent 的变化
                const unwatch = watch(currentFileContent, (newVal) => {
                    // 当内容不为空且不是加载中状态时，认为加载完成
                    if (newVal &&
                        newVal !== '' &&
                        newVal !== 'Loading file content...' &&
                        newVal !== 'Error loading file content') {
                        clearTimeout(timeout);
                        unwatch(); // 取消监听
                        resolve();
                    }
                });

                // 如果当前内容已经是加载完成状态，直接 resolve
                if (currentFileContent.value &&
                    currentFileContent.value !== '' &&
                    currentFileContent.value !== 'Loading file content...' &&
                    currentFileContent.value !== 'Error loading file content') {
                    clearTimeout(timeout);
                    unwatch(); // 取消监听
                    resolve();
                }
            });

            // 调用 turnDown 处理当前文件
            await turnDown();
            //console.log(`文件 ${currentFileIndex.value + 1} 处理完成`);
            // 检查是否还有更多文件需要处理
            if (currentFileIndex.value < props.filePaths.length - 1) {
                // 还有更多文件需要处理，增加文件索引并加载新文件
                currentFileIndex.value++;
                // 直接调用 loadCurrentFileContent 并等待其完成
                await loadCurrentFileContent();
            } else {
                // 没有更多文件，结束处理
                break;
            }

            // 在处理下一个文件前重置指定选项
            if (currentFileIndex.value < props.filePaths.length - 1) {
                Matching.value = 'Create';
                Range.value = 'Automatic';
                whenWellLogExists.value = 'Overwrite';
                indexLogType.value = 'MD';

                // 重置复选框状态
                handleLoadNoneMatched();
                handleLoadNoneUnmatched();
                handleLoadNone();
            }
        } catch (error) {
            console.error(`处理文件 ${props.filePaths[currentFileIndex.value]} 时出错:`, error);
            // 继续处理下一个文件
            if (currentFileIndex.value < props.filePaths.length - 1) {
                currentFileIndex.value++;
                await loadCurrentFileContent();
            } else {
                break;
            }
        }
    }
    // 所有文件处理完成后，进行一次性的树结构保存
    try {
        await ProjectRecordService.updateMenu();
        console.log('树结构保存成功');
    } catch (error) {
        console.error('保存树结构时出错:', error);
    }
    // 重置状态
    currentFileIndex.value = 0;
    shouldContinueProcessing.value = false;
    activeTab.value = 'Data';
    //console.log('所有文件处理完成');
}

// 处理单个文件OK按钮点击
const handleOkForOne = async () => {
    try {
        // 处理当前文件的逻辑
        await turnDown();
    } catch (error) {
        console.error('处理文件时出错:', error);
    }

    // 重置指定选项（在切换到下一个文件前）
    Matching.value = 'Create';
    Range.value = 'Automatic';
    whenWellLogExists.value = 'Overwrite';
    indexLogType.value = 'MD';

    // 重置复选框状态
    handleLoadNoneMatched();
    handleLoadNoneUnmatched();
    handleLoadNone();

    // 检查是否还有更多文件需要处理
    if (currentFileIndex.value < props.filePaths.length - 1 && shouldContinueProcessing.value) {
        // 还有更多文件需要处理，增加文件索引并重新加载内容
        currentFileIndex.value++;
        loadCurrentFileContent();
    } else {
        // 没有更多文件或用户选择停止处理，关闭对话框
        showInput.value = false;

        // 在所有文件处理完成后进行保存
        try {
            await ProjectRecordService.updateMenu();
            console.log('树结构保存成功');
        } catch (error) {
            console.error('保存树结构时出错:', error);
        }

        // 重置索引，为下次导入做准备
        currentFileIndex.value = 0;
    }
    activeTab.value = 'Data';
}
const turnDown = async () => {
    try {
        const filteredData = filterColumnDataByRange();
        const data = [];

        // 确保 filteredData 有足够的列
        if (filteredData.length > 0) {
            for (let i = 0; i < matchedDataSummary.value.length; i++) {
                // 确保 filteredData[i] 存在，如果不存在则使用空数组
                const columnData = i < filteredData.length ? filteredData[i] : [];

                data[i] = [
                    matchedDataSummary.value[i].logName,
                    filteredData[0].join(','), // 第一列作为索引列，转换为逗号分隔的字符串
                    columnData.join(','),      // 对应的列数据，转换为逗号分隔的字符串
                    matchedDataSummary.value[i].description,
                    matchedDataSummary.value[i].unitFile
                ];
            }
        }

        importData.value.startIndex = parseFloat(rangeStart.value);
        importData.value.endIndex = parseFloat(rangeStop.value);
        importData.value.indexSpacing = parseFloat(rangeStep.value);
        importData.value.indexType = indexLogType.value;
        importData.value.invalidValue = currentFileInfo.value.NULL;
        wellNameTip.value = currentFileInfo.value.WELL;
        importData.value.data = data;
        importData.value.dataId = uuidv4();
        matchTip.value = matchedData.value;
        const result = await invoke('import_well_logging', importData.value);
        // 只有当 result.errors 为空数组时才更新树结构
        if (result.errors && Array.isArray(result.errors) && result.errors.length === 0) {
            // 在调用 updateTreeStructure 前进行检查
            if (currentFileIndex.value < fileMappingData.value.length) {
                updateTreeStructure()
            } else {
                console.log('索引超出范围，跳过树结构更新');
            }
        } else {
            console.log('存在错误，跳过树结构更新:', result.errors);
        }

        // console.log('turnDown 执行完成');
        return result;
    } catch (error) {
        console.error('Error importing well logging data:', error);
        throw error; // 重新抛出错误，让调用者处理
    }
};
// 处理取消按钮点击
const handleCancelInput = () => {
    // 只重置指定选项
    indexLogType.value = 'MD';
    Range.value = 'Automatic';
    whenWellLogExists.value = 'Overwrite';
    Matching.value = 'Create';

    // 重置复选框状态
    handleLoadNoneMatched();
    handleLoadNoneUnmatched();
    handleLoadNone();
    shouldContinueProcessing.value = false
    showInput.value = false
}
// 处理Load复选框变化
const handleLoadChange = (row) => {
    // console.log('Load checkbox changed:', row)
    // 可以在这里处理选择变化的逻辑
}
// 全选Load复选框
const handleLoadAll = () => {
    unitMap.value.forEach(item => {
        item.load = true;
    });
}

// 取消全选Load复选框
const handleLoadNone = () => {
    unitMap.value.forEach(item => {
        item.load = false;
    });
}
// 替换现有的 updateGlobalWellLogsComprehensive 函数
const updateGlobalWellLogsComprehensive = () => {
    const inputPaneItem = strGeoMeta.aPane.find(o => 'Input' === o.title);
    if (!inputPaneItem) return;

    // 查找Wells节点
    const findWellsNode = (folders) => {
        if (!Array.isArray(folders)) return null;
        for (const folder of folders) {
            if (folder.id === 'Wells') {
                return folder;
            }
            if (folder.children) {
                const result = findWellsNode(folder.children);
                if (result) return result;
            }
        }
        return null;
    };

    const wellsNode = findWellsNode(inputPaneItem.folders);
    if (!wellsNode) return;

    // 查找或创建 Global well logs 文件夹
    let globalWellLogsFolder = wellsNode.children.find(child =>
        child.label === 'Global well logs'
    );

    if (!globalWellLogsFolder) {
        globalWellLogsFolder = {
            id: 'global_well_logs',
            label: 'Global well logs',
            parentId: 'Wells',
            children: [],
            isFolder: true
        };
        wellsNode.children.push(globalWellLogsFolder);
    }

    // 收集所有井下的日志（去重）
    const allLogNames = new Set();
    const collectLogsFromWells = (node) => {
        if (!node.children) return;

        for (const child of node.children) {
            // 收集 Well logs 下的日志
            if (child.label === 'Well logs' && child.children) {
                child.children.forEach(log => {
                    if (!log.isFolder) {
                        allLogNames.add(log.label);
                    }
                });
            }

            // 递归处理子节点
            if (child.children) {
                collectLogsFromWells(child);
            }
        }
    };

    collectLogsFromWells(wellsNode);

    // 获取当前 Global well logs 中已存在的日志项（用于保持现有项）
    const existingGlobalLogs = new Set(
        globalWellLogsFolder.children
            .filter(child => child.parentId === 'global_well_logs' && !child.isFolder)
            .map(child => child.label)
    );

    // 添加所有唯一日志到 Global well logs（基于label去重，保留原始名称）
    allLogNames.forEach(logName => {
        // 只有当该日志尚未存在于 Global well logs 中时才添加
        if (!existingGlobalLogs.has(logName)) {
            globalWellLogsFolder.children.push({
                id: `global_${logName}`,
                label: logName, // 保留原始label名称
                parentId: 'global_well_logs',
                isFolder: false
            });
        }
    });

    // 移除已经不存在于任何井中的日志项（可选）
    globalWellLogsFolder.children = globalWellLogsFolder.children.filter(child => {
        // 保留文件夹和已存在的日志
        if (child.isFolder || child.parentId !== 'global_well_logs') {
            return true;
        }
        // 保留仍然存在于任何井中的日志
        return allLogNames.has(child.label);
    });
};
onMounted(() => {
    // 初始化 Global well logs
    setTimeout(() => {
        const inputPaneItem = strGeoMeta.aPane.find(o => 'Input' === o.title);
        if (inputPaneItem) {
            // 确保 Global well logs 文件夹存在
            const findWellsNode = (folders) => {
                if (!Array.isArray(folders)) return null;
                for (const folder of folders) {
                    if (folder.id === 'Wells') {
                        return folder;
                    }
                    if (folder.children) {
                        const result = findWellsNode(folder.children);
                        if (result) return result;
                    }
                }
                return null;
            };

            const wellsNode = findWellsNode(inputPaneItem.folders);
            if (wellsNode) {
                // 查找并确保 Global well logs 文件夹存在
                let globalWellLogsFolder = wellsNode.children.find(child =>
                    child.label === 'Global well logs'
                );

                if (!globalWellLogsFolder) {
                    globalWellLogsFolder = {
                        id: 'global_well_logs',
                        label: 'Global well logs',
                        parentId: 'Wells',
                        children: [],
                        isFolder: true
                    };
                    wellsNode.children.push(globalWellLogsFolder);
                }

                // 确保 Wells Not Found 文件夹在 Saved searches 之后
                const savedSearchesIndex = wellsNode.children.findIndex(child =>
                    child.label === 'Saved searches'
                );

                const wellsNotFoundIndex = wellsNode.children.findIndex(child =>
                    child.parentId === 'Wells' && child.label === 'Wells Not Found'
                );

                // 如果存在 Saved searches 且 Wells Not Found 在它前面，则移动位置
                if (savedSearchesIndex !== -1 && wellsNotFoundIndex !== -1 && wellsNotFoundIndex < savedSearchesIndex) {
                    const wellsNotFoundFolder = wellsNode.children.splice(wellsNotFoundIndex, 1)[0];
                    wellsNode.children.splice(savedSearchesIndex, 0, wellsNotFoundFolder);
                }
            }
        }
        updateGlobalWellLogsComprehensive();
    }, 100);
});

// 添加组件卸载时的清理
onUnmounted(() => {
    // 清理可能存在的定时器
    if (window.cleanupTimeouts) {
        window.cleanupTimeouts.forEach(clearTimeout);
        window.cleanupTimeouts.clear();
    }

    // 重置所有响应式数据
    currentFileIndex.value = 0;
    shouldContinueProcessing.value = false;
    showInput.value = false;
});
</script>

<style lang="scss" scoped>
label {
    font-weight: 100;
}

.mapping-table-container {
    margin: 5px 0;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background-color: white;

}


.mapping-table-container :deep(.cell) {
    padding: 0;
    text-align: center;
}


.mapping-table :deep(.el-table) {
    background-color: white;
}

.mapping-table :deep(.el-table__header-wrapper) {
    background-color: #f5f7fa;
}

.mapping-table :deep(.el-table__body-wrapper) {
    background-color: white;
}

.mapping-table :deep(.el-select) {
    width: 100%;

    .el-select__wrapper {
        background-color: #E1E1E1;
    }
}


.file-additional-info {
    margin: 5px 10px;
    padding-top: 5px;
    border-radius: 4px;
}

.info-line {
    margin: 5px 0;
    font-size: 13px;
    color: #606266;

    span {
        margin-right: 15px;
    }
}

.missing-well-warning {
    color: #f56c6c;
    font-weight: 500;
}

.file-content-container {
    margin: 0 10px;
    padding-bottom: 10px;
}

.file-content-container h4 {
    margin: 0 0 10px 0;
    color: #606266;
}

.file-content {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.4;
    max-height: 150px;
    overflow: auto;
    white-space: pre-wrap;
}

.loading-content {
    text-align: center;
    padding: 20px;
    color: #909399;
}

.tab-content-information {
    background-color: #fff;
}

.table-button-row {
    position: relative;
    text-align: right;
    padding: 5px 10px;

    span {
        margin-right: 10px;
        font-size: 14px;
        color: #606266;
    }

    .left {
        position: absolute;
        left: 10px;
        top: 10px;
    }

    .el-button {
        margin-left: 5px;
        width: 50px;
        background-color: #E1E1E1;

        &:hover {
            background-color: #BEE6FD;
            border-color: #3C7FB1;
        }
    }
}

.range-inputs {
    margin: 0 50px;

    .input-row {
        display: flex;
        align-items: center;
        margin-bottom: 10px;

        label {
            font-weight: 100;
            //width: 50px;
        }
    }
}

.coordinate-inputs {
    margin: 3px 0;
    padding: 0 5px;

    .input-row {
        display: flex;
        align-items: center;

        label {
            font-weight: 100;
            width: 80px;
            color: #A0A0A0
        }
    }

    .button-row {
        margin-top: 5px;
        //text-align: left;
        margin-left: 80px;

        .el-button {
            background-color: #E1E1E1;
        }
    }
}

.disabled-section {
    opacity: 0.8;
    pointer-events: none;

    .disabled-table {
        opacity: 0.8;

        :deep(.el-checkbox) {
            pointer-events: none;
        }

        :deep(.el-select) {
            pointer-events: none;
        }
    }
}

.date-display-section {
    display: flex;
    align-items: center;
    margin: 3px 0;
    padding: 0 30px;

    .input-group {
        display: flex;
        align-items: center;
        margin-right: 20px;

        label {
            font-weight: 100;
            color: #606266;
            white-space: nowrap;
        }

        .parsed-date-value {
            margin-left: 10px;
            color: #606266;
            white-space: nowrap;
        }
    }

    :deep(.el-input.is-disabled .el-input__inner) {
        background-color: #f5f7fa;
        color: #606266;
    }
}

.date-info-section {
    // margin: 10px 0;
    opacity: 0.8;
    pointer-events: none;
    padding: 5px;
    border-radius: 4px;

    .date-info-row {
        display: flex;
        // justify-content: space-between;
        margin-bottom: 8px;

        &:last-child {
            margin-bottom: 0;
        }

        .date-info-item {
            display: flex;
            align-items: center;
            width: 300px;

            label {
                font-weight: 100;
                color: #606266;
                white-space: nowrap;
            }

            .file-string-value,
            .date-sample-value,
            .file-value-value {
                margin-left: 10px;
                color: #606266;
                white-space: nowrap;
            }
        }
    }
}
</style>