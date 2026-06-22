<template>
  <el-dialog :modal="false" :model-value="visible" :width="1900" :height="500" @close="handleClose"
    class="traj-edit-dialog" align-center draggable :close-on-click-modal="false">
    <template #header>
      <div class="dialog-title">
        <!-- 自定义图标 -->
        <img src="@/assets/image/traj/traj_title.png" alt="对话框图标" class="title-icon">

        <span class="title-text">Trajectory spreadsheet for '{{ props.wellName }}'</span>
      </div>
    </template>
    <!-- 表格筛选栏 -->
    <div class="table-filterbar">
      <div class="reference">
        <span>Azimuth reference:</span>
        <el-radio-group v-model="azimuthReference" size="small">
          <el-radio label="gn">Grid north</el-radio>
          <el-radio label="tn">True north</el-radio>
        </el-radio-group>
      </div>
      <div>
        <el-checkbox
          v-model="showCalcResult"
          label="Show calculated result"
          size="small"
          @change="handleChangeCalcResult" />
      </div>
    </div>
    <!-- 表格工具栏 -->
    <div class="table-toolbar">
      <!-- <el-input v-model="searchQuery" placeholder="搜索..." prefix-icon="Search" size="small" class="search-input" /> -->

      <div v-if="!showCalcResult" class="btn" @click="handleAppend">
        <img src="@/assets/image/traj/append.png" alt="Append" class="icon-image" title="Append a row at the end of spreadsheet.">
      </div>

      <div v-if="!showCalcResult" class="btn" @click="handleInsertAbove">
        <img src="@/assets/image/traj/insert_above.png" alt="Insert above" class="icon-image" title="Insert a row right above the currently selected row.">
      </div>

      <div v-if="!showCalcResult" class="btn" @click="handleInsertBelow">
        <img src="@/assets/image/traj/insert_below.png" alt="Insert below" class="icon-image" title="Insert a row right below the currently selected row.">
      </div>

      <div v-if="!showCalcResult" class="btn" @click="handleDeleteSelectedRows">
        <img src="@/assets/image/traj/delete_row.png" alt="Delete" class="icon-image" title="Delete all rows that are fully or partially selected.">
      </div>

      <div class="btn" @click="handleCopy">
        <img src="@/assets/image/traj/copy.png" alt="Copy" class="icon-image" title="Copy the selected cells to the clipboard.">
      </div>

      <div v-if="!showCalcResult" class="btn" @click="handlePaste">
        <img src="@/assets/image/traj/paste.png" alt="Paste" class="icon-image" title="Paste the clipboard content into the selected cell.">
      </div>

      <div v-if="!showCalcResult" class="btn" @click="handleReload">
        <img src="@/assets/image/traj/refresh.png" alt="Reload" class="icon-image" title="Reload model. Note: Will clear unsaved changes.">
      </div>

      <div class="btn" @click="handleClearFilters">
        <img src="@/assets/image/traj/filter_remove.png" alt="noFilters" class="icon-image" title="Clear all filters.">
      </div>

      <el-popover
        placement="bottom"
        :width="200"
        trigger="click"
        :show-arrow="false"
        :teleported="false"
        :hide-after="0"
      >
        <template #reference>
          <div class="select-box">
            <span>Show</span>
            <div class="icon">
              <el-icon><CaretBottom color="#444" /></el-icon>
            </div>
          </div>
        </template>

        <el-checkbox-group v-model="visibleColumn" size="small" class="column-checkbox">
          <el-checkbox v-for="item in allColumn" :key="item" :label="item" size="small"></el-checkbox>
        </el-checkbox-group>
      </el-popover>
    </div>

    <!-- 表格内容 -->
    <vxe-table
      ref="tableRef"
      v-loading="loading"
      border
      size="mini"
      max-height="800px"
      min-height="300px"
      class="traj-table"
      header-cell-class-name="traj-table-header"
      :cell-class-name="getCellClass"
      :virtual-y-config="{ enabled: true, gt: 200 }"
      :mouse-config="{ selected: true }"
      :row-config="{ resizable: true}"
      :header-cell-config="{ height: 25 }"
      :edit-config="{ trigger: 'click', mode: 'cell', beforeEditMethod: beforeEditMethod }"
      :column-config="{ resizable: true, drag: true }"
      :column-drag-config="columnDragConfig"
      :resizable-config="{ isDblclickAutoHeight: true, isDblclickAutoWidth: true }"
      :filter-config="{ destroyOnClose: false }"
      :tooltip-config="{}"
      :data="tableData"
      :style="{ '--vxe-ui-table-border-color': '#C0C0C0' }"
      @cell-click="handleCellClick"
      @cell-mouseenter="handleCellMouseEnter"
      @cell-selected="handleCellSelected"
      @filter-change="handleFilterChange"
      @filter-visible="handleFilterVisible"
    >
      <vxe-column width="auto" field="id" row-resize class-name="index-cell">
        <template #default="{ _rowIndex, row }">
          <img v-if="row.editStatus === 'error'" src="@/assets/image/cancel.png" alt="" width="20">
          <img v-else-if="row.editStatus === 'edit'" src="@/assets/image/edit.png" alt="" width="20">
          <img v-else src="@/assets/image/ok.png" alt="" width="20">
          <span>{{ _rowIndex + 1 }}</span>
        </template>
      </vxe-column>

      <vxe-column
        field="coord_e"
        title="X(m)"
        width="120"
        min-width="120"
        :filters="filters"
        :filter-render="{ name: 'FilterRender' }"
        :visible="columnVisible('X(m)')"
      ></vxe-column>

      <vxe-column
        field="coord_n"
        title="Y(m)"
        width="120"
        min-width="120"
        :filters="filters"
        :filter-render="{ name: 'FilterRender' }"
        :visible="columnVisible('Y(m)')"
      ></vxe-column>

      <vxe-column
        field="z"
        title="Z(m)"
        :filters="filters"
        :filter-render="{ name: 'FilterRender' }"
        :visible="columnVisible('Z(m)')"
      ></vxe-column>

      <vxe-column
        field="md"
        title="MD(m)"
        width="120"
        min-width="120"
        :filters="filters"
        :filter-render="{ name: 'FilterRender' }"
        :visible="columnVisible('MD(m)')"
        :edit-render="{ name: 'NumberInputRender', events: { valuechange: handleRowDataChange } }"
      ></vxe-column>

      <vxe-column
        field="incl"
        title="Inclination(deg)"
        width="130"
        min-width="130"
        :filters="filters"
        :filter-render="{ name: 'FilterRender' }"
        :visible="columnVisible('Inclination(deg)')"
        :edit-render="{ name: 'NumberInputRender', events: { valuechange: handleRowDataChange } }"
      ></vxe-column>

      <vxe-column
        field="closure_azimuth"
        title="Azimuth GN(deg)"
        width="140"
        min-width="140"
        :filters="filters"
        :filter-render="{ name: 'FilterRender' }"
        :visible="columnVisible('Azimuth GN(deg)')"
        :edit-render="{ name: 'NumberInputRender', events: { valuechange: handleRowDataChange } }"
      ></vxe-column>

      <vxe-column
        field="closure_azimuth"
        title="Azimuth TN(deg)"
        width="140"
        min-width="140"
        :filters="filters"
        :filter-render="{ name: 'FilterRender' }"
        :visible="columnVisible('Azimuth TN(deg)')"
        :edit-render="{ name: 'NumberInputRender', events: { valuechange: handleRowDataChange } }"
      ></vxe-column>

      <vxe-column
        field="disp_e"
        title="DX(m)"
        :filters="filters"
        :filter-render="{ name: 'FilterRender' }"
        :visible="columnVisible('DX(m)')"
      ></vxe-column>

      <vxe-column
        field="disp_n"
        title="DY(m)"
        :filters="filters"
        :filter-render="{ name: 'FilterRender' }"
        :visible="columnVisible('DY(m)')"
      ></vxe-column>
      
      <vxe-column
        field="disp_e"
        title="DX TN(m)"
        :filters="filters"
        :filter-render="{ name: 'FilterRender' }"
        :visible="columnVisible('DX TN(m)')"
      ></vxe-column>

      <vxe-column
        field="disp_n"
        title="DY TN(m)"
        :filters="filters"
        :filter-render="{ name: 'FilterRender' }"
        :visible="columnVisible('DY TN(m)')"
      ></vxe-column>

      <vxe-column
        field="tvd"
        title="TVD(m)"
        width="120"
        min-width="120"
        :filters="filters"
        :filter-render="{ name: 'FilterRender' }"
        :visible="columnVisible('TVD(m)')"
      ></vxe-column>

      <vxe-column
        field="empty"
        title="TWT(ms)"
        width="100"
        min-width="100"
        :filters="filters"
        :filter-render="{ name: 'FilterRender' }"
        :visible="columnVisible('TWT(ms)')"
      ></vxe-column>

      <vxe-column
        field="dls"
        title="DLS(deg/30m)"
        width="130"
        min-width="130"
        :filters="filters"
        :filter-render="{ name: 'FilterRender' }"
        :visible="columnVisible('DLS(deg/30m)')"
      ></vxe-column>
    </vxe-table>

    <div class="status-bar-container" :style="{ height: tableHeight + 'px' }">
      <div class="status-bar-header" :style="{ height: tableHeaderHeight + 'px' }">
        <img v-if="statusBarHeaderImg == 'error'" src="@/assets/image/cancel.png" alt="" width="20">
        <img v-else-if="statusBarHeaderImg == 'edit'" src="@/assets/image/edit.png" alt="" width="20">
        <img v-else src="@/assets/image/ok.png" alt="" width="20">
      </div>
      <div ref="listContainer" class="status-bar-list" :style="{ height: tableHeight - tableHeaderHeight - 4 + 'px' }" @click="handleStatusBarClick"></div>
    </div>
    
    <div class="cnt">Number of rows:{{ getTableDataNum }}</div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleSave(false)" type="primary" size="small" class="confirm-btn" :disabled="!enableSave" :loading="btnLoading" title="Apply changes.">
          <el-icon class="el-icon--left"><img src="@/assets/image/ok.png" alt="" width="20"></el-icon>
          Apply
        </el-button>
        <el-button @click="handleSave(true)" type="primary" size="small" class="confirm-btn" :disabled="!enableSave" :loading="btnLoading" title="Apply changes and close the dialog.">
          <el-icon class="el-icon--left"><img src="@/assets/image/ok.png" alt="" width="20"></el-icon>
          OK
        </el-button>
        <el-button @click="handleClose" size="small" class="cancel-btn" title="Close changes since last 'Apply' or 'OK', and close the dialog.">
          <el-icon class="el-icon--left"><img src="@/assets/image/cancel.png" alt="" width="20"></el-icon>
          Close
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { 
  ref,
  onMounted,
  watch,
  nextTick,
  reactive,
  computed,
  onBeforeUnmount,
} from 'vue';
import { ElMessage } from 'element-plus';
import { invoke } from '@tauri-apps/api/core';
import { CaretBottom } from '@element-plus/icons-vue'
import type { VxeTablePropTypes } from 'vxe-table'
import type { NumberPairString, TableItem } from "./type";

