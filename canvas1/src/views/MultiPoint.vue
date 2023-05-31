
<script setup lang="js">
import { getWebGLContext, initShaders } from "@lib/cuon-utils";
export default {
    mounted() {
        this.initHandle();
    },
    methods: {
        initHandle() {
            // 顶点着色器
            let VSHADER_SOURCE = `
                attribute vec4 a_Position;
                void main() {
                    gl_Position = a_Position;
                    gl_PointSize = 10.0;
                }
            `;
            // 片元着色器
            let FSHADER_SHOURCE = `
                precision mediump float;
                uniform vec4 u_FragColor;
                void main() {
                    gl_FragColor = u_FragColor;
                }
            `;

            // 获取canvas元素
            let canvas = document.getElementById('multi-point');
            // 获取webGL上下文
            let gl = getWebGLContext(canvas);

            if (!gl) {
                console.error('获取webGl上下文失败');
                return;
            }

            // 初始化着色器
            if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SHOURCE)) {
                console.error('着色器初始化失败');
                return;
            }

            // 设置顶点位置
            let n = this.initVertexBuffers(gl);
            if (n < 0) {
                console.error('设置定点位置失败');
            }

            // 设置canvas背景色
            gl.clearColor(0.2, 0.1, 0.3, 1.0);

            // 把指定的缓冲区清空为预设的值
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.drawArrays(gl.POINTS, 0, n);
        },
        // 初始化顶点缓冲区
        initVertexBuffers(gl) {
            // let vertices = new Float32Array([
            //     0.0, 0.5, -0.5, -0.5, 0.5, 0.5
            // ]);
            let vertices = new Float32Array(6);
            vertices.set([0.0, 0.5, -0.5, -0.5, 0.5, 0.5], 0);
            let n = 3; // 点的个数

            // 创建并初始化一个用于储存顶点数据或者着色数据的webGLBuffer对象
            let vertexBuffer = gl.createBuffer();
            if (!vertexBuffer) {
                console.error('创建缓冲区对象失败');
                return -1;
            }

            // 将缓冲区对象绑定到目标
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

            /*
            向缓冲区对象中写入数据 
            语法：
                // WebGL1:
                void gl.bufferData(target, size, usage);
                void gl.bufferData(target, ArrayBuffer? srcData, usage);
                void gl.bufferData(target, ArrayBufferView srcData, usage);

                // WebGL2:
                void gl.bufferData(target, ArrayBufferView srcData, usage, srcOffset, length);

             */
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            // 获取attribute变量储存位置
            let a_Position = gl.getAttribLocation(gl.program, 'a_Position');

            // 获取uniform变量储存位置
            let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

            /**
             * 将缓冲区对象分配给a_Position
             * https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
             */
            gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
            //  连接a_Position变量与配分配给它的缓冲区对象
            gl.enableVertexAttribArray(a_Position);

            // 设置片元着色器颜色
            gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
            return n;
        }
    }
}
</script>

<template>
    <div class="canvas-multi-point">
        <canvas id="multi-point" height="600" width="400"></canvas>
    </div>
</template>