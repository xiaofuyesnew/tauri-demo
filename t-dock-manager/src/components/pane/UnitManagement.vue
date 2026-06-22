<!-- src/components/pane/UnitManagement.vue -->
<template>
    <el-dialog v-model="showDialog" width="60%" max-height="70%" padding="0" draggable @close="handleClose"
        class="project-dialog">
        <template #header>
            <div class="dialog-custom-header">
                <img src="@/assets/image/title.png" alt="title" class="title-image" />
                <span>Unit Management</span>
            </div>
        </template>

        <div class="dialog-container">
            <el-tabs v-model="activeTab" type="card" class="custom-tabs">
                <el-tab-pane name="Unit Dimension">
                    <template #label>
                        <span>Unit Dimension</span>
                    </template>
                    <div class="tab-content">
                        <!-- 搜索框 -->
                        <div class="search-container">
                            <el-input v-model="searchKeyword" placeholder="Search dimensions..." clearable
                                style="width: 300px; margin-bottom: 15px;" @keyup.enter="handleSearch">
                                <template #append>
                                    <el-button @click="handleSearch" type="primary" :icon="Search">
                                        Search
                                    </el-button>
                                </template>
                            </el-input>
                        </div>
                        <!-- 表格 -->
                        <div class="table-wrapper">
                            <el-table :data="flattenedTableData" style="width: 100%;" height="400" row-key="id" border>
                                <!-- Name 列（可展开下拉） -->
                                <el-table-column prop="name" label="Name">
                                    <template #default="{ row }">
                                        <div class="name-cell" :style="{ paddingLeft: row.level * 30 + 'px' }">
                                            <!-- 只有父级显示展开/收缩按钮 -->
                                            <el-button v-if="row.type === 'parent'" type="text"
                                                @click="toggleExpand(row)" class="expand-button"
                                                :class="{ expanded: expandedRows.includes(row.id) }">
                                                <el-icon class="expand-icon">
                                                    <ArrowDown v-if="expandedRows.includes(row.id)" />
                                                    <ArrowRight v-else />
                                                </el-icon>
                                            </el-button>
                                            <span>{{ row.name }}</span>
                                        </div>
                                    </template>
                                </el-table-column>
                                <!-- K 列 -->
                                <el-table-column prop="k" label="K"></el-table-column>
                                <!-- B 列 -->
                                <el-table-column prop="b" label="B"></el-table-column>
                                <!-- 其他列 -->
                                <el-table-column prop="Notations" label="Notations"></el-table-column>
                                <el-table-column prop="Precision" label="Precision"></el-table-column>
                            </el-table>
                        </div>
                        <!-- 分页 -->
                        <div class="pagination-container">
                            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                                :page-sizes="[10, 20, 50, 100]" :total="totalItems"
                                layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
                                @current-change="handleCurrentChange" />
                        </div>
                    </div>
                </el-tab-pane>
                <el-tab-pane name="Unit Class">
                    <template #label>
                        <span>Unit Class</span>
                    </template>
                    <div class="tab-content">
                        <!-- Unit Class 搜索框 -->
                        <div class="search-container">
                            <el-input v-model="unitClassSearchKeyword" placeholder="Search unit classes..." clearable
                                style="width: 300px; margin-bottom: 15px;" @keyup.enter="handleUnitClassSearch">
                                <template #append>
                                    <el-button @click="handleUnitClassSearch" type="primary" :icon="Search">
                                        Search
                                    </el-button>
                                </template>
                            </el-input>
                        </div>

                        <!-- Unit Class 表格 -->
                        <div class="table-wrapper">
                            <el-table :data="flattenedUnitClassTableData" style="width: 100%;" height="400" row-key="id"
                                border>
                                <!-- Name 列 -->
                                <el-table-column prop="name" label="Name">
                                    <template #default="{ row }">
                                        <div class="name-cell" :style="{ paddingLeft: row.level * 30 + 'px' }">
                                            <!-- 只有父级显示展开/收缩按钮 -->
                                            <el-button v-if="row.type === 'parent'" type="text"
                                                @click="toggleUnitClassExpand(row)" class="expand-button"
                                                :class="{ expanded: unitClassExpandedRows.includes(row.id) }">
                                                <el-icon class="expand-icon">
                                                    <ArrowDown v-if="unitClassExpandedRows.includes(row.id)" />
                                                    <ArrowRight v-else />
                                                </el-icon>
                                            </el-button>
                                            <span>{{ row.name }}</span>
                                        </div>
                                    </template>
                                </el-table-column>
                                <!-- B 列 -->
                                <el-table-column prop="b" label="B"></el-table-column>
                                <!-- K 列 -->
                                <el-table-column prop="k" label="K"></el-table-column>
                                <!-- Notations 列 -->
                                <el-table-column prop="notations" label="Notations"></el-table-column>
                                <!-- Precision 列 -->
                                <el-table-column prop="precision" label="Precision"></el-table-column>
                            </el-table>
                        </div>

                        <!-- Unit Class 分页 -->
                        <div class="pagination-container">
                            <el-pagination v-model:current-page="unitClassCurrentPage"
                                v-model:page-size="unitClassPageSize" :page-sizes="[10, 20, 50, 100]"
                                :total="unitClassTotalItems" layout="total, sizes, prev, pager, next, jumper"
                                @size-change="handleUnitClassSizeChange"
                                @current-change="handleUnitClassCurrentChange" />
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane name="Measurement">
                    <template #label>
                        <span>Measurement</span>
                    </template>
                    <div class="tab-content">
                        <!-- Measurement 搜索框 -->
                        <div class="search-container">
                            <el-input v-model="measurementSearchKeyword" placeholder="Search measurements..." clearable
                                style="width: 300px; margin-bottom: 15px;" @keyup.enter="handleMeasurementSearch">
                                <template #append>
                                    <el-button @click="handleMeasurementSearch" type="primary" :icon="Search">
                                        Search
                                    </el-button>
                                </template>
                            </el-input>
                        </div>

                        <!-- Measurement 表格 -->
                        <div class="table-wrapper">
                            <el-table :data="measurementTableDataPage" style="width: 100%;" height="400" row-key="Name"
                                border>
                                <!-- Name 列 -->
                                <el-table-column prop="Name" label="Name"></el-table-column>
                                <!-- UnitClass 列 -->
                                <el-table-column prop="UnitClass" label="Unit Class"></el-table-column>
                            </el-table>
                        </div>

                        <!-- Measurement 分页 -->
                        <div class="pagination-container">
                            <el-pagination v-model:current-page="measurementCurrentPage"
                                v-model:page-size="measurementPageSize" :page-sizes="[10, 20, 50, 100]"
                                :total="measurementTotalItems" layout="total, sizes, prev, pager, next, jumper"
                                @size-change="handleMeasurementSizeChange"
                                @current-change="handleMeasurementCurrentChange" />
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane name="Unit System">
                    <template #label>
                        <span>Unit System</span>
                    </template>
                    <div class="tab-content">
                        <!-- Unit System 搜索框 -->
                        <div class="search-container">
                            <el-input v-model="unitSystemSearchKeyword" placeholder="Search unit systems..." clearable
                                style="width: 300px; margin-bottom: 15px;" @keyup.enter="handleUnitSystemSearch">
                                <template #append>
                                    <el-button @click="handleUnitSystemSearch" type="primary" :icon="Search">
                                        Search
                                    </el-button>
                                </template>
                            </el-input>
                        </div>

                        <!-- Unit System 表格 -->
                        <div class="table-wrapper">
                            <el-table :data="flattenedUnitSystemTableData" style="width: 100%;" height="400"
                                row-key="id" border>
                                <!-- Name 列 -->
                                <el-table-column prop="name" label="Name">
                                    <template #default="{ row }">
                                        <div class="name-cell" :style="{ paddingLeft: row.level * 30 + 'px' }">
                                            <!-- 只有父级显示展开/收缩按钮 -->
                                            <el-button v-if="row.type === 'parent'" type="text"
                                                @click="toggleUnitSystemExpand(row)" class="expand-button"
                                                :class="{ expanded: unitSystemExpandedRows.includes(row.id) }">
                                                <el-icon class="expand-icon">
                                                    <ArrowDown v-if="unitSystemExpandedRows.includes(row.id)" />
                                                    <ArrowRight v-else />
                                                </el-icon>
                                            </el-button>
                                            <span>{{ row.name }}</span>
                                        </div>
                                    </template>
                                </el-table-column>
                                <!-- UnitClass 列 -->
                                <el-table-column prop="unitClass" label="Unit"></el-table-column>
                            </el-table>
                        </div>

                        <!-- Unit System 分页 -->
                        <div class="pagination-container">
                            <el-pagination v-model:current-page="unitSystemCurrentPage"
                                v-model:page-size="unitSystemPageSize" :page-sizes="[10, 20, 50, 100]"
                                :total="unitSystemTotalItems" layout="total, sizes, prev, pager, next, jumper"
                                @size-change="handleUnitSystemSizeChange"
                                @current-change="handleUnitSystemCurrentChange" />
                        </div>
                    </div>
                </el-tab-pane>
                <el-tab-pane name="Aliases">
                    <template #label>
                        <span>Aliases</span>
                    </template>
                    <div class="tab-content">
                        <!-- Aliases 搜索框 -->
                        <div class="search-container">
                            <el-input v-model="aliasesSearchKeyword" placeholder="Search aliases..." clearable
                                style="width: 300px; margin-bottom: 15px;" @keyup.enter="handleAliasesSearch">
                                <template #append>
                                    <el-button @click="handleAliasesSearch" type="primary" :icon="Search">
                                        Search
                                    </el-button>
                                </template>
                            </el-input>
                        </div>

                        <!-- Aliases 表格 -->
                        <div class="table-wrapper">
                            <el-table :data="aliasesTableDataPage" style="width: 100%;" height="400" row-key="Alias"
                                border>
                                <el-table-column prop="Alias" label="Alias" width="150"></el-table-column>
                                <el-table-column prop="ChoiceList" label="ChoiceList"></el-table-column>
                                <el-table-column prop="Family" label="Family"></el-table-column>
                            </el-table>
                        </div>

                        <!-- Aliases 分页 -->
                        <div class="pagination-container">
                            <el-pagination v-model:current-page="aliasesCurrentPage" v-model:page-size="aliasesPageSize"
                                :page-sizes="[10, 20, 50, 100]" :total="aliasesTotalItems"
                                layout="total, sizes, prev, pager, next, jumper" @size-change="handleAliasesSizeChange"
                                @current-change="handleAliasesCurrentChange" />
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane name="Families">
                    <template #label>
                        <span>Families</span>
                    </template>
                    <div class="tab-content">
                        <!-- Families 搜索框 -->
                        <div class="search-container">
                            <el-input v-model="familiesSearchKeyword" placeholder="Search families..." clearable
                                style="width: 300px; margin-bottom: 15px;" @keyup.enter="handleFamiliesSearch">
                                <template #append>
                                    <el-button @click="handleFamiliesSearch" type="primary" :icon="Search">
                                        Search
                                    </el-button>
                                </template>
                            </el-input>
                        </div>

                        <!-- Families 表格 -->
                        <div class="table-wrapper">
                            <el-table :data="familiesTableDataPage" style="width: 100%;" height="400" row-key="Family"
                                border>
                                <el-table-column prop="Family" label="Family" min-width="150"></el-table-column>
                                <el-table-column prop="ColorLogView" label="ColorLogView"
                                    min-width="150"></el-table-column>
                                <el-table-column prop="FillType" label="FillType" min-width="150"></el-table-column>
                                <el-table-column prop="LimitInf" label="LimitInf" min-width="150"></el-table-column>
                                <el-table-column prop="LimitSup" label="LimitSup" min-width="150"></el-table-column>
                                <el-table-column prop="LineType" label="LineType" min-width="150"></el-table-column>
                                <el-table-column prop="MainFamily" label="MainFamily" min-width="150"></el-table-column>
                                <el-table-column prop="Max" label="Max" min-width="150"></el-table-column>
                                <el-table-column prop="Measurement" label="Measurement"
                                    min-width="150"></el-table-column>
                                <el-table-column prop="Min" label="Min" min-width="150"></el-table-column>
                                <el-table-column prop="Palette" label="Palette" min-width="150"></el-table-column>
                                <el-table-column prop="Scale" label="Scale" min-width="150"></el-table-column>
                                <el-table-column prop="Thickness" label="Thickness" min-width="150"></el-table-column>
                                <el-table-column prop="Type" label="Type" min-width="150"></el-table-column>
                                <el-table-column prop="Type2D" label="Type2D" min-width="150"></el-table-column>
                                <el-table-column prop="Unit" label="Unit" min-width="150"></el-table-column>
                                <el-table-column prop="WrapDisplay" label="WrapDisplay"
                                    min-width="150"></el-table-column>
                            </el-table>
                        </div>

                        <!-- Families 分页 -->
                        <div class="pagination-container">
                            <el-pagination v-model:current-page="familiesCurrentPage"
                                v-model:page-size="familiesPageSize" :page-sizes="[10, 20, 50, 100]"
                                :total="familiesTotalItems" layout="total, sizes, prev, pager, next, jumper"
                                @size-change="handleFamiliesSizeChange" @current-change="handleFamiliesCurrentChange" />
                        </div>
                    </div>
                </el-tab-pane>
            </el-tabs>
        </div>
    </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { UnitService } from '@/api/unit';
