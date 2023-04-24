<script setup lang="ts">
import { onMounted, ref } from "vue";

const el = ref();

onMounted(() => {
  let canvas = el.value;
  if (!canvas) {
    console.log("没有找到canvas");
    return false;
  }

  // 获取回执二维图形的绘图上下文
  let ctx = canvas.getContext("2d");

  // 绘制蓝色矩形
  ctx.fillStyle = "rgba(0,0,255,1.0)"; // 设置填充颜色为蓝色
  ctx.fillRect(12, 10, 1000, 1500, 150); // 使用填充颜色填充矩形
});
</script>

<template>
  <div class="canvas">
    <h1>This is an about page</h1>
    <canvas id="example" width="400" height="400" ref="el"></canvas>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .canvas {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
