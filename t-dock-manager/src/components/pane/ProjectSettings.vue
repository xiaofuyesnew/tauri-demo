<template>
    <el-dialog v-model="dialogVisible" width="50%" max-height="50%" padding="0px" draggable @close="handleClose"
        class="project-dialog">
        <template #header>
            <div class="dialog-custom-header">
                <img src="@/assets/image/title.png" alt="title" class="title-image" />
                <span>Settings for '{{ currentProject?.project_name }}'</span>
            </div>
        </template>
        <div class="tabs-container">
            <el-tabs v-model="activeTab" type="card" class="custom-tabs">
                <el-tab-pane name="info">
                    <template #label>
                        <img src="@/assets/image/project/gantanhao.png" alt="Info" />
                        <span>Info</span>
                    </template>
                    <div class="tab-content">
                        <div class="form-row separator">
                            <label>General</label>
                            <hr>
                        </div>
                        <div class="form-row column-inputs">
                            <div class="input-item">
                                <img src="@/assets/image/project/abc.png" alt="Name" />
                                <label>Name:</label>
                                <el-input :placeholder="currentProject?.project_name || ''" disabled />
                            </div>
                            <div class="input-item">
                                <img />
                                <label>Country:</label>
                                <el-input v-model="formData.general.country" />
                            </div>
                            <div class="input-item">
                                <img />
                                <label>Area:</label>
                                <el-input v-model="formData.general.area" />
                            </div>
                            <div class="input-item">
                                <img />
                                <label>Block:</label>
                                <el-input v-model="formData.general.block" />
                            </div>
                            <div class="input-item">
                                <img />
                                <label>License:</label>
                                <el-input v-model="formData.general.license" />
                            </div>
                        </div>
                    </div>
                    <el-tabs v-model="activeChildTab" type="card" class="custom-tabs child-tabs"
                        @tab-click="handleTabClick">
                        <el-tab-pane name="Comments">
                            <template #label>
                                <img src="@/assets/image/project/huixing.png" alt="Info" />
                                <span>Comments</span>
                            </template>
                            <!-- 添加可滚动的文本域 -->
                            <div class="input-item comments-textarea">
                                <el-input v-model="formData.general.content" type="textarea" :rows="4" resize="vertical"
                                    class="scrollable-textarea" />
                            </div>
                            <div class="input-item">
                                <label>PreVise filend:</label>
                                <el-input :placeholder="currentProject?.project_name || ''" disabled />
                            </div>
                            <div class="input-item">
                                <label>Orig. filanem:</label>
                                <el-input placeholder="(Made by PreVise)" disabled />
                            </div>
                        </el-tab-pane>
                        <el-tab-pane name="History">
                            <template #label>
                                <img src="@/assets/image/project/history.png" alt="Info" />
                                <span>History</span>
                            </template>
                            <div class="history-table-container">
                                <el-table :data="sortedHistoryData" class="history-table" :cell-style="getCellStyle"
                                    :header-cell-style="getHeaderCellStyle" border resizable ref="historyTableRef"
                                    style="width: 100%" @contextmenu.prevent="handleRowContextmenu($event)"
                                    @cell-mouse-enter="handleTableRowMouseEnter"
                                    @cell-mouse-leave="handleRowMouseLeave">
                                    <el-table-column prop="index" label="#" width="50" resizable></el-table-column>
                                    <el-table-column prop="date" label="Date" min-width="120"
                                        resizable></el-table-column>
                                    <el-table-column prop="user" label="User" min-width="100"
                                        resizable></el-table-column>
                                    <el-table-column prop="action" label="Action" min-width="120"
                                        resizable></el-table-column>
                                    <el-table-column prop="description" label="Description" min-width="150"
                                        resizable></el-table-column>
                                    <!-- <el-table-column prop="version" label="Version" min-width="100"
                                        resizable></el-table-column>
                                    <el-table-column prop="buildDate" label="Build date" min-width="150"
                                        resizable></el-table-column> -->
                                    <el-table-column prop="createdBy" label="History created by" min-width="150"
                                        resizable></el-table-column>
                                </el-table>
                            </div>
                        </el-tab-pane>
                    </el-tabs>
                </el-tab-pane>
                <!-- 其他选项卡保持不变 -->
                <el-tab-pane label="Coordinates and Units" name="coordinates">
                    <template #label>
                        <img src="@/assets/image/project/earth.png" alt="Coordinates and Units" />
                        <span>Coordinates and Units</span>
                    </template>
                    <div class="tab-content">
                        <div class="input-item column button-container" style="margin-left: 10px;">
                            <label style="width:130px">Corrdinate reference system(CRS):</label>
                            <el-input style="width: 68%;" disabled v-model="formData.coordinates.crs" />
                            <el-button style="margin-left: 5px;width: 20px; text-align:center;" class="button-icon"
                                :disabled="isCrsInfoButtonDisabled" @click="showCrsDetailsFromButton">
                                <img src="@/assets/image/project/gantanhao.png" alt="OK" class="button-icon"
                                    style="width: 20px; height: 20px;" />
                            </el-button>

                            <el-button style="margin-left: 10px;width: 100px; text-align:left;" class="button-icon"
                                @click="openCrsDialog">
                                <img src="@/assets/image/project/earth.png" alt="OK" class="button-icon"
                                    style="width: 20px; height: 20px;" />
                                Select..
                            </el-button>
                        </div>
                        <div class="input-item column button-container" style="margin-left: 10px;">
                            <label style="width:130px">Unit system:</label>
                            <el-select style="width: 72%;" v-model="formData.coordinates.unitSystem">
                                <el-option v-for="unit in unitSystemOptions" :key="unit.Name" :label="unit.Name"
                                    :value="unit.Name">
                                </el-option>
                            </el-select>
                            <el-button style="margin-left: 10px;width: 100px;text-align: left;" class="button-icon"
                                @click="handleCustomizeClick">
                                <img src="@/assets/image/project/ma.png" alt="OK" class="button-icon"
                                    style="width: 20px; height: 20px;" /> Customize
                            </el-button>
                        </div>
                        <div class="input-item column button-container" style="margin-left: 10px;">
                            <label style="width:130px">Simulation units:</label>
                            <el-select style="width: 72%; " v-model="formData.coordinates.simulationUnits">
                                <el-option label="ECLTPSE-Field" value="ECLTPSE-Field"></el-option>
                                <el-option label="ECLTPSE-Metric" value="ECLTPSE-Metric"></el-option>
                                <el-option label="ECLTPSE-Lab" value="ECLTPSE-Lab"></el-option>
                            </el-select>
                        </div>
                        <div class="input-item column button-container" style="margin-left: 10px;">
                            <label style="width:130px">Project time zone:</label>
                            <el-select style="width: 72%; " v-model="formData.coordinates.projectTimeZone">
                                <el-option v-for="timezone in timeZoneOptions" :key="timezone.value"
                                    :label="timezone.label" :value="timezone.value">
                                </el-option>
                            </el-select>
                            <el-checkbox style="margin-left: 10px;" v-model="formData.coordinates.dstEnabled"
                                :disabled="true" readonly>
                                Dst Enabled
                            </el-checkbox>
                        </div>
                        <div class="same-line-separators">
                            <div class="form-list">
                                <div class="form-row separator ">
                                    <label>Storage units</label>
                                    <hr>
                                </div>
                                <div class="input-item column button-container">
                                    <label style="width:110px">XY unit:</label>
                                    <el-input style="width:75%" v-model="formData.coordinates.xyUnit" disabled />
                                </div>
                                <div class="input-item column button-container">
                                    <label style="width:110px">Z unit:</label>
                                    <el-input style="width:75%" v-model="formData.coordinates.zUnit" disabled />
                                </div>
                                <div class="input-item column button-container">
                                    <label style="width:110px">Area unit:</label>
                                    <el-input style="width:75%" v-model="formData.coordinates.areaUnit" disabled />
                                </div>
                                <div class="input-item column button-container">
                                    <label style="width:110px">Volume unit:</label>
                                    <el-input style="width:75%" v-model="formData.coordinates.volumeUnit" disabled />
                                </div>
                                <div class="input-item column button-container">
                                    <label style="width:110px">Seismic time:</label>
                                    <el-input style="width:75%" v-model="formData.coordinates.seismicTimeUnit"
                                        disabled />
                                </div>
                                <div class="input-item column button-container">
                                    <label style="width:110px">Seismic velocity:</label>
                                    <el-input style="width:75%" v-model="formData.coordinates.seismicVelocityUnit"
                                        disabled />
                                </div>
                            </div>
                            <div class="form-list storage">
                                <div class="form-row separator ">
                                    <label>Display options</label>
                                    <hr>
                                </div>
                                <div class="checkbox-container">
                                    <label>Lat/long format:</label>
                                    <el-radio-group class="radio-group" v-model="formData.coordinates.latLongFormat"
                                        :disabled="isLatLongFormatDisabled">
                                        <div class="radio-item">
                                            <el-radio label="Degrees-minutes-seconds"
                                                size="large">Degrees-minutes-seconds</el-radio>
                                        </div>
                                        <div class="radio-item">
                                            <el-radio label="Decimal angle" size="large">Decimal angle</el-radio>
                                        </div>
                                    </el-radio-group>

                                    <label>Geodetic datum:</label>
                                    <el-radio-group class="radio-group" v-model="formData.coordinates.geodeticDatum"
                                        :disabled="isGeodeticDatumDisabled">
                                        <div class="radio-item">
                                            <el-radio label="Project datum" size="large">Project datum</el-radio>
                                        </div>
                                        <div class="radio-item">
                                            <el-radio label="WGS 84" size="large">WGS 84</el-radio>
                                        </div>
                                    </el-radio-group>
                                </div>
                            </div>

                        </div>
                        <div class="form-row separator">
                            <label>Project reference datum</label>
                            <hr>
                        </div>
                        <div class="input-item column button-container" style="margin-left: 10px;">
                            <label style="width:110px">Time (SRD):</label>
                            <el-select style="width: 72%;padding-left:20px;" v-model="formData.coordinates.selectedSrd">
                                <el-option v-for="option in formData.coordinates.srdOptions" :key="option.value"
                                    :label="option.label" :value="option.value">
                                </el-option>
                                <!-- 默认选项 -->
                                <el-option label="SRD Z=0.0 RV=1480.0" value="SRD Z=0.0 RV=1480.0"></el-option>
                            </el-select>
                            <el-button style="margin-left: 10px;width: 100px; text-align:left;" class="button-icon"
                                @click="createSRD">
                                Create
                            </el-button>
                        </div>
                        <div class="input-item column button-container" style="margin-left: 10px;">
                            <lable style="width:110px;text-align: left;">Depth (MSL):</lable>
                            <el-input v-model="formData.coordinates.depthMsl" style="width:100px;padding-left:30px;"
                                disabled />&emsp;{{
                                    formData.coordinates.zUnit }}
                        </div>

                    </div>
                </el-tab-pane>
                <el-tab-pane label="3D Settings" name="3d">
                    <div class="tab-content">
                        <div class="form-row separator">
                            <label>3D transparency</label>
                            <hr>
                        </div>
                        <div class="input-item column">
                            <label>Sort by:</label>
                            <el-select v-model="formData.settings3d.transparency.sortBy"
                                style="width: 72%; margin-left: 70px;">
                                <el-option label="Object" value="Object"></el-option>
                                <el-option label="Layers" value="Layers"></el-option>
                                <el-option label="Nothing" value="Nothing"></el-option>
                            </el-select>
                        </div>
                        <div class="form-row separator">
                            <label>3D decimation</label>
                            <hr>
                        </div>
                        <div class="input-item column">
                            <el-checkbox v-model="formData.settings3d.decimation.on">On</el-checkbox>
                            <label style="margin-left: 10px;">Frames per second:</label>
                            <el-input v-model="formData.settings3d.decimation.fps"
                                :disabled="!formData.settings3d.decimation.on" style="width: 72%; " />
                        </div>

                        <div class="form-row separator">
                            <label>3D anti-aliasing</label>
                            <hr>

                        </div>
                        <div class="input-item column">
                            <el-checkbox v-model="formData.settings3d.antiAliasing.sceneAntiAliasing"
                                label="Scene anti-aliasing"></el-checkbox>
                        </div>
                        <div class="form-row separator">
                            <label>3D visual effects</label>
                            <hr>
                        </div>
                        <div class="input-item column">
                            <el-checkbox v-model="formData.settings3d.visualEffects.fog" label="Fog"></el-checkbox>
                        </div>
                        <div class="form-row separator">
                            <label>3D editing</label>
                            <hr>
                        </div>
                        <div class="column">
                            <div class="input-row">
                                <label class="input-label">Keyboard translation increment:</label>
                                <el-input v-model="formData.settings3d.editing.keyboardIncrement" />
                            </div>
                            <div class="input-row">
                                <label class="input-label">Min dragger size (pixels):</label>
                                <el-input v-model="formData.settings3d.editing.minDraggerSize" />
                            </div>
                        </div>
                        <div class="form-row separator">
                            <label>3D origin</label>
                            <hr>
                        </div>
                        <div class=" column">
                            <div class="input-row">
                                <label class="input-label">X coordinate:</label>
                                <el-input v-model="formData.settings3d.origin.x" />
                            </div>
                            <div class="input-row" style="">
                                <label class="input-label">Y coordinate:</label>
                                <el-input v-model="formData.settings3d.origin.y" />
                            </div>
                            <div class="input-row button-container" style="padding-left: 235px;">
                                <el-button @click="handleGetOrigin" class="button-icon">Get origin from</el-button>
                            </div>
                            <div class="input-row" style="padding-left: 235px;">
                                <span>Get origin from object:</span>
                            </div>
                            <div class="input-row button-container"
                                style=" display: flex; align-items: center;padding-left: 235px;">
                                <el-button @click="handleGetObjectOrigin" class="button-icon">
                                    <img src="@/assets/image/project/right.png" alt="OK" class="button-icon" />
                                </el-button>
                                <el-input v-model="formData.settings3d.origin.objectName" readonly
                                    style="margin-left: 10px; " />
                            </div>
                        </div>
                    </div>
                </el-tab-pane>
                <el-tab-pane label="Misc Settings 1" name="misc1">
                    <div class="tab-content">
                        <div class="form-row separator">
                            <label>Project save</label>
                            <hr>
                        </div>
                        <div class="input-item column">
                            <el-checkbox v-model="formData.miscSettings1.doNotOverwrite">Do not overwrite by newer
                                PreVise
                                version</el-checkbox>
                        </div>
                        <div class="input-item column">
                            <el-checkbox v-model="formData.miscSettings1.autoSaveEnabled"
                                style="width: 120px;">Auto-save
                                every:</el-checkbox>
                            <el-input v-model="formData.miscSettings1.autoSaveInterval"
                                :disabled="!formData.miscSettings1.autoSaveEnabled"
                                style="margin-left: 10px;width: 72%; " />&emsp;minutes
                        </div>
                        <div class="input-item column">
                            <el-checkbox v-model="formData.miscSettings1.silentAutoSave"
                                :disabled="!formData.miscSettings1.autoSaveEnabled" style="margin-left: 20px;">Silent
                                auto-save</el-checkbox>
                        </div>
                        <div class="form-row separator">
                            <label>Player speed</label>
                            <hr>
                        </div>
                        <div class="input-item column">
                            <img src="@/assets/image/project/black.png" style="width:15px;margin-right: 5px;"></img>
                            <label style="width:100px">3D grid player</label>
                            <el-input v-model="formData.miscSettings1.player3dGrid"
                                style="margin-left: 10px;width: 72%; " />&emsp;ms
                        </div>
                        <div class="input-item column">
                            <img src="@/assets/image/project/blue.png" style="width:15px;margin-right: 5px;"></img>
                            <label style="width:100px">Plane player</label>
                            <el-input v-model="formData.miscSettings1.playerPlane"
                                style="margin-left: 10px;width: 72%; " />&emsp;ms
                        </div>
                        <div class="input-item column">
                            <img src="@/assets/image/project/yellow.png" style="width:15px;margin-right: 5px;"></img>
                            <label style="width:100px">Property player</label>
                            <el-input v-model="formData.miscSettings1.playerProperty"
                                style="margin-left: 10px;width: 72%; " />&emsp;ms
                        </div>
                        <div class="input-item column">
                            <img src="@/assets/image/project/gren.png" style="width:15px;margin-right: 5px;"></img>
                            <label style="width:100px">Time player</label>
                            <el-input v-model="formData.miscSettings1.playerTime"
                                style="margin-left: 10px;width: 72%; " />&emsp;ms
                        </div>
                        <div class="form-row separator">
                            <label>Simulation data folder</label>
                            <hr>
                        </div>
                        <div class="input-item column">
                            <label style="width:120px">Default directory</label>
                            <el-input v-model="formData.miscSettings1.defaultDirectory"
                                style="margin-left: 10px;width: 72%;" disabled />
                        </div>
                        <div class="input-item column button-container">
                            <el-checkbox v-model="formData.miscSettings1.overrideEnabled"
                                style="width: 120px;">override:</el-checkbox>
                            <el-input v-model="formData.miscSettings1.overrideDirectory"
                                :disabled="!formData.miscSettings1.overrideEnabled"
                                style="margin-left: 10px;width: 72%; " />
                            <el-button @click="handleSelectDirectory"
                                :disabled="!formData.miscSettings1.overrideEnabled" style="margin-left: 10px;"
                                class="button-icon">..
                            </el-button>
                        </div>
                    </div>
                </el-tab-pane>
                <el-tab-pane label="Misc Settings 2" name="misc2">
                    <div class="tab-content">
                        <div class="form-row separator">
                            <label>Global surface filter</label>
                            <hr>
                        </div>
                        <div class="global-surface-filter-row">
                            <el-radio-group v-model="formData.miscSettings2.globalSurfaceFilter"
                                class="radio-group-child">
                                <div class="radio-item">
                                    <img src="@/assets/image/project/point.png" style="width:20px" />
                                    <el-radio label="Apply inside" size="large">Apply inside:</el-radio>
                                </div>
                                <div class="radio-item">
                                    <img src="@/assets/image/project/yuan.png" style="width:20px" />
                                    <el-radio label="Apply outside" size="large">Apply outside:</el-radio>
                                </div>
                            </el-radio-group>
                            <div class="object-selector button-container">
                                <el-button @click="handleGetObjectOrigin" class="button-icon">
                                    <img src="@/assets/image/project/right.png" alt="OK" class="button-icon" />
                                </el-button>
                                <el-input v-model="formData.miscSettings2.objectName" readonly
                                    style="margin-left: 10px;" />
                            </div>
                        </div>
                        <div class="form-row separator">
                            <label>Minimum curvature algorithm</label>
                            <hr>
                        </div>
                        <div class="column">
                            <div class="input-row">
                                <el-button class="button-icon"
                                    style="width: 25px;height: 25px;padding: 0; margin-right: 10px;">
                                    <img src="@/assets/image/project/page.png" alt="OK" class="button-icon" />
                                </el-button>
                                <label class="input-label input-list">Max error tolerance:</label>
                                <el-input v-model="formData.miscSettings2.maxErrorTolerance" />
                            </div>
                            <div class="input-row">
                                <label class="button-icon"
                                    style="width: 25px;height: 25px;padding: 0; margin-right: 10px;">
                                </label>
                                <label class="input-label input-list">Max number of iterations:</label>
                                <el-input v-model="formData.miscSettings2.maxIterations" />
                            </div>
                            <div class="input-row">
                                <label class="button-icon"
                                    style="width: 25px;height: 25px;padding: 0; margin-right: 10px;">
                                </label>
                                <label class="input-label input-list">Initialize values by:</label>
                                <el-radio-group v-model="formData.miscSettings2.initializeValuesBy">
                                    <div class="radio-item radio-group-list">
                                        <el-radio label="Constant" size="large">Constant</el-radio>
                                    </div>
                                    <div class="radio-item radio-group-list">
                                        <el-radio label="Random" size="large">Random</el-radio>
                                    </div>
                                </el-radio-group>
                            </div>
                            <el-checkbox v-model="formData.miscSettings2.multigridOptimization">Multigrid optimization
                                (Make
                                surface process)</el-checkbox>
                        </div>
                    </div>
                </el-tab-pane>
                <el-tab-pane label="Well Settings" name="well">
                    <div class="tab-content">
                        <div class="form-row separator">
                            <img src="@/assets/image/new_well_folder.png"></img>
                            <label>Well identification</label>
                            <hr>
                        </div>
                        <div class="radio-group vertical">
                            <el-radio-group v-model="formData.wellSettings.wellIdentification">
                                <div class="radio-item">
                                    <el-radio label="Use well name" size="large">Use well name</el-radio>
                                </div>
                                <div class="radio-item">
                                    <el-radio label="Use unique well identifier (UWI)" size="large">Use unique well
                                        identifier
                                        (UWI)</el-radio>
                                </div>
                            </el-radio-group>
                        </div>
                        <div class="form-row separator">
                            <label>Date</label>
                            <hr>
                        </div>
                        <div class="input-item">
                            <label style="margin-left: 30px;">Default date:</label>
                            <el-date-picker v-model="formData.wellSettings.defaultDate" type="date"
                                placeholder="Select date" format="YYYY-MM-DD" value-format="YYYY-MM-DD"
                                :editable="false" :clearable="false" style="width: 200px;" />
                        </div>
                        <div class="form-row separator">
                            <label>Well section</label>
                            <hr>
                        </div>
                        <div class="input-item column">
                            <el-checkbox v-model="formData.wellSettings.decimateWhenScrolling">Decimate when
                                scrolling</el-checkbox>
                        </div>
                        <div class="form-row separator">
                            <label>Well manager</label>
                            <hr>
                        </div>
                        <div class="radio-group vertical">
                            <el-radio-group v-model="formData.wellSettings.wellManager">
                                <div class="radio-item">
                                    <el-radio label="Dynamic" size="large">Dynamic</el-radio>
                                </div>
                                <div class="radio-item">
                                    <el-radio label="Static(recommened for big projects)" size="large">Static(recommened
                                        for big
                                        projects)</el-radio>
                                </div>
                            </el-radio-group>
                        </div>
                        <div class="form-row separator">
                            <label>Well tops</label>
                            <hr>
                        </div>
                        <div class="input-item column">
                            <el-checkbox v-model="formData.wellSettings.autoPopulateInterpreter">Auto-populate
                                interpreter</el-checkbox>
                        </div>
                    </div>
                </el-tab-pane>
            </el-tabs>
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
    <!-- 新增的添加历史记录对话框 -->
    <el-dialog v-model="addHistoryDialogVisible" width="400px" top="30vh" @close="handleAddHistoryClose"
        class="project-dialog" raggable>
        <template #header>
            <div class="dialog-custom-header">
                <img src="@/assets/image/title.png" alt="title" class="title-image" />
                <span>Set history information</span>
            </div>
        </template>
        <div>
            <div class="input-itemlits">

                <label>Time:</label>
                <div class="input-list">
                    <el-date-picker v-model="newHistory.time" type="date" placeholder="Select date"
                        value-format="YYYY-MM-DD" format="YYYY-MM-DD" :editable="false" :clearable="false"
                        style="width: 100%" />
                </div>
            </div>
            <div class="input-itemlits">
                <label>User:</label>
                <div class="input-list">
                    <el-input v-model="newHistory.user" />
                </div>
            </div>

            <div class="input-itemlits">
                <label>Action:</label>
                <div class="input-list">
                    <el-input v-model="newHistory.action" />
                </div>
            </div>
            <div class="input-itemlits">

                <label>Description:</label>
                <div class="input-list">
                    <el-input v-model="newHistory.description" />
                </div>
            </div>

        </div>
        <div class="button-container">
            <el-button @click="handleAddHistoryConfirm">
                <img src="@/assets/image/ok.png" alt="OK" class="button-icon" /> OK
            </el-button>
            <el-button @click="handleAddHistoryClose">
                <img src="@/assets/image/cancel.png" alt="Cancel" class="button-icon" /> Cancel
            </el-button>
        </div>
    </el-dialog>
    <el-dialog v-model="comforim" width="350px" top="45vh" @close="closeComforim" class="comforim-dialog" draggable>
        <template #header>
            <div class="dialog-custom-header">
                <img src="@/assets/image/title.png" alt="title" class="title-image" />
                <span>PreVise</span>
            </div>
        </template>
        <div class="warning-content">
            <img src="@/assets/image/project/warring.png" alt="title" class="title-images" />
            <span>Do you really want to clear the history list?</span>
        </div>
        <div class="button-container">
            <el-button @click="addComforim">
                <img src="@/assets/image/ok.png" alt="OK" class="button-icon" /> OK
            </el-button>
            <el-button @click="closeComforim">
                <img src="@/assets/image/cancel.png" alt="Cancel" class="button-icon" /> Cancel
            </el-button>
        </div>
    </el-dialog>
    <el-dialog v-model="coury" width="300px" top="45vh" @close="closeCoury" class="comforim-dialog" draggable>
        <template #header>
            <div class="dialog-custom-header">
                <img src="@/assets/image/title.png" alt="title" class="title-image" />
                <span>PreVise</span>
            </div>
        </template>
        <div class="warning-content">
            <img src="@/assets/image/project/warring.png" alt="title" class="title-images" />
            <span>A single icon must be selected.</span>
        </div>
        <div class="button-container">
            <el-button @click="closeCoury">
                <img src="@/assets/image/ok.png" alt="OK" class="button-icon" /> OK
            </el-button>
        </div>
    </el-dialog>
    <el-dialog v-model="srdSreate" width="350px" top="45vh" @close="closeSrd" class="project-dialog" draggable>
        <template #header>
            <div class="dialog-custom-header">
                <img src="@/assets/image/title.png" alt="title" class="title-image" />
                <span>Create SRD</span>
            </div>
        </template>
        <div>
            <div class="input-itemlits">
                <label class="srdlabel">Name:</label>
                <div>
                    <el-input v-model="srdFormData.name" />
                </div>
            </div>
            <div class="input-itemlits">
                <label class="srdlabel">Z from MSL:</label>
                <div style="width: 100px;">
                    <el-input v-model.number="srdFormData.zFromMsl" class="srdinput" />
                </div>
                &emsp;m
            </div>
            <div class="input-itemlits">
                <label class="srdlabel">Replacement velocity:</label>
                <div style="width: 100px;">
                    <el-input v-model.number="srdFormData.replacementVelocity" class="srdinput" />
                </div>
                &emsp;m/s
            </div>
        </div>
        <div class="button-container">
            <el-button @click="addSrd">
                <img src="@/assets/image/ok.png" alt="OK" class="button-icon" /> OK
            </el-button>
            <el-button @click="closeSrd">
                <img src="@/assets/image/cancel.png" alt="Cancel" class="button-icon" /> Cancel
            </el-button>
        </div>
    </el-dialog>
    <!--坐标系确认弹窗-->
    <el-dialog v-model="CrsUnitcomforim" width="550px" top="30vh" @close="handleCrsUnitCancel" class="comforim-dialog"
        draggable>
        <template #header>
            <div class="dialog-custom-header">
                <img src="@/assets/image/title.png" alt="title" class="title-image" />
                <span>PreVise</span>
            </div>
        </template>
        <div class="warning-content">
            <img src="@/assets/image/project/warring.png" alt="title" class="title-images" />
            <div>
                <div style="margin-bottom: 5px;">You are about to change current project coordinate reference
                    system(CRS)
                </div>
                <div style="margin-bottom: 5px;">from "{{ formData.coordinates.crs }}"</div>
                <div style="margin-bottom: 5px;">to "{{ pendingCrsData?.crs?.crs_name }}"</div>
                <div style="margin-bottom: 5px;">Changing the project CRS will not lead to any immediate data
                    transformations. However, it will apply to new data added to the project and consequently to
                    existing
                    data. Consider reloading data, or use the Reference project tool to transform data.</div>
                <hr style="margin:5px 0;">
                <div style="margin-bottom: 5px;font-style: italic;">Note: The change has to be applied in the Project
                    settings dialog to
                    be
                    effective.</div>
            </div>
        </div>
        <div class="button-container">
            <el-button @click="handleCrsUnitConfirm">
                <img src="@/assets/image/project/warrings.png" alt="OK" class="button-icon" /> Confirm change
            </el-button>
            <el-button @click="handleCrsUnitCancel">
                <img src="@/assets/image/cancel.png" alt="Cancel" class="button-icon" /> Cancel
            </el-button>
        </div>
    </el-dialog>
    <el-dialog v-model="Crscomforim" width="550px" top="45vh" @close="handleCrsCancel" class="comforim-dialog"
        draggable>
        <template #header>
            <div class="dialog-custom-header">
                <img src="@/assets/image/title.png" alt="title" class="title-image" />
                <span>PreVise</span>
            </div>
        </template>
        <div class="warning-content">
            <img src="@/assets/image/project/warring.png" alt="title" class="title-images" />
            <div>
                <div style="margin-bottom: 10px;">The selected coordinate reference system (CRS) re-defines XY unit to
                    "{{
                        storedCrsData?.crs?.horizontal_unit || '' }}". </div>
                <div style="margin-bottom: 10px;">To avoid this, click Cancel and select a different CRS.</div>
                <div style="margin-bottom: 10px;"> Do you want to re-define the XY unit?</div>
            </div>

        </div>
        <div class="button-container">
            <el-button @click="handleCrsConfirm">
                <img src="@/assets/image/ok.png" alt="OK" class="button-icon" /> OK
            </el-button>
            <el-button @click="handleCrsCancel">
                <img src="@/assets/image/cancel.png" alt="Cancel" class="button-icon" /> Cancel
            </el-button>
        </div>
    </el-dialog>
    <!--单位确认弹窗-->
    <el-dialog v-model="TopUnitComforim" width="550px" top="40vh" @close="handleTopUnitCancel" class="comforim-dialog"
        draggable>
        <template #header>
            <div class="dialog-custom-header">
                <img src="@/assets/image/title.png" alt="title" class="title-image" />
                <span>PreVise</span>
            </div>
        </template>
        <div class="warning-content">
            <img src="@/assets/image/project/warring.png" alt="title" class="title-images" />
            <div>
                <div style="margin-bottom: 5px;">Coordinate reference system (CRS) or unit settings have been changed.
                </div>
                <div style="margin-bottom: 5px;">These settings must be applied before you can customize units.</div>
            </div>
        </div>
        <div class="button-container">
            <el-button @click="handleApplySettingsAndCustomize">
                <img src="@/assets/image/ok.png" alt="OK" class="button-icon" /> Apply settings and customize units...
            </el-button>
            <el-button @click="handleTopUnitCancel">
                <img src="@/assets/image/cancel.png" alt="Cancel" class="button-icon" /> Cancel
            </el-button>
        </div>
    </el-dialog>
    <el-dialog v-model="UnitComforim" width="550px" top="40vh" @close="handleUnitCancel" class="comforim-dialog"
        draggable>
        <template #header>
            <div class="dialog-custom-header">
                <img src="@/assets/image/title.png" alt="title" class="title-image" />
                <span>PreVise</span>
            </div>
        </template>
        <div class="warning-content">
            <img src="@/assets/image/project/warring.png" alt="title" class="title-images" />
            <div>
                <div style="margin-bottom: 5px;">You have selected to change the coordinate reference system (CRS) or
                    unit
                    settings after data has been loaded into the project.</div>
                <div style="margin-bottom: 5px;">These changes will not lead to any immediate data transformations.
                    However, they will apply to new data added to the project.</div>
                <div style="margin-bottom: 5px;">Are you really sure you want to do this?</div>
            </div>
        </div>
        <div class="button-container">
            <el-button @click="handleUnitConfirm">
                <img src="@/assets/image/ok.png" alt="OK" class="button-icon" /> OK
            </el-button>
            <el-button @click="handleUnitCancel">
                <img src="@/assets/image/cancel.png" alt="Cancel" class="button-icon" /> Cancel
            </el-button>
        </div>
    </el-dialog>
    <!-- 右键菜单 -->
    <ul v-show="contextMenuVisible" class="contextmenu"
        :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px', position: 'fixed' }">
        <li class="menu-item" @click="handleAppendNewItem">
            <img src="@/assets/image/project/backto.png" class="menu-icon" />
            <p class="menu-text">Append new item</p>
        </li>
        <li class="menu-item" @click="handleClearNonSystemItems">
            <img src="@/assets/image/project/page.png" class="menu-icon" />
            <p class="menu-text">Clear all non - system history items</p>
        </li>
        <li class="menu-item" @click="handleClearAllItems">
            <img src="@/assets/image/project/page.png" class="menu-icon" />
            <p class="menu-text">Clear all history items</p>
        </li>
    </ul>
    <!-- 鼠标显示 -->
    <div v-show="tooltipVisible" class="row-tooltip"
        :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px' }">
        <div class="tooltip-content">
            <div class="tooltip-line tooltip-header">
                #{{ tooltipData?.index }} {{ tooltipData?.date }} {{ tooltipData?.user }}
            </div>
            <div class="tooltip-line">
                Action: {{ tooltipData?.action }}
            </div>
            <div v-if="tooltipData?.description" class="tooltip-line">
                Description: {{ tooltipData?.description }}
            </div>
        </div>
    </div>
    <!--坐标系弹窗-->
    <Crs :visible="crsDialogVisible" @close="handleCrsClose" @select="handleCrsSelect" />
    <!--详情弹窗-->
    <CrsDetails v-model:visible="crsDetailsVisible" :crs-data="selectedCrsData" />
    <!--单位弹窗-->
    <el-dialog class="customize" :modal="false" :model-value="dataUnit" align-center draggable @close="closeUnitDialog"
        width="auto">
        <template #header>
            <div class="dialog-title">
                <img src="@/assets/image/title.png" alt="title" class="title-icon">

                <span class="title-text">Settings for '{{ currentProject?.project_name }}'</span>
            </div>
        </template>
        <MeasurementSettings></MeasurementSettings>
        <template #footer>
            <section>
                <el-button @click="closeUnitDialog" class="cancel-btn">
                    <img src="@/assets/image/cancel.png" alt="" width="20">
                    Close
                </el-button>
            </section>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue'
