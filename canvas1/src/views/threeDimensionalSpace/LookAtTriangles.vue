<template>
  <div class="look-at-triangles-wrap">
    <canvas id="look-at-triangles" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { getWebGLContext, initShaders } from '@lib/cuon-utils.js';


export default {
    mounted() {
        this.paintHandle();
    },
    methods: {
        paintHandle() {
            let VSHADER_SOURCE = `
                attribute vec4 a_Position;

                void main() {
                    gl_Position = a_Position;
                }
            `;
            // gl_FragCoord 是内置变量，用来表示片元的坐标
            let FSHADER_SOURCE = `
                precision mediump float;
                uniform float u_Width;
                uniform float u_Height;

                void main() {
                    gl_FragColor = vec4( gl_FragCoord.x/u_Width, 0.0, gl_FragCoord.y/u_Height, 1.0);
                }
            `;

            let canvas = document.getElementById('look-at-triangles');
            let gl = getWebGLContext(canvas);

            if (!gl) {
                console.error('获取webGL上下文失败');
                return;
            }
            if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
                console.error('着色器初始化失败');
                return;
            }

            // 初始化缓冲区对象
            let n = this.initVertexBuffer(gl);
            if (n < 0) {
                console.error('缓冲区对象创建失败');
                return;
            }

            let u_Width = gl.getUniformLocation(gl.program, 'u_Width');
            let u_Height = gl.getUniformLocation(gl.program, 'u_Height');
            gl.uniform1f(u_Width, gl.drawingBufferWidth);
            gl.uniform1f(u_Height, gl.drawBufferHeight);

            gl.clearColor(0.1, 0.2, 0.3, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            gl.drawArrays(gl.TRIANGLES, 0, n);
        },
        // 初始化缓冲区对象
        initVertexBuffer(gl) {
            // 顶点位置
            let vertices = new Float32Array([
                0.0, 0.5, 
                -0.5, -0.5,
                0.5, - 0.5
            ], 0, 6);

            // 顶点个数 
            let n = 3;

            let vertexBuffer = gl.createBuffer();
            if(!vertexBuffer) {
                return -1;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
            gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

            gl.enableVertexAttribArray(a_Position);
            return n;
        }
    }
}
</script>

<style>

</style>