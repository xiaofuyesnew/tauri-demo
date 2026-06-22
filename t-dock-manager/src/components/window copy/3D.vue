<template>
  <div class="container" ref="refContainer">
  </div>
</template>

<script setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { ref, onMounted, watch, onUnmounted } from "vue";
import useGeoMetaStore from "@/store/geometa";
import { storeToRefs } from 'pinia';
import { filterCheckedNodes } from "@/utils"

const strGeoMeta = useGeoMetaStore();
const { aPane } = storeToRefs(strGeoMeta); // 解构 computed 属性

let xyGrid, xyGridOpposite, xzGrid, xzGridOpposite, yzGrid, yzGridOpposite;
const refContainer = ref(null)
const width = 1, height = 1;
const scene = new THREE.Scene();
// 初始化时创建 Group
const linesGroup = new THREE.Group();
scene.add(linesGroup);
// 1. 创建场景、相机、渲染器

const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);


// 3. 设置相机位置
camera.position.z = 5;
// 创建坐标轴
const axesHelper = new THREE.AxesHelper(11); // 参数为轴的长度
scene.add(axesHelper);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(width, height);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';


// 2. 添加轨道控制器（方便旋转、缩放视角）
const controls = new OrbitControls(camera, labelRenderer.domElement);

createGrids();
// createTickLabel();
addTickMarks(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 10), 1);
createLabel();

// 6. 动画循环
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // 更新轨道控制器
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  if (true) {
    updateGridVisibility(camera)
  } else {
    xyGrid.visible = false;
    xzGrid.visible = false;
    yzGrid.visible = false;
    xyGridOpposite.visible = false;
    xzGridOpposite.visible = false;
    yzGridOpposite.visible = false;
  }
}
animate();

// 7. 响应窗口大小变化
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width: w, height: h } = entry.contentRect;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
  }
});

function createGrids(gridSize = 10, gridDivisions = 10) {
  // 定义网格参数
  const gridColor = 0xffffff; // 网格颜色

  // 创建 XY 平面网格
  xyGrid = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
  xyGrid.rotation.x = Math.PI / 2; // 将网格旋转到 XY 平面
  xyGrid.position.x = 5;
  xyGrid.position.y = 5;
  scene.add(xyGrid);
  xyGridOpposite = xyGrid.clone();
  xyGridOpposite.position.z = 10;
  scene.add(xyGridOpposite);

  // 创建 XZ 平面网格
  xzGrid = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
  // XZ 平面是默认的平面，无需旋转
  xzGrid.position.x = 5;
  xzGrid.position.z = 5;
  scene.add(xzGrid);
  xzGridOpposite = xzGrid.clone();
  xzGridOpposite.position.y = 10;
  scene.add(xzGridOpposite);

  // 创建 YZ 平面网格
  yzGrid = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
  yzGrid.rotation.z = -Math.PI / 2; // 将网格旋转到 YZ 平面
  yzGrid.position.y = 5;
  yzGrid.position.z = 5;
  scene.add(yzGrid);
  yzGridOpposite = yzGrid.clone();
  yzGridOpposite.position.x = 10;
  scene.add(yzGridOpposite);
}

function addTickMarks(axisStart, axisEnd, interval) {
  const dir = new THREE.Vector3().subVectors(axisEnd, axisStart).normalize();
  const dirAxis = new THREE.Vector3(0, 1, 0);
  const length = axisStart.distanceTo(axisEnd);
  const numTicks = Math.floor(length / interval);

  for (let i = 1; i <= numTicks; i++) {
    const tickPos = new THREE.Vector3()
      .copy(axisStart)
      .add(dir.clone().multiplyScalar(i * interval));
    // 绘制刻度小短线
    const tickGeometry = new THREE.BufferGeometry().setFromPoints([
      tickPos.clone(),
      tickPos.clone().add(dirAxis.clone().multiplyScalar(0.05)),
    ]);
    const tickMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const tickLine = new THREE.Line(tickGeometry, tickMaterial);
    scene.add(tickLine);
    createTickLabel(i, tickPos.clone().add(dirAxis.clone().multiplyScalar(0.2)));
  }
}

function createTickLabel(text, position) {
  const labelDiv = document.createElement('div');
  labelDiv.className = 'label';
  labelDiv.textContent = text;
  labelDiv.style.color = 'white';

  const label = new CSS2DObject(labelDiv);
  label.position.copy(position);
  scene.add(label);
}

function createLabel() {
  // 2. 添加 XYZ 坐标轴标签
  // X 轴标签
  const xLabel = document.createElement('div');
  xLabel.style.color = 'white';
  xLabel.style.fontSize = '20px';
  xLabel.style.fontFamily = 'Arial';
  xLabel.textContent = 'X-axis';
  const xLabelObj = new CSS2DObject(xLabel);
  xLabelObj.position.set(5.5, 0, 0); // X 轴末端
  scene.add(xLabelObj);

  // Y 轴标签
  const yLabel = document.createElement('div');
  yLabel.style.color = 'white';
  yLabel.style.fontSize = '20px';
  yLabel.style.fontFamily = 'Arial';
  yLabel.textContent = 'Y-axis';
  const yLabelObj = new CSS2DObject(yLabel);
  yLabelObj.position.set(0, 5.5, 0); // Y 轴末端
  scene.add(yLabelObj);

  // Z 轴标签
  const zLabel = document.createElement('div');
  zLabel.style.color = 'white';
  zLabel.style.fontSize = '20px';
  zLabel.style.fontFamily = 'Arial';
  zLabel.textContent = 'Z-axis';
  const zLabelObj = new CSS2DObject(zLabel);
  zLabelObj.position.set(0, 0, 5.5); // Z 轴末端
  scene.add(zLabelObj);
}

