<template>
  <div class="rounded-point-wrap">
    <canvas id="rounded-point" height="600" width="600"></canvas>
  </div>
</template>
<script>
import { initShaders, getWebGLContext } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';
/**
 * gl_PointCoord 变量表示 当前片元在所属的点内的坐标，坐标值是从 0.0到1.0
 *  为了将矩形削成圆形，需要将点的中心(0.5, 0.5)距离超过0.5，也就是将与安全外的片元剔除掉。
 *  在片元着色器中，可以使用discard语句来放弃当前片元
 */
export default {
    mounted() {
        this.paintHandle();
    },
    methods: {
        paintHandle() {
            // 顶点着色器
            let VSHADER_SOURCE = `
                precision mediump float;

                attribute vec4 a_Position;
                attribute vec4 a_Color;
                attribute float a_PointSize;

                uniform mat4 u_MvpMatrix;

                varying vec4 v_Color;

                void main() {
                    gl_Position = u_MvpMatrix * a_Position;
                    gl_PointSize = a_PointSize;
                    v_Color = a_Color;
                }
            `;
            // 片元着色器
            let FSHADER_SOURCE = `
                precision mediump float;

                varying vec4 v_Color;

                void main() {
                    // gl_PointCoord表示片元在所属点内的坐标（值在0.0~1.0之间），点中心的坐标是(0.5, 0.5)
                    float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); // 计算片元所在位置和点中心的距离
                    if (dist < 0.5) { // 在要切割的圆内
                        gl_FragColor = v_Color;
                    } else {
                        discard; // 不在圆范围内的片元做放弃操作
                    }
                }
            `;

            let canvas = document.getElementById('rounded-point');
            if (!canvas) {
                console.error('canvas的dom结构获取失败');
                return;
            }
            let gl = getWebGLContext(canvas);
            if (!gl) {
                console.error('webGL上下文获取失败');
                return;
            }
            if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
                console.error('着色器初始化失败');
                return;
            }
            let n = this.initVertexBuffers(gl);
            this.matrixHandle(gl, canvas);
            this.draw(gl, n);
        },
        draw(gl, n) {
            gl.clearColor(0.91, 0.67, 0.81, 1);
            // 使用预设值来清空缓冲
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawElements(gl.POINTS, n, gl.UNSIGNED_BYTE, 0);
        },
        matrixHandle(gl, canvas) {
            let mvpMatrix = new Matrix4();
            mvpMatrix.setPerspective(
                50,
                canvas.width / canvas.height,
                1,
                100,
            );
            mvpMatrix.lookAt(
                3, 3, 3,
                0, 0, 0,
                0, 1, 0,
            );
            let u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
            if (u_MvpMatrix < 0) {
                console.error('获取u_MvpMatrix下标失败');
                return;
            }
            gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
        },
        initVertexBuffers(gl) {
            let vertexAxis = [
                1.0, 0.0, 1.0,
                0.5, 1.0, 0.5,
                -0.5, -1.0, -1.0,
            ];

            // 颜色
            let pink = [ 0.98, 0.88, 0.93 ],
                yellow = [ 1.0, 1.0, 0.0 ],
                blue = [ 0.0, 0.8, 1.0 ];
            let colors = [ ...pink, ...yellow, ...blue ];
            let size = [ 20.0, 30.0, 40.0 ];
            let index = [ 0, 1, 2 ];
            this.initArrayBuffer(gl, vertexAxis, 'a_Position');
            this.initArrayBuffer(gl, colors, 'a_Color');
            this.initArrayBuffer(gl, size, 'a_PointSize', 1);
            this.initElementArrayBuffer(gl, index);
            return index.length;
        },
        initArrayBuffer(gl, data, attr, size = 3) {
            let array = new Float32Array(data, 0, data.length);
            let buffer = gl.createBuffer();
            if (!buffer) {
                console.error('顶点属性缓冲对象创建失败');
                return;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
            let location = gl.getAttribLocation(gl.program, attr);
            if (location < 0) {
                console.error('获取顶点属性'+ attr +'的储存下标失败');
                return;
            }
            gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(location);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        },
        initElementArrayBuffer(gl, data) {
            let array = new Uint8Array(data, 0, data.length);
            let buffer = gl.createBuffer();
            if (!buffer) {
                console.error('顶点索引缓冲对象创建失败');
                return;
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, array, gl.STATIC_DRAW);
        },
    }
}
</script>

<style>

</style>