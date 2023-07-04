<template>
    <div class="perspective-projection-view-wrap">
      <canvas id="perspective-projection-mvp-view" height="600" width="600"></canvas>
    </div>
  </template>
  
  <script>
  
  import { getWebGLContext, initShaders } from '@lib/cuon-utils';
  import Matrix4 from '@lib/cuon-matrix';
  
  /**
   * 在默认情况下，webGL为了加速绘图操作，是按照顶点在缓冲区的顺序来处理它们的
   * 按照缓冲区的顺序绘制图像，后绘制的图像覆盖先绘制的图像
   * 为了解决这个问题，webGL提供了 隐藏面消除 功能
   * 
   * 开启隐藏面消除功能：
   * 1.开启隐藏面消除功能 gl.enable(gl.DEPTH_TEST);
   * 2.在绘制之前，清除深度缓冲区 gl.clear(gl.DEPTH_BUFFER_BIT);
   * 
   * 隐藏面消除的前提：正确设置可视空间（正射投影 or 透视投影）。否则就可能产生错误的结果
   * 
   * gl.enable(cap)
   * 开启cap表示的功能 (capability)
   * cap:
   * gl.DEPTH_TEST 隐藏面消除
   * gl.BLEND 混合
   * gl.POLYGON_OFFSET_FILL 多边形位移
   * 
   * 模型视图投影矩阵 = 投影矩阵*视图矩阵*模型矩阵*顶点坐标
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
            // gl.clear(gl.COLOR_BUFFER_BIT); 

            // 开启隐藏面消除功能【注释这两行看绘图就能看出区别】
            gl.enable(gl.DEPTH_TEST);
            // 在绘制之前清除深度缓冲区【同时清除任意两个缓冲区时，都可以使用按位符|连接参数】
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT); 

            this.draw(gl, u_MvpMatrix, modelMatrix, mvpMatrix, perspectiveMatrix, viewMatrix,n, { x: -0.75, y: 0, z: 0 });
            this.draw(gl, u_MvpMatrix, modelMatrix, mvpMatrix, perspectiveMatrix, viewMatrix,n, { x: 0.75, y: 0, z: 0 });
          },
          initVertexBuffer(gl) {
              let trianglesCount  = 3;
              let n = trianglesCount * 3;
            
              let vertices = new Float32Array([
                // 黄色三角形 在中间
                0.0, 1.0, -0.2, 1.0, 1.0, 0.4,
                -0.5, -1.0, -0.2, 1.0, 1.0, 0.4,
                0.5, -1.0, -0.2, 1.0, 0.4, 0.4,

                // 蓝色三角形在最前面
                0.0, 1.0, 0.0, 0.4, 0.4, 1.0,
                -0.5, -1.0, 0.0, 0.4, 0.4, 1.0,
                0.5, -1.0, 0.0, 1.0, 0.4, 0.4,

                // 绿色三角形 在最后面
                0.0, 1.0, -0.4, 0.4, 1.0, 0.4, // xyz rgb
                -0.5, -1.0, -0.4, 0.4, 1.0, 0.4,
                0.5, -1.0, -0.4, 1.0, 0.4, 0.4,
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