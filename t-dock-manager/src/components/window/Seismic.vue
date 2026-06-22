<template>
  <div ref="refContainer" class="seismic-container"></div>
</template>

<script setup>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { toTrianglesDrawMode } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { onMounted, ref, watch, onUnmounted } from 'vue'
import useGeoMetaStore from "@/store/geometa";

const strGeoMeta = useGeoMetaStore();
const refContainer = ref(null)
const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  75,
  1,
  0.1,
  10000
)
const renderer = new THREE.WebGLRenderer({ antialias: true })

// 7. 响应窗口大小变化
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width: w, height: h } = entry.contentRect;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
});

const renderSeismic = () => {
  if (!refContainer.value || !(3 <= strGeoMeta.refSGY?.length)) return
  let linesGroup = scene.getObjectByName("linesGroup");
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
    scene.remove(linesGroup);
  }
  linesGroup = new THREE.Group();
  linesGroup.name = "linesGroup";
  scene.add(linesGroup);
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

watch(() => strGeoMeta.refSGY, renderSeismic, { immediate: true })

onMounted(() => {
  // 初始化场景
  scene.background = new THREE.Color(0x111111)

  // 初始化相机
  camera.position.set(0, 0, 5)

  // 初始化渲染器
  renderer.setSize(refContainer.value.clientWidth, refContainer.value.clientHeight)
  refContainer.value.appendChild(renderer.domElement)

  // 添加控制器
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  // 添加坐标轴辅助
  const axesHelper = new THREE.AxesHelper(3)
  scene.add(axesHelper)

  // 添加光源
  const ambientLight = new THREE.AmbientLight(0x404040)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
  directionalLight.position.set(1, 1, 1)
  scene.add(directionalLight)
  renderSeismic();
  // 动画循环
  const animate = () => {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

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

<style scoped>
.seismic-container {
  width: 100%;
  height: 100vh;
  position: relative;
}
</style>