import useGeoMetaStore from "@/store/geometa";
import { open } from '@tauri-apps/plugin-dialog';
import { ElMessage } from 'element-plus';
import { ProjectRecordService, ProjectHistoryService } from '@/api/project'
import { UnitService } from '@/api/unit';
import Crs from './Crs.vue'
import CrsDetails from './CrsDetails.vue'
import { CrsService } from '@/api/crs'
import MeasurementSettings from '../MeasurementSettings.vue';
const strGeoMeta = useGeoMetaStore();
const currentProject = computed(() => strGeoMeta.currentProject);
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    }
})
const dataUnit = ref(false)
// 添加关闭单位弹窗的函数
const closeUnitDialog = () => {
    dataUnit.value = false;
};
// 添加一个变量来跟踪是否是初次加载
const isFirstLoad = ref(true)
// 添加确认对话框相关的响应式变量
const comforim = ref(false)
const clearType = ref('')
const srdSreate = ref(false)
const emit = defineEmits(['close'])
const activeTab = ref('info') // 默认选中第一个tab
const activeChildTab = ref('Comments') // 默认选中 Comments 标签
// 计算属性：控制 Lat/long format 是否禁用
const isLatLongFormatDisabled = computed(() => {
    return formData.coordinates.crs === 'Undefined' || !formData.coordinates.crs
})