// 定义组件属性
const props = defineProps<{
  visible: boolean;
  wellId: number;
  wellName: String;
}>();

// 定义组件事件
const emit = defineEmits<{
  (e: 'close'): void;
}>();

// Azimuth reference值
const azimuthReference = ref('gn');

// Show calculated result值
const showCalcResult = ref(false);
// 表格非初始数据时，禁止切换Show calculated
const handleChangeCalcResult = () => {
  if (enableSave.value) {
    window.alert('Changes must be applied');
    nextTick(() => {
      showCalcResult.value = false;
    })
  } else {
    activeMap.value.clear();
  }
}

// 表格数据
const tableData = ref<TableItem[]>([]);

// 表格ref
const tableRef = ref();

// 加载状态
const loading = ref(true);

// 表格底部数据条数
const getTableDataNum = computed(() => {
  if (!tableRef.value) {
    return 0;
  }

  const { visibleData } = tableRef.value.getTableData();
  return visibleData ? visibleData.length : 0;
})

/**
 * 单元格编辑触发事件，由inputRender内部触发
 * @param cellValue 单元格值
 * @param row 行数据
 * @param column 列数据
 */
const handleRowDataChange = ({ cellValue, row, column }) => {
  const rowIndex = tableData.value.indexOf(row);
  
  updateRowStatus(rowIndex);
}

