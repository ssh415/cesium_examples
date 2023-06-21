<script setup>
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import {onMounted, onUnmounted, ref} from "vue";
import config from "../config/index.js";

const viewer = ref(null)
const alpha = ref(1) // alpha混合值 0-1
const nightAlpha = ref(1) // alpha混合值(夜晚) 0-1
const dayAlpha = ref(1) // alpha混合值（白天） 0-1
const brightness = ref(1) // 亮度 +-1
const hue = ref(0) // 色调 0-360
const contrast = ref(1) // 对比度 +-1
const saturation = ref(1) // 饱和度 +-1
const gamma = ref(1) // 伽马校正

const alpha_6 = ref(1) // alpha混合值 0-1
const nightAlpha_6 = ref(1) // alpha混合值(夜晚) 0-1
const dayAlpha_6 = ref(1) // alpha混合值（白天） 0-1
const brightness_6 = ref(1) // 亮度 +-1
const hue_6 = ref(0) // 色调 0-360
const contrast_6 = ref(1) // 对比度 +-1
const saturation_6 = ref(1) // 饱和度 +-1
const gamma_6 = ref(1) // 伽马校正


function createModel(url = '/models/Cesium_Air.glb', height = 100000) {
  viewer.value.entities.removeAll();

  const position = Cesium.Cartesian3.fromDegrees(
      109.49087,
      20.5825,
      height
  );
  const heading = Cesium.Math.toRadians(135);
  const pitch = 0;
  const roll = 0;
  const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(
      position,
      hpr
  );

  const entity = viewer.value.entities.add({
    name: url,
    position: position,
    orientation: orientation,
    model: {
      uri: url,
      minimumPixelSize: 128,
      maximumScale: 20000,
    },
  });
  viewer.value.trackedEntity = entity;
}

function getCameraPosition(viewer) {
  const canvas = viewer.scene.canvas
  const center = new Cesium.Cartesian3(canvas.clientWidth / 2, canvas.clientHeight / 2)
  const ellipsoid = viewer.scene.globe.ellipsoid
  const cartesian = viewer.camera.pickEllipsoid(center, ellipsoid)
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
  const longitude = Cesium.Math.toDegrees(cartographic.longitude)
  const latitude = Cesium.Math.toDegrees(cartographic.latitude)
  const height = viewer.camera.positionCartographic.height
  return {longitude, latitude, height}
}

function changeMapScene(viewer, to2d) {
  if (to2d) {
    const {longitude, latitude, height} = getCameraPosition(viewer)
    viewer.scene.morphTo2D(0)
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
    })
  } else {
    viewer.scene.morphTo3D(0)
  }
}

function add3dTiles() {
  changeSwitch(4)
  const tileSetModel = new Cesium.Cesium3DTileset({
    url: '/保利b3dm/tileset.json',
    // url: '/mars3d-max-shihua-3dtiles/tileset.json',
    // 控制切片视角显示的数量，可调整性能
    maximumScreenSpaceError: 2,
    maximumNumberOfLoadedTiles: 100000,
  })
  // viewer.value.scene.primitives.add(tileSetModel)
  // 控制模型的位置
  tileSetModel.readyPromise.then(function (tileSet) {
    viewer.value.scene.primitives.add(tileSet);
    const heightOffset = -80.0; // 可以改变3Dtiles的高度
    const boundingSphere = tileSet.boundingSphere;
    const cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
    const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
    const offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
    const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
    tileSet.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
    viewer.value.zoomTo(tileSet, new Cesium.HeadingPitchRange(0.5, -0.2, tileSet.boundingSphere.radius));
  });
  //定位到三维模型
  // viewer.value.zoomTo(tileSetModel)
}

function addBaseMaps() {
  for (const key in config.baseMap) {
    const item = config.baseMap[key]
    const provider = new Cesium.UrlTemplateImageryProvider({
      maximumLevel: 20,
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      url: item.url,
    })
    const imageryLayer = viewer.value.imageryLayers.addImageryProvider(provider, item.index)
    imageryLayer.show = false
    // imageryLayer.hue = 4; // 图层色调
    // imageryLayer.contrast = -1.2; // 图层对比度
  }
}

function addArcgisMapServer() {
  // arcgis map server
  const esri = new Cesium.ArcGisMapServerImageryProvider({
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
  })
  viewer.value.imageryLayers.addImageryProvider(esri)
}