// 计算属性：控制 Geodetic datum 是否禁用
const isGeodeticDatumDisabled = computed(() => {
    return formData.coordinates.crs === 'Undefined' || !formData.coordinates.crs
})
// 控制 CRS 详情弹窗显示
const crsDetailsVisible = ref(false)

// 存储选中的 CRS 数据（用于详情显示）
const selectedCrsData = ref(null)

// 计算属性：控制问号按钮是否禁用
const isCrsInfoButtonDisabled = computed(() => {
    return formData.coordinates.crs === 'Undefined'
})
// 通过问号按钮显示 CRS 详情
const showCrsDetailsFromButton = async () => {
    if (selectedCrsData.value) {
        crsDetailsVisible.value = true
    } else if (formData.coordinates.crsId) {
        try {
            // 根据 ID 获取 CRS 详情
            const id = formData.coordinates.crsId;
            const crsData = await CrsService.getById(id);
            if (crsData) {
                // 设置选中的 CRS 数据
                selectedCrsData.value = crsData;
                // 显示详情弹窗
                crsDetailsVisible.value = true;
            }
        } catch (error) {
            console.error('获取 CRS 详情失败:', error);
        }
    }
}
// 添加用于存储单位系统选项的响应式变量
const unitSystemOptions = ref([])
// 创建一个响应式变量来控制对话框显示
const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => {
        if (!val) {
            emit('close')
        }
    }
})
// 添加 coury 弹窗相关的响应式变量
const coury = ref(false)
// 添加控制 CRS 弹窗显示的响应式变量
const crsDialogVisible = ref(false)
// 添加打开 CRS 弹窗的函数
const openCrsDialog = () => {
    crsDialogVisible.value = true
}

