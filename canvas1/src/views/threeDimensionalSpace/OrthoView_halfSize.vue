<template>
  <div class="orthographic-view-half-size-wrap">
    <canvas id="orthographic-view-half-size" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { getWebGLContext, initShaders } from '@lib/cuon-utils.js';
import Matrix from '@lib/cuon-matrix.js';

/**
 * 如果可视空间 近 裁剪面的宽高比 与canvas不一样， 显示出的物体就会被压缩变形
 */
export default {
    data() {
        return {
            // 观察者视点的坐标
            eyeX: 0.20,
            eyeY: 0.25,
            eyeZ: 0.25,
        }
    },
    mounted() {
        this.initCanvas();
    },
    methods: {
        initCanvas() {
            // 顶点着色器
            let VSHADER_SOURCE = `
                precision mediump float;

                attribute vec4 a_Position;

                attribute vec4 a_Color;
                varying vec4 v_Color;

                uniform mat4 u_ViewMatrix; // 视图矩阵
                uniform mat4 u_OrthoProjMatrix; // 正射投影矩阵

                void main () {
                    gl_Position = u_OrthoProjMatrix * u_ViewMatrix * a_Position;
                    v_Color = a_Color;
                }
            `;
            // 片元着色器
            let FSHADER_SOURCE = `
                precision mediump float;

                varying vec4 v_Color;

                void main () {
                    gl_FragColor = v_Color;
                }
            `;

            let canvas = document.getElementById('orthographic-view-half-size');
            let gl = getWebGLContext(canvas);

            if(!gl) {
                console.error('获取webGL上下文失败');
                return;
            }

            if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
                console.error('着色器初始化失败');
                return;
            }
            let n = this.initVertexBuffer(gl);

            if (n < 0) {
                console.error('缓冲区对象创建失败');
                return;
            }

            // 正射投影矩阵
            let orthoProjMatrix = new Matrix();
            let u_OrthoProjMatrix = gl.getUniformLocation(gl.program, 'u_OrthoProjMatrix');
            orthoProjMatrix.setOrtho(-1.0, 1.0, -1.0, 1.0, 0.0, 1.0); // 正常的展示
           
            // orthoProjMatrix.setOrtho(-0.5, 0.5, -0.5, 0.5, 0, 0.5); 
            // orthoProjMatrix.setOrtho(
            //     -0.3, 0.3, // 左右
            //     -1.0, 1.0, // 下上
            //     0, 0.5, // 近远
            // ); 
            // orthoProjMatrix.setOrtho(
            //     -1.0, 1.0, // 左右
            //     -1.0, 1.0, // 下上
            //     0, 0.5, // 近远
            // ); 
            // orthoProjMatrix.setOrtho(
            //     -1.0, 1.0, // 左右
            //     -0.5, 0.5, // 下上
            //     0.0, 1.0, // 近远
            // );

            gl.uniformMatrix4fv(u_OrthoProjMatrix, false, orthoProjMatrix.elements);

            // 视图矩阵
            let viewMatrix = new Matrix();
            let u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');

            this.draw(gl, n, viewMatrix, u_ViewMatrix);
            document.onkeydown = (ev) => this.onKeyDown(ev, gl, n, viewMatrix, u_ViewMatrix);
        },
        // 创建顶点缓冲对象
        initVertexBuffer(gl) {
            let n = 9; // 三角形的顶点个数
            // 绿色三角形 在最后面
            const triangle1 = [
                0.0, 0.6, -0.4, 0.4, 1.0, 0.4, // x, y, z, r, g, b
                -0.5, -0.4, -0.4, 0.4, 1.0, 0.4,
                0.5, -0.4, -0.4, 1.0, 0.5, 0.4,
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
                0.5, -0.5, 0.0, 1.0, 0.4, 1.0,
            ];
            let len = triangle1.length + triangle2.length + triangle3.length;
            let vertices = new Float32Array([
                ...triangle1, ...triangle2, ...triangle3
            ], 0, len);

            // 强类型数组中每个元素所占用的字节数 
            const FSIZE = vertices.BYTES_PER_ELEMENT;

            let vertexBuffer = gl.createBuffer();
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
        // 键盘事件
        onKeyDown(ev, gl, n, viewMatrix, u_ViewMatrix) {
            let { keyCode } = ev;
            let { eyeX, eyeY } = this;
            switch(keyCode) {
                case 37: // left
                    this.eyeX -= 0.01;
                break;

                case 38: // up
                    this.eyeY += 0.01;
                break;

                case 39: // right
                    this.eyeX += 0.01;
                break;

                case 40: // down
                    this.eyeY -= 0.01;
                break;
            }

            if (this.eyeX !== eyeX || this.eyeY !== eyeY) {
                this.draw(gl, n, viewMatrix, u_ViewMatrix);
            }
        },
        // 绘制阶段
        draw(gl, n, viewMatrix, u_ViewMatrix) {
            viewMatrix.setLookAt(
                this.eyeX, this.eyeY, this.eyeZ,
                0, 0, 0, // 观察目标点
                0, 1, 0, // 上方向
            );
            gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

            gl.clearColor(0.1, 0.2, 0.3, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // gl.drawArrays(mode, first, count);
            gl.drawArrays(gl.TRIANGLES, 0, n);
        }
    },
}
</script>

<style>

</style>