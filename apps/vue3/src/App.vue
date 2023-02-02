<script setup lang="ts">
import { ref } from 'vue'
import ThreeJSMap from 'threejs-map'

const canvas = ref<HTMLCanvasElement | null>(null)

if (canvas.value) {
  const map = new ThreeJSMap(canvas.value)
  map.render()
}
</script>

<template>
  <canvas ref="canvas"/>
</template>

<style scoped>
</style>
