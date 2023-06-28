<template>
    <div class="canvas-hello-triangle-matrix">
      <canvas height="600" width="400" id="rotated-triangle-matrix"></canvas>
    </div>
  </template>
  
  <script>
  // 旋转矩阵 -使用函数库 Matrix4已经在html全局引入了
  import { getWebGLContext, initShaders } from '@lib/cuon-utils';
 import Matrix4 from '@lib/cuon-matrix';
const Matrix = new Matrix4();

  export default {
      mounted() {
          this.initHandle();
      },
      methods: {
          initHandle(){
              let VSHADER_SOURCE = `
                  attribute vec4 a_Position;
                  uniform mat4 u_xformMatrix;
                  
                  void main() {
                      gl_Position = u_xformMatrix * a_Position;
                  }
              `;
              let FSHADER_SOURCE = `
                  precision mediump float;
                  uniform vec4 u_FragColor;
                  void main() {
                      gl_FragColor = u_FragColor;
                  }
              `;
              
              let canvas = document.getElementById('rotated-triangle-matrix');
              // 获取webGL上下文
              let gl = getWebGLContext(canvas);
              if(!gl) {
                  console.error('获取webGl上下文失败');
                  return;
              }
              // 初始化着色器
              if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)){
                  console.error('着色器初始化失败');
                  return;
              }
  
              // 初始化缓冲区对象设置定点
              let n = this.initVertexBuffer(gl);
              if (n < 0) {
                  console.error('设置顶点位置失败')
              }
  
              // 旋转角度
              const ANGLE = 60.0;
              Matrix.setRotate(ANGLE, 0, 0, 1);

              let u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
              gl.uniformMatrix4fv(u_xformMatrix, false, Matrix.elements);
  
              // 设置canvas画布背景色
              gl.clearColor(0.2, 0.1, 0.3, 1.0);
              // 把指定的缓冲区清空为预设的值
              gl.clear(gl.COLOR_BUFFER_BIT);
              gl.drawArrays(gl.TRIANGLES, 0, n);
          },
          // 创建缓冲区对象&设置顶点位置
          initVertexBuffer(gl) {
              // 顶点位置
              let vertices = new Float32Array(6); // 6 为TypeArray的length
            // vertices.set(array, targetOffset) targetOffset下标
              vertices.set([
                0.0, 0.5, 
                -0.5, -0.5, 
                0.5, 0.5
            ], 0);
              // 顶点个数
              let n = 3;
              
              // 创建缓冲区对象
              let vertexBuffer = gl.createBuffer();
              if (!vertexBuffer) {
                  console.error('创建缓冲区对象失败');
                  return -1;
              }
  
              // 绑定缓冲区对象
              gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  
              // 将数据写入缓冲区对象
              gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
              // 获取attribute变量下标
              let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
              /**
               * 告诉显卡重当前绑定的缓冲区中读取定点数据
               * gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
               * index: 下标
               * size: 坐标参数的个数
               * type: 指定数组中每个元素的数据类型
               * normalized: 当转换为浮点数时是否将整数数值归一到特定范围
               * stride: 一以字节为单位指定连续顶点属性开始之间的偏移量（即数据中一行的长度）
               * offset: 指定顶点属性数组中第一部分的字节偏移量
               * 
               */
              gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  
              let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
              gl.uniform4f(u_FragColor, 0.0, 1.0, 1.0, 1.0);
  
              // 开启attribute变量
              gl.enableVertexAttribArray(a_Position);
  
              return n;
          },
      }
  }
  </script>