// 添加处理 CRS 弹窗关闭的函数
const handleCrsClose = () => {
    crsDialogVisible.value = false
}
// 添加处理 CRS 确认对话框关闭的函数
const Crscomforim = ref(false)
const pendingCrsData = ref(null) // 存储待确认的 CRS 数据
// 添加一个新的响应式变量来存储深拷贝的数据
const storedCrsData = ref(null)
// 添加 CrsUnitcomforim 弹窗相关的响应式变量
const CrsUnitcomforim = ref(false)
// 添加处理 CRS 选择的函数
const handleCrsSelect = (data) => {
    if (data.crs) {
        if (data.crs.id !== undefined) {
            formData.coordinates.crsId = data.crs.id;
        }
        // 先显示 CrsUnitcomforim 弹窗
        pendingCrsData.value = data
        CrsUnitcomforim.value = true
    }
    crsDialogVisible.value = false
}
// 添加处理 CrsUnitcomforim 确认的函数
const handleCrsUnitConfirm = () => {
    CrsUnitcomforim.value = false
    if (pendingCrsData.value) {
        // 检查 Horizontal unit 与当前 XY unit 是否一致
        if (pendingCrsData.value.crs.horizontal_unit &&
            pendingCrsData.value.crs.horizontal_unit !== formData.coordinates.xyUnit) {
            // 不一致时显示 Crscomforim 弹窗
            storedCrsData.value = JSON.parse(JSON.stringify(pendingCrsData.value));
            Crscomforim.value = true

        } else {
            // 一致时直接处理，并将 pendingCrsData.value 设置为 null
            processCrsSelection(pendingCrsData.value)
            pendingCrsData.value = null
        }
    }
}
// 添加处理 CRS 选择的函数
const processCrsSelection = (data) => {
    if (data && data.crs) {
        // 保存选中的 CRS 数据
        selectedCrsData.value = data.crs
        // 将 CRS ID 存储到 formData.coordinates.crsId 中
        if (data.crs.id !== undefined) {
            formData.coordinates.crsId = data.crs.id;
        }
        // 检查 CRS 名称是否存在且不为 "Undefined"
        if (data.crs.crs_name && data.crs.crs_name !== 'Undefined') {
            // 设置 CRS 名称
            formData.coordinates.crs = data.crs.crs_name
            // 设置 XY unit 为 Horizontal unit 的值
            if (data.crs.horizontal_unit) {
                formData.coordinates.xyUnit = data.crs.horizontal_unit
            }
        } else if (data.crs.crs_name === 'Undefined') {
            formData.coordinates.crs = data.crs.crs_name
        }
    }
}
// 添加处理 CrsUnitcomforim 取消的函数
const handleCrsUnitCancel = () => {
    CrsUnitcomforim.value = false
    pendingCrsData.value = null
}


