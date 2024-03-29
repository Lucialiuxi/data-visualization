<template>
  <div class="point-lighted-cube-per-fragment-wrap">
    <p class="sub-title">漫反射-点光源光-逐片元</p>
    <canvas id="point-lighted-cube-per-fragment" height="600" width="600"></canvas>
    <p class="back-text">
        在前一个章节中看过 应用样式和颜色 之后，我们现在来看一下如何在 canvas 中绘制文本

        绘制文本
        canvas 提供了两种方法来渲染文本：

        fillText(text, x, y [, maxWidth])
        在指定的 (x,y) 位置填充指定的文本，绘制的最大宽度是可选的。

        strokeText(text, x, y [, maxWidth])
        在指定的 (x,y) 位置绘制文本边框，绘制的最大宽度是可选的。

        一个填充文本的示例

    </p>
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
                attribute vec4 a_Normal; // 法向量-即法线方向

                uniform mat4 u_MvpMatrix; // 模型视图投影矩阵
                uniform mat4 u_NormalMatrix; // 法向量变换矩阵
                uniform mat4 u_ModelMatrix; // 模型矩阵

                varying vec4 v_Color;
                varying vec3 v_Normal; // 计算变换后的法向量
                varying vec3 v_VertexPosition; // 顶点的世界坐标

                void main () {
                    gl_Position = u_MvpMatrix * a_Position;
                    
                    // 计算变换后的法向量并归一化 矩阵右乘矢量： 矩阵*矢量=矢量
                    v_Normal = vec3(u_NormalMatrix * a_Normal);

                    // 顶点的世界坐标
                    v_VertexPosition = vec3(u_ModelMatrix * a_Position);

                    v_Color = a_Color;
                }
            `;
            let FSHADER_SOURCE = `
                precision mediump float;

                varying vec4 v_Color;
                varying vec3 v_Normal; // 计算变换后的法向量
                varying vec3 v_VertexPosition; // 顶点的世界坐标

                uniform vec3 u_LightColor; // 入射光颜色 
                uniform vec3 u_LightPosition; // 点光源位置
                uniform vec3 u_AmbientColor; // 环境光颜色

                void main() {
                    // 计算光线方向
                    vec3 lightDirection = normalize(u_LightPosition - v_VertexPosition);

                    // 归一化法向量
                    vec3 normal = normalize(v_Normal);

                    // cosø = 光线方向*法线方向
                    float dotLN = max(dot(lightDirection, normal), 0.0);

                    // 漫反射颜色 = 入射光颜色 * 表面基地色 * cosø
                    vec3 diffuseColor = u_LightColor * v_Color.rgb * dotLN;

                    // 环境反射光颜色 = 环境光颜色 * 表面基底色
                    vec3 ambientReflectColor = u_AmbientColor * v_Color.rgb;
                    gl_FragColor = vec4(diffuseColor + ambientReflectColor, v_Color.a);
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
            this.lightEffect(gl);

            gl.clearColor(0.4, 0.6, 0.9, 0.5);
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
        getUniformLocation(gl, attr) {
            let location = gl.getUniformLocation(gl.program, attr);
            if (location < 0) {
                console.error('获取 '+ attr + ' 下标失败');
                return;
            }
            return location;
        },
        // 光照相关
        lightEffect(gl) {
            // 光线颜色
            let u_LightColor = this.getUniformLocation(gl, 'u_LightColor');
            gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);

            // 环境光颜色
            let u_AmbientColor = this.getUniformLocation(gl, 'u_AmbientColor');
            gl.uniform3f(u_AmbientColor, 0.2, 0.2, 0.2);

            // 点光源位置
            let u_LightPosition = this.getUniformLocation(gl, 'u_LightPosition');
            gl.uniform3f(u_LightPosition, 4.0, -3.0, 4.0);
        },
        // 矩阵相关
        matrixHandle(gl, canvas) {
            // 模型矩阵
            let modelMatrix = new Matrix4();
            // 模型视图投影矩阵
            let mvpMatrix = new Matrix4();
            // 计算法向量变换的矩阵
            let normalMatrix = new Matrix4();
        
            modelMatrix.setRotate(30, 0, 0, 1); // 绕Z轴旋转30°

            // 创建矩阵 & 设置透视投影可视空间
            mvpMatrix.setPerspective(
                30,
                canvas.width/canvas.height,
                1,
                100,
            );
            // 设置观察信息
            mvpMatrix.lookAt(
                -5, 2, 7, // 观察视点
                0, 0, 0, // 观察目标点
                0, 1, 0, // 上方向
            );

            mvpMatrix.multiply(modelMatrix);

            let u_ModelMatrix = this.getUniformLocation(gl, 'u_ModelMatrix');
            let u_MvpMatrix = this.getUniformLocation(gl, 'u_MvpMatrix');
            let u_NormalMatrix = this.getUniformLocation(gl, 'u_NormalMatrix');

            gl.uniformMatrix4fv(u_ModelMatrix, false,  modelMatrix.elements);
            gl.uniformMatrix4fv(u_MvpMatrix, false,  mvpMatrix.elements);
            gl.uniformMatrix4fv(u_NormalMatrix, false,  normalMatrix.elements);
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
               ...back, ...back, ...back, ...back,
               ...left, ...left, ...left, ...left,
               ...right, ...right, ...right, ...right,
               ...top, ...top, ...top, ...top,
               ...bottom, ...bottom, ...bottom, ...bottom,
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
            this.initArrayBuffer(gl, normals, 'a_Normal');
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
/**
 * 出现的错误：
 *  1. 问题立方体是纯黑色
 *  原因：光线方向公式用错
 *  光线方向 = normalize(光源位置 - 顶点的世界坐标)
 *  ⭐️顶点的世界坐标 = 模型矩阵 * 顶点坐标
 * 
 *  2.问题：立方体的每一个面都是背光的效果
 *  原因：
 *      没有在缓冲对象中定义和存储法向量
 *  
 * 
 */
</script>

<style scope>
    .point-lighted-cube-per-fragment-wrap {
        position: relative;
    }
    .sub-title, canvas {
        position: relative;
        z-index: 1;
    }
    .back-text {
        position: absolute;
        top: 100px;
        left: 0;
        z-index: 0;
    }
</style>