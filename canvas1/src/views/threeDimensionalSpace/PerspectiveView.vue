<template>
  <div class="perspective-projection-view-wrap">
    <canvas id="perspective-projection-view" height="600" width="600"></canvas>
  </div>
</template>

<script>

import { getWebGLContext, initShaders } from '@lib/cuon-utils';
import Matrix4 from '@lib/cuon-matrix';

/**
 * Matrix4.setPerspective(fov, aspect, near, far)
 * fov      指定垂直视角，即可视空间顶面和底面间的夹角，必须大于0
 * aspect   指定裁剪面的宽高比（宽度/高度）
 * near/far 指定近裁剪面和远裁剪面的位置， 即可视空间的近边界和远边界（near和far都必须大于0）
 */
export default {
    mounted() {
        this.initCanvasHandle();
    },
    methods: {
        initCanvasHandle() {
            // 顶点着色器
            let VSHADER_SOURCE = `
                precision mediump float;

                attribute vec4 a_Position;
                attribute vec4 a_Color;

                varying vec4 v_Color;

                uniform mat4 a_PerspectiveMatrix; // 透视投影矩阵
                uniform mat4 a_ViewMatrix; // 视图矩阵

                void main() {
                    gl_Position = a_PerspectiveMatrix * a_ViewMatrix * a_Position;
                    v_Color = a_Color;
                }
            `;

            // 片元着色器
            let FSHADER_SOURCE = `
                precision mediump float;

                varying vec4 v_Color;
                
                void main() {
                    gl_FragColor = v_Color;
                }
            `;

            let canvas = document.getElementById('perspective-projection-view');
            let gl = getWebGLContext(canvas);

            if (!gl) {
                console.error('获取webGL上下文失败');
                return;
            }
            if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
                console.error('着色器初始化失败');
                return;
            }
            
            let n = this.initVertexBuffer(gl);
            if(n < 0) {
                console.error('顶点缓冲器创建失败');
                return;
            }
            // 视图矩阵
            let viewMatrix = new Matrix4();
            let a_ViewMatrix = gl.getUniformLocation(gl.program, 'a_ViewMatrix');
            gl.uniformMatrix4fv(a_ViewMatrix, false, viewMatrix.elements);

            // 透视投影矩阵
            let perspectiveMatrix = new Matrix4();
            let a_PerspectiveMatrix = gl.getUniformLocation(gl.program, 'a_PerspectiveMatrix');
            gl.uniformMatrix4fv(a_PerspectiveMatrix, false, perspectiveMatrix.elements);
            perspectiveMatrix.setPerspective(
                30, // 垂直视角
                canvas.width/canvas.height, // aspect宽高比应与canvas的宽高比一直，才不会导致图片变形
                1, // near
                100, // far
            )

            gl.clearColor(0.1, 0.2, 0.4, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.drawArrays(gl.TRIANGLES, 0, n);
        },
        initVertexBuffer(gl) {
            let n = 18; // 总的6个三角形 排成2列

            let leftTriangles = [
                // 绿色三角形 在最前面
                0.75, 1.0, -0.4, 0.4, 1.0, 0.4, // xyz rgb
                0.25, -1.0, -0.4, 0.4, 1.0, 0.4,
                1.25, -1.0, -0.4, 1.0, 0.4, 0.4,

                // 黄色三角形
                0.75, 1.0, -0.2, 1.0, 1.0, 0.4,
                0.25, -1.0, -0.2, 1.0, 1.0, 0.4,
                1.25, -1.0, -0.2, 1.0, 0.4, 0.4,

                // 蓝色三角形在最前面
                0.75, 1.0, 0.0, 0.4, 0.4, 1.0,
                0.25, -1.0, 0.0, 0.4, 0.4, 1.0,
                1.25, -1.0, 0.0, 1.0, 0.4, 0.4,
            ];
            let rightTriangles = [
                // 绿色三角形 在最前面
                -0.75, 1.0, -0.4, 0.4, 1.0, 0.4,
                -0.25, -1.0, -0.4, 0.4, 1.0, 0.4,
                -1.25, -1.0, -0.4, 1.0, 0.4, 0.4,

                // 黄色三角形
                -0.75, 1.0, -0.2, 1.0, 1.0, 0.4,
                -0.25, -1.0, -0.2, 1.0, 1.0, 0.4,
                -1.25, -1.0, -0.2, 1.0, 0.4, 0.4,

                // 蓝色三角形在最前面
                -0.75, 1.0, 0.0, 0.4, 0.4, 1.0,
                -0.25, -1.0, 0.0, 0.4, 0.4, 1.0,
                -1.25, -1.0, 0.0, 1.0, 0.4, 0.4,
            ];
            let vertices = new Float32Array([
                ...leftTriangles,
                ...rightTriangles,
            ], 0, n * 6);

            let FSIZE = vertices.BYTES_PER_ELEMENT;

            let vertexBuffer = gl.createBuffer();
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