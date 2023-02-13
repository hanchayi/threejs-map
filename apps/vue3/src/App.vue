<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { Map, MapOptions } from '@hanchayi/map'
import groundUrl from './ground.png';
import mapUrl from './map.png';

const canvas = ref<HTMLCanvasElement | null>(null)
const width = ref(800);
const height = ref(600);
const adcode = ref(320600);
const actives = ref([ 320602 ])
const lightIntensity = ref(1.8)
const cameraX = ref(0)
const cameraY = ref(-3)
const cameraZ = ref(3)
let map: Map

const options = computed<MapOptions>(() => {
  return {
    groundUrl,
    mapUrl,
    debug: true,
    width: width.value,
    height: height.value,
    cameraX: cameraX.value,
    cameraY: cameraY.value,
    cameraZ: cameraZ.value,
    depth: 0.5,
    adcode: adcode.value,
    actives: actives.value,
    lightIntensity: lightIntensity.value,
    onClick: (area) => {
      alert(`${JSON.stringify(area)} clicked`)
    }
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
      width<input type="number" v-model="width" @change="fresh"/>
      height<input type="number" v-model="height" @change="fresh"/>
      light intensity<input type="number" v-model="lightIntensity" @change="fresh"/>
      cameraX<input type="number" v-model="cameraX" @change="fresh"/>
      cameraY<input type="number" v-model="cameraY" @change="fresh"/>
      cameraZ<input type="number" v-model="cameraZ" @change="fresh"/>
      
    </div>
    <canvas ref="canvas" :width="width * 2" :height="height * 2" :style="`width: ${width}px; height: ${height}px;`"/>
  </div>

</template>

<style scoped>
</style>
