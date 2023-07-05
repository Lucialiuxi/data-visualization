<template>
  <div class="hello-cube-wrap">
    <canvas id="hello-cube" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { getWebGLContext, initShaders } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';

export default {
    mounted() {
        this.paint();
    },
    methods: {
        paint() {
            let VSHADER_SOURCE =  `
                precision mediump float;

                attribute vec4 a_Position;
                uniform mat4 u_ViewProjMatrix; // 透视投影视图矩阵

                attribute vec4 a_Color;
                varying vec4 v_Color;

                void main() {
                    gl_Position = a_Position;
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

            let viewProjMatrix = new Matrix4();
            viewProjMatrix.setPerspective(
                50,
                canvas.width/canvas.hight,
                1,
                100,
            );
            viewProjMatrix.lookAt(
                  5, 5, 5, // 视点
                  0, 0, -100, // 目标点
                  0, 1, 0, // 上方向
            );
            let u_ViewProjMatrix = gl.getUniformLocation(gl.program, 'u_ViewProjMatrix');
            gl.uniformMatrix4fv(u_ViewProjMatrix, false, viewProjMatrix.elements);

            gl.clearColor(0.1, 0.2, 0.3, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
        },
        initVertexBuffer(gl) {
            let n = 4;
            let vertices = new Float32Array(n * 6);
            vertices.set([
                -0.1, 0.1, 0.0, 0.0, 1.0 ,0.0, 
                -0.1, -0.1, 0.0, 0.0, 0.0, 1.0,
                0.1, 0.1, 0.0, 1.0, 0.0, 0.0,
                0.1, -0.1, 0.0, 0.1, 0.2, 0.3,
            ]);

            const FSIZE = gl.BYTES_PER_ELEMENT;
            let vertexBuffer  = gl.createBuffer();
            if (!vertexBuffer) {
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