// 添加用于控制单位确认弹窗的响应式变量
const TopUnitComforim = ref(false)
const UnitComforim = ref(false)
// 存储原始值用于比较变化
const originalValues = reactive({
    crs: '',
    unitSystem: ''
})
// 监听对话框打开，初始化原始值
watch(dialogVisible, (newVal) => {
    if (newVal) {
        initializeFormData();
        // 保存初始值用于比较
        originalValues.crs = formData.coordinates.crs
        originalValues.unitSystem = formData.coordinates.unitSystem
    }
});

// 检查是否有变化的计算属性
const hasChanges = computed(() => {
    return originalValues.crs !== formData.coordinates.crs ||
        originalValues.unitSystem !== formData.coordinates.unitSystem
})
// 修改 Customize 按钮的点击处理函数
const handleCustomizeClick = () => {
    // 检查是否是初次加载
    if (isFirstLoad.value) {
        // 初次加载时直接激活单位弹窗
        dataUnit.value = true;
        isFirstLoad.value = false;
        return;
    }
    // 检查是否有变化
    if (hasChanges.value) {
        // 如果有变化，先显示 TopUnitComforim 弹窗
        TopUnitComforim.value = true
    } else {
        // 如果没有变化，可以直接进行自定义操作
        dataUnit.value = true;
    }
}
// TopUnitComforim 弹窗中"Apply settings and customize units..."按钮的处理函数
const handleApplySettingsAndCustomize = () => {
    TopUnitComforim.value = false
    UnitComforim.value = true
}

