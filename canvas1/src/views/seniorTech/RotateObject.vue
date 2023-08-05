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

                attribute vec4 a_Position;
                attribute vec2 a_TexCoord; // 纹理坐标
                varying vec2 v_TexCoord;

                uniform mat4 u_MvpMatrix; // 模型视图透视投影矩阵
                uniform mat4 u_NormalMatrix; // 记录法向量变化的矩阵

                uniform vec3 u_LightPosition; // 入射光位置（世界坐标）
                
                void main() {
                    gl_Position = u_MvpMatrix * a_Position;
                    v_TexCoord = a_TexCoord;
                }
            `;
            let FASHDER_SOURCE = `
                precision mediump float;

                uniform sampler2D u_Sampler;
                varying vec2 v_TexCoord;

                void main() {
                    gl_FragColor = texture2D(u_Sampler, v_TexCoord);
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
            this.initTexture(gl, n);
        },
        draw(gl, n) {
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
            let modelMatrix = new Matrix4();
            // 法向量矩阵
            let normalMatrix = new Matrix4();
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
                -5, 2, 7, // 视点
                0, 0, 0, // 目标点
                0, 1, 0, // 上方向
            );

            modelMatrix.setRotate(10, 1, 0, 0); // 绕X轴旋转10度

            // 求逆转置矩阵【用法向量乘以模型矩阵的逆转置矩阵，就可以求得变换后的法向量】
            // 自身成为 模型句还早呢的逆矩阵
            normalMatrix.setInverseOf(modelMatrix);
            // 对自身进行转置操作，并将自身设置为转置后的结果
            normalMatrix.transpose();

            mvpMatrix.multiply(viewMatrix).multiply(modelMatrix);

            let u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
            gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

            let u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
            gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

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
            // 每个面的纹理坐标
            let topL = [ 0.0, 1.0 ], 
                topR = [ 1.0, 1.0 ],
                bottomL = [ 0.0, 0.0 ],
                bottomR = [ 1.0, 0.0 ];
            
            let texCoords = [
                ...topL, ...bottomL, ...topR, ...bottomR,
                ...topL, ...bottomL, ...topR, ...bottomR,
                ...topL, ...bottomL, ...topR, ...bottomR,
                ...topL, ...bottomL, ...topR, ...bottomR,
                ...topL, ...bottomL, ...topR, ...bottomR,
                ...topL, ...bottomL, ...topR, ...bottomR,
            ];

            let indices = [
                0, 1, 2, 3,
                4, 5, 6, 7,
                8, 9, 10, 11,
                12, 13, 14, 15,
                16, 17, 18, 19,
                20, 21, 22, 23,
            ];
            
            this.initArrayBuffer(gl, vertexAxis, 'a_Position', 3);
            this.initArrayBuffer(gl, texCoords, 'a_TexCoord', 2);
            this.initElementArrayBuffer(gl, indices);
            return indices.length;
        },
        // 创建顶点数组缓冲对象
        initArrayBuffer(gl, array, attr, size) {
            let data = new Float32Array(array, 0, array.length);
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
            gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(location);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        },
        // 创建索引缓冲对象
        initElementArrayBuffer(gl, array) {
            let data = new Uint8Array(array, 0, array.length);
            let elementArrayBuffer = gl.createBuffer();
            if (!elementArrayBuffer) {
                console.error('索引缓冲对象创建失败');
                return;
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementArrayBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
        },
        //初始化纹理
        initTexture(gl, n) {
            let texture = gl.createTexture();
            let image = new Image();

            let u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
            if (u_Sampler < 0) {
                console.error('获取u_Sampler储存位置失败');
                return;
            }

            image.onload = (ev) => {
                this.loadTexture(gl, n, texture, u_Sampler, image);
            };
            image.src = '/img/water.webp';
        },
        // 加载纹理
        loadTexture(gl, n, texture, u_Sampler, image) {
            // 图像预处理【对纹理图像进行Y轴翻转】
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            let textureOrder = gl.TEXTURE0;
            // 激活制定的纹理单元
            gl.activeTexture(textureOrder);
            // 开启纹理对象，以及将纹理对象绑定到纹理单元上
            gl.bindTexture(gl.TEXTURE_2D, texture);
            // 配置纹理参数
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            // 指定二维纹理图像
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
            // 将纹理单元传递给片元着色器
            gl.uniform1i(u_Sampler, 0);
            this.draw(gl, n)
        },
    },
}
</script>

<style>

</style>