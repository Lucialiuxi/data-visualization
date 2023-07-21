<template>
  <div>
    <p>漫反射-点光源光</p>
    <canvas id="point-lighted-cube" height="600" width="600"></canvas>
  </div>
</template>

<script>
/**
 * 环境反射光颜色 = 环境光颜色 * 表面基底色
 * 表面的反射光颜色 = 漫反射光颜色 + 环境反射光颜色
 * 
 * 计算变换后的法向量：
 * 1.在片元做色漆中申明法向量矩阵u_NormalMatrix
 * 2.求逆转矩阵 Matrix4.setInverseOf(m)
 * 3.对逆转矩阵进行转置 Matrix4.transpose()
 */

import { getWebGLContext, initShaders } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';

export default {
    data() {
        return {
            rotateAngle: 10,
        }
    },
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

                uniform mat4 u_ModelMatrix; // 模型矩阵
                uniform mat4 u_MvpMatrix; // 模型视图投影矩阵
                uniform mat4 u_NormalMatrix; // 法向量变换矩阵

                uniform vec3 u_LightColor; // 入射光颜色
                uniform vec3 u_AmbientColor; // 环境光颜色
                uniform vec3 u_LightPosition; // 点光源位置

                varying vec4 v_Color;

                void main(){
                    gl_Position = u_MvpMatrix * a_Position;

                    // 计算变换后的法向量 并归一化
                    vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal)); 

                    // 计算顶点的世界坐标
                    vec4 vertexPosition = u_ModelMatrix * a_Position;

                    // 光线方向 = 光源坐标 - 顶点坐标
                    vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));

                    // 计算光线方向和法向量的点积。内置函数dot：计算点积；内置函数max：比较大小，返回最小值
                   float LDotN = max(dot(lightDirection.xyz, normal), 0.0); // 点积小于0，意味着入射角大于90度，入射角大于90度说明光线照射在表面的背面

                   // 环境反射光颜色 = 环境光颜色 * 表面基底色
                   vec3 ambientReflectColor = u_AmbientColor * a_Color.rgb;

                   // 计算漫反射光的颜色
                   vec3 diffuseColor = u_LightColor * vec3(a_Color) * LDotN;
                   
                   // 表面发射光颜色 = 漫反射光颜色+环境反射光颜色
                   v_Color = vec4(diffuseColor + ambientReflectColor, a_Color.a);
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
            this.lightHandle(gl);
            this.animate(gl, canvas, n);
        },
        animate(gl, canvas, n) {
            this.timer = setInterval(() => {

                this.rotateAngle++;
                this.matrixHandle(gl, canvas);
                gl.clearColor(0.95, 0.74, 0.8, 1);

                // 开启隐藏面消除功能
                gl.enable(gl.DEPTH_TEST);
                gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

                /**
                 *  gl.drawElements(mode, count, type, offset)
                 *  mode 指定要渲染的图元类型
                 *  count 要渲染的元素数量
                 *  type 指定元素数组缓冲区中的值的类型
                 *  offset 指定元素数组缓冲区中的偏移量
                 */
                gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

            }, 50);
        },
        lightHandle(gl) {
            // 入射光颜色
            let u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
            gl.uniform3f(u_LightColor, 1, 1, 1);// 光线颜色设置为白色
            
            // 环境光颜色
            let u_AmbientColor = gl.getUniformLocation(gl.program, 'u_AmbientColor');
            gl.uniform3f(u_AmbientColor, 0.2, 0.2, 0.2);

            // 点光源的世界坐标
            let u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightDirection');
            gl.uniform3f(u_LightPosition, 0.0, 3.0, 4.0);
        },
        matrixHandle(gl, canvas) {
            let modelMatrix = new Matrix4(); // 模型矩阵【设置旋转、平移、缩放】
            let mvpMatrix = new Matrix4(); //  模型视图投影矩阵【设置可视空间、组合视图和模型矩阵】
            let normalMatrix = new Matrix4(); // 法向量变换矩阵

            // 计算模型矩阵
            modelMatrix.setRotate(this.rotateAngle, 1, 1, 1); // 绕z轴旋转90°
            mvpMatrix.setPerspective(
                30,
                canvas.width/canvas.height,
                1,
                100,
            );
            mvpMatrix.lookAt(
                -3, -3, 13,
                0, 0, 0,
                0, 1, 0,
            );

            mvpMatrix.multiply(modelMatrix);

            // 求mvpMatrix得逆转矩阵
            normalMatrix.setInverseOf(mvpMatrix);
            // 对modelMatrix进行转置
            normalMatrix.transpose();

            let u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
            gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

            let u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
            gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

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
            behind = [ 0.0, 0.0, -1.0];
            // 每个面的法向量[一个平面只有一个法向量]
            let normals = [
                ...front, ...front, ...front, ...front,

                ...right, ...right, ...right, ...right, 

                ...top, ...top, ...top, ...top,

                ...left, ...left, ...left,  ...left, 

                ...bottom, ...bottom, ...bottom, ...bottom, 

                ...behind, ...behind, ...behind, ...behind,
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
/**
 * 发现的问题：
 *  1、不能值列举8个顶点坐标，用索引排列来画立方体，法向量无法跟顶面对应，需要对应每个面。
 *  2、三维图形再绘制之前必须消除隐藏面，否则视觉上会出现错乱
 *  3、必须加上环境光颜色，否则只有光照方向的面会显示正确的颜色
 *  4、要非常注意着色器中的矢量、矩阵的类型，同类型的才能进行加减，对同类型的矢量或矩阵计算后赋值的申明类型也要相同
 * 
 */
</script>

<style>

</style>