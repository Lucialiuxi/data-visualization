<template>
  <div class="colored-cube-wrap">
    <canvas id="colored-cube" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { getWebGLContext, initShaders } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';
/**
 * gl.drawElements(mode, count, type, offset);
 * 执行着色器，按照mode参数指定的方式，
 * 根据绑定到gl.ELEMENT_ARRAY_BUFFER的缓冲区的顶点索引值绘制图形
 * mode 制定绘制的方式：
 *  gl.POINTS 
 *  gl.LINES 
 *  gl.LINE_STRIP 
 *  gl.LINE_LOOP
 *  gl.TRIANGLES
 *  gl.TRIANGLE_STRIP
 *  gl.TRIANGLE_FAN 
 * 
 * count 指定绘制顶点的个数（整数型
 * 
 * type 指定索引值数据类型：
 * gl.UNSIGNED_BYTE 
 * gl.UNSIGNED_SHORT
 * 
 * gl.ELEMENT_ARRAY_BUFFER: 用于元素索引的 Buffer
 * 
 * gl.drawArrays 和 gl.drawElements
 * gl.drawArrays:从向量数组中绘制图元
 * gl.drawElements:从数组数据中渲染渲染图元，根据gl.ELEMENT_ARRAY_BUFFER将缓冲区的顶点索引绑定到缓冲区与顶点一一对应
 * 
 */

export default {
    mounted() {
        this.paint();
    },
    methods: {
        paint() {
            let VSHADER_SOURCE =  `
                precision mediump float;

                attribute vec4 a_Position;
                attribute vec4 a_Color;

                uniform mat4 u_ProjMatrix; // 透视投影矩阵
                uniform mat4 u_ViewMatrix; // 视图矩阵

                varying vec4 v_Color;

                void main() {
                    gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;
                    v_Color = a_Color;
                }

            `;
            let FSHADER_SOURCE = `
                precision mediump float;

                varying vec4 v_Color;

                void main() {
                    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
                    //gl_FragColor = v_Color;
                }
            `;

            let canvas = document.getElementById('colored-cube');
            let gl = getWebGLContext(canvas);
            if (!gl) {
                console.error('获取webGL上下文失败');
                return;
            }

            if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
                console.error('初始化着色器失败');
                return;
            }

            let n = this.initVertexBuffers(gl);
            if (n < 0) {
                console.error('顶点缓冲对象创建失败');
                return;
            }

            let viewMatrix = new Matrix4();
            let projMatrix = new Matrix4();
            viewMatrix.setLookAt(
                3, 3, 3, // 视点
                0, 0, 0, // 目标点
                0, 1, 0, // 上方向
            );
            projMatrix.setPerspective(
                30, // 垂直视角
                canvas.width/canvas.height, // aspect宽高比应与canvas的宽高比一直，才不会导致图片变形
                1, // near
                100, // far
            );
            let u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
            gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
            let u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
            gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

            gl.clearColor(0.1, 0.2, 0.3, 1.0);
            gl.enable(gl.DEPTH_TEST);
            gl.clear(gl.DEPTH_OFFSET_FILL | gl.COLOR_BUFFER_BIT);
            gl.drawElements(gl.TRIANGLE_FAN, n, gl.UNSIGNED_BYTE, 0);
        },
        initVertexBuffers(gl) {
            /**
             *  白色 1.0, 1.0, 1.0
             *  品红色 0.67, 0, 0.73
             *  红色   1.0, 0.0, 0.0
             *  黄色   1.0, 1.0, 0.0
             * 
             * 蓝色 0.0, 0.0, 1.0
             * 黑色 0.0, 0.0, 0.0
             * 青色 0.4, 0.6, 0.6
             * 绿色 0.0, 0.62, 0.42
             */

             // 顶点坐标
            let vertexAxis = [
                0.3, 0.3, 0.3, // v0
                -0.3, 0.3, 0.3, // v1
                -0.3, -0.3, 0.3, // v2
                0.3, -0.3, 0.3, // v3
                0.3, -0.3, -0.3, // v4
                0.3, 0.3, -0.3, // v5
                -0.3, 0.3, -0.3, // v6
                -0.3, -0.3, -0.3, // v7
            ];

            // 顶点颜色
            let vertexColor = [
                0.67, 0.0, 0.73, // 品红色
                1.0, 0.0, 0.0, // 红色
                1.0, 1.0, 0.0, // 黄色
                0.0, 0.0, 1.0, // 蓝色
                0.4, 0.6, 0.6, // 青色
                0.0, 0.62, 0.42, // 绿色
            ];
            
             // 顶点坐标
            let vertices = new Float32Array(vertexAxis, 0, vertexAxis.length);
            this.initArrayBuffer(gl, vertices, 'a_Position');
             // 顶点颜色
            let colors = new Float32Array(vertexColor, 0, vertexColor.length);
            this.initArrayBuffer(gl, colors, 'a_Color');

            // 顶点索引
            let vertexIndices = [
                0, 1, 2, 3,// 正面
                0, 3, 4, 5, // 右面
                0, 5, 6, 1, // 上面
                7, 2, 3, 4,// 下面
                7, 4, 5, 6, // 背面
                7, 2, 1, 6,// 左面
            ];

            // 颜色索引
            let colorIndices = [
                0, 0, 0, 0,
                1, 1, 1, 1,
                2, 2, 2, 2,
                3, 3, 3, 3,
                4, 4, 4, 4,
                5, 5, 5, 5,
            ];
            // 立方体每个面的三角扇顶点索引【绘制顺序】
            this.initElementArrayBuffer(gl, vertexIndices);

            this.initElementArrayBuffer(gl, colorIndices);

            return vertexIndices.length;
        },
        initArrayBuffer(gl, typeArray, attribAttr) {
            let buffer  = gl.createBuffer();
            if (!buffer) return -1;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, typeArray, gl.STATIC_DRAW);
            let attrib = gl.getAttribLocation(gl.program, attribAttr);
            gl.vertexAttribPointer(attrib, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(attrib);
            return true;
        },
        initElementArrayBuffer(gl, indices) {
            // 立方体每个面的三角扇顶点索引【绘制顺序】
            let index = new Uint8Array(indices, 0, indices.length);
            let indexBuffer  = gl.createBuffer();
            if (!indexBuffer) {
                return -1;
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);
        }
    }
}
</script>

<style>

</style>