/**
 * 从rowIndex行开始更新到表尾
 * @param rowIndex 需要更新行的起始索引
 */
const updateRowStatus = (rowIndex) => {
  return new Promise((resolve) => {
    if (rowIndex < 0 || rowIndex >= tableData.value.length) {
      throw new Error('rowIndex out of range')
    }

    // 使用requestIdleCallback分批次处理
    let curIndex = rowIndex;
    const totalElements = tableData.value.length;
    const batchSize = 80000;
    // 查找rowIndex之前最近的mdStatus为空的元素，即合法数据
    let lastEmptyIndex = -1;
    for (let i = rowIndex - 1; i >= 0; i--) {
        if (!tableData.value[i].mdStatus) {
            lastEmptyIndex = i;
            break;
        }
    }
    btnLoading.value = true;

    let start = Date.now();

    function processBatch(deadline) {
      // 利用浏览器空闲时间处理批次
      // while (curIndex < totalElements) {
      // 目前发现不使用timeRemaining渲染会更快，若需要开启，则使用下行代码，同时设置batchSize
      while (curIndex < totalElements && deadline.timeRemaining() > 0) {
        const row = tableData.value[curIndex];
        const curMd = row.md;

        // 处理mdStatus
        if (Number(curMd) > 0) {
          if (lastEmptyIndex === -1 || tableData.value[lastEmptyIndex].md < curMd) {
            row.mdStatus = '';
            lastEmptyIndex = curIndex;
          } else {
            row.mdStatus = 'error';
          }
        } else {
          row.mdStatus = 'error';
        }

        // 处理editStatus
        if (row.mdStatus) {
          row.editStatus = 'error';
        } else {
          if (row.id) { // 原始存在的数据
            const originalRow = row.originalData as TableItem;
            if (isEmpty(row.incl) || isEmpty(row.closure_azimuth)) {
              row.editStatus = 'error';
            } else if (row.md != originalRow.md || row.incl != originalRow.incl || row.closure_azimuth != originalRow.closure_azimuth) {
              row.editStatus = 'edit'
            } else {
              row.editStatus = '';
            }
          } else { // 新增的数据
            if (row.incl && row.closure_azimuth) {
              row.editStatus = 'edit'
            } else {
              row.editStatus = 'error';
            }
          }
        }

        curIndex++;

        // 达到批次大小限制，等待下一次空闲周期
        if (curIndex % batchSize === 0) {
            break;
        }
      }
      // 所有元素处理完成
      if (curIndex >= totalElements) {
          console.log('全部处理时间', Date.now() - start);
          renderStatusBarList();
          btnLoading.value = false;
          updateSaveStatus();
          resolve(tableData.value);
          return;
      }

      // 继续调度下一批次
      requestIdleCallback(processBatch);
    }

    // 启动第一批处理
    requestIdleCallback(processBatch);
  })
}

// 底部按钮loading，用于避免enableSave字段更新过慢导致保存错误触发
const btnLoading = ref(false);

/**
 * 更新enableSave值
 */
