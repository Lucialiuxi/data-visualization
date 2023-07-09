<template>
  <div class="hello-cube-wrap">
    <canvas id="hello-cube" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { getWebGLContext, initShaders } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';
/**
 * 用2个三角扇可以分别画出立方体的3个面，但无法将不同平面的三角扇组合成立方体
 * 得分别用4个三角扇画出的矩形组合成立方体
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
                -4, -4, 10, // 视点
                0, 0, -10, // 目标点
                0, 1, 0, // 上方向
            );
            projMatrix.setPerspective(
                40, // 垂直视角
                canvas.width/canvas.height, // aspect宽高比应与canvas的宽高比一直，才不会导致图片变形
                1, // near
                100, // far
            );
            let u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
            gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
            let u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
            gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

            gl.clearColor(0.7, 0.7, 0.7, 1.0);
            gl.enable(gl.DEPTH_TEST)
            gl.clear(gl.DEPTH_OFFSET_FILL | gl.COLOR_BUFFER_BIT);

            gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
        },
        initVertexBuffer(gl) {
            /**
             *  v0 白色     1.0, 1.0, 1.0, 1.0, 1.0, 1.0
             *  v1 品红色   -1.0, 1.0, 1.0, 0.67, 0, 0.73,
             *  v2 红色     -1.0, -1.0, 1.0, 1.0, 0.0, 0.0,
             *  v3 黄色     1.0, -1.0, 1.0, 1.0, 1.0, 0.0,
             *  v4 绿色     1.0, -1.0, -1.0, 0.0, 0.62, 0.42,
             *  v5 青色     1.0, 1.0, -1.0, 0.4, 0.6, 0.6,
             *  v6 蓝色     -1.0, 1.0, -1.0, 0.0, 0.0, 1.0,
             *  v7 黑色     -1.0, -1.0, -1.0, 0.0, 0.0, 0.0,
             */
            // 观察者视角方向的右上角v0为起点的三角扇
            let fanFrontTopRight = [
                // 正面
                1.0, 1.0, 1.0, 1.0, 1.0, 1.0, // v0
                -1.0, 1.0, 1.0, 0.67, 0, 0.73, // v1
                -1.0, -1.0, 1.0, 1.0, 0.0, 0.0, // v2
                1.0, -1.0, 1.0, 1.0, 1.0, 0.0, // v3

                // 右面
                1.0, 1.0, 1.0, 1.0, 1.0, 1.0, // v0
                1.0, -1.0, 1.0, 1.0, 1.0, 0.0, // v3
                1.0, -1.0, -1.0, 0.0, 0.62, 0.42, // v4
                1.0, 1.0, -1.0, 0.4, 0.6, 0.6, // v5

               // 正上面
                1.0, 1.0, 1.0, 1.0, 1.0, 1.0, // v0
                1.0, 1.0, -1.0, 0.4, 0.6, 0.6, // v5
                -1.0, 1.0, -1.0, 0.0, 0.0, 1.0, // v6
                -1.0, 1.0, 1.0, 0.67, 0, 0.73, // v1
            ];

            // 后左下方v7为顶点的扇形
            let fanBackBottomLeft = [
                // 正下面
                -1.0, -1.0, -1.0, 0.0, 0.0, 0.0, // v7
                -1.0, -1.0, 1.0, 1.0, 0.0, 0.0, // v2
                1.0, -1.0, 1.0, 1.0, 1.0, 0.0, // v3
                1.0, -1.0, -1.0, 0.0, 0.62, 0.42, // v4

                // 正后面
                -1.0, -1.0, -1.0, 0.0, 0.0, 0.0, // v7
                1.0, -1.0, -1.0, 0.0, 0.62, 0.42, // v4
                1.0, 1.0, -1.0, 0.4, 0.6, 0.6, // v5
                -1.0, 1.0, -1.0, 0.0, 0.0, 1.0, // v6

                // 左面
                -1.0, -1.0, -1.0, 0.0, 0.0, 0.0, // v7
                -1.0, 1.0, -1.0, 0.0, 0.0, 1.0, // v6
                -1.0, 1.0, 1.0, 0.67, 0, 0.73, // v1
                -1.0, -1.0, 1.0, 1.0, 0.0, 0.0, // v2
            ];

            let len = fanFrontTopRight.length + fanBackBottomLeft.length;
            let n = len / 6;
            console.log(n)
            let vertices = new Float32Array([
                ...fanFrontTopRight,
                ...fanBackBottomLeft,
            ], 0, len);

            const FSIZE = vertices.BYTES_PER_ELEMENT;
            let vertexBuffer  = gl.createBuffer();
            if (!vertexBuffer) {
                return -1;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW, 0, n);

            let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
            gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
            gl.enableVertexAttribArray(a_Position);

            let a_Color = gl.getAttribLocation(gl.program, 'a_Color');
            gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
            gl.enableVertexAttribArray(a_Color);

            return n;
        },
    }
}
</script>

<style>

</style>