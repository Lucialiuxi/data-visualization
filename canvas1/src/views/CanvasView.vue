<script lang="js">
import { getWebGLContext  } from '../../lib/cuon-utils.js';
export default {
  data(){
    return {
      n: 0,
      el: undefined
    };
  },
  mounted() {
      this.paint();
  },
  methods: {
    paint() {
        let canvas= document.getElementById('example');
        if (!canvas) {
          console.log("没有找到canvas");
          return;
        }
         /*
        // 获取回执二维图形的绘图上下文
        let ctx = canvas.getContext("2d");

        // 绘制蓝色矩形
        ctx.fillStyle = "rgba(0,0,255,1.0)"; // 设置填充颜色为蓝色
        ctx.fillRect(120, 0, 200, 80); // 使用填充颜色填充矩形 [距离左上角的x, 距离左上角的y, 长, 宽]
        */

        // 初始化WebGL 上下文
        const gl = canvas.getContext('webgl');
        if (!gl) {
          console.log('无法初始化WebGL， 你的浏览器、操作系统或者硬件可能不支持WebGL');
          return;
        }
        gl.clearColor(0, 0, 0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    },
    clear () {
      let canvas = document.getElementById('example');
      // 获取webgl绘图上下文
      let gl = getWebGLContext(canvas);
      if (!gl) {
        console.log('获取webgl渲染上下文失败');
        return;
      }

      // 指定绘图区域canvas的背景色
      // gl.clearColor(0, 0, 1.0, 1.0);
      gl.clearColor(0.0, 1.0, 0.0, 1.0);

      // 用上面指定的颜色清除缓冲区
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
  },
}

</script>

<template>
  <div class="canvas">
    <button @click="clear">清空canvas画布</button>
    <canvas id="example" width="400" height="400"></canvas>
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