const updateSaveStatus = () => {
  const hasDeleted = deletedRow.size > 0;

  let enable = false;
  for (const item of tableData.value) {
    if (item.editStatus == 'error') {
      enableSave.value = false;
      return false
    }
    if (item.editStatus == 'edit' || hasDeleted) {
      enable = true;
    }
  }
  enableSave.value = enable;
}

// 从后端加载数据
const loadData = async () => {
  try {
    loading.value = true;
    // 调用 Tauri 后端命令获取数据
    let result: TableItem[] = await invoke('trace_get_list_by_well_id', {
      wellId: props.wellId
    });
    result = result.map(item=> {
      return {
        ...item,
        originalData: item
      }
    })
    
    tableData.value = result as TableItem[];
    activeMap.value.clear();
    enableSave.value = false;

    tableObserver();
    nextTick(() => {
      renderStatusBarList();
      setTimeout(() => {
        tableRef.value.scrollToRow(tableData.value[0]);
      })
    })

    return Promise.resolve(true);
  } catch (error) {
    activeMap.value.clear();
    console.error('加载数据失败:', error);
    ElMessage.error('Failed to load data, please try again.');
    return Promise.reject(false);
  } finally {
    loading.value = false;
  }
};

const tableHeight = ref(30);
const tableHeaderHeight = ref(30);
/**
 * 获取表格高度，包括header高度和整个高度，用于表格右侧状态栏布局
 */
const tableObserver = () => {
  let tableEl = null;
  let tableHeaderEl = null;

  const observer = new MutationObserver((mutationList) => {
    mutationList.forEach(mutation => {
      if (mutation.type === 'childList') {
        tableEl = document.querySelector('.vxe-table');
        if (tableEl) {
          tableHeaderEl = tableEl.querySelector('.vxe-table--header-wrapper');
          if (tableHeaderEl) {
            handleTableReady();
            observer.disconnect();
          }
        }
      }
    })
  })

  observer.observe(document.documentElement, {
    childList: true, // 监听子节点变化
    subtree: true,   // 深入监听所有子树
    attributes: false // 暂不监听属性变化
  })


  function handleTableReady() {
    getTableHeight();
    startResizeObserver();
  }

  function getTableHeight() {
    tableHeight.value = tableEl.offsetHeight - 1;
    tableHeaderHeight.value = tableHeaderEl.offsetHeight - 1;
  }

  function startResizeObserver() {
    const resizeObserver = new ResizeObserver(entries => {
      getTableHeight();
    })

    resizeObserver.observe(tableEl);
    resizeObserver.observe(tableHeaderEl);
  }
}

const statusBarMap = reactive({
  '': 'status-bar-item',
  'error': 'status-error status-bar-item',
  'edit': 'status-edit status-bar-item',
});

/**
 * 根据表格行数据获取对应statusBarItem的类名
 * @param item 表格行
 */
const getStatusBarItemClass = computed(() => {
  return editStatus => {
    return statusBarMap[editStatus] || statusBarMap[''];
  }
})

const statusBarHeaderImg = computed(() => {
  if (tableData.value.some(i => i.editStatus == 'error')) {
    return 'error'
  } else if (tableData.value.some(i => i.editStatus == 'edit')) {
    return 'edit'
  } else {
    return ''
  }
})

const listContainer = ref<HTMLDivElement | null>(null); // 列表容器

/**
 * 渲染列表
 */
const renderStatusBarList = () => {
  if (!listContainer.value) {
    return;
  }
  listContainer.value.innerHTML = '';
  const fragment = document.createDocumentFragment();

  const { visibleData } = tableRef.value.getTableData();

  visibleData.forEach(item => {
    const div = document.createElement('div');
    div.dataset.rowkey = item._X_ROW_KEY;
    div.className = getStatusBarItemClass.value(item.editStatus);
    fragment.appendChild(div);
  })
  listContainer.value.appendChild(fragment);
}

const handleStatusBarClick = (e) => {
  const item = e.target.closest('[data-rowkey]');
  if (!item) return;
  const rowKey = item.dataset.rowkey;

  const rowIndex = tableData.value.findIndex(i => i._X_ROW_KEY == rowKey)
  
  tableRef.value.scrollToRow(tableData.value[rowIndex]);
}

/**
 * 值为true时表示可保存，条件：
 * 1.表格中没有editStatus为error的行
 * 2.表格中至少有一行editStatus为edit或者有删除原始数据(带id的行)
 */
const enableSave = ref(false);

/**
 * 保存当前数据
 * @param close 是否关闭弹窗
 */
