<template>
    <el-dialog v-model="openProject" @close="close" title="Project List Record" width="800px" height="500px">
        <div class="app-container">
            <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="110px"
                @submit.prevent>
                <el-form-item label="Project Name" prop="name">
                    <el-input v-model="queryParams.name" placeholder="Please Enter Project Name" clearable
                        @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleQuery">Query</el-button>
                    <el-button @click="resetQuery">Reset</el-button>
                    <el-button type="primary" plain @click="handleAdd"
                        v-hasPermi="['loghub:record:add']">New</el-button>
                </el-form-item>
            </el-form>

            <el-row :gutter="10" class="mb8">
                <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
            </el-row>

            <el-table v-loading="loading" :data="recordList" highlight-current-row
                @current-change="handleCurrentChange">
                <el-table-column label="No." align="center" width="60">
                    <template #default="scope">
                        {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
                    </template>
                </el-table-column>
                <el-table-column label="Project Name" align="center" prop="project_name" />
                <el-table-column label="Last Saved" align="center" prop="update_time" />
                <el-table-column label="Operation" align="center" class-name="small-padding fixed-width">
                    <template #default="scope">
                        <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                            v-hasPermi="['loghub:record:edit']">Edit</el-button>
                        <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                            v-hasPermi="['loghub:record:remove']">Delete</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="pagination-container">
                <el-pagination v-show="total > 0" :total="total" v-model:current-page="queryParams.pageNum"
                    v-model:page-size="queryParams.pageSize" @current-change="handlePageChange"
                    @size-change="handleSizeChange" layout="total, sizes, prev, pager, next, jumper"
                    :page-sizes="[10, 20, 50, 100]" background />
            </div>

            <!-- 添加或修改coura个人工程记录表对话框 -->
            <el-dialog :title="title" v-model="open" width="500px" append-to-body>
                <el-form ref="recordRef" :model="form" :rules="rules" label-width="110px" @submit.prevent>
                    <el-form-item label="Project Name" prop="name">
                        <el-input v-model="form.name" placeholder="Please Enter Project Name" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <div class="dialog-footer">
                        <el-button type="primary" @click="submitForm">ok</el-button>
                        <el-button @click="cancel">cancel</el-button>
                    </div>
                </template>
            </el-dialog>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="selectProject">ok</el-button>
                <el-button @click="openProject = false">cancel</el-button>
            </div>
        </template>
    </el-dialog>
    <!-- 弹出对话框：询问用户是否保存文件 -->
    <el-dialog v-model="saveDialogVisible" title="PreVise" width="30%" :show-close="false">
        <span>Do you want to save the changes you made to the project?</span>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleSaveDialogCancel">Cancel</el-button>
                <el-button @click="handleSaveDialogNoSave" :plain="true">Don't save</el-button>
                <el-button type="primary" @click="handleSaveDialogSave">Save</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed, reactive, toRefs } from 'vue'
import { ElMessage } from 'element-plus';
import useGeoMetaStore from "@/store/geometa";
import { invoke } from '@tauri-apps/api/core';
import { ProjectRecordService } from '@/api/project';
const emit = defineEmits(["update"]);
const strGeoMeta = useGeoMetaStore();
const { aPane } = strGeoMeta//调用页面展示
const currentProject = computed(() => strGeoMeta.currentProject);
const recordList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const title = ref("");
const openProject = ref(false);
const project = ref("");
const saveDialogVisible = ref(false);
const data = reactive({
    form: {},
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: null,
        deptId: null,
        name: null,
        menuStructure: null,
    },
    rules: {},
});

const { queryParams, form, rules } = toRefs(data);

/** 查询数据列表 */
const getList = async () => {
    const result = await ProjectRecordService.getPagedList({
        page_index: queryParams.value.pageNum,
        page_size: queryParams.value.pageSize,
        project_name: queryParams.value.name || ''
    });
    const formattedProjects = result.data.map(project => ({
        ...project,
        is_pin: Boolean(project.is_pin),
        is_favorite: Boolean(project.is_favorite),
        update_time: formatUpdateTime(project.update_time)
    }));
    loading.value = false;
    recordList.value = formattedProjects;
    total.value = result.total_records;

}

// 取消按钮
function cancel() {
    open.value = false;
    reset();
}

// 表单重置
function reset() {
    form.value = {
        id: null,
        userId: null,
        deptId: null,
        name: null,
        menuStructure: null,
        createBy: null,
        updateBy: null,
        createTime: null,
        updateTime: null,
        remark: null,
    };
}

/** 搜索按钮操作 */
function handleQuery() {
    queryParams.value.pageNum = 1;
    getList();
}

