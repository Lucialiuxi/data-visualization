<template>
  <div class="z-fight-wrap">
    <canvas id="z-fight" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { getWebGLContext, initShaders } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';

/**
 * 深度冲突ZFighting：
 *  描述：当几何图形或物体的两个表面极为接近时，就会出现新的问题，使得表面看上去斑斑驳驳。
 *  解决： 多边形偏移
 * 
 * 多边形偏移：
 *  1.启动多边形偏移： gl.enable(gl.POLYGON_OFFSET_FILL);
 *  2.在绘制之前指定用来计算偏移量的参数： gl.polygonOffset(factor, units);
 * 
 * gl.polygonOffset(factor, units);
 * factor 为每个多边形设置可变深度偏移的比例因子，默认为0
 * units 设置乘数，具体实现值与该乘数相乘以创建恒定的深度偏移，默认为0
 * 
 * 投影视图矩阵 = 投影矩阵 * 视图矩阵 * 顶点坐标
 */

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

                uniform mat4 u_ViewProjMatrix; // 视图投影矩阵

                void main() {
                    gl_Position = u_ViewProjMatrix * a_Position;
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

            let canvas = document.getElementById('z-fight');
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
            // 视图透视投影矩阵
            const viewProjMatrix = new Matrix4();

            viewProjMatrix.setPerspective(
                30,
                canvas.width/canvas.height,
                1,
                100,
            );

            // 设置 视点、观察目标点 和 上方向
            viewProjMatrix.lookAt(
                2.06, 2.5, 10.0, // 视点
                0, 0, -2, // 观察目标点
                0, 1, 0, // 上方向
            );

            let u_ViewProjMatrix = gl.getUniformLocation(gl.program, 'u_ViewProjMatrix'); 
            gl.uniformMatrix4fv(u_ViewProjMatrix, false, viewProjMatrix.elements);

            gl.clearColor(0.1, 0.2, 0.4, 1.0);

            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.POLYGON_OFFSET_FILL);
            // 在绘制之前清除深度缓冲区【同时清除任意两个缓冲区时，都可以使用按位符|连接参数】
            gl.clear(gl.DEPTH_OFFSET_FILL | gl.COLOR_BUFFER_BIT);

            // 注释这三行可以看出来深度冲突
            gl.drawArrays(gl.TRIANGLES, 0, n/2);
            gl.polygonOffset(1.0, 1.0);
            gl.drawArrays(gl.TRIANGLES, n/2, n/2);


            // gl.drawArrays(gl.TRIANGLES, 0, n);
        },
        // 初始化缓冲区对象
        initVertexBuffer(gl) {
            // 顶点个数 
            let n = 6;

             const trianglesAxis = [
                // 绿色三角形
                 0.0, 1.5, -0.4, 0.0, 1.0, 0.0,
                 -1.5, -1.5, -0.4, 0.0, 0.0, 1.0,
                 1.5, -1.5, -0.4, 0.0, 1.0, 0.0,

                // 黄色三角形
                0.0, 2.0, -0.4, 1.0, 0.0, 0.0, // x, y, z, r, g, b
                -2.0, -2.0, -0.4, 1.0, 1.0, 0.0,
                2.0, -2.0, -0.4, 1.0, 1.0, 0.0,
            ];
            // 顶点位置
            let vertices = new Float32Array(trianglesAxis);

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
    }
}
</script>

<style>

</style>