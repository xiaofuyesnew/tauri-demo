<template>
    <el-dialog v-model="crsVisible" style="height: auto;width:1030px" draggable @close="handleClose"
        class="project-dialog">
        <template #header>
            <div class="dialog-custom-header">
                <img src="@/assets/image/project/crs.png" alt="title" class="title-image" />
                <span>Coordinate reference system selection</span>
            </div>
        </template>

        <div class="crs-content">
            <!-- 地图容器 -->
            <div ref="mapContainer" class="map-container">
                <!-- 将提示框放在地图容器内部 -->
                <div class="tooltip" v-if="currentLatLng">
                    {{ formatLatLng(currentLatLng.lat, currentLatLng.lng) }}
                </div>
            </div>
        </div>

        <div class="tab-content">
            <div class="form-row separator">
                <label>Select coordinate reference system (CRS)</label>
                <hr>
            </div>

            <!-- 第一行 -->
            <div class="form-row">
                <div class="form-group">
                    <label style="width: 100px;">Filter by string:</label>
                    <el-input v-model="filterString" placeholder="Enter filter string"
                        @input="debouncedFilterStringChange" />
                </div>
                <div class="form-group">
                    <label>Filter by catalog:</label>
                    <el-select v-model="filterCatalog" placeholder="Select catalog">
                        <el-option label="Enterprise & Extensions Catalogs" value="enterprise_extensions"></el-option>
                        <el-option label="Enterprise Catalog" value="enterprise"></el-option>
                    </el-select>
                </div>
            </div>

            <!-- 第二行 -->
            <div class="form-row" style="height: 30px;">
                <div class="form-group">
                    <label style="width: 100px;">Filter by :</label>
                </div>
                <div class="form-group checkbox-group">
                    <el-checkbox v-model="pointInsideArea" @change="handleCheckboxChange">
                        Point inside area of use
                    </el-checkbox>
                </div>
                <div class="form-group">
                    <label>Reference position:</label>
                    <el-input v-model="referencePosition" :disabled="!pointInsideArea && !maxShapeDistortion"
                        placeholder="Click on map to set position" style="width: 100px;" />
                    <span class="degree-label">degrees lat/long</span>
                </div>
                <div class="button-container" style="margin-left: auto;">
                    <el-button :disabled="(!pointInsideArea && !maxShapeDistortion) || filterDisabled"
                        @click="handleFilter" style="width: 80px;">
                        <img src="@/assets/image/project/Filter.png" alt="OK" class="button-icon" />Filter
                    </el-button>
                </div>
            </div>

            <!-- 第三行 -->
            <div class="form-row" style="height: 30px;">
                <div class="form-group">
                    <label style="width: 100px;"></label>
                </div>
                <div class="form-group checkbox-group">
                    <el-checkbox v-model="maxShapeDistortion" @change="handleCheckboxChange">
                        Max shape distortion:
                    </el-checkbox>
                    <el-input v-model="maxDistortionValue" :disabled="!maxShapeDistortion"
                        placeholder="Enter max distortion value" style="width: 100px;" />%
                </div>
                <div class="button-container" style="margin-left: auto;">
                    <el-button :disabled="resetDisabled" @click="handleReset" style="width: 80px;">
                        <img src="@/assets/image/project/Reset.png" alt="OK" class="button-icon" />Reset
                    </el-button>
                </div>
            </div>
        </div>
        <div class="history-table-container" style="min-height:180px">
            <el-table :data="sortedHistoryData" class="history-table crd-table" border resizable ref="historyTableRef"
                style="width: 100%" @row-click="handleRowClick" @row-dblclick="handleRowDblClick" highlight-current-row>
                <el-table-column prop="crs_name" label="Name" width="120" resizable></el-table-column>
                <el-table-column prop="descn" label="Description" width="300" resizable></el-table-column>
                <el-table-column prop="horizontal_unit" label="Horizontal unit" width="150" resizable></el-table-column>
                <el-table-column prop="auth_name" label="Authority" width="100" resizable></el-table-column>
                <el-table-column prop="auth_code" label="Code" width="100" resizable></el-table-column>
            </el-table>
        </div>
        <div class="button-container">
            <el-button title="Show details of currently selected CRS" :disabled="crsDetailsButtonDisabled"
                @click="showCrsDetails">
                <img src="@/assets/image/project/check.png" alt="CRS details" class="button-icon" />CRS details...
            </el-button>
            <el-button @click="handleOk">
                <img src="@/assets/image/ok.png" alt="OK" class="button-icon" /> OK
            </el-button>
            <el-button @click="handleClose">
                <img src="@/assets/image/cancel.png" alt="Cancel" class="button-icon" /> Cancel
            </el-button>
        </div>
    </el-dialog>
    <CrsDetails v-model:visible="crsDetailsVisible" :crs-data="selectedCrsData" />
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import CrsDetails from './CrsDetails.vue'
import { CrsService } from '@/api/crs'

