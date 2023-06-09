<template>
  <div class="canvas-translate-triangle-matrix">
    <canvas id="translate-triangle-matrix" height="600" width="600"></canvas>
  </div>
</template>

<script>
// 平移矩阵
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
                    gl_Position = u_xformMatrix * a_Position;
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

            let canvas = document.getElementById('translate-triangle-matrix');
            let gl = getWebGLContext(canvas);

            if (!gl) {
                console.error('获取webGL上下文失败');
                return;
            }

            if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)){
                console.error('着色器初始化失败');
                return;
            }

            let n = this.initVertexBuffer(gl);
            if (n < 0) {
                console.error('创建缓冲区对象失败');
                return;
            }

            let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
            gl.uniform4f(u_FragColor, 0.0, 1.0, 1.0, 1.0);

            this.setMatrixHandle(gl);

            // 设置清空颜色缓冲时的颜色值
            gl.clearColor(0.1, 0.2, 0.3, 1.0);

            /**
             * 使用预设值来清空缓冲
             * void gl.clear(mask)
             * mask:
             *  gl.COLOR_BUFFER_BIT 颜色缓冲区
             *  gl.DEPTH_BUFFER_BIT 深度缓冲区
             *  gl.STENCIL_BUFFER_BIT 模板缓冲区
             */
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.drawArrays(gl.TRIANGLES, 0, n);
        },
        setMatrixHandle(gl) {
            let xformMatrix = new Float32Array(16);
            // 坐标轴平移变量
            const Tx = 0.5, Ty = 0.1, Tz = 0.0;
            xformMatrix.set([
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                Tx, Ty, Tz, 1,
            ]);
            let u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
            gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix);
        },
        // 创建缓冲区对象
        initVertexBuffer(gl) {
            // 顶点个数
            let n = 3;
            let vertices = new Float32Array(6);
            vertices.set([
                0.0, 0.5,
                0.5, 0.0,
                -0.5, 0.0,
            ]);

            let vertexBuffer = gl.createBuffer();
            if (!vertexBuffer) {
                return -1;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            // 创建并初始化了buffer对象的数据存储区
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW, false, 0, 0);

            let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
            // 告诉显卡重当前绑定的缓冲区读取定点数据
            gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

            // 打开属性数据列表中指定索引处的通用顶点属性数组
            gl.enableVertexAttribArray(a_Position);

            return n;
        },
    }
}
</script>

<style>

</style>