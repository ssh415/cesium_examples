<script setup>
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import {onMounted, onUnmounted, ref} from "vue";
import config from "../config/index.js";

const viewer = ref(null)

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
  }
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
  viewer.value.imageryLayers.get(1).show = true
  viewer.value.imageryLayers.get(2).show = true

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
  }

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
      <div class="item"  @click="changeSwitch(3)">2D影像</div>
      <div class="item"  @click="changeSwitch(4)">3D影像</div>
      <div class="item"  @click="add3dTiles">加载3DTiles</div>
<!--      <div class="item"  @click="createModel">加载模型</div>-->
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
}
</style>