import { Search, ArrowDown, ArrowRight } from '@element-plus/icons-vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    }
})

// 搜索相关
const searchKeyword = ref('')

// 表格相关
const tableData = ref([])
const expandedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)

// Unit Class 相关数据
const unitClassTableData = ref([])
const unitClassExpandedRows = ref([])
const unitClassCurrentPage = ref(1)
const unitClassPageSize = ref(10)
const unitClassTotalItems = ref(0)
const unitClassSearchKeyword = ref('')
// Unit System 相关数据
const unitSystemTableData = ref([])
const unitSystemExpandedRows = ref([])
const unitSystemCurrentPage = ref(1)
const unitSystemPageSize = ref(10)
const unitSystemTotalItems = ref(0)
const unitSystemSearchKeyword = ref('')
// Measurement 相关数据
const measurementTableData = ref([])
const measurementCurrentPage = ref(1)
const measurementPageSize = ref(10)
const measurementTotalItems = ref(0)
const measurementSearchKeyword = ref('')

// Aliases 相关数据
const aliasesTableData = ref([])
const aliasesCurrentPage = ref(1)
const aliasesPageSize = ref(10)
const aliasesTotalItems = ref(0)
const aliasesSearchKeyword = ref('')

// Families 相关数据
const familiesTableData = ref([])
const familiesCurrentPage = ref(1)
const familiesPageSize = ref(10)
const familiesTotalItems = ref(0)
const familiesSearchKeyword = ref('')

