<template>
  <div class="canvas-scale-triangle-matrix">
    <canvas id="scale-triangle-matrix" height="600" width="600" />
  </div>
</template>

<script>
// 缩放矩阵
import { getWebGLContext, initShaders } from '@lib/cuon-utils';

export default {
    mounted() {
        this.initHandle();
    },
    methods: {
        initHandle() {
            // 顶点着色器
            let VSHADER_SOURCE = `
                attribute vec4 a_Position;
                uniform mat4 u_xformMatrix;
                void main() {
                    gl_Position = a_Position * u_xformMatrix;
                }
            `;
            // 片元着色器
            let FSHADER_SOURCE = `
                precision mediump float;
                uniform vec4 u_FragColor;
                void main() {
                    gl_FragColor = u_FragColor;
                }
            `;

            let canvas = document.getElementById('scale-triangle-matrix');
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
            if (n < 0) {
                console.error('顶点缓冲对象创建失败');
                return;
            }
            let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
            gl.uniform4f(u_FragColor, 0.0, 1.0, 0.2, 1.0);

            this.scaleHandle(gl);

            gl.clearColor(0.1, 0.2, 0.3, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.drawArrays(gl.TRIANGLES, 0, n);
        },
        initVertexBuffer(gl) {
            let n = 3;
            let vertices = new Float32Array(6);
            vertices.set([
                0.0, 0.5,
                0.5, -0.5,
                -0.5, -0.5,
            ]);

            let vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW, 0, 0);

            let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
            // 指定缓冲区的顶点属性
            gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
            // 打开 属性列表中 指定索引处的  通用顶点属性数组
            gl.enableVertexAttribArray(a_Position);
            return n;
        },
        // 缩放操作
        scaleHandle(gl) {
            // 缩放系数 s、y、z周都缩小一半
            let Sx = 0.5, Sy = 0.5, Sz = 0.5;
            let xformMatrix = new Float32Array(16);
            xformMatrix.set([
                Sx, 0.0, 0.0, 0.0,
                0.0, Sy, 0.0, 0.0,
                0.0, 0.0, Sz, 0.0,
                0.0, 0.0, 0.0, 1,
            ]);
            let u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
            gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix);
        }
    }
}
</script>