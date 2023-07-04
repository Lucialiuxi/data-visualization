<template>
    <div class="perspective-projection-view-wrap">
      <canvas id="perspective-projection-mvp-view" height="600" width="600"></canvas>
    </div>
  </template>
  
  <script>
  
  import { getWebGLContext, initShaders } from '@lib/cuon-utils';
  import Matrix4 from '@lib/cuon-matrix';
  
  /**
   * Matrix4.set(matrix)
   * 复制矩阵
   * 
   * 模型视图投影矩阵 = 投影矩阵 * 视图矩阵 * 模型矩阵
   */
  export default {
      mounted() {
          this.initCanvasHandle();
      },
      methods: {
          initCanvasHandle() {
              // 顶点着色器
              let VSHADER_SOURCE = `
                  precision mediump float;
  
                  attribute vec4 a_Position;
                  attribute vec4 a_Color;
  
                  varying vec4 v_Color;
  
                  uniform mat4 u_MvpMatrix; // 模型视图投影矩阵
  
                  void main() {
                      gl_Position = u_MvpMatrix * a_Position;
                      v_Color = a_Color;
                  }
              `;
  
              // 片元着色器
              let FSHADER_SOURCE = `
                  precision mediump float;
  
                  varying vec4 v_Color;
                  
                  void main() {
                      gl_FragColor = v_Color;
                  }
              `;
  
              let canvas = document.getElementById('perspective-projection-mvp-view');
              let gl = getWebGLContext(canvas);
  
              if (!gl) {
                  console.error('获取webGL上下文失败');
                  return;
              }
              if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
                  console.error('着色器初始化失败');
                  return;
              }
              
              let n = this.initVertexBuffer(gl);
              if(n < 0) {
                  console.error('顶点缓冲器创建失败');
                  return;
              }
              // 模型矩阵
              let modelMatrix = new Matrix4();
              // 视图矩阵
              let viewMatrix = new Matrix4();
              // 透视投影矩阵
              let perspectiveMatrix = new Matrix4();
              // 模型视图投影矩阵
              let mvpMatrix = new Matrix4();
  
              let u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  
              viewMatrix.setLookAt(
                  0, 0, 5, // 视点
                  0, 0, -100, // 目标点
                  0, 1, 0, // 上方向
              );
  
              perspectiveMatrix.setPerspective(
                  30, // 垂直视角
                  canvas.width/canvas.height, // aspect宽高比应与canvas的宽高比一直，才不会导致图片变形
                  1, // near
                  100, // far
              );
              
              gl.clearColor(0.1, 0.2, 0.4, 1.0);
              gl.clear(gl.COLOR_BUFFER_BIT);
              this.draw(gl, u_MvpMatrix, modelMatrix, mvpMatrix, perspectiveMatrix, viewMatrix,n, { x: -0.75, y: 0, z: 0 });
              this.draw(gl, u_MvpMatrix, modelMatrix, mvpMatrix, perspectiveMatrix, viewMatrix,n, { x: 0.75, y: 0, z: 0 });
          },
          initVertexBuffer(gl) {
              let trianglesCount  = 3;
              let n = trianglesCount * 3;
  
              let triangles = [
                  // 绿色三角形 在最前面
                  0.0, 1.0, -0.4, 0.4, 1.0, 0.4, // xyz rgb
                  -0.5, -1.0, -0.4, 0.4, 1.0, 0.4,
                  0.5, -1.0, -0.4, 1.0, 0.4, 0.4,
  
                  // 黄色三角形
                  0.0, 1.0, -0.2, 1.0, 1.0, 0.4,
                  -0.5, -1.0, -0.2, 1.0, 1.0, 0.4,
                  0.5, -1.0, -0.2, 1.0, 0.4, 0.4,
  
                  // 蓝色三角形在最前面
                  0.0, 1.0, 0.0, 0.4, 0.4, 1.0,
                  -0.5, -1.0, 0.0, 0.4, 0.4, 1.0,
                  0.5, -1.0, 0.0, 1.0, 0.4, 0.4,
              ];
              let vertices = new Float32Array([
                  ...triangles,
              ], 0, n * 6);
  
              let FSIZE = vertices.BYTES_PER_ELEMENT;
  
              let vertexBuffer = gl.createBuffer();
              gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
              gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
              let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
              gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
              gl.enableVertexAttribArray(a_Position);
  
  
              let a_Color = gl.getAttribLocation(gl.program, 'a_Color');
              gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
              gl.enableVertexAttribArray(a_Color);
              return n;
          },
          draw(gl, u_MvpMatrix, modelMatrix, mvpMatrix, perspectiveMatrix, viewMatrix,n, axis) {
              modelMatrix.setTranslate(axis.x, axis.y, axis.z);
              /**
               * 首先将模型视图投影矩阵mvpMatrix设为投影矩阵perspectiveMatrix
               * 再依次乘以视图矩阵viewMatrix和模型矩阵modelMatrix
               * 调用带有set前缀的方法，就是的矩阵相乘的结果又写入到mvpMatrix中
               * 接着 将mvpMatrix传给着色器的u_MvpMatrix，再进行绘制操作
               */
              mvpMatrix.set(perspectiveMatrix).multiply(viewMatrix).multiply(modelMatrix);
              gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
              gl.drawArrays(gl.TRIANGLES, 0, n);
          }
      }
  }
  </script>
  
  <style>
  
  </style>