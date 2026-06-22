<template>
  <div id="SpatialGridLines">
    <!-- Three.js场景容器 -->
    <ThreeFrame ref="ThreeFrame" />
  </div>
</template>

<script>
import * as THREE from 'three'; // 导入Three.js库
import { markRaw } from 'vue'; // 导入Vue的markRaw函数，用于防止响应式代理
import ThreeFrame from '@/components/threeTool/threeFrame/ThreeFrame.vue'; // 导入Three.js场景框架组件
import ThreeDGridRuler from '@/components/threeTool/threeFrame/components/function/ThreeDGridRuler.js'; // 导入3D网格标尺系统

export default {
  name: 'SpatialGridLinesTest', // 组件名称
  components: {
    ThreeFrame // 注册子组件
  },
  data() {
    return {
      isTurnOn: true
    }
  },
  mounted() {
    this.initScene(); // 组件挂载后初始化场景
  },
  beforeUnmount() {
    this.ThreeDGridRuler?.dispose() // 组件卸载前清理网格标尺资源
  },
  methods: {
    /**
     * 初始化Three.js场景
     */
    initScene() {
      // 从ThreeFrame组件获取Three.js核心对象
      const { scene, camera, controls } = this.$refs.ThreeFrame.getThreeObject();
      // 使用markRaw防止Vue对这些对象进行响应式代理
      this.scene = markRaw(scene);
      this.camera = markRaw(camera);
      this.controls = markRaw(controls);

      // 初始化3D网格标尺系统
      this.ThreeDGridRuler = new ThreeDGridRuler(
        scene,
        camera,
        controls,
        '#ffffff'
      );
    },

    renderInput() {
      // 计算包围盒并重置相机和灯光
      const { size, center } = this.createBoundingBox(randomCubeGroup);
      this.$refs.ThreeFrame.resetCameraAndLight(size, center);
      // 设定包围盒和包围盒中心
      this.ThreeDGridRuler.setGridLines(size, center)
    }

    /**
     * 开关（ 隐藏或显示 不销毁或创建
     */
    turnOnOff() {
      this.isTurnOn = !this.isTurnOn
      this.ThreeDGridRuler.show(this.isTurnOn)
    },

    /**
     * 改变立方体群的缩放比例
     */
    changeScale() {
      // 获取场景中的立方体群组
      let randomCubeGroup = this.scene.getObjectByName("randomCubeGroup");
      // 随机设置Y轴缩放
      randomCubeGroup.scale.set(1, Math.random(), 1)

      // 重新计算包围盒并重置相机
      const { size, center } = this.createBoundingBox(randomCubeGroup);
      this.$refs.ThreeFrame.resetCameraAndLight(size, center);

      // 重置网格标尺
      this.ThreeDGridRuler.setGridLines(size, center)
    },

    /**
     * 改变立方体群的位置
     */
    changePositions() {
      let randomCubeGroup = this.scene.getObjectByName("randomCubeGroup");

      // 生成随机Y轴位置
      let randomRangesStr = Math.random() * 100
      let randomRanges = Number(randomRangesStr.toFixed(0))
      randomCubeGroup.position.set(0, -randomRanges, 0)

      // 重新计算包围盒并重置相机
      const { size, center } = this.createBoundingBox(randomCubeGroup);
      this.$refs.ThreeFrame.resetCameraAndLight(size, center);

      // 重置网格标尺
      this.ThreeDGridRuler.setGridLines(size, center)
    },

    /**
     * 改变立方体群的分布范围
     */
    changeRange() {
      let randomCubeGroup = this.scene.getObjectByName("randomCubeGroup");
      // 先释放现有群组的资源
      if (randomCubeGroup) {
        // 1. 递归释放所有子对象的几何体和材质
        randomCubeGroup.traverse((child) => {
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

        // 2. 从场景中移除组
        this.scene.remove(randomCubeGroup);

        // 3. 清除引用
        randomCubeGroup = null;
      }

      // 生成新的随机范围
      let randomRangesStr = Math.random() * 1000
      let randomRanges = Number(randomRangesStr.toFixed(0))

      // 创建新的立方体群组并添加到场景
      randomCubeGroup = this.createBasicObjects(randomRanges);
      this.scene.add(randomCubeGroup)

      // 重新计算包围盒并重置相机
      const { size, center } = this.createBoundingBox(randomCubeGroup);
      this.$refs.ThreeFrame.resetCameraAndLight(size, center);

      // 重置网格标尺
      this.ThreeDGridRuler.setGridLines(size, center)
    },

    /**
     * 创建包围盒并计算尺寸和中心
     * @param {THREE.Object3D} ThreeObject - 要计算包围盒的3D对象
     * @returns {Object} 包含size和center的对象
     */
    createBoundingBox(ThreeObject) {
      const box = new THREE.Box3().setFromObject(ThreeObject); // 创建包围盒
      const size = box.getSize(new THREE.Vector3()); // 获取尺寸
      const center = box.getCenter(new THREE.Vector3()); // 获取中心点
      return { size, center };
    },

    /**
     * 创建基础立方体群组
     * @param {number} ranges - 立方体分布的范围，默认为100
     * @returns {THREE.Group} 包含随机立方体的群组
     */
    createBasicObjects(ranges = 100) {
      // 创建立方体几何体和材质
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshStandardMaterial({
        color: 0x00ff00, // 绿色
        metalness: 0.9, // 金属质感
        roughness: 0.1 // 光滑度
      });

      // 创建群组
      let randomCubeGroup = new THREE.Group()
      randomCubeGroup.name = 'randomCubeGroup' // 设置名称便于查找

      let range = ranges
      // 创建100个随机立方体
      for (let i = 0; i < 100; i++) {
        const cube = new THREE.Mesh(geometry, material);
        // 随机位置
        cube.position.set(
          (Math.random() - 0.5) * range,
          (Math.random() - 0.5) * range,
          (Math.random() - 0.5) * range
        );
        // 随机旋转
        cube.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        // 随机缩放
        const scale = 0.5 + Math.random() * 1.5;
        cube.scale.set(scale, scale, scale);
        randomCubeGroup.add(cube);
      }
      return randomCubeGroup
    }
  }
}
</script>

<style scoped>
/* 主容器样式 */
#SpatialGridLines {
  width: 100%;
  height: 100%;
  position: relative;
  /* 相对定位，便于子元素绝对定位 */
}

/* 底部按钮容器样式 */
.bottomBtnBox {
  position: absolute;
  /* 绝对定位 */
  left: 0;
  bottom: 20px;
  /* 距离底部20px */
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  /* 确保按钮显示在3D场景上方 */
}
</style>