// 自定义十字形图标
const crossIcon = new L.DivIcon({
    className: 'cross-icon',
    html: '<div style="width: 16px; height: 32px; position: relative;">' +
        '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 2px; height: 32px; background: red;"></div>' +
        '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 16px; height: 4px; background: red;"></div>' +
        '</div>',
    iconSize: [16, 32],
    iconAnchor: [8, 16]
})

// 表单数据
const filterString = ref('')
const filterCatalog = ref('enterprise_extensions')
const pointInsideArea = ref(false)
const maxShapeDistortion = ref(false)
const referencePosition = ref('0°S 0°W')
const maxDistortionValue = ref('0.1')
const filterDisabled = ref(false)
const resetDisabled = ref(true)
const crossMarker = ref(null)
const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    }
})
const crsDetailsButtonDisabled = ref(true)

const initialized = ref(false)
const emit = defineEmits(['close', 'select'])
// 控制 CrsDetails 弹窗显示
const crsDetailsVisible = ref(false)
// 添加防抖定时器引用
const filterDebounceTimer = ref(null)

// 存储选中的行数据
const selectedCrsData = ref(null)
// 控制对话框显示
const crsVisible = computed({
    get: () => props.visible,
    set: (val) => {
        if (!val) {
            emit('close')
        }
    }
})
// 添加一个变量来存储已绘制的矩形框，避免重复添加
const drawnRectangles = ref([])
// 示例数据：添加 bbox 字段
const sortedHistoryData = ref([])
// 地图容器引用
const mapContainer = ref(null)
const map = ref(null)
const currentLatLng = ref(null)

