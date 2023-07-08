<template>
  <div class="hello-cube-triangles-wrap">
    <canvas id="hello-cube-triangles" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { getWebGLContext, initShaders } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js'
export default {
    mounted() {
        this.paint()
    },
    methods: {
        paint() {
            // 顶点着色器
            let VSHADER_SOURCE = `
                precision mediump float;

                attribute vec4 a_Position;
                attribute vec4 a_Color;

                varying vec4 v_Color;

                uniform mat4 u_ViewMatrix; // 视图矩阵
                uniform mat4 u_ProjMatrix; // 透视投影矩阵

                void main() {
                    gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;
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

            let canvas = document.getElementById('hello-cube-triangles');
            let gl = getWebGLContext(canvas);

            if(!gl) {
                console.error('获取webGL上下文失败');
                return;
            }
            if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
                console.error('着色器初始化失败');
                return;
            }

            // 透视投影矩阵
            let projMatrix = new Matrix4();
            // 视图矩阵
            let viewMatrix = new Matrix4();
            viewMatrix.setLookAt(
                5, 5, 25, // 观察者视点
                0, 0, -100, // 目标点
                0, 1, 0,// 上方向
            );
            projMatrix.setPerspective(
                30, // 角度
                canvas.width/canvas.height,
                1, // near
                100, // far
            );
            let u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
            let u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
            gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
            gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

            let n = this.initVertexBuffers(gl);
            if (n < 0) {
                console.error('顶点着色器创建失败');
                return;
            }

            gl.enable(gl.DEPTH_TEST); // 深度冲突
            gl.clearColor(0.1, 0.2, 0.3, 1.0);
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

            /**
             * gl.drawElements(mode, count, type, offset)
             */
            gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
        },
        initVertexBuffers(gl) {
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
            // x y z r g b
            let AxisColor = [
                1.0, 1.0, 1.0, 1.0, 1.0, 1.0, // v0
                -1.0, 1.0, 1.0, 0.67, 0, 0.73, // v1
                -1.0, -1.0, 1.0, 1.0, 0.0, 0.0, // v2
                1.0, -1.0, 1.0, 1.0, 1.0, 0.0, // v3
                1.0, -1.0, -1.0, 0.0, 0.62, 0.42, // v4
                1.0, 1.0, -1.0, 0.4, 0.6, 0.6, // v5
                -1.0, 1.0, -1.0, 0.0, 0.0, 1.0, // v6
                -1.0, -1.0, -1.0, 0.0, 0.0, 0.0, // v7
            ];
            
            let vertices = new Float32Array(AxisColor, 0, AxisColor.length);
            let FSIZE = vertices.BYTES_PER_ELEMENT;

            let vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
            let a_Color = gl.getAttribLocation(gl.program, 'a_Color');

            gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
            gl.enableVertexAttribArray(a_Position);

            gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
            gl.enableVertexAttribArray(a_Color);

            let vertexIndex = [
                0, 1, 2, 0, 2, 3, // 正面
                5, 6, 7, 5, 7, 4, // 背面
                1, 2, 7, 1, 7, 6, // 左面
                0, 3, 4, 0, 4, 5, // 右面
                0, 5, 6, 0, 6, 1, // 上面
                7, 2, 3, 7, 3, 4,// 下面
            ];
            let n = vertexIndex.length;
            let vertexIndexArray = new Uint8Array(vertexIndex, 0, n);
            let indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexIndexArray, gl.STATIC_DRAW);
            return n;
        }
    }
}
</script>

<style>

</style>