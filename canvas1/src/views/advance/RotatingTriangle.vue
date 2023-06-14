<template>
  <div class="canvas-rotating-triangle">
    <button type="button" class="up" @click="changeDirection('up')">up</button>
    <button type="button" class="down" @click="changeDirection('down')">down</button>
    <canvas id="rotating-triangle" height="600" width="600"></canvas>
  </div>
</template>

<script>
// 旋转动画
import { getWebGLContext, initShaders } from '@lib/cuon-utils';
import Matrix4 from '@lib/cuon-matrix';

export default {
  data(){
    return {
      startTime: Date.now(),
      gl_last: Date.now(), // 记录上一次调用绘制三角形的时间
      ANGLE_STEP: 45.0, // 旋转速度 每秒旋转45度
      currentAngle: 0.0, // 三角形当前旋转角度
      count: 0, // 记录动画时长
      Ty: 0, // y轴平移方向
      direction: '',
    }
  },
  mounted() {
    this.paintHandle();
  },
  updated() {
    console.log('456', this.Ty)
    
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
      gl.uniform4f(u_FragColor, 0.3, 0.5, 0.0, 1.0);

      gl.clearColor(0.0, 0.3, 0.3, 1.0);

      let  u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');

      this.tick(gl, u_xformMatrix, n, Matrix4, this.Ty);
    },
    initVertexBuffer(gl) {
      let n = 3;
      let vertices = new Float32Array(6);
      vertices.set([
          0.0, 0.5,
          -0.5, -0.5,
          0.5, -0.5,
      ]);

      let vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      
      let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
      // 告诉显卡重当前绑定的缓冲区中读取顶点数据
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
      return n;
    },
    drawHandle(gl, u_xformMatrix, n, angle, matrix_model,Ty) {
      // 设置旋转矩阵
      Matrix4.setRotate(angle, 0, 0, 1);
      Matrix4.translate(0.3, Ty, 0);
      // 将旋转矩阵传输给顶点着色器
      gl.uniformMatrix4fv(u_xformMatrix, false, matrix_model.elements);
      // 清除canvas
      gl.clear(gl.COLOR_BUFFER_BIT);
      // 绘制三角形
      gl.drawArrays(gl.TRIANGLES, 0, n);
    },
    animateHandle(angle){
      // 计算距离上次调用经过多长的时间
      let now = Date.now();
      let elapsed = now - this.gl_last; // 毫秒
      this.gl_last = now;
      // 根据距离上一次调用的时间， 更新当前旋转角度
      let newAngle = angle + (this.ANGLE_STEP * elapsed) / 1000;

      return newAngle %= 360; // 取余数
    },
    tick(gl, u_xformMatrix, n, matrix_model, Ty) {
      if (this.gl_last - this.startTime < 60000) {
        this.currentAngle = this.animateHandle(this.currentAngle); // 更新旋转角度
        this.drawHandle(gl, u_xformMatrix, n, this.currentAngle, matrix_model, Ty);
        
        // 告诉浏览器执行一个动画，并且要求浏览器在下次重绘之前调用制定的回调函数更新动画
        requestAnimationFrame(() => {
          this.tick(gl, u_xformMatrix, n, matrix_model, Ty);
        }); 
      } else {
        // 停止动画
        window.cancelAnimationFrame(this.tick);
      }
    },
    changeDirection(direction) {
      if (this.direction !== direction) {
        this.direction = direction;
      }
      if (direction === 'up') {
        this.Ty += 0.1;
      } else if (direction === 'down') {
        this.Ty -= 0.1;
      }
      console.log('34234--', this.Ty)
    },
  }
}
</script>