const handleSave = async (close?: boolean) => {
  try {
    // 新增的数据
    const insert: TableItem[] = tableData.value.filter(i => !i.id);
    // 处理插入数据的sort_base_id和sort_offset字段
    for (let i = 0; i < insert.length; i++) {
      let cur = insert[i];
      let curIndex = tableData.value.indexOf(cur);
      let offsetIndex = findNearestWithId(curIndex);
      let offset = offsetIndex - curIndex;
      let baseId = tableData.value[offsetIndex].id;
      cur.sort_base_id = baseId;
      cur.sort_offset = offset;
    }
    console.log('insert', insert);
    
    // 删除的数据
    const remove = Array.from(deletedRow) as TableItem[];
    console.log('remove', remove);

    // 修改的数据
    const update: TableItem[] = tableData.value.filter(i => i.editStatus && i.id);
    console.log('remove', remove);

    await invoke('trace_batch_edit', {
      dto: {
        insert_list: insert.map(i => {
          return {
            well_id: props.wellId,
            md: Number(i.md),
            incl: Number(i.incl),
            closure_azimuth: Number(i.closure_azimuth),
            sort_base_id: Number(i.sort_base_id),
            sort_offset: Number(i.sort_offset),
          }
        }),
        update_list: update.map(i => {
          return {
            id: i.id,
            md: Number(i.md),
            incl: Number(i.incl),
            closure_azimuth: Number(i.closure_azimuth)
          }
        }),
        delete_list: remove.map(i => i.id)
      }
    });

    await loadData();

    if (close) {
      setTimeout(() => {
        handleClose();
      }, 1000)
    }
  } catch (error) {
    ElMessage.error('Failed to save data, please try again.');
  }
};

/**
 * 根据insert数据的索引，找到距离最近并且有id的数组项额度索引
 * @param index 索引
 */
const findNearestWithId = (index) => {
    const arr = tableData.value;
    let leftDist = Infinity;
    let rightDist = Infinity;
    let leftIndex = -1;
    let rightIndex = -1;
    // 向左搜索
    for (let i = index - 1; i >= 0; i--) {
        if (arr[i] && arr[i].id) {
            leftDist = index - i;
            leftIndex = i;
            break; // 找到最近的左侧带id项
        }
    }
    
    // 向右搜索
    for (let i = index + 1; i < arr.length; i++) {
        if (arr[i] && arr[i].id) {
            rightDist = i - index;
            rightIndex = i;
            break; // 找到最近的右侧带id项
        }
    }
    
    // 比较左右距离，返回最近的
    if (leftIndex === -1 && rightIndex === -1) {
        return -1; // 未找到带id的项
    } else if (leftIndex === -1) {
        return rightIndex; // 只有右侧有结果
    } else if (rightIndex === -1) {
        return leftIndex; // 只有左侧有结果
    } else {
        // 两边都有结果，返回距离更近的
        if (leftDist <= rightDist) {
            return leftIndex; // 距离相同则优先左侧
        } else {
            return rightIndex;
        }
    }
}

/**
 * 处理关闭对话框
 */
const handleClose = () => {
  emit('close');
};

