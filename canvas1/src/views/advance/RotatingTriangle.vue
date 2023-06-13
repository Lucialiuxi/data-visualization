<template>
  <div class="canvas-rotating-triangle">
    <canvas id="rotating-triangle" height="600" width="600"></canvas>
  </div>
</template>

<script>
// 旋转动画
import { getWebGLContext, initShaders } from '@lib/cuon-utils';
import Matrix4 from '@lib/cuon-matrix';

export default {
  mounted() {
    this.paintHandle();
  },
  methods: {
    paintHandle() {
      // 顶点着色器
      let VSHADER_SOURCE =  `
        attribute vec4 a_Position;
        uniform mat4 u_xformMatrix;
        void main() {
          gl_Position = a_Position * u_xformMatrix;
        }
      `;
      // 片元着色器
      let FHSHADER_SOURCE = `
        precision mediump float;
        uniform vec4 u_FragColor;
        void main() {
          gl_FragColor = u_FragColor;
        }
      `;

      let canvas = document.getElementById('rotating-triangle');
      let gl = getWebGLContext(canvas);

      if(!gl) {
        console.error('获取webGl上下文失败');
        return;
      }

      if (!initShaders(gl, VSHADER_SOURCE, FHSHADER_SOURCE)) {
        console.error('着色器初始化失败');
        return;
      }

      let n = this.initVertexBuffer(gl);
      if (n < 0) {
        console.error('创建顶点缓冲对象失败');
        return;
      }

      let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
      gl.uniform4f(u_FragColor, 0.5, 0.0, 0.0, 1.0);

      gl.clearColor(0.0, 0.3, 0.1, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.drawArrays(gl.TRIANGLES, 0, n);
    },
    initVertexBuffer(gl) {
      let n = 3;
      let vertices = new Float32Array(6);
      vertices.set([
          0.0, 0.5,
          0.5, 0.0,
          -0.5, 0.0,
      ]);

      let vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      
      let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
      // 告诉显卡重当前绑定的缓冲区中读取顶点数据
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
      
      Matrix4.setTranslate(0.2, 0.1, 0);
      let  u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
      gl.uniformMatrix4fv(u_xformMatrix, false, Matrix4.elements);
      return n;
    }
  }
}
</script>
