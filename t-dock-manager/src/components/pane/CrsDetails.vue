<template>
  <el-dialog v-model="detailsVisible" width="40%" draggable class="project-dialog">
    <template #header>
      <div class="dialog-custom-header">
        <img src="@/assets/image/project/crs.png" alt="title" class="title-image" />
        <span>{{ crsData.crs_name }}</span>
      </div>
    </template>
    <div class="tab-content">
      <div class="form-row separator">
        <label>Coordinate reference system (CRS)</label>
        <hr>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Name:</label>
          <el-input disabled style="width: 200px;" :value="crsData.crs_name" />
        </div>
        <div class="form-group">
          <label>Authority code:</label>
          <el-input disabled style="width: 100px;" :value="crsData.auth_name+','+crsData.auth_code" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Unit domain:</label>
          <el-input disabled style="width: 200px;" :value="crsData.unit_domain"/>
        </div>
        <div class="form-group">
          <label>Native surface unit:</label>
          <el-input disabled style="width: 100px;" :value="crsData.horizontal_unit"/>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Description:</label>
          <el-input disabled style="width:80%;" :value="crsData.descn"/>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Extended WKT:</label>
          <el-input type="textarea" disabled style="width: 80%; resize: vertical;" :value="crsData.wkt"/>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Reference CRS:</label>
          <el-input disabled style="width:300px;" :value="crsData.refer_crs"/>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Textual CRS representation:</label>
          <el-input type="textarea" disabled style="width: 80%; resize: vertical;" :value="crsData.textual_crs"/>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Area of use:</label>
          <el-input type="textarea" disabled style="width: 80%; resize: vertical;" :value="crsData.area"/>
        </div>
      </div>
    </div>
    <div class="tab-content">
      <div class="form-row separator">
        <label>Caetographic transform</label>
        <hr>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Name:</label>
          <el-input disabled style="width:200px;" />
        </div>
        <div class="form-group">
          <label>Authority code:</label>
          <el-input disabled style="width:100px;" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>From CRS:</label>
          <el-input disabled style="width:200px;" />
        </div>
        <div class="form-group">
          <label>To CRS:</label>
          <el-input disabled style="width:200px;" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Extended WKT:</label>
          <el-input type="textarea" disabled style="width: 80%; resize: vertical;" />
        </div>
      </div>
    </div>

    <div class="button-container">
      <el-button @click="detailsVisible = false">
        <img src="@/assets/image/cancel.png" alt="Close" class="button-icon" /> Close
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  crsData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible'])

const detailsVisible = computed({
  get: () => props.visible,
  set: (val) => {
    emit('update:visible', val)
  }
})
</script>

<style scoped>
.form-group {
  width: 100%;
  display: flex;
  align-items: flex-start;
  label {
    margin-left: 10px;
    display: inline-block;
    width: 120px;
    font-weight: 100;
    flex-shrink: 0;
    margin-top: 6px;
  }
}
</style>