// 定义 emits
const emit = defineEmits(['update:visible', 'close'])

// 响应式数据
const activeTab = ref('Unit Dimension')

// 计算属性控制对话框显示
const showDialog = computed({
    get: () => props.visible,
    set: (val) => {
        emit('update:visible', val)
    }
})

// 计算扁平化的表格数据（包含父级和展开的子级）
const flattenedTableData = computed(() => {
    const result = []

    tableData.value.forEach(parentRow => {
        // 添加父级行
        result.push({
            id: parentRow.Name, // 使用 Name 作为 id
            name: parentRow.Name,
            k: '', // 父级可能没有 K 值
            b: '', // 父级可能没有 B 值
            Notations: '',
            Precision: '', // 父级可能没有描述
            type: 'parent',
            level: 0
        })

        // 如果父级展开，添加子级行
        if (expandedRows.value.includes(parentRow.Name)) {
            parentRow.Units.Unit.forEach((child, index) => {
                result.push({
                    id: `${parentRow.Name}-child-${index}`,
                    name: child.Name,
                    k: child.K, // 兼容 K 和 k
                    b: child.B, // 兼容 B 和 b
                    Notations: child.Notations || '',
                    Precision: child.Precision || '', // 父级可能没有描述
                    type: 'child',
                    level: 1,
                    parentId: parentRow.Name
                })
            })
        }
    })

    return result
})

