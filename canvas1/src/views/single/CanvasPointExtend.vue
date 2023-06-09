<script setup lang="js">
/**
 * 使用attribute变量赋值
 */
import { getWebGLContext, initShaders } from '@lib/cuon-utils';

export default {
    mounted() {
        this.initHandle();
    },
    methods: {
        initHandle() {
            // 定点着色器程序
            let VSHADER_SOURCE = `
                attribute vec4 a_Position;
                attribute float a_PointSize;
                void main() {
                    gl_Position = a_Position;
                    gl_PointSize = a_PointSize;
                }
            `;
            // 片元着色器
            let FSHADER_SHOURCE = `
                void main() {
                    gl_FragColor = vec4(0.0, 1.0, 0.0, 0.5);
                }
            `;

            // 获取canvas元素
            let canvas = document.getElementById('point-extend');
            // 获取webgl上下文
            let gl = getWebGLContext(canvas);
            if (!gl) {
                console.error('获取webGL上下文失败');
                return;
            }

            // 初始化着色器
            if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SHOURCE)) {
                console.error('着色器初始化失败');
                return;
            }

            // 获取attribute 变量的储存位置
            let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
            let a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');

            // 将顶点位置传输给attribute变量
            /**
             * gl.vertexAttrib3f(location参, v1, v2, v3)
             * 将数据(v1, v2, v3)传给由location参数指定的attribute变量
             * 
             * 等同于 gl_Position = vec4(0.0, 0.0, 0.0, 1.0) 当前写法是动态赋值 更具有灵活性
             */
            gl.vertexAttrib3f(a_Position, 0.0, 0.0, 0.0);
            /**
             * 以下每一句语句也都有同等效果
             * gl.vertexAttrib1f(a_Position, 0.0)
             * gl.vertexAttrib2f(a_Position, 0.0, 0.0)
             * gl.vertexAttrib3f(a_Position, 0.0, 0.0, 0.0)
             * gl.vertexAttrib4f(a_Position, 0.0, 0.0, 0, 1.0)
             * 
             * 也可以选择传数组
             * let positions = new Float32Array([0.0, 0.0, 0, 1.0]);
             * gl.vertexAttrib4fv(a_Position, positions)
             */


            // 点尺寸动态复制
            gl.vertexAttrib1f(a_PointSize, 20.0);

            // 设置canvas背景色
            gl.clearColor(0.0, 0.1, 0.4, 1.0);

            // 把指定的缓冲区清空为预设的值
            gl.clear(gl.COLOR_BUFFER_BIT);

            // 绘制一个点
            gl.drawArrays(gl.POINTS, 0, 1);
        }
    }
}
</script>
<template>
    <div class="paint-point-extend">
        <canvas id="point-extend" width="400" height="400"></canvas>
    </div>
</template>