// UnitComforim 弹窗中"OK"按钮的处理函数
const handleUnitConfirm = () => {
    UnitComforim.value = false
    console.log('用户确认了单位更改')

    // 更新原始值为当前值
    originalValues.crs = formData.coordinates.crs
    originalValues.unitSystem = formData.coordinates.unitSystem
    // 激活单位弹窗
    dataUnit.value = true;
}

// UnitComforim 弹窗中"Cancel"按钮的处理函数
const handleUnitCancel = () => {
    UnitComforim.value = false
    console.log('用户取消了单位更改')
}

// TopUnitComforim 弹窗中"Cancel"按钮的处理函数
const handleTopUnitCancel = () => {
    TopUnitComforim.value = false
}
const handleCrsConfirm = () => {
    if (storedCrsData.value) {
        processCrsSelection(storedCrsData.value)
        storedCrsData.value = null
    }
    Crscomforim.value = false
}

const handleCrsCancel = () => {
    pendingCrsData.value = null
    storedCrsData.value = null
    Crscomforim.value = false
}
// 创建一个对象来存储所有表单数据
const formData = reactive({
    general: {
        name: '',
        country: '',
        area: '',
        block: '',
        license: '',
        content: ''
    },
    coordinates: {
        crs: 'Undefined',
        crsId: '',
        unitSystem: 'Metric', // 默认值
        simulationUnits: 'ECLTPSE-Metric', // 默认值
        xyUnit: 'm', // 默认值
        zUnit: 'm', // 默认值
        areaUnit: 'm2', // 默认值
        volumeUnit: 'm3', // 默认值
        seismicTimeUnit: 'ms', // 默认值
        seismicVelocityUnit: 'm/s', // 默认值
        latLongFormat: 'Degrees-minutes-seconds', // 默认值
        geodeticDatum: 'Project datum', // 默认值
        projectTimeZone: 'China Standard Time',
        dstEnabled: false, // 夏令时选项
        // ... 其他坐标相关设置 ...
        srdOptions: [], // 存储SRD选项
        selectedSrd: 'SRD Z=0.0 RV=1480.0',
        depthMsl: '0'
    },
    settings3d: {
        transparency: {
            sortBy: 'Object'
        },
        decimation: {
            on: false,
            fps: 10
        },
        antiAliasing: {
            sceneAntiAliasing: false
        },
        visualEffects: {
            fog: false
        },
        editing: {
            keyboardIncrement: 10,
            minDraggerSize: 30
        },
        origin: {
            x: '3.476066e-310',
            y: '4.180332e-312',
            objectName: ''
        }
    },
    wellSettings: {
        wellIdentification: 'Use well name', // 默认选中第一个选项
        defaultDate: new Date().toISOString().split('T')[0], // 默认为今天
        decimateWhenScrolling: true,
        wellManager: 'Dynamic', // 默认选中 Dynamic
        autoPopulateInterpreter: true
    },
    miscSettings1: {
        doNotOverwrite: false,
        autoSaveEnabled: false,
        autoSaveInterval: '15',
        silentAutoSave: false,
        player3dGrid: '100', // 默认100ms
        playerPlane: '100', // 默认100ms
        playerProperty: '100', // 默认100ms
        playerTime: '300',
        defaultDirectory: '', // 默认目录
        overrideEnabled: false,
        overrideDirectory: '' // 覆盖目录
    },
    miscSettings2: {
        globalSurfaceFilter: 'Apply inside',
        objectName: '',
        maxErrorTolerance: '1', // 添加最大误差容限
        maxIterations: '', // 添加最大迭代次数
        initializeValuesBy: 'Constant', // 添加初始化值方式，默认为Constant
        multigridOptimization: true // 添加多网格优化，默认为false
    }
})
// 初始化表单数据
const initializeFormData = () => {
    if (currentProject.value) {
        // 如果项目有保存的设置，使用这些设置
        if (currentProject.value.project_setting) {
            try {
                const savedSettings = JSON.parse(currentProject.value.project_setting);
                // 使用 Object.assign 将保存的设置合并到现有的 formData 中
                Object.assign(formData, savedSettings);
            } catch (error) {
                console.error('Failed to parse project settings:', error);
            }
        }
    }
};

// 监听对话框打开，初始化数据
watch(dialogVisible, (newVal) => {
    if (newVal) {
        initializeFormData();
    }
});
// 时区选项列表（包含UTC偏移量和中文城市名）
const timeZoneOptions = [
    { label: '(UTC-12:00) 国际日期变更线西', value: 'Dateline Standard Time' },
    { label: '(UTC-11:00) 协调世界时-11', value: 'UTC-11' },
    { label: '(UTC-10:00) 夏威夷', value: 'Hawaiian Standard Time' },
    { label: '(UTC-09:00) 阿拉斯加', value: 'Alaskan Standard Time' },
    { label: '(UTC-08:00) 太平洋时间（美国和加拿大）', value: 'Pacific Standard Time' },
    { label: '(UTC-07:00) 亚利桑那', value: 'US Mountain Standard Time' },
    { label: '(UTC-07:00) 山地时间（美国和加拿大）', value: 'Mountain Standard Time' },
    { label: '(UTC-06:00) 中部时间（美国和加拿大）', value: 'Central Standard Time' },
    { label: '(UTC-05:00) 东部时间（美国和加拿大）', value: 'Eastern Standard Time' },
    { label: '(UTC-05:00) 印地安那州（东部）', value: 'US Eastern Standard Time' },
    { label: '(UTC-04:00) 大西洋时间（加拿大）', value: 'Atlantic Standard Time' },
    { label: '(UTC-03:30) 纽芬兰', value: 'Newfoundland Standard Time' },
    { label: '(UTC-03:00) 巴西利亚', value: 'E. South America Standard Time' },
    { label: '(UTC-02:00) 协调世界时-02', value: 'UTC-02' },
    { label: '(UTC-01:00) 亚速尔群岛', value: 'Azores Standard Time' },
    { label: '(UTC) 都柏林、爱丁堡、里斯本、伦敦', value: 'GMT Standard Time' },
    { label: '(UTC) 蒙罗维亚、雷克雅未克', value: 'Greenwich Standard Time' },
    { label: '(UTC+01:00) 阿姆斯特丹、柏林、伯尔尼、罗马', value: 'W. Europe Standard Time' },
    { label: '(UTC+01:00) 贝尔格莱德、布拉迪斯拉发、布达佩斯', value: 'Central Europe Standard Time' },
    { label: '(UTC+02:00) 雅典、布加勒斯特', value: 'GTB Standard Time' },
    { label: '(UTC+02:00) 赫尔辛基、基辅、里加、索非亚', value: 'FLE Standard Time' },
    { label: '(UTC+03:00) 莫斯科、圣彼得堡、伏尔加格勒', value: 'Russian Standard Time' },
    { label: '(UTC+03:00) 内罗毕', value: 'E. Africa Standard Time' },
    { label: '(UTC+03:30) 德黑兰', value: 'Iran Standard Time' },
    { label: '(UTC+04:00) 阿布扎比、马斯喀特', value: 'Arabian Standard Time' },
    { label: '(UTC+04:00) 巴库', value: 'Azerbaijan Standard Time' },
    { label: '(UTC+04:30) 喀布尔', value: 'Afghanistan Standard Time' },
    { label: '(UTC+05:00) 塔什干', value: 'West Asia Standard Time' },
    { label: '(UTC+05:30) 金奈、加尔各答、孟买、新德里', value: 'India Standard Time' },
    { label: '(UTC+05:45) 加德满都', value: 'Nepal Standard Time' },
    { label: '(UTC+06:00) 阿斯塔纳', value: 'Central Asia Standard Time' },
    { label: '(UTC+06:00) 达卡', value: 'Bangladesh Standard Time' },
    { label: '(UTC+06:30) 仰光', value: 'Myanmar Standard Time' },
    { label: '(UTC+07:00) 曼谷、河内、雅加达', value: 'SE Asia Standard Time' },
    { label: '(UTC+08:00) 北京、重庆、香港', value: 'China Standard Time' },
    { label: '(UTC+08:00) 吉隆坡、新加坡', value: 'Singapore Standard Time' },
    { label: '(UTC+08:00) 珀斯', value: 'W. Australia Standard Time' },
    { label: '(UTC+08:00) 台北', value: 'Taipei Standard Time' },
    { label: '(UTC+09:00) 大阪、札幌、东京', value: 'Tokyo Standard Time' },
    { label: '(UTC+09:00) 首尔', value: 'Korea Standard Time' },
    { label: '(UTC+09:30) 阿德莱德', value: 'Cen. Australia Standard Time' },
    { label: '(UTC+09:30) 达尔文', value: 'AUS Central Standard Time' },
    { label: '(UTC+10:00) 布里斯班', value: 'E. Australia Standard Time' },
    { label: '(UTC+10:00) 堪培拉、墨尔本、悉尼', value: 'AUS Eastern Standard Time' },
    { label: '(UTC+10:00) 关岛、莫尔兹比港', value: 'West Pacific Standard Time' },
    { label: '(UTC+11:00) 马加丹', value: 'Magadan Standard Time' },
    { label: '(UTC+12:00) 奥克兰、惠灵顿', value: 'New Zealand Standard Time' },
    { label: '(UTC+12:00) 协调世界时+12', value: 'UTC+12' },
    { label: '(UTC+13:00) 努库阿洛法', value: 'Tonga Standard Time' }
];