// 计算 Unit Class 扁平化数据
const flattenedUnitClassTableData = computed(() => {
    const result = []

    unitClassTableData.value.forEach(parentRow => {
        result.push({
            id: parentRow.Name,
            name: parentRow.Name,
            b: parentRow.B,
            k: parentRow.K,
            notations: parentRow.Notations,
            precision: parentRow.Precision,
            type: 'parent',
            level: 0
        })

        if (unitClassExpandedRows.value.includes(parentRow.Name)) {
            parentRow.Units.Unit.forEach((child, index) => {
                result.push({
                    id: `${parentRow.Name}-child-${index}`,
                    name: child.Name,
                    b: child.B || '',
                    k: child.K || '',
                    notations: child.Notations || '',
                    precision: child.Precision || '',
                    type: 'child',
                    level: 1,
                    parentId: parentRow.Name
                })
            })
        }
    })

    return result
})
// 计算 Unit System 扁平化数据
const flattenedUnitSystemTableData = computed(() => {
    const result = []

    unitSystemTableData.value.forEach(parentRow => {
        // 添加父级行 (父级没有 UnitClass 字段)
        result.push({
            id: parentRow.Name,
            name: parentRow.Name,
            unitClass: '', // 父级没有 UnitClass
            type: 'parent',
            level: 0
        })

        // 如果父级展开，添加子级行
        if (unitSystemExpandedRows.value.includes(parentRow.Name)) {
            parentRow.UnitClass.forEach((child, index) => {
                result.push({
                    id: `${parentRow.Name}-child-${index}`,
                    name: child.Name,
                    unitClass: child.Unit,
                    type: 'child',
                    level: 1,
                    parentId: parentRow.Name
                })
            })
        }
    })

    return result
})
// 计算 Measurement 当前页数据
const measurementTableDataPage = computed(() => {
    const start = (measurementCurrentPage.value - 1) * measurementPageSize.value
    const end = start + measurementPageSize.value
    return measurementTableData.value.slice(start, end)
})

