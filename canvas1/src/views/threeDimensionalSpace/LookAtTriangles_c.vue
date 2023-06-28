<template>
  <div class="look-at-triangles-wrap">
    <canvas id="look-at-triangles" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { getWebGLContext, initShaders } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';

export default {
    mounted() {
        this.paintHandle();
    },
    methods: {
        paintHandle() {
            let VSHADER_SOURCE = `
                precision mediump float;
                attribute vec4 a_Position;

                attribute vec4 a_Color;
                varying vec4 v_Color;

                uniform mat4 u_ViewMatrix;

                void main() {
                    gl_Position = u_ViewMatrix * a_Position;
                    v_Color = a_Color;
                }
            `;
            // gl_FragCoord 是内置变量，用来表示片元的坐标
            let FSHADER_SOURCE = `
                precision mediump float;
                varying vec4 v_Color;

                void main() {
                    gl_FragColor = v_Color;
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

            let a_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');

            // 设置 视点、观察目标点 和 上方向
            Matrix4.setLookAt(
                0.20, 0.25, 0.25, // 视点
                0, 0, 0, // 观察目标点
                0, 1, 0, // 上方向
            );
            // 将视图矩阵传给u_ViewMatrix
            gl.uniformMatrix4fv(a_ViewMatrix, false, Matrix4.elements), 


            gl.clearColor(0.1, 0.2, 0.3, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            gl.drawArrays(gl.TRIANGLES, 0, n);
        },
        // 初始化缓冲区对象
        initVertexBuffer(gl) {
            // 绿色三角形 在最后面
            const triangle1 = [
                0.0, 0.5, -0.4, 0.4, 1.0, 0.4, // x, y, z, r, g, b
                -0.5, -0.5, -0.4, 0.4, 1.0, 0.4,
                0.5, -0.5, -0.4, 1.0, 0.4, 0.4,
            ];

            // 黄色三角形 在中间
            const triangle2 = [
                0.5, 0.4, -0.2, 1.0, 0.4, 0.4,
                -0.5, 0.4, -0.2, 1.0, 1.0, 0.4,
                0.0, -0.6, -0.2, 1.0, 0.4, 0.4,
            ];

            // 蓝色三角形 在最前面
            const triangle3 = [
                0.0, 0.5, 0.0, 0.4, 0.4, 1.0,
                -0.5, -0.5, 0.0, 0.4, 0.4, 1.0,
                0.5, -0.5, 0.0, 1.0, 0.4, 0.4,
            ];
            let len = triangle1.length + triangle2.length + triangle3.length;
            // 顶点位置
            let vertices = new Float32Array([
                ...triangle1,
                ...triangle2,
                ...triangle3,
            ], 0, len);

            // 顶点个数 
            let n = 9;
            const FSIZE = vertices.BYTES_PER_ELEMENT;

            let vertexBuffer = gl.createBuffer();
            if(!vertexBuffer) {
                return -1;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
            gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
            gl.enableVertexAttribArray(a_Position);

            let a_Color = gl.getAttribLocation(gl.program, 'a_Color');
            gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
            gl.enableVertexAttribArray(a_Color);

            return n;
        }
    }
}
</script>

<style>

</style>