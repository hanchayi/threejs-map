<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import ThreeJSMap from 'threejs-map'

const canvas = ref<HTMLCanvasElement | null>(null)
const width = ref(1000)
const height = ref(800)

onMounted(() => {
  nextTick(() => {
    if (canvas.value) {
      const map = new ThreeJSMap(canvas.value, {
        width: width.value,
        height: height.value,
      })
    }
  })
})
</script>

<template>
  <canvas ref="canvas" :width="width" :height="height" />
</template>

<style scoped>
</style>