onMounted(() => {
  if (props.visible) {
    loadData();
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', mousedownEvent);
  document.removeEventListener('mouseup', mouseupEvent);
  document.removeEventListener('keydown', keydownEvent);
})


// 监听对话框显示状态变化，重新加载数据
watch(() => props.visible, (newVal) => {
  if (newVal) {
    loadData();
  }
});

const filters = ref([{ data: '' }]);
const filterRender = ref({ name: 'FilterRender' });
/**
 * 筛选条件变化时，清除选择的单元格，并重新渲染右侧状态条
 */
const handleFilterChange = () => {
  renderStatusBarList();
  activeMap.value.clear();
}

const filterVisible = ref(false);
const handleFilterVisible = ({ visible }) => {
  filterVisible.value = visible;
}

/**
 * 获取根据列标题获取是否可编辑
 * @param columnTitle 列标题
 */
const editableColumn = (columnTitle) => {
  return !showCalcResult.value
    && (columnTitle === 'MD(m)'
      || columnTitle === 'Inclination(deg)'
      || (azimuthReference.value === 'gn' && columnTitle === 'Azimuth GN(deg)')
      || (azimuthReference.value === 'tn' && columnTitle === 'Azimuth TN(deg)'));
}

/**
 * 判断当前是否可编辑
 * @param row 行
 * @param column 列
 */
const beforeEditMethod = ({ row, column }): boolean => {
  if (editableColumn(column.title)) {
    return true;
  }
  return false;
}

// 列拖拽配置
const columnDragConfig = reactive<VxeTablePropTypes.ColumnDragConfig<TableItem>>({
  trigger: 'cell',
  showIcon: false,
  dragStartMethod({ column }) {
    return true;
  },
  dragEndMethod({ newColumn, oldColumn }) {
    if (newColumn.sortNumber === 1) { // 序号列禁止拖拽
      return false;
    }
    if (newColumn.sortNumber === oldColumn.sortNumber) {
      return false;
    }
    const newIndex = newColumn.sortNumber - 1;
    const oldIndex = oldColumn.sortNumber - 1;
    [columns.value[oldIndex], columns.value[newIndex]] = [columns.value[newIndex], columns.value[oldIndex]];

    activeMap.value.clear();
    return true;
  },
  disabledMethod({ column }) {
    if (column.sortNumber === 1) {
      return true;
    } else {
      return false;
    }
  }
})

// 空行数据，用于插入新行
const emptyRow: TableItem = {
  id: '',
  coord_e: '',
  coord_n: '',
  z: '',
  md: '',
  incl: '',
  closure_azimuth: '',
  disp_e: '',
  disp_n: '',
  tvd: '',
  dls: '',
  editStatus: 'error',
  mdStatus: 'error',
};

// 选中的单元格数据，数据格式为 rowIndex_columnIndex
const activeMap = ref<Set<NumberPairString>>(new Set());

// 表格列数据
const columns = ref([
  { title: '', field: '' },
  { title: 'X(m)', field: 'coord_e' },
  { title: 'Y(m)', field: 'coord_n' },
  { title: 'Z(m)', field: 'z' },
  { title: 'MD(m)', field: 'md' },
  { title: 'Inclination(deg)', field: 'incl' },
  { title: 'Azimuth GN(deg)', field: 'closure_azimuth' },
  { title: 'Azimuth TN(deg)', field: 'closure_azimuth' },
  { title: 'DX(m)', field: 'disp_e' },
  { title: 'DY(m)', field: 'disp_n' },
  { title: 'DX TN(m)', field: 'disp_e' },
  { title: 'DY TN(m)', field: 'disp_n' },
  { title: 'TVD(m)', field: 'tvd' },
  { title: 'TWT(ms)', field: '' },
  { title: 'DLS(deg/30m)', field: 'dls' }
]);

// 所有非空行标题，用于列显隐操作区渲染选项
const allColumn = computed(() => {
  return columns.value.map(item => item.title).filter(item => item);
})

// 列显隐操作区绑定的可见列数据
const visibleColumn = ref(columns.value.map(item => item.title).filter(item => item));

/**
 * 通过列标题判断列是否可见
 * @param title 列标题
 */
const columnVisible = computed(() => {
  return title => {
    return visibleColumn.value.includes(title);
  }
})

/**
 * 单元格点击事件
 */
const handleCellClick = ({ columnIndex, rowIndex, row, $event }) => {
  if (columnIndex === 0) { // 触发当前行的选中切换
    const columnNum = columns.value.length;
    if (!$event.ctrlKey) {
      activeMap.value.clear();
    }

    for (let i = 1; i < columnNum; i++) {
      const key = rowIndex + '_' + i as NumberPairString;
      activeMap.value.add(key);
    }
  } else { // 触发单个单元格的选中切换
    const key = rowIndex + '_' + columnIndex;
    if (!$event.ctrlKey) {
      activeMap.value.clear();
    }

    if (activeMap.value.has(key as NumberPairString)) {

      activeMap.value.delete(key as NumberPairString);
    } else {
      activeMap.value.add(key as NumberPairString);
    }
  }
}

//#region 鼠标拖动多选、Ctrl+C复制、Ctrl+V黏贴、Ctral+A全选
let isDraging = ref(false);
let startCell = ref([0, 0]); // 用于记录鼠标左键点击后拖动选择的起始单元格

/**
 * 表格的cell-selected事件，用于记录startCell
 */
const handleCellSelected = ({ rowIndex, columnIndex}) => {
  startCell.value = [rowIndex, columnIndex];
}

/**
 * 表格的cell-mouse-enter事件，用于处理鼠标拖动时的单元格选中
 */
const handleCellMouseEnter = ({ rowIndex, columnIndex, $event }) => {
  if (!isDraging.value) {
    startCell.value = [0, 0];
    return;
  }
  console.log('开始', startCell.value[0], startCell.value[1]);
  console.log('结束', rowIndex, columnIndex);

  // 处理鼠标拖动时的单元格选中
  if (!$event.ctrlKey) {
    activeMap.value.clear();
  }

  let startRow = startCell.value[0];
  let startColumn = startCell.value[1];
  let endRow = rowIndex;
  let endColumn = columnIndex;

  let minRow = 0;
  let maxRow = 0;
  let minColumn = 0;
  let maxColumn = 0;

  const columnNum = columns.value.length;
  if (startColumn == 0) { // 行选中
    minRow = Math.min(startRow, endRow);
    maxRow = Math.max(startRow, endRow);
    minColumn = 1;
    maxColumn = columnNum - 1;
  } else {
    // 单元格选择去掉第一列
    endColumn = endColumn == 0 ? 1 : endColumn;

    minRow = Math.min(startRow, endRow);
    maxRow = Math.max(startRow, endRow);
    minColumn = Math.min(startColumn, endColumn);
    maxColumn = Math.max(startColumn, endColumn);
  }

  for (let i = minRow; i <= maxRow; i++) {
    for (let j = minColumn; j <= maxColumn; j++) {
      activeMap.value.add(i + '_' + j as NumberPairString);
    }
  }

}

const mousedownEvent = (e: MouseEvent) => {
  isDraging.value = e.button === 0;
};
const mouseupEvent = (e: MouseEvent) => {
  if (isDraging.value && e.button === 0) {
    isDraging.value = false;
  }
}
const keydownEvent = (e: KeyboardEvent) => {
  if (e.key === 'c' && (e.ctrlKey || e.metaKey)) { // 复制
    if (!filterVisible.value) {
      handleCopy();
    }
  } else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) { // 黏贴
    if (!filterVisible.value) {
      handlePaste();
    }
  } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) { // 全选
    if (!isEditableElement(e.target as HTMLElement)) {
      e.preventDefault();
      handleCopyAll();
    }
  }
}
const contextmenuEvent = (e: MouseEvent) => {
  e.preventDefault();
}
document.addEventListener('mousedown', mousedownEvent);
document.addEventListener('mouseup', mouseupEvent);
document.addEventListener('keydown', keydownEvent);
document.addEventListener('contextmenu', contextmenuEvent);

