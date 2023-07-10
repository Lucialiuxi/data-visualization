<template>
  <div class="colored-cube-wrap">
    <canvas id="colored-cube-by-triangle-strip" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { getWebGLContext, initShaders } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';

/**
 * 未解决问题：
 * 三角带绘制立方体，顶点绘制渲染没问题，
 * 但是 观察者在不同的角度，正下面的颜色会串
 * 观察者 在 前右下方 和 后有左下方 正下方面都会和左边串色
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
                    gl_FragColor = v_Color;
                }
            `;

            let canvas = document.getElementById('colored-cube-by-triangle-strip');
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
                // 有问题的视点
                // 3, -3, 13,
                // -3, -3, -13,

                3, 3, 13, // 观察者视点

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
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            
            gl.drawElements(gl.TRIANGLE_STRIP, n, gl.UNSIGNED_BYTE, 0);
            gl.drawElements(gl.TRIANGLE_STRIP, 6, gl.UNSIGNED_BYTE, 0);
            gl.polygonOffset(0.0, 0.1);
            gl.drawElements(gl.TRIANGLE_STRIP, 6, gl.UNSIGNED_BYTE, 6);
            gl.polygonOffset(0.1, 0.2);
            gl.drawElements(gl.TRIANGLE_STRIP, 6, gl.UNSIGNED_BYTE, 12);
            gl.polygonOffset(0.2, 0.3);
            gl.drawElements(gl.TRIANGLE_STRIP, 6, gl.UNSIGNED_BYTE, 18);
        },
        initVertexBuffers(gl) {
            // 品红色
            let magenta = [ 0.67, 0, 0.73 ],
                red = [ 1.0, 0.0, 0.0 ],
                yellow = [ 1.0, 1.0, 0.0 ],
                blue = [ 0.0, 0.0, 1.0 ],
                // 青色
                cyan = [ 0.4, 0.6, 0.6 ],
                green = [ 0.0, 0.62, 0.42 ]; 

            
            let v0 = [ 1.0, 1.0, 1.0 ],
                v1 = [ -1.0, 1.0, 1.0 ],
                v2 = [ -1.0, -1.0, 1.0 ],
                v3 = [ 1.0, -1.0, 1.0 ],
                v4 = [ 1.0, -1.0, -1.0 ],
                v5 = [ 1.0, 1.0, -1.0 ],
                v6 = [ -1.0, 1.0, -1.0 ],
                v7 = [ -1.0, -1.0, -1.0 ];

             // 顶点坐标
            let vertexAxis = [
                // 正面 绿
                ...v1, ...v2, ...v0,  ...v3,
                // 背面 品红
                ...v6, ...v7, ...v5, ...v4,
                // 上面 蓝
                ...v1, ...v6, ...v0, ...v5,
                // 下面 青
                ...v2, ...v7, ...v3, ...v4,
                // 左面 红
                ...v2, ...v7, ...v1, ...v6, 
                // 右面 黄
                ...v3, ...v4, ...v0, ...v5,
            ];

            // 顶点颜色
            let vertexColor = [
                ...green, ...green, ...green, ...green, // 正面
                ...magenta, ...magenta, ...magenta, ...magenta,// 背面
                ...blue, ...blue, ...blue, ...blue, // 上面
                ...cyan, ...cyan, ...cyan, ...cyan, // 下面
                ...red, ...red, ...red, ...red, // 左面
                ...yellow, ...yellow, ...yellow, ...yellow, // 右面
            ];

             // 顶点坐标
            let vertices = new Float32Array(vertexAxis, 0, vertexAxis.length);
            this.initArrayBuffer(gl, vertices, 'a_Position');
             // 顶点颜色
            let colors = new Float32Array(vertexColor, 0, vertexColor.length);
            this.initArrayBuffer(gl, colors, 'a_Color');

            // 索引
            let indices = [
                0, 1, 2, 3, 
                4, 5, 6, 7, 
                8, 9, 10, 11,
                12, 13, 14, 15, 
                16, 17, 18, 19, 
                20, 21, 22, 23,
            ];
            // 立方体每个面的三角扇顶点索引【绘制顺序】
            this.initElementArrayBuffer(gl, indices);

            return indices.length;
        },
        // 初始化顶点缓冲对象
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
        // 初始化顶点缓冲对象
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