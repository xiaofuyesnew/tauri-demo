<template>
    <ThreeFrame ref="refThreeFrame" />
</template>

<script setup>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import ThreeFrame from '@/components/threeTool/threeFrame/ThreeFrame.vue'; // 导入Three.js场景框架组件
import ThreeDGridRuler from '@/components/threeTool/threeFrame/components/function/ThreeDGridRuler.js'; // 导入3D网格标尺系统

import { toTrianglesDrawMode } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { onMounted, ref, watch, onUnmounted, markRaw, reactive } from 'vue'
import useGeoMetaStore from "@/store/geometa";
import { filterNodes } from "@/utils"
import WellTopsSphereMarker from "@/components/threeTool/threeFrame/components/marker/WellTopsSphereMarker"

const strGeoMeta = useGeoMetaStore();

const { aPane, assignSrcToTreeNodes } = strGeoMeta; // 解构 computed 属性
const refThreeFrame = ref(null)
const oObjects = {
    scene: null,
    camera: null,
    controls: null,
    renderer: null,
    labelRenderer: null,
    gridRuler: null,
    wellTopsSphereMarker: null
};



function createBoundingBox(object) {
    const box = new THREE.Box3().setFromObject(object); // 创建包围盒
    const size = box.getSize(new THREE.Vector3()); // 获取尺寸
    const center = box.getCenter(new THREE.Vector3()); // 获取中心点
    return { size, center };
}

const renderSeismic = () => {
    if (!oObjects.scene || !refThreeFrame.value) return
    let linesGroup = oObjects.scene.getObjectByName("linesGroup");
    // 先释放现有群组的资源
    if (linesGroup) {
        // 1. 递归释放所有子对象的几何体和材质
        linesGroup.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) {
                    child.geometry.dispose(); // 释放几何体
                }
                if (child.material) {
                    // 处理单材质和材质数组
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
        oObjects.scene.remove(linesGroup);
    }
    linesGroup = new THREE.Group();
    linesGroup.name = "linesGroup";
    oObjects.scene.add(linesGroup);

    if (3 <= strGeoMeta.refSGY?.length) {
        // 创建几何体
        const geometry = new THREE.BufferGeometry();

        // 定义顶点（3个顶点）
        const vertices = new Float32Array(strGeoMeta.refSGY[0]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        // 定义颜色（每个顶点一个颜色）
        const colors = new Float32Array(strGeoMeta.refSGY[1]);
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // 定义索引（三角形由顶点0、1、2组成）
        const indices = new Uint16Array(strGeoMeta.refSGY[2]);
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        // 设置为三角形带绘制模式
        const geometryStrip = toTrianglesDrawMode(geometry, THREE.TriangleStripDrawMode);
        // 创建材质（启用顶点颜色）
        const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });

        // 创建网格并添加到场景
        const mesh = new THREE.Mesh(geometryStrip, material);
        linesGroup.add(mesh);
    }
    const aNode = aPane.find(o => 'Input' === o.title).folders.map(o => filterNodes(o)).flat();

    // 添加新线段
    aNode.forEach(oNode => {
        switch (oNode.type) {
            case 'Well tops':
                oNode.array?.filter(a => oNode.id === a[6])?.forEach(a => {
                    // // 1. 创建球体几何体
                    // const geometry = new THREE.SphereGeometry(1, 32, 32); // (半径, 宽度分段, 高度分段)

                    // // 2. 创建球体材质（例如红色）
                    // const material = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 1, metalness: 0.1 }); // 基础材质（不光照）

                    // // 3. 创建球体网格（Mesh）
                    // const sphere = new THREE.Mesh(geometry, material);

                    // // 4. 设置球体的位置（xyz）
                    // sphere.position.set(Number(a[0] / 100), Number(a[1] / 100), Number(a[2] / 100)); // 根据实际需要设置位置

                    // // 5. 添加到场景或某个 Group 中
                    // linesGroup.add(sphere); // 假设 linesGroup 是一个 THREE.Group
                    
                    const wellTopsGroup = oObjects.wellTopsSphereMarker.getGroup();
                    let o = wellTopsGroup.children.find(o => o.name === `${a[6]}_${a[5]}`)
                    if (!o) {
                        oObjects.wellTopsSphereMarker.createWellTops(
                            new THREE.Vector3(Number(a[0]), Number(a[1]), Number(a[2])), // 坐标
                            10, // 半径
                            oNode.color, // 颜色
                            `${a[6]}_${a[5]}`, // 名称(用于单独隐藏)
                            a[6], // 所属井轨迹(用于批量隐藏)
                            a[5], // 所属地层(用于批量隐藏)
                            !!oNode.check
                        );
                    } else {
                        o.visible = oNode.check
                    }
                })
                break;

            default:
                break;
        }
    });

    // 计算包围盒并重置相机和灯光
    const { size, center } = createBoundingBox(oObjects.wellTopsSphereMarker.getGroup());
    refThreeFrame.value.resetCameraAndLight(size, center);
    // 设定包围盒和包围盒中心
    oObjects.gridRuler.setGridLines(size, center)
    console.log('包围盒尺寸:', size, '中心点:', center);
}

watch(() => strGeoMeta.refSGY, renderSeismic, { immediate: true })
watch(() => strGeoMeta.aPane, renderSeismic, { immediate: true, deep: true })

onMounted(() => {
    // 初始化场景
    // scene.background = new THREE.Color(0x111111)

    // // 初始化相机
    // camera.position.set(0, 0, 5)

    // // 初始化渲染器
    // renderer.setSize(refContainer.value.clientWidth, refContainer.value.clientHeight)
    // refContainer.value.appendChild(renderer.domElement)

    // // 添加控制器
    // const controls = new OrbitControls(camera, renderer.domElement)
    // controls.enableDamping = true

    // // 添加坐标轴辅助
    // const axesHelper = new THREE.AxesHelper(3)
    // scene.add(axesHelper)

    // // 添加光源
    // const ambientLight = new THREE.AmbientLight(0x404040)
    // scene.add(ambientLight)

    // const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    // directionalLight.position.set(1, 1, 1)
    // scene.add(directionalLight)
    // 从ThreeFrame组件获取Three.js核心对象
    const { scene, camera, controls } = refThreeFrame.value.getThreeObject();
    // 使用markRaw防止Vue对这些对象进行响应式代理
    oObjects.scene = markRaw(scene);
    window.dxj = oObjects.scene; // 暴露场景对象到全局，方便调试
    oObjects.camera = markRaw(camera);
    oObjects.controls = markRaw(controls);
    // 初始化井轨迹标记系统
    oObjects.wellTopsSphereMarker = markRaw(new WellTopsSphereMarker(
        oObjects.scene,
        oObjects.camera,
        oObjects.controls,
        () => {} // 批量操作回调
    ));

    // 初始化3D网格标尺系统
    oObjects.gridRuler = new ThreeDGridRuler(
        oObjects.scene,
        oObjects.camera,
        oObjects.controls,
        '#ffffff'
    );
    renderSeismic();
})

// 组件卸载时停止观察（避免内存泄漏）
onUnmounted(() => {
    oObjects.gridRuler?.dispose()
    oObjects.wellTopsSphereMarker?.dispose();
});
</script>

<style scoped>
.seismic-container {
    width: 100%;
    height: 100vh;
    position: relative;
}
</style>