/** 重置按钮操作 */
function resetQuery() {
    queryParams.value.name = null;
    queryParams.value.pageNum = 1;
    queryParams.value.pageSize = 10,
        getList();
}

/** 新增按钮操作 */
function handleAdd() {
    reset();
    open.value = true;
    title.value = "Add Project";
}

/** 修改按钮操作 */
function handleUpdate(row) {
    reset();
    form.value = {
        id: row.id,
        name: row.project_name,
        // 如果还有其他字段需要初始化，也可以在这里添加
    };
    open.value = true;
    title.value = "Update Project";
}

/** 提交按钮 */
function submitForm() {
    //如果存在id则修改，否则添加
    if (form.value.id) {
        hand_update_one(form.value)
    } else {
        hand_insert(form.value)
    }
}

/** 删除按钮操作 */
const handleDelete = async (row) => {
    const result = await ProjectRecordService.delete(
        row.id,
        row.project_name
    );
    if (result == 1) {
        getList();
        ElMessage.success('删除成功');
        // 发送事件通知父组件刷新数据
        emit("update");
    } else {
        ElMessage.error('删除失败');
    }
    return result;
}

/** 列表选择 */
function handleCurrentChange(val) {
    if (val) {
        project.value = val;
    }
}

/** 选择工程 */
function selectProject() {
    const showUp = aPane.find(o => 'Input' === o.title).show//如果有打开的项目就需要保存
    if (showUp) {
        saveDialogVisible.value = true;  //设置弹窗保存之后在跳转
    } else {
        saveDialogVisible.value = false;
        strGeoMeta.setCurrentProject(project);
        ProjectRecordService.open(project.project_name);
        showPage()
    }

}

function handleOpenProject() {
    openProject.value = true;
}

const formatUpdateTime = (timeString) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return timeString; // 如果不是有效日期，返回原值
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
//修改项目
const hand_update_one = async (data) => {
    const result = await ProjectRecordService.update({
        id: data.id,
        project_name: data.name
    });
    if (result == 1) {
        getList();
        emit("update");
        open.value = false;
    }
};
//新增项目
const hand_insert = async (data) => {
    const insertedId = await ProjectRecordService.add(data.name);
    //将返回的数据更新上去
    if (insertedId) {
        const results = await ProjectRecordService.get(insertedId);
        strGeoMeta.setCurrentProject(results);
        await ProjectRecordService.open(results.project_name);
    }
    showPage();
};
//新建打开新项目
const showPage = () => {
    cancel()
    aPane.find(o => 'Projects' === o.title).show = false//关闭project，打开其他窗口
    aPane.find(o => 'Input' === o.title).show = true
    aPane.find(o => 'Cases' === o.title).show = true
    aPane.find(o => 'Templates' === o.title).show = true
    aPane.find(o => 'Models' === o.title).show = true
    aPane.find(o => 'Results' === o.title).show = true
    aPane.find(o => 'Workflows' === o.title).show = true
}
const handleSaveDialogCancel = () => {
    saveDialogVisible.value = false;
    // 用户取消操作，不执行新建或打开
};
// 用户取消操作，不执行新建或打开
const handleSaveDialogNoSave = () => {
    saveDialogVisible.value = false;
    strGeoMeta.setCurrentProject(project.value);
    ProjectRecordService.open(project.value.project_name);
    showPage()
};
//将当前项目保存
const handleSaveDialogSave = () => {
    //将当前打开的项目数据更新去后台
    hand_update_all(currentProject)
    saveDialogVisible.value = false;
    //修改存储的数据
    strGeoMeta.setCurrentProject(project.value);
    ProjectRecordService.open(project.value.project_name);
    showPage()
}
const hand_update_all = async () => {
    await ProjectRecordService.update({
        id: currentProject.value.id,
        project_name: currentProject.value.project_name,
        menu_structure: currentProject.value.menu_structure
    });
};

// 处理页码变化
const handlePageChange = (newPage) => {
    queryParams.value.pageNum = newPage;
    getList();
};
// 处理页面大小变化
const handleSizeChange = (newSize) => {
    queryParams.value.pageNum = 1; // 重置到第一页
    queryParams.value.pageSize = newSize;
    getList();
};
defineExpose({
    handleOpenProject,
});

getList();
</script>
<style scoped>
/* 添加分页容器的样式，使其居中显示 */
.pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 5px;
    padding: 5px 0;
}

.app-container {
    max-height: 550px;
    /* 根据对话框高度调整 */
    padding: 0;
}

:deep(.el-table__body-wrapper ) {
    max-height: 400px;
    overflow-y: auto;
}
</style>