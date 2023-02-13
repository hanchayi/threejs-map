<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { Map, MapOptions } from '@hanchayi/map'
import groundUrl from './ground.png';
import mapUrl from './map.png';

const canvas = ref<HTMLCanvasElement | null>(null)
const width = ref(800);
const height = ref(600);
const adcode = ref(320600);
const borderColor = ref('#2d8cf0');
let map: Map

const options = computed<MapOptions>(() => {
  return {
    groundUrl,
    mapUrl,
    debug: true,
    width: width.value,
    height: height.value,
    camera: [0, -3, 3],
    depth: 0.5,
    adcode: adcode.value
  }
})

function fresh() {
  map.changeOptions(options.value)
}

onMounted(() => {
  nextTick(() => {
    if (canvas.value) {
      map = new Map(canvas.value, options.value)
    }
  })
})
</script>

<template>
  <div>
    <div>
      地区<select v-model="adcode" @change="fresh">
          <option :value="320000">江苏</option>
          <option :value="320600">南通</option>
        </select>
      边框颜色<input v-model="borderColor" @change="fresh"/>
    </div>
    <canvas ref="canvas" :width="width * 2" :height="height * 2" :style="`width: ${width}px; height: ${height}px;`"/>
  </div>

</template>

<style scoped>
</style>