// 双击处理函数
const handleRowDblClick = (row, column, event) => {
    if (!row) return

    // 存储选中的行数据
    selectedCrsData.value = row

    // 显示 CrsDetails 弹窗
    if (row.crs_name !== 'Undefined') {
        crsDetailsVisible.value = true
    }
}
const handleRowClick = (row, column, event) => {
    //if (!row || !row.bbox) return
    selectedCrsData.value = row
    if (row && row.crs_name === 'Undefined') {
        crsDetailsButtonDisabled.value = true
    } else {
        // 启用 CRS details 按钮
        crsDetailsButtonDisabled.value = false
    }
    // 清除之前绘制的矩形
    drawnRectangles.value.forEach(rect => map.value.removeLayer(rect))
    drawnRectangles.value = []
    // 替换 handleRowClick 中的矩形绘制部分
    if (row && row.crs_name !== 'Undefined' && row.bbox) {
        const [minLat, minLng, maxLat, maxLng] = row.bbox.split(',').map(Number)

        // 检查是否跨越国际日期变更线 (经度)
        if (minLng > maxLng) {
            // 检查纬度是否也需要分割
            if (minLat > maxLat) {
                // 经度和纬度都需要分割的情况
                // 创建四个矩形来表示完整的区域
                const rect1 = L.rectangle([[maxLat, minLng], [90, 180]], {
                    color: 'rgba(255, 255, 255, 0.7)',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.3,
                    fillColor: 'white'
                }).addTo(map.value);

                const rect2 = L.rectangle([[maxLat, -180], [90, maxLng]], {
                    color: 'rgba(255, 255, 255, 0.7)',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.3,
                    fillColor: 'white'
                }).addTo(map.value);

                const rect3 = L.rectangle([[minLat, minLng], [-90, 180]], {
                    color: 'rgba(255, 255, 255, 0.7)',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.3,
                    fillColor: 'white'
                }).addTo(map.value);

                const rect4 = L.rectangle([[minLat, -180], [-90, maxLng]], {
                    color: 'rgba(255, 255, 255, 0.7)',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.3,
                    fillColor: 'white'
                }).addTo(map.value);

                // 将四个矩形都添加到 drawnRectangles 数组中
                drawnRectangles.value.push(rect1, rect2, rect3, rect4);
            } else {
                // 只有经度需要分割的情况
                // 跨越国际日期变更线的情况
                const rect1 = L.rectangle([[minLat, minLng], [maxLat, 180]], {
                    color: 'rgba(255, 255, 255, 0.7)',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.3,
                    fillColor: 'white'
                }).addTo(map.value);

                const rect2 = L.rectangle([[minLat, -180], [maxLat, maxLng]], {
                    color: 'rgba(255, 255, 255, 0.7)',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.3,
                    fillColor: 'white'
                }).addTo(map.value);

                // 将两个矩形都添加到 drawnRectangles 数组中
                drawnRectangles.value.push(rect1, rect2);
            }
        } else {
            // 不跨越国际日期变更线的情况
            if (minLat > maxLat) {
                // 只有纬度需要分割的情况
                // 创建两个矩形来表示跨越极点的区域
                const rect1 = L.rectangle([[maxLat, minLng], [90, maxLng]], {
                    color: 'rgba(255, 255, 255, 0.7)',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.3,
                    fillColor: 'white'
                }).addTo(map.value);

                const rect2 = L.rectangle([[minLat, minLng], [-90, maxLng]], {
                    color: 'rgba(255, 255, 255, 0.7)',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.3,
                    fillColor: 'white'
                }).addTo(map.value);

                // 将两个矩形都添加到 drawnRectangles 数组中
                drawnRectangles.value.push(rect1, rect2);
            } else {
                // 正常情况 - 不需要分割
                const bounds = L.latLngBounds([[minLat, minLng], [maxLat, maxLng]]);
                const rectangle = L.rectangle(bounds, {
                    color: 'rgba(255, 255, 255, 0.7)',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.3,
                    fillColor: 'white'
                }).addTo(map.value);
                drawnRectangles.value.push(rectangle);
            }
        }
    }
}
const showCrsDetails = () => {
    if (selectedCrsData.value) {
        crsDetailsVisible.value = true
    } else {
        console.warn('No CRS data selected')
    }
}
// 处理复选框变化
const handleCheckboxChange = () => {
    // 当任一复选框被选中时，启用Filter按钮
    if (pointInsideArea.value || maxShapeDistortion.value) {
        filterDisabled.value = false
    } else {
        filterDisabled.value = true
    }
}
// 获取 CRS 列表数据
const fetchCrsList = async (dto = {}) => {
    try {
        const result = await CrsService.getListByFilter(dto)
        sortedHistoryData.value = [{
            crs_name: 'Undefined',
            descn: "Clear current CRS and set context to'spatially unaware'",
            horizontal_unit: '',
            auth_name: '',
            auth_code: '',
            bbox: ''
        }, ...result]
    } catch (error) {
        console.error('获取 CRS 列表失败:', error)
        // 可以添加错误提示
    }
}
// 处理Filter按钮点击
const handleFilter = async () => {
    filterDisabled.value = true
    resetDisabled.value = false
    // 缺少max参数,先不写
    const parsedCoords = parseLatLng(referencePosition.value)
    try {
        // 构造过滤参数
        const dto = {
            ref_lat: parsedCoords.lat,
            ref_lon: parsedCoords.lng,
            is_inside: true
            //max_distortion
        }
        // 调用后端接口获取数据
        const result = await CrsService.getListByFilter(dto)
        // 更新表格数据
        sortedHistoryData.value = [{
            crs_name: 'Undefined',
            descn: "Clear current CRS and set context to'spatially unaware'",
            horizontal_unit: '',
            auth_name: '',
            auth_code: '',
            bbox: ''
        }, ...result]
    } catch (error) {
        console.error('获取 CRS 列表失败:', error)
    }
}

// 处理Reset按钮点击
const handleReset = async () => {
    filterString.value = ''
    filterCatalog.value = 'enterprise_extensions'
    referencePosition.value = '0°S 0°W'
    maxDistortionValue.value = '0.1'
    filterDisabled.value = true
    resetDisabled.value = true

    // 根据复选框状态决定Filter按钮是否可用
    if (pointInsideArea.value || maxShapeDistortion.value) {
        filterDisabled.value = false
    }
    // 重置后重新获取数据
    await fetchCrsList({})
}

