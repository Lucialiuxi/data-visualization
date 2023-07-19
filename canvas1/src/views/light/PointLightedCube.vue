<template>
  <div>
    <p>漫反射-点光源光</p>
    <canvas id="point-lighted-cube" height="600" width="600"></canvas>
  </div>
</template>

<script>

import { getWebGLContext, initShaders } from '@lib/cuon-utils.js';
import Matrix4, { Vector3 } from '@lib/cuon-matrix.js';

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
                attribute vec4 a_Normal; // 法向量

                uniform mat4 u_MvpMatrix; // 模型视图投影矩阵

                uniform vec3 u_LightColor; // 入射光颜色
                uniform vec3 u_LightDirection; // 入射光方向【归一化的世界坐标】

                varying vec4 v_Color;

                void main(){
                    gl_Position = u_MvpMatrix * a_Position;

                    // 归一化法向量
                    vec3 normal = normalize(vec3(a_Normal));

                    // 光线方向和法线方向的点积
                    float dotLN = max(dot(u_LightDirection, normal), 0.0);

                    vec3 diffuseColor = u_LightColor * a_Color.rgb * dotLN;

                    v_Color = vec4(diffuseColor, a_Color.a);
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

            let canvas = document.getElementById('point-lighted-cube');
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
            this.lightHandle(gl);

            gl.clearColor(0.2, 0.2, 0.5, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            /**
             *  gl.drawElements(mode, count, type, offset)
             *  mode 指定要渲染的图元类型
             *  count 要渲染的元素数量
             *  type 指定元素数组缓冲区中的值的类型
             *  offset 指定元素数组缓冲区中的偏移量
             */
            gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
        },
        lightHandle(gl) {
            let u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
            gl.uniform3f(u_LightColor, 1, 1, 1);
            
            // 法线方向
            let u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
            let lightDirection = new Vector3([0.5, 4.0, 5.0]);
            lightDirection.normalize();
            gl.uniform3fv(u_LightDirection, lightDirection.elements);
        },
        matrixHandle(gl, canvas) {
            // let modelMatrix = new Matrix4(); // 模型矩阵【处理旋转、平移、缩放等】
            let mvpMatrix = new Matrix4(); //  模型视图投影矩阵【设置可视空间、组合视图和模型矩阵】
            // let normalMatrix = new Matrix4(); // 法向量矩阵
            mvpMatrix.setPerspective(
                30,
                canvas.width/canvas.height,
                1,
                100,
            );
            mvpMatrix.lookAt(
                -3, -3, 7,
                0, 0, 0,
                0, 1, 0,
            );

            let u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
            gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
        },
        initVertexBuffers(gl) {
            // 立方体每个点的坐标
            let v0 = [ 1.0, 1.0, 1.0 ],
                v1 = [ -1.0, 1.0, 1.0 ],
                v2 = [ -1.0, -1.0, 1.0 ],
                v3 = [ 1.0, -1.0, 1.0 ],
                v4 = [ 1.0, -1.0, -1.0 ],
                v5 = [ 1.0, 1.0, -1.0 ],
                v6 = [ -1.0, 1.0, -1.0 ],
                v7 = [ -1.0, -1.0, -1.0 ];

             // 顶点坐标
             let vertexAxis = [
                // 正面
                ...v0, ...v1, ...v2, ...v3,
                // 右面
                ...v0, ...v3, ...v4,...v5,
                // 上面
                ...v0, ...v5, ...v6, ...v1,
                // 左面
                ...v1, ...v6, ...v7, ...v2, 
                // 下面
                ...v7, ...v4, ...v3, ...v2,
                // 背面
                ...v4, ...v7, ...v6, ...v5,
            ];


            let magenta = [ 0.67, 0, 0.73 ],
                red = [ 1.0, 0.0, 0.0 ],
                yellow = [ 1.0, 1.0, 0.0 ],
                blue = [ 0.0, 0.0, 1.0 ],
                // 青色
                cyan = [ 0.4, 0.6, 0.6 ],
                green = [ 0.0, 0.62, 0.42 ]; 
            let colors = [ 
                ...magenta, ...magenta, ...magenta, ...magenta, 
                ...red, ...red, ...red, ...red, 
                ...yellow, ...yellow, ...yellow, ...yellow, 
                ...blue, ...blue, ...blue, ...blue, 
                ...cyan, ...cyan, ...cyan, ...cyan, 
                ...green, ...green, ...green, ...green, 
            ];
            // 每个面的法向量
            let top = [  0.0, 1.0, 0.0 ], 
                bottom = [ 0.0, -1.0, 0.0 ],
                left = [ -1.0, 0.0, 0.0 ],
                right = [ 1.0, 0.0, 0.0 ],
                front = [ 0.0, 0.0, 1.0 ],
                back = [ 0.0, 0.0, -1.0];
            // 法向量
            let normals = [
                ...front, ...front, ...front, ...front, 
                ...right, ...right, ...right, ...right, 
                ...top, ...top, ...top, ...top, 
                ...left, ...left, ...left, ...left, 
                ...bottom, ...bottom, ...bottom, ...bottom, 
                ...back, ...back, ...back, ...back, 
            ];
             // 索引
             let indices = [
                0, 1, 2,   0, 2, 3,    // front
                4, 5, 6,   4, 6, 7,    // right
                8, 9,10,   8,10,11,    // top
                12,13,14,  12,14,15,    // left
                16,17,18,  16,18,19,    // bottom
                20,21,22,  20,22,23     // back
            ];
            console.log(vertexAxis.length, colors.length, normals.length)


            let vertexArray = new Float32Array(vertexAxis, 0, vertexAxis.length);
            this.initArrayBuffer(gl, 'a_Position', vertexArray);

            let colorArray = new Float32Array(colors, 0, colors.length);
            this.initArrayBuffer(gl, 'a_Color', colorArray);

            let normalArray = new Float32Array(normals, 0, normals.length);
            this.initArrayBuffer(gl, 'a_Normal', normalArray);

            let indicesArray = new Uint8Array(indices, 0, indices.length);
            this.initElementArrayBuffer(gl, indicesArray);

            return indices.length;
        },
        initElementArrayBuffer(gl, data) {
            let buffer = gl.createBuffer();
            if (!buffer) {
                console.error('缓冲对象创建失败');
                return;
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
        },
        initArrayBuffer(gl, attr, data) {
            let buffer = gl.createBuffer();
            if (!buffer) {
                console.error('缓冲对象创建失败');
                return;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

            let vertexAttrib = gl.getAttribLocation(gl.program, attr);
            if (vertexAttrib < 0) {
                console.error('获取' + attr + '储存下标位置失败');
                return;
            }
            gl.vertexAttribPointer(vertexAttrib, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vertexAttrib);
            return;
        }
    }
}
</script>

<style>

</style>