// 计算 Aliases 当前页数据
const aliasesTableDataPage = computed(() => {
    const start = (aliasesCurrentPage.value - 1) * aliasesPageSize.value
    const end = start + aliasesPageSize.value
    return aliasesTableData.value.slice(start, end)
})

// 计算 Families 当前页数据
const familiesTableDataPage = computed(() => {
    const start = (familiesCurrentPage.value - 1) * familiesPageSize.value
    const end = start + familiesPageSize.value
    return familiesTableData.value.slice(start, end)
})
// 方法
const handleClose = () => {
    emit('update:visible', false)
    emit('close')
}



// 清空模拟数据，只保留空数组
const mockData = ref([])

const unitClassMockData = ref([])

// 修改模拟数据 - Unit System (清空数据)
const unitSystemMockData = ref([])

// 修改模拟数据 - Measurement (清空数据)
const measurementMockData = ref([])

// 搜索处理
const handleSearch = () => {
    currentPage.value = 1
    loadData()
}
// Unit Class 搜索处理
const handleUnitClassSearch = () => {
    unitClassCurrentPage.value = 1
    loadUnitClassData()
}
// Unit System 搜索处理
const handleUnitSystemSearch = () => {
    unitSystemCurrentPage.value = 1
    loadUnitSystemData()
}
// Measurement 搜索处理
const handleMeasurementSearch = () => {
    measurementCurrentPage.value = 1
    loadMeasurementData()
}
// Aliases 搜索处理
const handleAliasesSearch = () => {
    aliasesCurrentPage.value = 1
    loadAliasesData()
}
// Families 搜索处理
const handleFamiliesSearch = () => {
    familiesCurrentPage.value = 1
    loadFamiliesData()
}