// 添加格式化经纬度的函数
const formatLatLng = (lat, lng) => {
    const latDirection = lat >= 0 ? 'N' : 'S';
    const lngDirection = lng >= 0 ? 'E' : 'W';
    const formattedLat = Math.abs(Math.round(lat));
    const formattedLng = Math.abs(Math.round(lng));

    return `${formattedLat}°${latDirection} ${formattedLng}°${lngDirection}`;
};

// 修改 initializeMap 函数，添加 mouseover 事件监听
const initializeMap = () => {
    if (!mapContainer.value) {
        console.error('Map container not found')
        return
    }

    // 修复 Leaflet 默认图标问题
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    })

    // 创建地图并禁用交互功能
    map.value = L.map(mapContainer.value, {
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
        attributionControl: false
    }).setView([35, 0], 2) // 初始视图

    // 创建自定义图层，只显示3张瓦片高度
    const customTileLayer = L.gridLayer({
        tileSize: 256,
        noWrap: true,
        bounds: [[-90, -180], [90, 180]]
    });

    customTileLayer.createTile = function (coords) {
        const tile = L.DomUtil.create('img', 'leaflet-tile');

        // 加载正常的瓦片
        tile.onload = function () {
            // 可以在这里添加加载成功的处理
        };

        tile.onerror = function () {
            tile.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
        };

        tile.src = `./tiles/${coords.z}/${coords.x}/${coords.y}.png`;
        tile.alt = `${coords.z}/${coords.x}/${coords.y}`;

        return tile;
    };

    customTileLayer.addTo(map.value);

    // 添加初始十字形标记在 (0,0)
    crossMarker.value = L.marker([0, 0], { icon: crossIcon }).addTo(map.value)

    // 提取更新提示框位置的函数，供多个事件使用
    const updateTooltipPosition = (e) => {
        // 更新经纬度值
        currentLatLng.value = e.latlng

        // 更新提示位置，使其跟随鼠标
        const tooltip = document.querySelector('.tooltip')
        if (tooltip) {
            // 使用leaflet提供的layerPoint坐标，相对于地图容器
            const point = map.value.layerPointToContainerPoint(e.layerPoint)
            tooltip.style.left = point.x + 'px'
            tooltip.style.top = point.y + 'px'
        }
    }

    // 鼠标进入地图容器事件：显示提示框并定位
    map.value.on('mouseover', (e) => {
        updateTooltipPosition(e)
    })

    // 鼠标移动事件：更新经纬度提示并跟随鼠标
    map.value.on('mousemove', (e) => {
        updateTooltipPosition(e)
    })

    // 鼠标移出地图容器事件：清除经纬度提示
    map.value.on('mouseout', (e) => {
        currentLatLng.value = null
    })

    // 点击事件：更新十字形位置
    map.value.on('click', (e) => {
        const latlng = e.latlng
        crossMarker.value.setLatLng(latlng)
        currentLatLng.value = latlng

        // 更新参考位置输入框，使用与提示框相同的格式
        referencePosition.value = formatLatLng(latlng.lat, latlng.lng)

        // 点击时也更新提示框位置
        updateTooltipPosition(e)
    })
}
// 解析 "45°N 120°E" 格式的字符串
const parseLatLng = (str) => {
    const regex = /^(\d+)°([NS])\s+(\d+)°([EW])$/i
    const match = str.match(regex)
    if (!match) return null

    let [, lat, ns, lng, ew] = match
    lat = parseInt(lat)
    lng = parseInt(lng)

    if (ns.toUpperCase() === 'S') lat = -lat
    if (ew.toUpperCase() === 'W') lng = -lng

    return { lat, lng }
}
// 处理过滤字符串变化
const handleFilterStringChange = async () => {
    try {
        // 构造过滤参数
        const dto = {
            name: filterString.value
        }
        // 调用后端接口获取数据
        const result = await CrsService.getListByFilter(dto)
        // 更新表格数据
        sortedHistoryData.value = [{
            crs_name: 'Undefined',
            descn: "Clear current CRS and set context to'spatially unaware'",
            horizontal_unit: '',
            auth_name: '',
            auth_code: '',
            bbox: ''
        }, ...result]
    } catch (error) {
        console.error('获取 CRS 列表失败:', error)
    }
}
// 监听对话框可见性变化
watch(crsVisible, (newVal) => {
    if (newVal && !initialized.value) {
        // 延迟一小段时间确保 DOM 渲染完成
        setTimeout(async () => {
            initializeMap()
            // 初始化时获取数据
            await fetchCrsList({})
            initialized.value = true
        }, 100)
    }
})
// 监听 referencePosition 变化，当勾选了相应复选框时启用Filter按钮
watch(referencePosition, (newVal) => {
    // 更新地图标记位置
    if (!newVal || !crossMarker.value) return

    const parsed = parseLatLng(newVal)
    if (parsed) {
        const { lat, lng } = parsed
        crossMarker.value.setLatLng([lat, lng])
    } else {
        console.warn('Invalid coordinate format')
    }

    // 当勾选了相应复选框时启用Filter按钮
    if (pointInsideArea.value || maxShapeDistortion.value) {
        filterDisabled.value = false
    }
})
// 监听 maxDistortionValue 变化，当勾选了相应复选框时启用Filter按钮
watch(maxDistortionValue, (newVal) => {
    // 当勾选了相应复选框时启用Filter按钮
    if (maxShapeDistortion.value) {
        filterDisabled.value = false
    }
})
// 防抖处理过滤字符串变化
const debouncedFilterStringChange = () => {
    // 清除之前的定时器
    if (filterDebounceTimer.value) {
        clearTimeout(filterDebounceTimer.value)
    }

    // 设置新的定时器
    filterDebounceTimer.value = setTimeout(() => {
        handleFilterStringChange()
    }, 2000) // 2秒延迟
}
// 初始化地图
onMounted(() => {
    // 如果组件挂载时对话框已经可见，则初始化地图
    if (crsVisible.value) {
        setTimeout(async () => {
            initializeMap()
            await fetchCrsList({})
            initialized.value = true
        }, 100)
    }

})
// 在组件卸载时移除事件监听器
onUnmounted(() => {
    if (filterDebounceTimer.value) {
        clearTimeout(filterDebounceTimer.value)
    }
    // 清理地图事件监听器
    if (map.value) {
        map.value.off('mouseover')
        map.value.off('mousemove')
        map.value.off('mouseout')
        map.value.off('click')

        // 移除地图实例
        map.value.remove()
        map.value = null
    }

    // 清理其他可能的定时器或事件监听器
    crossMarker.value = null
    currentLatLng.value = null

    // 清理已绘制的矩形
    if (drawnRectangles.value.length > 0) {
        drawnRectangles.value.forEach(rect => {
            if (rect && typeof rect.remove === 'function') {
                rect.remove()
            }
        })
        drawnRectangles.value = []
    }
})
// 关闭对话框
const handleClose = () => {
    emit('close')
}

