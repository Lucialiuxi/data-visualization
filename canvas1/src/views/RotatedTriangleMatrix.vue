<template>
  <div class="canvas-rotated-triangle-matrix">
    <canvas id="rotated-triangle-matrix" height="600" width="400"></canvas>
  </div>
</template>

<script>
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
            ` ;
            // 片元着色器
            let FSHADER_SOURCE = `
                precision mediump float;
                uniform vec4 u_FragColor;
                void main() {
                    gl_FragColor = u_FragColor;
                }
            `;

            let canvas = document.getElementById('rotated-triangle-matrix');
            let gl = getWebGLContext(canvas);

            if (!gl) {
                console.error('获取webGl上下文失败');
                return;
            }

            // 初始化着色器
            if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
                console.error('着色器初始化失败');
                return;
            }

            // 初始化缓冲区对象设置顶点
            let n = this.initVertexBuffer(gl);
            if (n < 0) {
                console.error('设置顶点位置失败');
                return;
            }


            // 旋转角度
            const ANGLE = 90.0;

            // 创建旋转矩阵
            let radian = ANGLE * Math.PI / 180; // 角度制转弧度制
            let cosB = Math.cos(radian);
            let sinB = Math.sin(radian);
            // 注意webGL中矩阵是列主序的
            let xformMatrix = new Float32Array([
                cosB, -sinB, 0, 0,
                sinB, cosB, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
            ]);


            let u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
            // 为uniform指定矩阵值
            gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix);

            // 设置canvas画布背景色
            gl.clearColor(0.2, 0.1, 0.3, 1.0);
            // 把指定的缓冲区清空为预设的值
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            // 画一个三角形
            gl.drawArrays(gl.TRIANGLES, 0, n);
        },
        // 创建缓冲区对象&设置顶点位置
        initVertexBuffer(gl) {
            // TypeArray的长度
            let len = 6;
            // 顶点位置
            let vertices = new Float32Array(len); // 长度为6的TypeArray
            vertices.set([
                0.0, 0.5,
                -0.5, 0.5,
                0.5, 0.5
            ], 0);
            // 顶点个数
            let n = 3;


            // 创建缓冲区对象
            let vertexBuffer = gl.createBuffer();
            if(!vertexBuffer) {
                console.error('创建缓冲区对象失败');
                return -1;
            }

            // 绑定缓冲区对象
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

            // 将数据写入缓冲区对象
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            // 获取attribute变量下标
            let a_Position = gl.getAttribLocation(gl.program, 'a_Position');

            let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
            let rgba = [0.0, 1.0, 0.0, 1.0];
            gl.uniform4f(u_FragColor, ...rgba);

            /**
             * 告诉显卡重当前绑定的缓冲区中读取定点数据
             * gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
             * index: 下标
             * size: 坐标参数的个数
             * type: 指定数组中每个元素的数据类型
             * normalized: 当转换为浮点数时是否将整数数值归一到特定范围
             * stride: 一以字节为单位指定连续顶点属性开始之间的偏移量（即数据中一行的长度）
             * offset: 指定顶点属性数组中第一部分的字节偏移量
             * 
             */
            gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

            // 开启attribute变量
            gl.enableVertexAttribArray(a_Position);

            return n;
        }
    }
}
</script>