// 展开/收起行
const toggleExpand = (row) => {
    const index = expandedRows.value.indexOf(row.id)
    if (index > -1) {
        expandedRows.value.splice(index, 1)
    } else {
        expandedRows.value.push(row.id)
    }
}
// Unit Class 展开/收起
const toggleUnitClassExpand = (row) => {
    const index = unitClassExpandedRows.value.indexOf(row.id)
    if (index > -1) {
        unitClassExpandedRows.value.splice(index, 1)
    } else {
        unitClassExpandedRows.value.push(row.id)
    }
}
// Unit System 展开/收起
const toggleUnitSystemExpand = (row) => {
    const index = unitSystemExpandedRows.value.indexOf(row.id)
    if (index > -1) {
        unitSystemExpandedRows.value.splice(index, 1)
    } else {
        unitSystemExpandedRows.value.push(row.id)
    }
}
// 分页处理
const handleSizeChange = (val) => {
    pageSize.value = val
    currentPage.value = 1
    loadData()
}
const handleCurrentChange = (val) => {
    currentPage.value = val
    loadData()
}
// Unit Class 分页处理
const handleUnitClassSizeChange = (val) => {
    unitClassPageSize.value = val
    unitClassCurrentPage.value = 1
    loadUnitClassData()
}
const handleUnitClassCurrentChange = (val) => {
    unitClassCurrentPage.value = val
    loadUnitClassData()
}
// Unit System 分页处理
const handleUnitSystemSizeChange = (val) => {
    unitSystemPageSize.value = val
    unitSystemCurrentPage.value = 1
    loadUnitSystemData()
}

const handleUnitSystemCurrentChange = (val) => {
    unitSystemCurrentPage.value = val
    loadUnitSystemData()
}


// Measurement 分页处理
const handleMeasurementSizeChange = (val) => {
    measurementPageSize.value = val
    measurementCurrentPage.value = 1
    loadMeasurementData()
}

const handleMeasurementCurrentChange = (val) => {
    measurementCurrentPage.value = val
    loadMeasurementData()
}
// Aliases 分页处理
const handleAliasesSizeChange = (val) => {
    aliasesPageSize.value = val
    aliasesCurrentPage.value = 1
    loadAliasesData()
}

const handleAliasesCurrentChange = (val) => {
    aliasesCurrentPage.value = val
    loadAliasesData()
}

// Families 分页处理
const handleFamiliesSizeChange = (val) => {
    familiesPageSize.value = val
    familiesCurrentPage.value = 1
    loadFamiliesData()
}

