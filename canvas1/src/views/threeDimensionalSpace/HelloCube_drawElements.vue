<template>
  <div class="hello-cube-wrap">
    <canvas id="hello-cube" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { getWebGLContext, initShaders } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';

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

            let canvas = document.getElementById('hello-cube');
            let gl = getWebGLContext(canvas);
            if (!gl) {
                console.error('获取webGL上下文失败');
                return;
            }

            if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
                console.error('初始化着色器失败');
                return;
            }

            let n = this.initVertexBuffer(gl);
            if (n < 0) {
                console.error('顶点缓冲对象创建失败');
                return;
            }

            let viewMatrix = new Matrix4();
            let projMatrix = new Matrix4();
            viewMatrix.setLookAt(
                0.3, 0.3, 3, // 视点
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
            gl.enable(gl.DEPTH_TEST)
            gl.clear(gl.DEPTH_OFFSET_FILL | gl.COLOR_BUFFER_BIT);

            gl.drawElements(gl.TRIANGLES_FAN, n, gl.UNSIGNED_BYTE, 0);
        },
        initVertexBuffer(gl) {
            /**
             *  v0 白色 1.0, 1.0, 1.0
             *  v1 品红色 0.67, 0, 0.73
             *  v2 红色   1.0, 0.0, 0.0
             *  v3 黄色   1.0, 1.0, 0.0
             * 
             * v6 蓝色 0.0, 0.0, 1.0
             * v7 黑色 0.0, 0.0, 0.0
             * v5 青色 0.4, 0.6, 0.6
             * v4 绿色 0.0, 0.62, 0.42
             */

            let cubeAxisColor = [
                0.15, 0.15, 0.15, 1.0, 1.0, 1.0, // v0
                -0.15, 0.15, 0.15, 0.67, 0, 0.73, // v1
                -0.15, -0.15, 0.15, 1.0, 0.0, 0.0, // v2
                0.15, -0.15, 0.15, 1.0, 1.0, 0.0, // v3
                0.15, -0.15, -0.15, 0.0, 0.62, 0.42, // v4
                0.15, 0.15, -0.15, 0.4, 0.6, 0.6, // v5
                -0.15, 0.15, -0.15, 0.0, 0.0, 1.0, // v6
                -0.15, -0.15, -0.15, 0.0, 0.0, 0.0, // v7
            ];

            let indexFan = [
                0, 1, 2, 3, // 正面
                0, 3, 4, 5, // 右面
                0, 5, 6, 1, // 上面
                7, 2, 3, 4,// 下面
                7, 4, 5, 6, // 背面
                7, 2, 1, 6,// 左面
            ];

             // 顶点坐标和颜色
            let vertices = new Float32Array(cubeAxisColor, 0, cubeAxisColor.length);
            // 立方体每个面的三角扇顶点索引【绘制顺序】
            let vertexIndex = new Uint8Array(indexFan, 0, indexFan.length);

            const FSIZE = vertices.BYTES_PER_ELEMENT;

            let vertexBuffer  = gl.createBuffer();
            let IndexBuffer  = gl.createBuffer();
            if (!vertexBuffer || !IndexBuffer) {
                return -1;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
            gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, true, FSIZE * 6, 0);
            gl.enableVertexAttribArray(a_Position);

            let a_Color = gl.getAttribLocation(gl.program, 'a_Color');
            gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, true, FSIZE * 6, FSIZE * 3);
            gl.enableVertexAttribArray(a_Color);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IndexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexIndex, gl.STATIC_DRAW);
            return indexFan.length;
        },
    }
}
</script>

<style>

</style>