// SRD创建表单数据
const srdFormData = reactive({
    name: '',
    zFromMsl: 0,
    replacementVelocity: 1480
});

// 监听 Unit system 的变化并更新相关字段
watch(() => formData.coordinates.unitSystem, (newVal) => {
    if (newVal === 'Metric' || newVal === 'Metric (customized)') {
        // 更新 Simulation units
        formData.coordinates.simulationUnits = 'ECLTPSE-Metric';
        // 只有在没有选择有效 CRS 时才更新 XY unit
        if (!selectedCrsData.value ||
            !selectedCrsData.value.Name ||
            selectedCrsData.value.Name === 'Undefined') {
            formData.coordinates.xyUnit = 'm';
        }
        formData.coordinates.zUnit = 'm';
        formData.coordinates.areaUnit = 'm2';
        formData.coordinates.volumeUnit = 'm3';
        formData.coordinates.seismicTimeUnit = 'ms';
        formData.coordinates.seismicVelocityUnit = 'm/s';
    }
    else if (newVal === 'Field' || newVal === 'Field-UTM') {
        // 更新 Simulation units
        formData.coordinates.simulationUnits = 'ECLTPSE-Field';
        // 只有在没有选择有效 CRS 时才更新 XY unit
        if (!selectedCrsData.value ||
            !selectedCrsData.value.Name ||
            selectedCrsData.value.Name === 'Undefined') {
            formData.coordinates.xyUnit = newVal === 'Field-UTM' ? 'm' : 'ft';
        }
        formData.coordinates.zUnit = 'ft';
        formData.coordinates.areaUnit = 'ft2';
        formData.coordinates.volumeUnit = 'ft3';
        formData.coordinates.seismicTimeUnit = 'ms';
        formData.coordinates.seismicVelocityUnit = 'ft/s';
    }
}, { immediate: true });
// 关闭对话框
const handleClose = () => {
    emit('close');
};

const handleOk = () => {
    handUpdate()
    // 处理OK逻辑
    emit('close');
};
// 添加表格引用
const historyTableRef = ref(null);
// 历史数据相关
const historyData = ref([])
// 添加一个新的计算属性用于倒序显示
const sortedHistoryData = computed(() => {
    return [...historyData.value].reverse();
});
// 获取历史数据列表
const fetchHistoryData = async () => {
    if (!currentProject.value) return;
    try {
        const result = await ProjectHistoryService.getList(currentProject.value.id);
        // 处理数据格式，添加序号和其他字段
        historyData.value = result.map((item, index) => ({
            index: index + 1,
            date: item.action_time,
            user: item.action_user,
            action: item.action_content,
            description: item.action_descn,
            createdBy: item.create_by
        }));
    } catch (error) {
        console.error('Failed to fetch history data:', error);
    }
};

// 监听当前项目变化，获取历史数据
watch(currentProject, () => {
    if (activeTab.value === 'History' && currentProject.value) {
        fetchHistoryData();
    }
}, { immediate: true });

// 切换到历史标签时加载数据
const handleTabClick = (tab) => {
    if (tab.paneName === 'History') {
        fetchHistoryData();
    }
};

// 表格样式设置
const getCellStyle = () => {
    return {
        backgroundColor: '#E6E6C8',
        borderBottom: 'none'
    };
};

const getHeaderCellStyle = () => {
    return {
        backgroundColor: '#f5f5f5',
        fontWeight: 'bold'
    };
};
// 添加右键菜单处理函数
const handleRowContextmenu = (event) => {
    event.preventDefault();
    contextMenuPosition.value = { x: event.clientX, y: event.clientY };
    contextMenuVisible.value = true;
};
// 点击其他地方隐藏右键菜单
const handleClickOutside = () => {
    contextMenuVisible.value = false;
};

// 在组件挂载时添加全局点击监听器
onMounted(() => {
    getUnitSystems();
    initializeFormData();
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('click', handleClickOutside);
});
// 在组件卸载时移除事件监听器
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('mousemove', handleMouseMove)
})
// 新增的添加历史记录相关变量和方法
const addHistoryDialogVisible = ref(false)
const newHistory = reactive({
    time: new Date().toISOString().split('T')[0],
    user: 'Administrator',
    action: '',
    description: ''
})

// 打开添加历史记录对话框
const handleAppendNewItem = async () => {
    addHistoryDialogVisible.value = true;
    // 重置表单数据
    newHistory.time = new Date().toISOString().split('T')[0];
    newHistory.user = await ProjectHistoryService.getCurrentUser();
    newHistory.action = '';
    newHistory.description = '';
}

// 关闭添加历史记录对话框
const handleAddHistoryClose = () => {
    addHistoryDialogVisible.value = false
}

// 确认添加历史记录
const handleAddHistoryConfirm = () => {
    // 创建新的历史记录对象
    const newRecord = {
        date: newHistory.time,
        user: newHistory.user,
        action: newHistory.action,
        description: newHistory.description,
        createdBy: 'User'
    }
    addHistory(newRecord)
    // 关闭对话框
    addHistoryDialogVisible.value = false

}

// 清空非系统历史记录
const handleClearNonSystemItems = () => {
    clearType.value = 'non-system'
    comforim.value = true
    contextMenuVisible.value = false
}

// 清空所有历史记录
const handleClearAllItems = () => {
    clearType.value = 'all'
    comforim.value = true
    contextMenuVisible.value = false
}
// 鼠标移入时显示提示信息，并添加响应式变量
const tooltipVisible = ref(false)
const tooltipPosition = ref({ x: 0, y: 0 })
const tooltipData = ref(null)
// 添加方法
const handleTableRowMouseEnter = (row, column, cell, event) => {
    tooltipData.value = row
    tooltipPosition.value = {
        x: event.clientX + 10,
        y: event.clientY + 10
    }
    tooltipVisible.value = true
}

const handleRowMouseLeave = (row, column, cell, event) => {
    tooltipVisible.value = false
}

