<template>
  <div class="look-at-triangles-wrap">
    <canvas id="look-at-triangles" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { getWebGLContext, initShaders } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';

/**
 * 注册键盘事件， 每当左方向键或者右方向键被按下时， 就改变视点的位置
 * 
 * 正射投影矩阵 补缺角 => 正射投影矩阵 * 视图矩阵 * 顶点坐标
 */

export default {
    data() {
        return {
            // 视点的 xyz坐标点
            g_eyeX: 0.20,
            g_eyeY: 0.25,
            g_eyeZ: 0.25,
        }
    },
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

                uniform mat4 u_ViewMatrix; // 视图矩阵
                uniform mat4 u_OrthoProjMatrix; // 正射投影矩阵

                void main() {
                    gl_Position = u_OrthoProjMatrix * u_ViewMatrix * a_Position;
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

            // 正射投影矩阵
            const orthoProjMatrix = new Matrix4();
            let u_OrthoProjMatrix = gl.getUniformLocation(gl.program, 'u_OrthoProjMatrix');
            orthoProjMatrix.setOrtho(-1.0, 1.0, -1.0, 1.0, 0.0, 2.0);
            gl.uniformMatrix4fv(u_OrthoProjMatrix, false, orthoProjMatrix.elements);


            // 视图矩阵
            const viewMatrix = new Matrix4();
            let u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
            this.drawHandle(gl, n, u_ViewMatrix, viewMatrix);
            document.onkeydown = (ev) => this.onKeyDown(ev, gl, n, u_ViewMatrix, viewMatrix);
        },
        // 初始化缓冲区对象
        initVertexBuffer(gl) {
            // 绿色三角形 在最后面
            const triangle1 = [
                0.0, 0.5, -0.4, 0.4, 1.0, 0.4, // x, y, z, r, g, b
                -0.5, -0.5, -0.4, 0.4, 1.0, 0.4,
                0.5, -0.5, -0.4, 1.0, 0.5, 0.4,
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
                -0.5, -0.5, 0.0, 0.4, 0.4, 0.1,
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
        },
        // 键盘事件
        onKeyDown(ev, gl, n, u_ViewMatrix, viewMatrix) {
            if (ev.keyCode == 39) { // 按下右键
                this.g_eyeX = this.g_eyeX + 0.01;
            } else if (ev.keyCode == 37) {// 按下左键
                this.g_eyeX = this.g_eyeX - 0.01;
            } else {
                return;
            }

            this.drawHandle(gl, n, u_ViewMatrix, viewMatrix);
        },
        drawHandle(gl, n, u_ViewMatrix, viewMatrix) {
            // 设置 视点、观察目标点 和 上方向
            viewMatrix.setLookAt(
                this.g_eyeX, this.g_eyeY, this.g_eyeZ, // 视点
                0, 0, 0, // 观察目标点
                0, 1, 0, // 上方向
            );

            gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

            gl.clearColor(0.1, 0.2, 0.3, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            gl.drawArrays(gl.TRIANGLES, 0, n);
        }
    }
}
</script>

<style>

</style>