// 确认操作：将当前坐标传递给父组件
const handleOk = () => {
    if (currentLatLng.value) {
        emit('select', {
            lat: currentLatLng.value.lat,
            lng: currentLatLng.value.lng,
            crs: selectedCrsData.value // 添加选中的 CRS 数据
        })
    } else {
        emit('select', {
            crs: selectedCrsData.value // 即使没有坐标点也传递 CRS 数据
        })
    }
    emit('close')
}
</script>

<style scoped>
.crs-content {
    height: 390px;
}

.map-container {
    width: 100%;
    height: 768px;
    border: 1px solid #ccc;
    margin-bottom: 10px;
    cursor: default;
    position: relative;
    /* 确保容器为相对定位 */
    overflow: hidden;
    transform: scaleY(0.51);
    /* 压缩到目标高度 390px */
    transform-origin: top center;
}

.tooltip {
    position: absolute;
    /* 改为绝对定位 */
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 1000;
    pointer-events: none;
    white-space: nowrap;
    transform: translate(-50%, -100%)scaleY(1.96);
    margin-top: -20px;
}


.form-row {
    display: flex;
    align-items: center;
    gap: 5px;
}

.form-row.separator {
    height: 20px;
    margin-bottom: 5px;
}

.form-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.form-group.checkbox-group {
    min-width: 200px;
}

.form-group label {
    white-space: nowrap;
    font-weight: 100;
}

.form-group .el-input,
.form-group .el-select {
    width: 200px;
}

.degree-label {
    white-space: nowrap;
}

.button-container {
    display: flex;
    align-items: center;
    gap: 10px;
}

.button-container :first-child {
    margin-right: auto;
}
</style>