// 判断网格是否面向摄像机的函数（点积 > 0 则隐藏）
function updateGridVisibility(camera) {
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);

  // XY 平面网格（法线向量 (0, 0, 1)）
  const xyNormal = new THREE.Vector3(0, 0, 1);
  const xyDot = xyNormal.dot(cameraDirection);
  xyGrid.visible = xyDot <= 0; // 点积 <= 0 时显示（背对摄像机）

  // XZ 平面网格（法线向量 (0, 1, 0)）
  const xzNormal = new THREE.Vector3(0, 1, 0);
  const xzDot = xzNormal.dot(cameraDirection);
  xzGrid.visible = xzDot <= 0;

  // YZ 平面网格（法线向量 (1, 0, 0)）
  const yzNormal = new THREE.Vector3(1, 0, 0);
  const yzDot = yzNormal.dot(cameraDirection);
  yzGrid.visible = yzDot <= 0;

  // XY 平面网格（法线向量 (0, 0, 1)）
  const xyNormalOpposite = new THREE.Vector3(0, 0, -1);
  const xyDotOpposite = xyNormalOpposite.dot(cameraDirection);
  xyGridOpposite.visible = xyDotOpposite <= 0;

  // XZ 平面网格（法线向量 (0, 1, 0)）
  const xzNormalOpposite = new THREE.Vector3(0, -1, 0);
  const xzDotOpposite = xzNormalOpposite.dot(cameraDirection);
  xzGridOpposite.visible = xzDotOpposite <= 0;

  // YZ 平面网格（法线向量 (1, 0, 0)）
  const yzNormalOpposite = new THREE.Vector3(-1, 0, 0);
  const yzDotOpposite = yzNormalOpposite.dot(cameraDirection);
  yzGridOpposite.visible = yzDotOpposite <= 0;
}


watch(
  () => aPane.value,
  (aPane) => {
    const aChecked = aPane.find(o => 'Input' === o.title).folders.map(o => filterCheckedNodes(o)).flat();
    // 清空 Group
    while (0 < linesGroup.children.length) {
      linesGroup.remove(linesGroup.children[0]);
    }

    // 添加新线段
    aChecked.forEach(oNode => {
      // if (!(2 <= oNode.points?.length)) {
      //   console.warn(`节点 ${oNode.id} 的 points 数组长度小于 2，无法绘制线段或者points不存在`);
      //   return;
      // }
      // for (let i = 0; i < oNode.points.length - 1; i += 2) {
      //   const points = [
      //     new THREE.Vector3(...oNode.points[i]),
      //     new THREE.Vector3(...oNode.points[i + 1])
      //   ];
      //   const geometry = new THREE.BufferGeometry().setFromPoints(points);
      //   const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
      //   const line = new THREE.Line(geometry, material);
      //   linesGroup.add(line);
      // }
      switch (oNode.type) {
        case 'Well tops':
          oNode.array.filter(a => oNode.id === a[6]).forEach(a => {
            // 1. 创建球体几何体
            const geometry = new THREE.SphereGeometry(1, 32, 32); // (半径, 宽度分段, 高度分段)

            // 2. 创建球体材质（例如红色）
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // 基础材质（不光照）

            // 3. 创建球体网格（Mesh）
            const sphere = new THREE.Mesh(geometry, material);

            // 4. 设置球体的位置（xyz）
            sphere.position.set(Number(a[0]), Number(a[1]), Number(a[2])); // 根据实际需要设置位置
            
            // 5. 添加到场景或某个 Group 中
            linesGroup.add(sphere); // 假设 linesGroup 是一个 THREE.Group
            camera.position.set(Number(a[0]), Number(a[1]), Number(a[2]) + 5);
          })
          break;

        default:
          break;
      }
    });
  },
  { immediate: true, deep: true }
);

onMounted(() => {
  const { clientWidth: w, clientHeight: h } = refContainer.value
  refContainer.value.appendChild(renderer.domElement);
  refContainer.value.appendChild(labelRenderer.domElement);

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  // 开始观察 div
  resizeObserver.observe(refContainer.value);
})

// 组件卸载时停止观察（避免内存泄漏）
onUnmounted(() => {
  resizeObserver.disconnect();
  // 3. 释放其他 Three.js 资源（可选，如果这些是组件内创建的）
  if (renderer) {
    renderer.dispose(); // 释放 WebGLRenderer 资源
    const gl = renderer.getContext();
    if (gl && gl.getExtension('WEBGL_lose_context')) {
      gl.getExtension('WEBGL_lose_context').loseContext(); // 显式通知浏览器释放上下文
    }
    renderer.domElement.remove(); // 从 DOM 中移除 canvas
  }
});
</script>

<style scoped lang="scss">
.container {
  height: 100%;
  background: url('@/assets/image/bg-3d.png') center no-repeat #676768;
}
</style>