const initViewer = () => {
  viewer.value = new Cesium.Viewer('cesiumContainer', {
    shouldAnimate: true,
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false,
    sceneMode: Cesium.SceneMode.SCENE2D,
    // scene3DOnly: false,
    // imageryProvider: imgLayer,
  })

  viewer.value.scene.screenSpaceCameraController.tiltEventTypes = [Cesium.CameraEventType.PINCH, Cesium.CameraEventType.RIGHT_DRAG]
  viewer.value.scene.screenSpaceCameraController.zoomEventTypes = [Cesium.CameraEventType.PINCH, Cesium.CameraEventType.WHEEL]

  addBaseMaps()
  viewer.value.imageryLayers.get(5).show = true
  viewer.value.imageryLayers.get(6).show = true

  // console.log(viewer.value.imageryLayers)

  // 改善实体的文字和图片清晰度
  viewer.value.scene.fxaa = false;
  // 降低性能提供图片质量
  viewer.value.scene.globe.maximumScreenSpaceError = 1.9;
  // 改变地图灰度系数
  const layer0 = viewer.value.scene.imageryLayers.get(0);
  layer0.gamma = 0.66;
  // 调整瓦片数据的结构
  layer0.minificationFilter = Cesium.TextureMinificationFilter.NEAREST;
  layer0.magnificationFilter = Cesium.TextureMagnificationFilter.NEAREST;

  viewer.value.cesiumWidget.creditContainer.style.display = "none";

  viewer.value.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(109.49087, 22.5825, 200000),
    orientation: {
      heading: 0,
      pitch: -0.8,
      roll: 0.000022,
    }
  })

  // createModel('/models/Cesium_Air.glb', 100000)

  console.log('=======viewer init==========')
}

function hideAllImageryLayers() {
  viewer.value.imageryLayers.get(1).show = false
  viewer.value.imageryLayers.get(2).show = false
  viewer.value.imageryLayers.get(3).show = false
  viewer.value.imageryLayers.get(4).show = false
  viewer.value.imageryLayers.get(5).show = false
  viewer.value.imageryLayers.get(6).show = false
}

const changeSwitch = (type) => {
  // 矢量 vec_w,cva_w
  // 地形 ter_w,cta_w
  // 2d影像 img_w,cia_w
  // 3d影像 img_w,cia_w
  switch (type) {
    case 1:
      hideAllImageryLayers()
      viewer.value.imageryLayers.get(5).show = true
      viewer.value.imageryLayers.get(6).show = true
      changeMapScene(viewer.value, true)
      console.log(viewer.value.imageryLayers)
      break
    case 2:
      hideAllImageryLayers()
      viewer.value.imageryLayers.get(3).show = true
      viewer.value.imageryLayers.get(4).show = true
      changeMapScene(viewer.value, true)
      break
    case 3:
      hideAllImageryLayers()
      viewer.value.imageryLayers.get(1).show = true
      viewer.value.imageryLayers.get(2).show = true
      changeMapScene(viewer.value, true)
      break
    case 4:
      hideAllImageryLayers()
      viewer.value.imageryLayers.get(1).show = true
      viewer.value.imageryLayers.get(2).show = true
      changeMapScene(viewer.value, false)
      break
    case 5:
      hideAllImageryLayers()
      addArcgisMapServer()
      changeMapScene(viewer.value, false)
      break
  }

}

const onValueChange = (val, prop, layerIndex = 5) => {
  viewer.value.imageryLayers.get(layerIndex)[prop] = val
}

const destroyViewer = () => {
  if (viewer.value) {
    viewer.value.destroy()
    viewer.value = null
    console.log('=====viewer destroy==========')
  }
}

onMounted(() => {
  initViewer()
})

onUnmounted(() => {
  destroyViewer()
})
</script>