const handleFamiliesCurrentChange = (val) => {
    familiesCurrentPage.value = val
    loadFamiliesData()
}
// 加载数据
const loadData = async () => {
    try {
        // 分页数据
        const start = (currentPage.value - 1) * pageSize.value
        const end = start + pageSize.value
        const filteredData = mockData.value.filter(item =>
            !searchKeyword.value ||
            item.Name.toLowerCase().includes(searchKeyword.value.toLowerCase())
        )
        tableData.value = filteredData.slice(start, end)
        totalItems.value = filteredData.length
    } catch (error) {
        console.error('Failed to load unit dimensions:', error)
    }
}
// 加载 Unit Class 数据
const loadUnitClassData = async () => {
    try {
        const start = (unitClassCurrentPage.value - 1) * unitClassPageSize.value
        const end = start + unitClassPageSize.value
        const filteredData = unitClassMockData.value.filter(item =>
            !unitClassSearchKeyword.value ||
            item.Name.toLowerCase().includes(unitClassSearchKeyword.value.toLowerCase())
        )
        unitClassTableData.value = filteredData.slice(start, end)
        unitClassTotalItems.value = filteredData.length
    } catch (error) {
        console.error('Failed to load unit classes:', error)
    }
}
// 加载 Unit System 数据
const loadUnitSystemData = async () => {
    try {
        const start = (unitSystemCurrentPage.value - 1) * unitSystemPageSize.value
        const end = start + unitSystemPageSize.value
        const filteredData = unitSystemMockData.value.filter(item =>
            !unitSystemSearchKeyword.value ||
            item.Name.toLowerCase().includes(unitSystemSearchKeyword.value.toLowerCase())
        )
        unitSystemTableData.value = filteredData.slice(start, end)
        unitSystemTotalItems.value = filteredData.length
    } catch (error) {
        console.error('Failed to load unit systems:', error)
    }
}
// 加载 Measurement 数据
const loadMeasurementData = async () => {
    try {
        // 过滤数据
        const filteredData = measurementMockData.value.filter(item =>
            !measurementSearchKeyword.value ||
            item.Name.toLowerCase().includes(measurementSearchKeyword.value.toLowerCase())
        )

        measurementTableData.value = filteredData
        measurementTotalItems.value = filteredData.length
    } catch (error) {
        console.error('Failed to load measurements:', error)
    }
}

// 加载 Aliases 数据
const loadAliasesData = async () => {
    try {
        // 过滤数据
        const filteredData = aliasesTableData.value.filter(item =>
            !aliasesSearchKeyword.value ||
            item.Alias?.toLowerCase().includes(aliasesSearchKeyword.value.toLowerCase())
        )

        aliasesTableData.value = filteredData
        aliasesTotalItems.value = filteredData.length
    } catch (error) {
        console.error('Failed to load aliases:', error)
    }
}
// 加载 Families 数据
const loadFamiliesData = async () => {
    try {
        // 过滤数据
        const filteredData = familiesTableData.value.filter(item =>
            !familiesSearchKeyword.value ||
            item.Family?.toLowerCase().includes(familiesSearchKeyword.value.toLowerCase())
        )

        familiesTableData.value = filteredData
        familiesTotalItems.value = filteredData.length
    } catch (error) {
        console.error('Failed to load families:', error)
    }
}
// 监听搜索关键词变化
watch(searchKeyword, (newVal) => {
    if (!newVal) {
        // 清空搜索时重新加载数据
        currentPage.value = 1
        loadData()
    }
})
// 监听 Unit Class 搜索关键词变化
watch(unitClassSearchKeyword, (newVal) => {
    if (!newVal) {
        unitClassCurrentPage.value = 1
        loadUnitClassData()
    }
})
// 监听 Unit System 搜索关键词变化
watch(unitSystemSearchKeyword, (newVal) => {
    if (!newVal) {
        unitSystemCurrentPage.value = 1
        loadUnitSystemData()
    }
})
// 监听 Measurement 搜索关键词变化
watch(measurementSearchKeyword, (newVal) => {
    if (!newVal) {
        measurementCurrentPage.value = 1
        loadMeasurementData()
    }
})
// 监听 Aliases 搜索关键词变化
watch(aliasesSearchKeyword, (newVal) => {
    if (!newVal) {
        aliasesCurrentPage.value = 1
        loadAliasesData()
    }
})