/**
 * 判断元素是否为可编辑状态，避免输入框聚焦时的ctrl+a行为冲突
 * @param element 元素
 */
const isEditableElement = (
  element: HTMLElement
): element is (HTMLInputElement | HTMLTextAreaElement) & { disabled: false, readOnly: false } | HTMLElement & { isContentEditable: true } => {
  const tagName = element.tagName.toLowerCase();

  // 1. 处理input和textarea元素
  if (tagName === 'input' || tagName === 'textarea') {
    const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
    
    // 排除disabled和readonly状态
    if (inputElement.disabled || inputElement.readOnly) {
      return false;
    }
    
    // 特殊input类型处理（排除不可编辑类型）
    if (tagName === 'input') {
      const nonEditableTypes = ['checkbox', 'radio', 'submit', 'reset', 'button', 'image', 'file'];
      if (nonEditableTypes.includes(inputElement.type.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  }

  // 2. 处理contenteditable元素
  return element.isContentEditable === true;
}
//#endregion

/**
 * 由于免费版本的vxeTable不支持多选，所以单元格多选功能使用activeMap自己实现
 * 同时行的插入以及删除操作之后，选中单元格的行列索引可能会变化，此时就需要更新activeMap中的索引
 * 为了避免这种情况，同时与Petrel交互细节一致，在行插入以及删除操作之后，清除activeMap
 */

/**
 * 表格底部插入
 */
const handleAppend = () => {
  tableData.value.push(JSON.parse(JSON.stringify(emptyRow)));
  activeMap.value.clear();
  enableSave.value = false;

  setTimeout(() => {
    tableRef.value.scrollToRow(tableData.value[tableData.value.length - 1]);
    updateRowStatus(tableData.value.length - 1);
  })
}

/**
 * 当前行上方插入，有多选单元格时，以最上的选中单元格所在行为基准，没有选中时，不操作
 */
const handleInsertAbove = () => {
  const minRow = Math.min(...Array.from(activeMap.value).map(item => Number(item.split('_')[0])));

  if (minRow >= 0 && minRow < tableData.value.length) {
    tableData.value.splice(minRow, 0, JSON.parse(JSON.stringify(emptyRow)));
    activeMap.value.clear();
    enableSave.value = false;
    setTimeout(() => {
      tableRef.value.scrollToRow(tableData.value[minRow]);
      updateRowStatus(minRow);
    })
  }
}

/**
 * 当前行下方插入，有多选单元格时，以最下的选中单元格所在行为基准，没有选中时，不操作
 */
const handleInsertBelow = () => {
  const minRow = Math.min(...Array.from(activeMap.value).map(item => Number(item.split('_')[0])));
  const maxRow = Math.max(...Array.from(activeMap.value).map(item => Number(item.split('_')[0])));

  if (maxRow >= 0 && maxRow < tableData.value.length) {
    tableData.value.splice(maxRow + 1, 0, JSON.parse(JSON.stringify(emptyRow)));
    activeMap.value.clear();
    enableSave.value = false;
    setTimeout(() => {
      tableRef.value.scrollToRow(tableData.value[maxRow + 1]);
      updateRowStatus(minRow);
    })
  }
}

// 记录删除的数据（只记录有id的原始数据）
const deletedRow= new Set();

/**
 * 删除选中的行,包括单元格和整行选择
 */
const handleDeleteSelectedRows = () => {
  let selectedRowIndex = new Set<number>();
  activeMap.value.forEach(item => {
    const keyArr = item.split('_');
    selectedRowIndex.add(Number(keyArr[0]));
  })

  if (selectedRowIndex.size === 0) {
    return;
  }

  const minRow = Math.min(...Array.from(selectedRowIndex));


  let selectedRows = [];
  for (const index of selectedRowIndex) {
    selectedRows.push(tableData.value[index]);

    if (tableData.value[index]['id']) {
      deletedRow.add(tableData.value[index]);
      updateSaveStatus();
    }
  }
  tableRef.value.remove(selectedRows);
  updateRowStatus(minRow);

  activeMap.value.clear();
}

/**
 * 复制选中的单元格
 */
const handleCopy = () => {
  if (!activeMap.value.size) {
    return;
  }
  try {
    let arr: string[][] = [];

    let activeArr: NumberPairString[] = Array.from(activeMap.value);
    activeArr = activeArr.filter(item => item.split('_')[1] != '0');
    activeArr.sort((a, b) => {
      let aRow = Number(a.split('_')[0]);
      let aColumn = Number(a.split('_')[1]);
      let bRow = Number(b.split('_')[0]);
      let bColumn = Number(b.split('_')[1]);
      if (aRow === bRow) {
        return aColumn - bColumn;
      } else {
        return aRow - bRow;
      }
    })

    let curRow = Infinity;
    activeArr.forEach(item => {
      const rowIndex = Number(item.split('_')[0]);
      const columnIndex = Number(item.split('_')[1]);

      const rowData = tableData.value[rowIndex];
      const cellValue = rowData[columns.value[columnIndex]['field']];

      if (columnIndex != 0) {
        if (curRow !== rowIndex) {
          arr.push([]);
          curRow = rowIndex;
        }
        arr[arr.length - 1].push(cellValue);
      }
    })

    const copyText = arr.map(item => item.join('\t')).join('\n');
    console.log(copyText);
    navigator.clipboard.writeText(copyText);
  } catch (error) {
    ElMessage.error('Error: copy failed');
  }
}

const handleCopyAll = () => {
  const columnNum = columns.value.length;
  for (let i = 0; i < tableData.value.length; i++) {
    for (let j = 1; j <= columnNum; j++) {
      const key = i + '_' + j as NumberPairString;
      activeMap.value.add(key);
    }
  }
}

/**
 * 粘贴复制的内容到选中的单元格
 */
const handlePaste = async () => {
  if (showCalcResult.value) {
    return;
  }

  try {
    let copyText = await navigator.clipboard.readText();
    console.log(copyText);
    copyText = copyText.replace(/\r\n/g, '\n'); // 兼容不同浏览器的换行符
    let arr = copyText.split('\n').map(item => item.split('\t')).flat().filter(item => item);

    // 对剪切板内容做校验
    const reg = /^-?\d+(\.\d+)?$/;
    const unValid = arr.some(i => !reg.test(i));
    
    if (unValid) {
      window.alert('Some of the pasted values are not valid for some of the cells');
      return;
    }

    let activeArr = Array.from(activeMap.value);
    activeArr.sort((a, b) => {
      let aRow = Number(a.split('_')[0]);
      let aColumn = Number(a.split('_')[1]);
      let bRow = Number(b.split('_')[0]);
      let bColumn = Number(b.split('_')[1]);
      if (aRow === bRow) {
        return aColumn - bColumn;
      } else {
        return aRow - bRow;
      }
    })

    if (!activeArr.length) {
      return;
    }

    let startRowIndex = activeArr[0].split('_')[0];

    while (activeArr.length) {
      const curCell = activeArr.shift() as NumberPairString;
      const rowIndex = curCell.split('_')[0];
      const columnIndex = curCell.split('_')[1];
      const rowData = tableData.value[rowIndex];
      if (editableColumn(columns.value[columnIndex]['title']) && arr.length) {
        const copy = arr.shift();
        rowData[columns.value[columnIndex]['field']] = copy;
      }
      if (!arr.length) {
        activeArr = [];
      }
    }
    // 这里使用黏贴的第一行内容去更新其他行状态
    updateRowStatus(Number(startRowIndex));
  } catch (error) {
    ElMessage.error('Error: paste failed');
  }
}

/**
 * 单元格类名
 * editable-cell 可编辑的单元格
 * activ-cell 选中的单元格
 */
const getCellClass = ({ rowIndex, columnIndex, column, row }) => {
  let className: string[] = [];
  
  if (columnIndex === 0 || editableColumn(column.title)) { // 序号列和可编辑列
    className.push('editable-cell');

      if (row.editStatus == 'error') {
        if (columnIndex !== 0) {
          if (row.mdStatus && column.field === 'md') {
            className.push('error-cell');
          }
          if (!row.closure_azimuth) {
            if (azimuthReference.value == 'gn' && column.title == 'Azimuth GN(deg)') {
              className.push('error-cell');
            }
            if (azimuthReference.value == 'tn' && column.title == 'Azimuth TN(deg)') {
              className.push('error-cell');
            }
          }
          if (column.field == 'incl' && !row.incl) {
            className.push('error-cell');
          }
        }
      }
  }

  if (activeMap.value.has(rowIndex + '_' + columnIndex as NumberPairString)) { // 已选中单元格
    className.push('active-cell');
  }

  return className.join(' ');
}

/**
 * 重新加载数据
 */
const handleReload = () => {
  loadData();
}

/**
 * 清空表格筛选
 */
const handleClearFilters = () => {
  tableRef.value.clearFilter();
}

/**
 * 判断val是否为空字符串或undefined
 * @param val
 */
const isEmpty = (val) => {
    return val === '' || val == undefined;
}
</script>

<style lang="scss">
.status-bar-container {
  display: inline-flex;
  flex-direction: column;

  .status-bar-list {
    display: flex;
    flex-direction: column;
    cursor: pointer;

    .status-bar-item {
      flex: 1;
      max-height: 23px;

      &.status-error {
        background-color: #ff0000;
      }

      &.status-edit {
        background-color: #87CEFA;
      }
    }
  }
}
.table-filterbar {
  margin-bottom: 10px;
  .reference {
    display: flex;
    align-items: center;

    & > span {
      margin-right: 10px;
      font-size: 12px;
    }
  }
}
.select-box {
  cursor: pointer;
  border: 1px solid #999;
  border-radius: 3px;
  margin-left: 5px;
  padding-left: 2px;
  height: 23px;
  line-height: 23px;
  box-shadow: 0 0 1px 1px #ddd;
  overflow: hidden;
  font-size: 12px;

  .icon {
    display: inline-block;
    width: 20px;
    height: 23px;
    margin-left: 2px;
    background: linear-gradient(#F5F5F5, #CFCFCF);
    text-align: center;
    border-left: 1px solid #999;
  }

  &:hover {
    .icon {
      background: linear-gradient(#F5F5F5, #ACACAC);
    }
  }
}

.column-checkbox {
  .el-checkbox {
    display: flex;
  }
}

</style>