<template>
  <div class="viewer" id="cesiumContainer">
    <div class="basemap-switch">
      <div class="item" @click="changeSwitch(1)">矢量地图</div>
      <div class="item" @click="changeSwitch(2)">地形地图</div>
      <div class="item" @click="changeSwitch(3)">2D影像</div>
      <div class="item" @click="changeSwitch(4)">3D影像</div>
      <div class="item" @click="changeSwitch(5)">Arcgis底图</div>
      <div class="item" @click="add3dTiles">加载3DTiles</div>
      <!--      <div class="item"  @click="createModel">加载模型</div>-->
    </div>
    <div class="top-div">
      <div class="item">
        <span class="label">色调</span>
        <el-slider v-model="hue" :min="0" :max="360" :step="0.1" show-input size="small"
                   @change="(val) => { onValueChange(val, 'hue') }"/>
      </div>
      <div class="item">
        <span class="label">对比度</span>
        <el-slider v-model="contrast" :min="-100" :max="100" :step="0.1" show-input size="small"
                   @change="(val) => { onValueChange(val, 'contrast') }"/>
      </div>
      <div class="item">
        <span class="label">饱和度</span>
        <el-slider v-model="saturation" :min="-100" :max="100" :step="0.1" show-input size="small"
                   @change="(val) => { onValueChange(val, 'saturation') }"/>
      </div>
      <div class="item">
        <span class="label">alpha混合值</span>
        <el-slider v-model="alpha" :min="0" :max="1" :step="0.1" show-input size="small"
                   @change="(val) => { onValueChange(val, 'alpha') }"/>
      </div>
      <div class="item">
        <span class="label">alpha混合值(N)</span>
        <el-slider v-model="nightAlpha" :min="0" :max="1" :step="0.1" show-input size="small"
                   @change="(val) => { onValueChange(val, 'nightAlpha') }"/>
      </div>
      <div class="item">
        <span class="label">alpha混合值(D)</span>
        <el-slider v-model="dayAlpha" :min="0" :max="1" :step="0.1" show-input size="small"
                   @change="(val) => { onValueChange(val, 'dayAlpha') }"/>
      </div>
      <div class="item">
        <span class="label">亮度</span>
        <el-slider v-model="brightness" :min="-100" :max="100" :step="0.1" show-input size="small"
                   @change="(val) => { onValueChange(val, 'brightness') }"/>
      </div>
      <div class="item">
        <span class="label">伽马校正</span>
        <el-slider v-model="gamma" :min="-100" :max="100" :step="0.1" show-input size="small"
                   @change="(val) => { onValueChange(val, 'gamma') }"/>
      </div>
    </div>
    <div class="top-div" style="left: 400px">
      <div class="item">
        <span class="label">色调</span>
        <el-slider v-model="hue_6" :min="0" :max="360" :step="0.1" show-input size="small"
                   @change="(val) => { onValueChange(val, 'hue', 6) }"/>
      </div>
      <div class="item">
        <span class="label">对比度</span>
        <el-slider v-model="contrast_6" :min="-100" :max="100" :step="0.1" show-input size="small"
                   @change="(val) => { onValueChange(val, 'contrast', 6) }"/>
      </div>
      <div class="item">
        <span class="label">饱和度</span>
        <el-slider v-model="saturation_6" :min="-100" :max="100" :step="0.1" show-input size="small"
                   @change="(val) => { onValueChange(val, 'saturation', 6) }"/>
      </div>
      <div class="item">
        <span class="label">alpha混合值</span>
        <el-slider v-model="alpha_6" :min="0" :max="1" :step="0.1" show-input size="small"
                   @change="(val) => { onValueChange(val, 'alpha', 6) }"/>
      </div>
      <div class="item">
        <span class="label">alpha混合值(N)</span>
        <el-slider v-model="nightAlpha_6" :min="0" :max="1" :step="0.1" show-input size="small"
                   @change="(val) => { onValueChange(val, 'nightAlpha', 6) }"/>
      </div>
      <div class="item">
        <span class="label">alpha混合值(D)</span>
        <el-slider v-model="dayAlpha_6" :min="0" :max="1" :step="0.1" show-input size="small"
                   @change="(val) => { onValueChange(val, 'dayAlpha', 6) }"/>
      </div>
      <div class="item">
        <span class="label">亮度</span>
        <el-slider v-model="brightness_6" :min="-100" :max="100" :step="0.1" show-input size="small"
                   @change="(val) => { onValueChange(val, 'brightness', 6) }"/>
      </div>
      <div class="item">
        <span class="label">伽马校正</span>
        <el-slider v-model="gamma_6" :min="-100" :max="100" :step="0.1" show-input size="small"
                   @change="(val) => { onValueChange(val, 'gamma', 6) }"/>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.viewer {
  width: 100%;
  height: 100%;
  position: relative;

  .basemap-switch {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1;
    color: #fff;

    .item {
      padding: 4px;
      margin-top: 8px;
      cursor: pointer;
      background: #646cff;
      border-radius: 4px;
      text-align: center;
    }
  }

  .top-div {
    position: absolute;
    top: 10px;
    left: 20px;
    z-index: 1;
    color: white;
    background: rgba(0, 0, 0, 0.5);
    font-size: 12px;
    padding: 8px;

    .item {
      display: flex;
      align-items: center;
      width: 340px;
      height: 40px;
      line-height: 40px;
      margin-left: 10px;

      .label {
        width: 130px;
      }

      :deep(.el-slider__input) {
        width: 100px;
      }
    }
  }
}
</style>
