<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import ThreeJSMap from 'threejs-map'
import { ThreeJSMapOptions } from 'threejs-map/intefaces';
import nantong from './nantong.json';

const canvas = ref<HTMLCanvasElement | null>(null)
const width = ref(800);
const height = ref(600);
const borderWidth = ref(1);
const borderColor = ref('#2d8cf0');
const textColor = ref('#fff');
const fillColor = ref('#fff');
const hoverColor = ref('yellow');
const backgroundColor = ref('#fff');
// china [104.0, 37.5] nantong [120.864608, 32.016212]
const center = [120.864608, 32.016212]
let map: ThreeJSMap

const options = computed<ThreeJSMapOptions>(() => {
  return {
    width: width.value,
    height: height.value,
    mapColor: 'red',
    sideColor: 'green',
    hoverColor: 'yellow',
    center,
    camera: [0, -3, 3],
    depth: 0.5,
    geojson: nantong as any,
    borderWidth: borderWidth.value,
    borderColor: borderColor.value,
    textColor: textColor.value,
    fillColor: fillColor.value,
    backgroundColor: backgroundColor.value
  }
})

function fresh() {
  map.changeOptions(options.value)
}

onMounted(() => {
  nextTick(() => {
    if (canvas.value) {
      map = new ThreeJSMap(canvas.value, options.value)
    }
  })
})
</script>

<template>
  <div>
    <div>
      边框粗细<input v-model="borderWidth" @change="fresh"/>
      边框颜色<input v-model="borderColor" @change="fresh"/>
    </div>
    <canvas ref="canvas" :width="width * 2" :height="height * 2" :style="`width: ${width}px; height: ${height}px;`"/>
  </div>

</template>

<style scoped>
</style>
