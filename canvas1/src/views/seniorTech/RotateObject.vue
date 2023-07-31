<template>
  <div class="senior-rotate-object">
    <canvas id="rotate-object" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { initShaders, getWebGLContext } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';

/**
 * 漫反射光颜色 =  入射光颜色 * 物体表面基底色 * cosø
 * cosø = 光线方向 * 法线方向
 * 
 * 环境反射光颜色 = 环境光颜色 * 物体表面基底色
 * 
 * 物体表面反射光颜色 = 漫反射光颜色 + 环境反射光颜色
 */
export default {
    data() {
        return {};
    },
    mounted(){
        this.paintHandle();
    },
    methods: {
        paintHandle() {
            let VSHADER_SOURCE = `
                precision mediump float;

                attribute vec4 a_Color;
                attribute vec4 a_Position;
                attribute vec4 a_Normal; // 法线方向（法向量）

                varying vec4 v_Color;
                varying float v_DotLN; // cosø

                uniform mat4 a_MvpMatrix; // 模型视图透视投影矩阵
                uniform mat4 a_NormalMatrix; // 记录法向量变化的矩阵

                uniform vec3 a_LightPosition; // 入射光位置（世界坐标）
                
                void main() {
                    gl_Position = a_MvpMatrix * a_Position;

                    // 变换后的法向量
                    vec4 normal = normalize(a_NormalMatrix * a_Normal);

                    // 光线方向 
                    vec3 lightDirection = normalize(a_LightPosition - a_Position.rgb);

                    // cosø
                    v_DotLN = max(dot(lightDirection, normal.xyz), 0.0);

                    v_Color = a_Color;
                }
            `;
            let FASHDER_SOURCE = `
                precision mediump float;

                uniform vec3 a_LightColor; // 入射光颜色
                uniform vec3 a_AmbientColor; // 环境光颜色
                
                varying vec4 v_Color;
                varying float v_DotLN;

                void main() {
                    // 漫反射光颜色
                    vec3 diffuseColor = a_LightColor * v_Color.rgb * v_DotLN;
                    // 环境反射光颜色
                    vec3 ambientEffectColor = a_AmbientColor * v_Color.rgb;

                    gl_FragColor = vec4(diffuseColor + ambientEffectColor, v_Color.a);
                }
            `;

            let canvas = document.getElementById('rotate-object');
            if(!canvas) {
                console.error('获取canvas节点失败');
                return;
            }
            let gl = getWebGLContext(canvas);
            if(!canvas) {
                console.error('获取webGL上下文失败');
                return;
            }

            if (!initShaders(gl, VSHADER_SOURCE, FASHDER_SOURCE)){
                console.error('着色器初始化失败');
                return;
            }

            let n = this.initVertexBuffers(gl);
            this.matrixHandle(gl, canvas);
            this.lightEffect(gl);

            gl.clearColor(0.9, 0.97, 0.95, 1);

            // 开启隐藏面消除
            gl.enable(gl.DEPTH_TEST);
            // 开启多边形位移
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.drawElements(gl.TRIANGLE_STRIP, n, gl.UNSIGNED_BYTE, 0); // mode, count, type, offset
        },
        // 矩阵相关
        matrixHandle(gl, canvas) {
            // 视图矩阵
            let viewMatrix = new Matrix4();
            // 模型矩阵
            let ModelMatrix = new Matrix4();
            // 法向量矩阵
            let NormalMatrix = new Matrix4();
            // 模型视图投影矩阵
            let mvpMatrix = new Matrix4();

            // 透视投影
            viewMatrix.setPerspective(
                30,
                canvas.width/canvas.height,
                1,
                100,
            );

            // 观察信息
            viewMatrix.lookAt(
                3, 3, 7, // 视点
                0, 0, 1, // 目标点
                0, 1, 0, // 上方向
            );

            ModelMatrix.setRotate(10, 1, 0, 0); // 绕X轴旋转10度


            mvpMatrix.multiply(viewMatrix);

            let u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
            gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

            let u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
            gl.uniformMatrix4fv(u_NormalMatrix, false, NormalMatrix.elements);

        },
        // 光照相关
        lightEffect(gl) {
            // 入射光颜色
            let u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
            gl.uniform3f(u_LightColor, 1, 1, 1);

            // 环境光颜色
            let a_AmbientColor = gl.getUniformLocation(gl.program, 'a_AmbientColor');
            gl.uniform3f(a_AmbientColor, 1, 1, 0.88);

            // 点光源位置【世界坐标】
            let a_LightPosition = gl.getUniformLocation(gl.program, 'a_LightPosition');
            gl.uniform3f(a_LightPosition, 3, 4, 5);

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
            ];
            // 颜色
            let pink = [ 0.98, 0.88, 0.93 ],
                red = [ 1.0, 0.0, 0.0 ],
                yellow = [ 1.0, 1.0, 0.0 ],
                blue = [ 0.0, 0.8, 1.0 ],
                // 青色
                cyan = [ 0.4, 0.6, 0.6 ],
                green = [ 0.13, 0.7, 0.67 ];

            let colors = [
                ...pink,  ...pink,  ...pink,  ...pink,
                ...red,  ...red,  ...red,  ...red,
                ...yellow,  ...yellow,  ...yellow,  ...yellow,
                ...blue,  ...blue,  ...blue,  ...blue,
                ...cyan,  ...cyan,  ...cyan,  ...cyan,
                ...green,  ...green,  ...green,  ...green,
            ];

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
            this.initArrayBuffer(gl, normals, 'a_Normal');
            this.initElementArrayBuffer(gl, indices);
            return indices.length;
        },
        // 创建顶点数组缓冲对象
        initArrayBuffer(gl, data, attr) {
            let arrayBuffer = gl.createBuffer();
            if (!arrayBuffer) {
                console.error('数组缓冲对象:'+ attr + '创建失败');
                return;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

            let location = gl.getAttribLocation(gl.program, attr);
            if (location < 0) {
                console.error(attr + '的存储位置获取失败');
                return;
            }
            gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(location);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        },
        // 创建索引缓冲对象
        initElementArrayBuffer(gl, data) {
            let elementArrayBuffer = gl.createBuffer();
            if (!elementArrayBuffer) {
                console.error('索引缓冲对象创建失败');
                return;
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementArrayBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
        },
    },
}
</script>

<style>

</style>