<template>
  <div>
    <canvas id="joint-model" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { initShaders, getWebGLContext } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';

/**
 * 运动描述：
 *  大臂arm1旋转运动， 带动小臂arm2：上下方向键控制arm2绕joint1关节垂直转动
 *  小臂arm2绕肘关节运动，但不影响大臂arm1：左右方向键控制小臂arm2水平运动
 */
export default {
    mounted() {
        this.paint();
    },
    methods: {
        paint() {
            // 顶点着色器
            let VSHADER_SOURCE = `
                precision mediump float;

                attribute vec4 a_Position;
                attribute vec4 a_Color;
                attribute vec4 a_Normal; // 法向量

                uniform mat4 u_MvpMatrix; // 模型视图投影矩阵
                uniform mat4 u_ModelMatrix; // 模型矩阵
                uniform mat4 u_NormalMatrix; // 法向量变换矩阵

                uniform vec3 u_LightPosition; // 点光源坐标

                varying vec4 v_Color;
                varying vec3 v_Normal;
                varying vec3 v_LightDirection; // 点光源方向方向
                
                void main() {
                    gl_Position = u_MvpMatrix * a_Position;
                    
                    // 变换后的法向量
                    v_Normal = vec3(u_NormalMatrix * a_Normal);

                    // 点光源坐标是在世界坐标 所以要先把顶点坐标转化成世界坐标
                    vec3 vertexPosition = vec3(u_ModelMatrix * a_Position);
                    // 光线方向
                    v_LightDirection = normalize(u_LightPosition - vertexPosition);

                    v_Color = a_Color;
                }
            `;

            // 片元着色器
            let FSHADER_SOURCE = `
                precision mediump float;

                varying vec4 v_Color;
                varying vec3 v_Normal;
                varying vec3 v_LightDirection; // 点光源方向方向


                uniform vec3 u_LightColor; // 光线颜色
                uniform vec3 u_AmbientColor; // 环境光颜色

                void main() {
                    // 世界坐标下的法向量
                    vec3 normal = normalize(v_Normal);

                    // 环境光的放射光颜色 = 环境光颜色 * 表面基底色
                    vec3 ambientColor = u_AmbientColor * u_LightColor;

                    // 反射光颜色 = 入射光颜色 * 表面基地色 * cosø
                    float dotLN = max(dot(v_LightDirection, v_Normal), 0.0);
                    vec3 diffuseColor = u_LightColor * v_Color.rgb * dotLN;

                    gl_FragColor = vec4(diffuseColor + ambientColor, v_Color.a);
                }
            `;


            let canvas = document.getElementById('joint-model');
            let gl = getWebGLContext(canvas);
            if (!gl) {
                console.error('获取webGL上下文失败');
                return;
            }
            if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
                console.error('着色器初始化失败');
                return;
            }

            let n = this.initVertexBuffers(gl);
            this.matrixHandle(gl, canvas);
            this.lightEffect(gl);

            gl.clearColor(0.86, 0.82, 1, 1);
            // 隐藏面消除
            gl.enable(gl.DEPTH_TEST);
            // 多边形位移
            gl.enable(gl.POLYGON_OFFSET_FILL);

            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
        },
        // 光照
        lightEffect(gl) {
            // 光线颜色
            let u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
            gl.uniform3f(u_LightColor, 1, 1, 1);

            // 点光源位置
            let u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
            gl.uniform3f(u_LightPosition, 3, 4, 5);

            //环境光颜色
            let u_AmbientColor = gl.getUniformLocation(gl.program, 'u_AmbientColor');
            gl.uniform3f(u_AmbientColor, 0.1, 0.1, 0.1);

        },
        uniformMatrixHandle(gl, attr, matrix) {
            let location = gl.getUniformLocation(gl.program, attr);
            if (location < 0) {
                console.error('获取' + attr + '下标失败');
                return;
            }
            gl.uniformMatrix4fv(location, false, matrix.elements);
        },
        // 矩阵
        matrixHandle(gl, canvas) {
            // 模型矩阵
            let modelMatrix = new Matrix4();
            // 模型视图矩阵
            let mvpMatrix = new Matrix4();
            // 法向量变换矩阵
            let normalMatrix = new Matrix4();

            modelMatrix.setRotate(-3, 0, 0, 1);

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

            mvpMatrix.multiply(modelMatrix);

            // 求逆转矩阵
            normalMatrix.setInverseOf(modelMatrix); // 求modelMatrix的逆矩阵
            normalMatrix.transpose(); // 在对本身进行转置

            this.uniformMatrixHandle(gl, 'u_ModelMatrix', modelMatrix);
            this.uniformMatrixHandle(gl, 'u_MvpMatrix', mvpMatrix);
            this.uniformMatrixHandle(gl, 'u_NormalMatrix', normalMatrix);

        },
        // 创建缓冲对象
        initVertexBuffers(gl) {
            //  小臂顶点坐标
            let v0 = [ 0.22, 1.0, 0.3 ],
                v1 = [ -0.22, 1.0, 0.3 ],
                v2 = [ -0.22, 0.0, 0.3 ],
                v3 = [ 0.22, 0.0, 0.3 ],
                v4 = [ 0.22, 0.0, -0.2 ],
                v5 = [ 0.22, 1.0, -0.2 ],
                v6 = [ -0.22, 1.0, -0.2 ],
                v7 = [ -0.22, 0.0, -0.2 ];
            // 大臂顶点坐标
            let v8 = [ 0.2, 0.0, 0.2 ],
                v9 = [ -0.2, 0.0, 0.2 ],
                v10 = [ -0.2, -1.0, 0.2 ],
                v11 = [ 0.2, -1.0, 0.2 ],
                v12 = [ 0.2, -1.0, -0.2 ],
                v13 = [ 0.2, 0.0, -0.2 ],
                v14 = [ -0.2, 0.0, -0.2 ],
                v15 = [ -0.2, -1.0, -0.2 ];

            // 顶点坐标
            let vertexAxis = [
                // --------- 小臂
                // front
                ...v0, ...v1, ...v2, ...v3,
                // back
                ...v4, ... v5, ...v6, ...v7,
                // left
                ...v1, ...v2, ...v6, ...v7,
                // right
                ...v0, ...v3, ...v4, ...v5,
                // top
                ...v0, ...v1, ...v6, ...v5,
                // bottom
                ...v2, ...v3, ...v4, ...v7,


                // --------- 大臂
                // front
                ...v8, ...v9, ...v10, ...v11,
                // back
                ...v12, ... v13, ...v14, ...v15,
                // left
                ...v9, ...v10, ...v14, ...v15,
                // right
                ...v8, ...v11, ...v12, ...v13,
                // top
                ...v8, ...v9, ...v14, ...v13,
                // bottom
                ...v10, ...v11, ...v12, ...v15,
            ];

            // 每个面的法向量
            let top = [  0.0, 1.0, 0.0 ], 
                bottom = [ 0.0, -1.0, 0.0 ],
                left = [ -1.0, 0.0, 0.0 ],
                right = [ 1.0, 0.0, 0.0 ],
                front = [ 0.0, 0.0, 1.0 ],
                back = [ 0.0, 0.0, -1.0];

            let normals = [
                ...front, ...front, ...front, ...front,
                ...back, ...back, ...back, ...back,
                ...left, ...left, ...left, ...left,
                ...right, ...right, ...right, ...right,
                ...top, ...top, ...top, ...top,
                ...bottom, ...bottom, ...bottom, ...bottom,

                ...front, ...front, ...front, ...front,
                ...back, ...back, ...back, ...back,
                ...left, ...left, ...left, ...left,
                ...right, ...right, ...right, ...right,
                ...top, ...top, ...top, ...top,
                ...bottom, ...bottom, ...bottom, ...bottom,
            ];

            // 索引
            let indices = [
                // --------- 小臂
                0, 1, 2,  0, 2, 3, // front
                4, 5, 6,  4, 6, 7, // back
                8, 9, 10,  8, 10, 11, // left
                12, 13, 14,  12, 14, 15, // right
                16, 17, 18,  16, 18, 19, // top
                20, 21, 22,  20, 22, 23, // bottom

                // --------- 大臂
                24, 25, 26,  24, 26, 27, 
                28, 29, 30,  28, 30, 31,
                32, 33, 34,  32, 34, 35,
                36, 37, 38,  36, 38, 39,
                40, 41, 42,  40, 42, 43,
                44, 45, 46,  44, 46, 47,
            ];

            let a_Color = gl.getAttribLocation(gl.program, 'a_Color');
            if(!a_Color) {
                console.error('获取a_Color存储下标失败');
                return;
            }
            gl.vertexAttrib3f(a_Color, 0.77, 0.34, 0.1);

            this.initArrayBuffer(gl, vertexAxis, 'a_Position');
            this.initArrayBuffer(gl, normals, 'a_Normal');
            this.initElementArrayBuffer(gl, indices);
            return indices.length;
        },
        // 创建顶点缓冲对象
        initArrayBuffer(gl, array, attr) {
            let typeArray = new Float32Array(array, 0.0, array.length);
            let buffer = gl.createBuffer();
            if (!buffer) {
                console.error('创建顶点缓冲对象失败');
                return;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, typeArray, gl.STATIC_DRAW);

            let location = gl.getAttribLocation(gl.program, attr);
  
            if (location < 0) {
                console.error('获取储存变量'+ attr + '的下标失败');
                return;
            }
            gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0.0, 0);
            gl.enableVertexAttribArray(location);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        },
        // 创建索引缓冲对象
        initElementArrayBuffer(gl, array) {
            let typeArray = new Uint8Array(array, 0.0, array.length);
            let buffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, typeArray, gl.STATIC_DRAW);
        },
    },
}
</script>

<style>

</style>