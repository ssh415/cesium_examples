<template>
  <div class="top-div">
    <div class="item">
      <span class="label">色调(hue)</span>
      <el-slider v-model="hue" :min="0" :max="360" :step="0.1" show-input size="small"
                 @change="(val) => { onValueChange() }"/>
    </div>
    <div class="item">
      <span class="label">对比度(contrast)</span>
      <el-slider v-model="contrast" :min="-100" :max="100" :step="0.1" show-input size="small"
                 @change="(val) => { onValueChange() }"/>
    </div>
    <div class="item">
      <span class="label">饱和度(saturation)</span>
      <el-slider v-model="saturation" :min="-100" :max="100" :step="0.1" show-input size="small"
                 @change="(val) => { onValueChange() }"/>
    </div>
    <div class="item">
      <span class="label">混合值(alpha)</span>
      <el-slider v-model="alpha" :min="0" :max="1" :step="0.1" show-input size="small"
                 @change="(val) => { onValueChange() }"/>
    </div>
    <div class="item">
      <span class="label">混合值(nightAlpha)</span>
      <el-slider v-model="nightAlpha" :min="0" :max="1" :step="0.1" show-input size="small"
                 @change="(val) => { onValueChange() }"/>
    </div>
    <div class="item">
      <span class="label">混合值(dayAlpha)</span>
      <el-slider v-model="dayAlpha" :min="0" :max="1" :step="0.1" show-input size="small"
                 @change="(val) => { onValueChange() }"/>
    </div>
    <div class="item">
      <span class="label">亮度(brightness)</span>
      <el-slider v-model="brightness" :min="-100" :max="100" :step="0.1" show-input size="small"
                 @change="(val) => { onValueChange() }"/>
    </div>
    <div class="item">
      <span class="label">伽马校正(gamma)</span>
      <el-slider v-model="gamma" :min="-100" :max="100" :step="0.1" show-input size="small"
                 @change="(val) => { onValueChange() }"/>
    </div>
    <div class="item">
      <span class="label">开启滤镜</span>
      <el-checkbox v-model="invertColor" style="margin-right: 10px" @change="(val) => { onValueChange() }" />
      <div>
        <span>滤镜颜色：</span>
        <el-color-picker :disabled="!invertColor" v-model="filterColor" @change="(val) => { onValueChange(val) }" />
      </div>
    </div>
    <div class="item">
      <el-button @click="reset">还原</el-button>
    </div>
  </div>
</template>

<script setup>
import {ref} from "vue";

const props = defineProps({
  layerIndex: {
    type: Number
  },
  defaultProps: {
    type: Object,
    default: {
      alpha: 1,
      nightAlpha: 1,
      dayAlpha: 1,
      brightness: 0.6,
      hue: 1,
      contrast: 1.8,
      saturation: 0,
      gamma: 0.3,
      // alpha: 1,
      // nightAlpha: 1,
      // dayAlpha: 1,
      // brightness: 1,
      // hue: 0,
      // contrast: 1,
      // saturation: 1,
      // gamma: 1,
      invertColor: false,
      filterColor: '#4e70a6',
    }
  }
})
const emit = defineEmits(['onValueChange', 'resetValue'])

const alpha = ref(props.defaultProps.alpha) // alpha混合值 0-1
const nightAlpha = ref(props.defaultProps.nightAlpha) // alpha混合值(夜晚) 0-1
const dayAlpha = ref(props.defaultProps.dayAlpha) // alpha混合值（白天） 0-1
const brightness = ref(props.defaultProps.brightness) // 亮度 +-1
const hue = ref(props.defaultProps.hue) // 色调 0-360
const contrast = ref(props.defaultProps.contrast) // 对比度 +-1
const saturation = ref(props.defaultProps.saturation) // 饱和度 +-1
const gamma = ref(props.defaultProps.gamma) // 伽马校正

const invertColor = ref(props.defaultProps.invertColor) // 是否开启滤镜
const filterColor = ref(props.defaultProps.filterColor) // 是否开启滤镜

const onValueChange = (filterColor = '#4e70a6') => {
  const values = {
    alpha: alpha.value,
    nightAlpha: nightAlpha.value,
    dayAlpha: dayAlpha.value,
    brightness: brightness.value,
    hue: hue.value,
    contrast: contrast.value,
    saturation: saturation.value,
    gamma: gamma.value,
  }
  emit('onValueChange', values, props.layerIndex, invertColor.value, filterColor)
}

const reset = () => {
  alpha.value = 1
  nightAlpha.value = 1
  dayAlpha.value = 1
  brightness.value = 1
  hue.value = 0
  contrast.value = 1
  saturation.value = 1
  gamma.value = 1

  emit('resetValue', props.layerIndex)
}
</script>

<style lang="less" scoped>
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
    width: 380px;
    height: 40px;
    line-height: 40px;
    margin-left: 10px;

    .label {
      width: 160px;
    }

    :deep(.el-slider__input) {
      width: 100px;
    }
  }
}
</style>