const handleMouseMove = (event) => {
    if (tooltipVisible.value) {
        tooltipPosition.value = {
            x: event.clientX + 10,
            y: event.clientY + 10
        }
    }
}
// 添加确认清除的方法
const addComforim = () => {
    if (clearType.value === 'non-system') {
        // 清空非系统历史记录
        //historyData.value = historyData.value.filter(item => item.createdBy === 'System')
        handCleanUse()
    } else if (clearType.value === 'all') {
        // 清空所有历史记录
        //historyData.value = []
        handCleanAll()
    }
    // 关闭确认对话框
    comforim.value = false
    clearType.value = ''
}

// 添加关闭确认对话框的方法
const closeComforim = () => {
    comforim.value = false
    clearType.value = ''
}

//添加 3D 设置相关的处理函数
const handleGetOrigin = () => {
    // 实现获取原点的逻辑
    console.log('Get origin from clicked')
}

const handleGetObjectOrigin = () => {
    coury.value = true
}
const closeCoury = () => {
    coury.value = false
}
// 添加目录选择处理函数
const handleSelectDirectory = async () => {
    try {
        const selected = await open({
            directory: true,
            multiple: false,
            defaultPath: formData.miscSettings1.overrideDirectory || undefined
        });

        if (selected) {
            formData.miscSettings1.overrideDirectory = selected;
        }
    } catch (error) {
        console.error('选择目录时出错:', error);
    }
}
const closeSrd = () => {
    srdSreate.value = false
}
const addSrd = () => {
    // 构造选项文本
    const name = srdFormData.name || 'Datum';
    const zValue = parseFloat(srdFormData.zFromMsl).toFixed(1);
    const rvValue = parseFloat(srdFormData.replacementVelocity).toFixed(1);
    const optionText = `${name} Z=${zValue} RV=${rvValue}`;

    // 添加新选项
    formData.coordinates.srdOptions.push({
        label: optionText,
        value: optionText
    });

    // 关闭对话框
    srdSreate.value = false;
    // 重置表单数据
    srdFormData.name = '';
    srdFormData.zFromMsl = 0;
    srdFormData.replacementVelocity = 1480;
};
const createSRD = () => {
    srdSreate.value = true
}
//调用后台数据
//新增历史数据BY用户
const addHistory = async (data) => {
    const result = await ProjectHistoryService.add(
        {
            project_id: currentProject.value.id,
            action_time: new Date(data.date),
            action_user: data.user,
            action_content: data.action,
            action_descn: data.description,
            create_by: 'User'
        }
    );
    if (result) {
        fetchHistoryData()
    }
}

//清空用户的历史数据
const handCleanUse = async () => {
    const result = await ProjectHistoryService.clear(currentProject.value.id, true);
    if (result) {
        fetchHistoryData()
    }
}
//清空所有的历史数据
const handCleanAll = async () => {
    const result = await ProjectHistoryService.clear(currentProject.value.id);
    if (result) {
        fetchHistoryData()
    }
}
const handUpdate = async () => {
    const result = await ProjectRecordService.update({
        id: currentProject.value.id,
        project_setting: JSON.stringify(formData)
    });
    if (result == 1) {
        //将数据缓存到前端
        currentProject.value.project_setting = JSON.stringify(formData);
        strGeoMeta.setCurrentProject(currentProject.value);
        ElMessage.success('projectSettings update success')
    } else {
        ElMessage.error('projectSettings update failed')
    }
};
//获取单位数据
const getUnitSystems = async () => {
    try {
        const results = await UnitService.getUnitSystems();
        const systems = results.UnitSystem;
        unitSystemOptions.value = systems; // 存储结果供选择器使用
        return systems;
    } catch (error) {
        console.error('Failed to get unit classes:', error);
    }
}
</script>

<style lang="scss" scoped>
.contextmenu {
    margin: 0;
    background: #fff;
    z-index: 3000;
    position: fixed;
    list-style-type: none;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    color: #333;
    box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.3);
    width: 300px;
    background-color: #fff;

    .menu-item {
        display: flex;
        align-items: center;
        margin: 0;
        line-height: 30px;
        background-color: #F0F0F0;
        cursor: pointer;
        width: 100%;


        .menu-icon {
            width: 20px;
            height: 20px;
            margin: 0 5px;

        }

        .menu-text {
            margin: 0;
            flex: 1;
            border-left: 1px solid #E2E2E2;
            padding-left: 5px;
            background-color: #fff;
        }

        &:hover {
            border: 1px solid #0078D7;
            background: #B2D6F2;

            .menu-text {
                background: #B2D6F2;
            }
        }
    }
}

.comforim {
    background-color: #fff !important;
}

label {
    font-weight: 100;
}

:deep(.el-dialog.customize) {
    .el-dialog__body {
        padding: 0;
    }

    .figma-frame {
        position: relative;
        width: 668px;
        height: 572px;
        background: #F0F0F0;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
    }

    .title-measurement {
        position: absolute;
        left: 13px;
        top: 10px;
        width: 115px;
        height: 21px;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        font-size: 12px;
        line-height: 1.5em;
        color: #000000;
        display: flex;
        align-items: center;
    }

    .filter-label {
        position: absolute;
        left: 28px;
        top: 35px;
        width: 115px;
        height: 21px;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        font-size: 12px;
        line-height: 1.5em;
        color: #000000;
        display: flex;
        align-items: center;
    }

    .filter-input {
        position: absolute;
        left: 123px;
        top: 34px;
        width: 198px;
        height: 22px;
        background: #D9D9D9;
        border: none;
        border-radius: 2px;
        font-size: 12px;
        color: #000000;
    }

    .filter-input:focus {
        outline: 1px solid #409eff;
    }

    .show-measurements-label {
        position: absolute;
        left: 28px;
        top: 67px;
        width: 189px;
        height: 21px;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        font-size: 12px;
        line-height: 1.5em;
        color: #000000;
        display: flex;
        align-items: center;
    }

    .show-measurements-checkbox {
        position: absolute;
        left: 217px;
        top: 66px;
        width: 104px;
        height: 22px;
        background: #D9D9D9;
        border: none;
        border-radius: 2px;
    }

    .show-measurements-in-use-label {
        position: absolute;
        left: 28px;
        top: 96px;
        color: black;
    }

    .area1 {
        position: absolute;
        left: 13px;
        top: 126px;
        width: 308px;
        height: 359px;
        background: white;
        border-radius: 2px;
        padding: 16px;
        overflow: hidden;
        border: 1px solid #000;
    }

    .area2 {
        position: absolute;
        left: 334px;
        top: 35px;
        width: 328px;
        height: 147px;
        background: white;
        border-radius: 2px;
        padding: 16px;
        overflow: hidden;
        border: 1px solid #000;
    }

    .template-label {
        position: absolute;
        left: 339px;
        top: 10px;
        width: 220px;
        height: 21px;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        font-size: 12px;
        line-height: 1.5em;
        color: #000000;
        display: flex;
        align-items: center;
    }

    .area3 {
        position: absolute;
        left: 334px;
        top: 224px;
        width: 328px;
        height: 261px;
        background: white;
        border-radius: 2px;
        padding: 16px;
        overflow: hidden;
        border: 1px solid #000;
    }

    .unit-label {
        position: absolute;
        left: 340px;
        top: 198px;
        width: 45px;
        height: 21px;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        font-size: 12px;
        line-height: 1.5em;
        color: #000000;
        display: flex;
        align-items: center;
    }

    .area4 {
        position: absolute;
        left: 5px;
        top: 495px;
        width: 657px;
        height: 74px;
        background: #F0F0F0;
        border-radius: 2px;
        border: 1px solid #000;
        padding: 16px;
        overflow: hidden;
    }

    .area-content {
        color: #666;
        font-size: 12px;
    }

    .area-content h4 {
        margin-bottom: 12px;
        color: #000;
        font-size: 14px;
        font-weight: 500;
    }

    .form-group {
        margin-bottom: 12px;
    }

    .form-group label {
        display: block;
        margin-bottom: 4px;
        font-size: 12px;
        color: #000;
        font-weight: 500;
    }

    .settings-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
    }

    .measurement-item {
        padding: 8px 0;
        border-bottom: 1px solid #ccc;
    }

    .measurement-item:last-child {
        border-bottom: none;
    }

    .item-name {
        font-weight: 500;
        margin-bottom: 4px;
    }

    .item-description {
        font-size: 11px;
        color: #888;
    }
}
</style>