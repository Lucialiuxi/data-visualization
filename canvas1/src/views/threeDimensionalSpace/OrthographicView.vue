<template>
  <div class="look-at-triangles-wrap">
    <canvas id="look-at-triangles" height="600" width="600"></canvas>
    <p id="nearFar">near 和 far的值展示在这儿</p>
  </div>
</template>

<script>
import { getWebGLContext, initShaders } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';

/**
 * 设置盒装可视空间【正射投影orthographic projection】
 * 注册键盘事件， 按方向键改变可是空间大小
 * 左方向键 near递增0.01
 * 右方向键 near递减 0.01
 * 上方向键 far递增0.01
 * 下方向键 far递减0.01
 * 
 * 本例 将视点置于原点处，视线为Z轴负方向
 */

export default {
    data() {
        return {
            gl_near: 0.0,
            gl_far: 0.5,
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

                uniform mat4 u_ProjMatrix; // 投影矩阵

                void main() {
                    gl_Position = u_ProjMatrix * a_Position;
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

            let nf = document.getElementById('nearFar');
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
            const projMatrix = new Matrix4();

            let u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
            this.drawHandle(gl, n, u_ProjMatrix, projMatrix, nf);
            document.onkeydown = (ev) => this.onKeyDown(ev, gl, n, u_ProjMatrix, projMatrix, nf);
        },
        // 初始化缓冲区对象
        initVertexBuffer(gl) {
             // 绿色三角形 在最后面
             const triangle1 = [
                0.0, 0.5, -0.4, 0.4, 1.0, 0.4, // x, y, z, r, g, b
                -0.5, -0.5, -0.4, 0.4, 1.0, 0.4,
                0.5, -0.5, -0.4, 1.0, 0.4, 0.4,
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
                -0.5, -0.5, 0.0, 0.4, 0.4, 1.0,
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
        onKeyDown(ev, gl, n, u_ProjMatrix, Matrix, nf) {
            let changeValue = 0.01;
            if (ev.keyCode == 39) { // 右键
                this.gl_far += changeValue;
            } else if (ev.keyCode == 37) {// 左键
                this.gl_far -= changeValue;
            } else if(ev.keyCode == 38){ // 上键
                this.gl_near += changeValue;
            } else if(ev.keyCode == 40){ // 下键
                this.gl_near -= changeValue;
            } else {
                return;
            }

            this.drawHandle(gl, n, u_ProjMatrix, Matrix, nf);
        },
        drawHandle(gl, n, u_ProjMatrix, Matrix, nf) {
            let { gl_near, gl_far } = this;
            Matrix.setOrtho(-1, 1, -1, 1, gl_near, gl_far);
            gl.uniformMatrix4fv(u_ProjMatrix, false, Matrix.elements);

            gl.clearColor(0.1, 0.2, 0.3, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            gl.drawArrays(gl.TRIANGLES, 0, n);
            nf.innerHTML = `near: ${gl_near}  far: ${gl_far}`;
        }
    }
}
</script>

<style>

</style>