// 监听 Families 搜索关键词变化
watch(familiesSearchKeyword, (newVal) => {
    if (!newVal) {
        familiesCurrentPage.value = 1
        loadFamiliesData()
    }
})
// 获取数据并更新UI
const getUnitDimensions = async () => {
    try {
        const results = await UnitService.getUnitDimensions();
        if (results && Array.isArray(results)) {
            mockData.value = results;
        } else if (results && results.UnitDimension) {
            mockData.value = results.UnitDimension;
        }
        // 获取数据后重新加载UI
        await loadData();
        return results;
    } catch (error) {
        console.error('Failed to get unit dimensions:', error);
    }
}
const getUnitClasses = async () => {
    try {
        const results = await UnitService.getUnitClasses();
        if (results && results.UnitClass) {
            unitClassMockData.value = results.UnitClass;
        } else if (Array.isArray(results)) {
            unitClassMockData.value = results;
        }
        // 获取数据后重新加载UI
        await loadUnitClassData();
        return results;
    } catch (error) {
        console.error('Failed to get unit classes:', error);
    }
}
const getMeasurements = async () => {
    try {
        const results = await UnitService.getMeasurements();
        if (results && results.Measurement) {
            measurementMockData.value = results.Measurement;
        } else if (Array.isArray(results)) {
            measurementMockData.value = results;
        }
        // 获取数据后重新加载UI
        await loadMeasurementData();
        return results;
    } catch (error) {
        console.error('Failed to get measurements:', error);
    }
}
const getUnitSystems = async () => {
    try {
        const results = await UnitService.getUnitSystems();
        if (results && results.UnitSystem) {
            unitSystemMockData.value = results.UnitSystem;
        } else if (Array.isArray(results)) {
            unitSystemMockData.value = results;
        }
        // 获取数据后重新加载UI
        await loadUnitSystemData();
        return results;
    } catch (error) {
        console.error('Failed to get unit systems:', error);
    }
}
const getCurveAliases = async () => {
    try {
        const results = await UnitService.getCurveAliases();
        if (results && results.AliasInfo) {
            aliasesTableData.value = results.AliasInfo;
        } else if (Array.isArray(results)) {
            aliasesTableData.value = results;
        }
        // 获取数据后重新加载UI
        await loadAliasesData();
        return results;
    } catch (error) {
        console.error('Failed to get curve aliases:', error);
    }
}

const getCurveFamilies = async () => {
    try {
        const results = await UnitService.getCurveFamilies();
        if (results && results.LogInfo) {
            familiesTableData.value = results.LogInfo;
        } else if (Array.isArray(results)) {
            familiesTableData.value = results;
        }
        // 获取数据后重新加载UI
        await loadFamiliesData();
        return results;
    } catch (error) {
        console.error('Failed to get curve families:', error);
    }
}
onMounted(async () => {
    // 从后台获取真实数据
    await getUnitDimensions();
    await getUnitClasses();
    await getMeasurements();
    await getUnitSystems();
    await getCurveAliases();
    await getCurveFamilies();
});
</script>

<style lang="scss" scoped>
.custom-tabs {
    height: 100%;
}

.tab-content {
    padding: 20px;

    :deep(.el-table__expanded-cell) {
        padding: 0 !important;
    }
}



.dialog-custom-header {
    display: flex;
    align-items: center;

    .title-image {
        width: 20px;
        height: 20px;
        margin-right: 10px;
    }
}

.expanded-content {
    padding: 10px 20px;
    background-color: #f5f7fa;

    :deep(.el-table) {
        background-color: #f5f7fa;

        .el-table__header th {
            background-color: #e4e7ed;
        }
    }
}

.name-cell {
    display: flex;
    align-items: center;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

// 为子级行添加特殊样式
:deep(.el-table__row) {
    &[data-row-key*="-child-"] {
        background-color: #f9f9f9;

        .name-cell {
            font-style: italic;
            color: #666;
        }
    }
}

.table-wrapper {
    :deep(.el-table) {
        .el-table__header-wrapper {
            overflow: hidden;
        }

        .el-table__body-wrapper {
            overflow-y: auto;
            overflow-x: auto;
        }
    }
}
</style>