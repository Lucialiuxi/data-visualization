<template>
  <div>
    <p>漫反射-点光源光-逐片元</p>
    <canvas id="point-lighted-cube-per-fragment" height="600" width="600"></canvas>
  </div>
</template>
<script>
import { initShaders, getWebGLContext } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';

export default {
    mounted(){
        this.paint();
    },
    methods: {
        paint() {
            let VSHADER_SOURCE = `
                precision mediump float;
                
                attribute vec4 a_Position;
                attribute vec4 a_Color;

                uniform mat4 u_MvpMatrix; // 模型视图投影矩阵

                varying vec4 v_Color;

                void main () {
                    gl_Position = u_MvpMatrix * a_Position;
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
            
            let canvas = document.getElementById('point-lighted-cube-per-fragment');
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

            gl.clearColor(0.4, 0.6, 0.9, 1.0);
            // 消除隐藏面
            gl.enable(gl.DEPTH_TEST);

            // 启动多边形位移
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.polygonOffset(0.01, 0.01);

            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            
            gl.drawElements(gl.TRIANGLE_STRIP, 8, gl.UNSIGNED_BYTE, 0);
            gl.drawElements(gl.TRIANGLE_STRIP, 8, gl.UNSIGNED_BYTE,  n/6 * 2);
            gl.drawElements(gl.TRIANGLE_STRIP, 8, gl.UNSIGNED_BYTE, n/6 * 4);
        },
        // 光照相关
        lightEffect(gl) {

        },
        // 矩阵相关
        matrixHandle(gl, canvas) {
            let mvpMatrix = new Matrix4();
            mvpMatrix.setPerspective(
                30,
                canvas.width/canvas.height,
                1,
                100,
            );
            mvpMatrix.lookAt(
                3, 3, 7,
                0, 0, 0,
                0, 1, 0,
            );

            let u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
            if (u_MvpMatrix < 0) {
                console.error('获取 u_MvpMatrix 下标失败');
                return;
            }
            gl.uniformMatrix4fv(u_MvpMatrix, false,  mvpMatrix.elements);
        },
        // 创建顶点缓冲对象
        initVertexBuffers(gl) {
            // 顶点坐标
            let v0 = [ 1.0, 1.0, 1.0 ],
                v1 = [ -1.0, 1.0, 1.0 ],
                v2 = [ -1.0, -1.0, 1.0 ],
                v3 = [ 1.0, -1.0, 1.0 ],
                v4 = [ 1.0, -1.0, -1.0 ],
                v5 = [ 1.0, 1.0, -1.0 ],
                v6 = [ -1.0, 1.0, -1.0 ],
                v7 = [ -1.0, -1.0, -1.0 ];
            // 每个面的顶点排序
            let vertexAxis = [
                // 正面 1203
                ...v1, ...v2, ...v0, ...v3,
                // 背面 6754
                ...v6, ...v7,...v5, ...v4, 
                // 左面 2716
                ...v2, ...v7,...v1, ...v6, 
                // 右面 3405
                ...v3, ...v4,...v0, ...v5, 
                // 顶面 1605
                ...v1, ...v6,...v0, ...v5,
                // 底面 2734
                ...v2, ...v7,...v3, ...v4, 
            ];
            let pink = [ 0.98, 0.88, 0.93 ],
                red = [ 1.0, 0.0, 0.0 ],
                yellow = [ 1.0, 1.0, 0.0 ],
                blue = [ 0.0, 0.8, 1.0 ],
                // 青色
                cyan = [ 0.4, 0.6, 0.6 ],
                green = [ 0.13, 0.7, 0.67 ];
            let colors = [
                ...pink, ...pink, ...pink, ...pink,
                ...red, ...red, ...red, ...red,
                ...yellow, ...yellow, ...yellow, ...yellow,
                ...blue, ...blue, ...blue, ...blue,
                ...cyan, ...cyan, ...cyan, ...cyan,
                ...green, ...green, ...green, ...green,
            ];
            // 索引
            let indices = [
                0, 1, 2, 3,
                4, 5, 6, 7,
                8, 9, 10, 11,
                12, 13, 14, 15,
                16, 17, 18, 19, 
                20, 21, 22, 23,
            ];

            this.initArrayBuffer(gl, vertexAxis, 'a_Position');
            this.initArrayBuffer(gl, colors, 'a_Color');
            this.initElementArrayBuffer(gl, indices);
            return indices.length;
        },
        // 创建顶点属性的缓冲对象
        initArrayBuffer(gl, array, attr) {
            let typeArray = new Float32Array(array, 0, array.length);
            let buffer = gl.createBuffer();
            if (!buffer) {
                console.error('顶点属性缓冲对象创建失败');
                return;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, typeArray, gl.STATIC_DRAW);
            let vertexAttrib = gl.getAttribLocation(gl.program, attr);
            if (vertexAttrib < 0) {
                console.error('获取属性 '+ attr +' 的下标失败');
                return;
            }
            gl.vertexAttribPointer(vertexAttrib, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vertexAttrib);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        },
        // 创建元素索引的缓冲对象
        initElementArrayBuffer(gl, array) {
            let typeArray = new Uint8Array(array, 0, array.length);
            let buffer = gl.createBuffer();
            if (!buffer) {
                console.error('元素索引的缓冲对象创建失败');
                return;
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, typeArray, gl.STATIC_DRAW);
        }
    }
}
</script>

<style>

</style>