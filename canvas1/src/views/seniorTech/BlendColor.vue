<template>
  <div class="point-lighted-cube-per-fragment-wrap">
    <p class="sub-title">混合a</p>
    <canvas id="point-lighted-cube-per-fragment" height="600" width="600"></canvas>
    <p class="back-text">
        随着颜色中的a分量的降低整个绘图区域也会逐渐变白，
        <br/>
        因为在默认情况下，a混合不仅会影响绘制的物体，也会影响背景色， 
        <br/>
        最后看到的白色实际上 是canvas后面空白的网页

    </p>
  </div>
</template>
<script>
import { initShaders, getWebGLContext } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';

export default {
    data() {
        return {
            angle: 30,
            timer: null,
        }
    },
    mounted(){
        this.paintHandle();
    },
    unmounted() {
        if(this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },
    methods: {
        paintHandle() {
            let VSHADER_SOURCE = `
                precision mediump float;
                
                attribute vec4 a_Position;
                attribute vec4 a_TrianglePosition;
                attribute vec4 a_Color;
                attribute vec4 a_Normal; // 法向量-即法线方向
                attribute vec2 a_TexCoord; // 纹理坐标

                uniform mat4 u_MvpMatrix; // 模型视图投影矩阵
                uniform mat4 u_NormalMatrix; // 法向量变换矩阵
                uniform mat4 u_ModelMatrix; // 模型矩阵

                uniform bool u_IsTriangle;

                varying vec4 v_Color;
                varying vec3 v_Normal; // 计算变换后的法向量
                varying vec3 v_VertexPosition; // 顶点的世界坐标

                varying vec2 v_TexCoord; // 纹理坐标

                void main () {
                    if (!u_IsTriangle) {
                        gl_Position = u_MvpMatrix * a_Position;
                        // 计算变换后的法向量并归一化 矩阵右乘矢量： 矩阵*矢量=矢量
                        v_Normal = vec3(u_NormalMatrix * a_Normal);

                        // 顶点的世界坐标
                        v_VertexPosition = vec3(u_ModelMatrix * a_Position);

                        v_Color = a_Color;

                    } else {
                        gl_Position = u_MvpMatrix * a_TrianglePosition;
                        v_TexCoord = a_TexCoord;
                    }
                }
            `;
            let FSHADER_SOURCE = `
                precision mediump float;

                varying vec4 v_Color;
                varying vec3 v_Normal; // 计算变换后的法向量
                varying vec3 v_VertexPosition; // 顶点的世界坐标
                varying vec2 v_TexCoord; // 纹理坐标

                uniform vec3 u_LightColor; // 入射光颜色 
                uniform vec3 u_LightPosition; // 点光源位置
                uniform vec3 u_AmbientColor; // 环境光颜色
                uniform bool u_IsTriangle;

                uniform sampler2D u_Sampler; // 纹理单元编号

                void main() {
                    if (!u_IsTriangle) {
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
                    } else {
                        gl_FragColor = texture2D(u_Sampler, v_TexCoord);
                    }
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
            let u_IsTriangle = gl.getUniformLocation(gl.program, 'u_IsTriangle');
            gl.uniform1i(u_IsTriangle, 0);

            let triangleVertexCount = this.initTriangleVertexBuffers(gl);
            let cubeVertexCount = this.initCubeVertexBuffers(gl);

            this.lightEffect(gl);
            this.matrixHandle(gl, canvas);

            this.initTexture(gl, triangleVertexCount, u_IsTriangle);
            this.drawCube(gl, cubeVertexCount, canvas);
        },
        drawCube(gl, n, canvas) {
            this.matrixHandle(gl, canvas);
            // 消除隐藏面
            gl.enable(gl.DEPTH_TEST); //【开启混合的时候 就不再使用隐藏面消除】
            gl.clearColor(0.4, 0.6, 0.9, 1);

            // 锁定用于进行隐藏面消除的深度缓冲区的写入操作，使之只读
            gl.depthMask(false);

            // 启动多边形位移
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.polygonOffset(0.1, 0.1);

            // 开启a混合
            gl.enable(gl.BLEND);
            // 指定混合指数
            gl.blendFunc(gl.SRC_COLOR, gl.SRC_COLOR);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            console.log('立方体')
            gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

            // 释放深度缓冲区，使之可写可读
            gl.depthMask(true);
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
        
            modelMatrix.setRotate(this.angle, 1, 0, 0); // 绕Z轴旋转30°

            // 创建矩阵 & 设置透视投影可视空间
            mvpMatrix.setPerspective(
                30,
                canvas.width/canvas.height,
                1,
                100,
            );
            // 设置观察信息
            mvpMatrix.lookAt(
                5, 8, 7, // 观察视点
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
        // 创建三角形的顶点缓冲对象
        initTriangleVertexBuffers(gl) {
            let verticesTexCoords = new Float32Array([
                -1.4, 2.3, 0.0, 0.0, 1.0,
                -1.4, -1.4, 0.0, 0.0, 0.0,
                2.3, 2.3, 0.0, 1.0, 1.0,
            ]);

            this.initArrayBuffer(gl, verticesTexCoords, 'a_TrianglePosition', 3, 5, 0);
            this.initArrayBuffer(gl, verticesTexCoords, 'a_TexCoord', 2, 5, 3);
            return verticesTexCoords.length / 5;
        },
        initTexture(gl, n, u_IsTriangle) {
            let texture = gl.createTexture();
            let image = new Image();
            let u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
            image.onload = () => {
                this.LoadTexture(gl, n, texture, image, u_Sampler, u_IsTriangle);
            };
            image.src = '/img/girl.webp';
        },
        LoadTexture(gl, n, texture, image, u_Sampler, u_IsTriangle) {
            let target = gl.TEXTURE_2D;
            // webGL纹理坐标系统重的t轴的方向和图片的坐标系统的Y轴方向是相反的，需要做翻转操作
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

            // 激活指定的纹理单元
            gl.activeTexture(gl.TEXTURE0);

            // 开启纹理对象，以及将纹理对象绑定到纹理单元上
            gl.bindTexture(target, texture);

            // 配置纹理参数
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            // 指定二维纹理图像
            gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            // 将纹理单元传递给片元着色器
            gl.uniform1i(u_Sampler, 0); // 对应activeTexture的第0个纹理单元


            gl.clearColor(0.4, 0.6, 0.9, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.uniform1i(u_IsTriangle, 1);
console.log('三角形')
            gl.drawArrays(gl.TRIANGLES, 0, n);
        },
        // 创建立方体的顶点缓冲对象
        initCubeVertexBuffers(gl) {
            // 顶点坐标
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
                // 上面
                ...v0, ...v5, ...v6, 
                ...v0, ...v6, ...v1,
                // 下面
                ...v7, ...v2, ...v3, 
                ...v7, ...v3, ...v4,
                // 左面
                ...v6, ...v7, ...v2,
                ...v6, ...v2,...v1, 
                // 右面
                ...v5, ...v0, ...v3, 
                ...v5, ...v3, ...v4,
                // 正面
                ...v0, ...v1, ...v2, 
                ...v0, ...v2, ...v3,
                // 背面
                ...v7, ...v4, ...v5, 
                ...v7, ...v5, ...v6,
            ];
            let pink = [ 0.98, 0.88, 0.93, 0.63 ],
                red = [ 1.0, 0.0, 0.0, 0.83 ],
                yellow = [ 1.0, 1.0, 0.0, 0.88 ],
                blue = [ 0.0, 0.8, 1.0, 2.35 ],
                // 青色
                cyan = [ 0.4, 0.6, 0.6, 2.3 ],
                green = [ 0.13, 0.7, 0.67, 0.42 ];
            let colors = [
                ...pink, ...pink, ...pink, 
                ...pink, ...pink, ...pink, 
                ...red, ...red, ...red, 
                ...red, ...red, ...red, 
                ...yellow, ...yellow, ...yellow,
                ...yellow, ...yellow, ...yellow,
                ...blue, ...blue, ...blue,
                ...blue, ...blue, ...blue,
                ...cyan, ...cyan, ...cyan,
                ...cyan, ...cyan, ...cyan,
                ...green, ...green, ...green,
                ...green, ...green, ...green,
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
               ...front, ...front, ...front, 
               ...front, ...front, ...front, 

               ...back, ...back, ...back, 
               ...back, ...back, ...back, 

               ...left, ...left, ...left, 
               ...left, ...left, ...left, 

               ...right, ...right, ...right, 
               ...right, ...right, ...right, 

               ...top, ...top, ...top,
               ...top, ...top, ...top,

               ...bottom, ...bottom, ...bottom,
               ...bottom, ...bottom, ...bottom,
            ];
            // 索引
            let indices = [
                0, 1, 2, 3, 4, 5, 
                6, 7, 8, 9, 10, 11,
                12, 13, 14, 15, 16, 17, 
                18, 19, 20, 21, 22, 23, 
                24, 25, 26, 27, 28, 29, 
                30, 31, 32, 33, 34, 35,
            ];

            this.initArrayBuffer(gl, vertexAxis, 'a_Position');
            this.initArrayBuffer(gl, colors, 'a_Color', 4);
            this.initArrayBuffer(gl, normals, 'a_Normal');
            this.initElementArrayBuffer(gl, indices);
            return indices.length;
        },
        // 创建顶点属性的缓冲对象
        initArrayBuffer(gl, array, attr, size = 3, strideFactor = 0, offsetFactor = 0) {
            let typeArray = new Float32Array(array, 0, array.length);
             // 强类型数组中每个元素所占用的字节数
            const FSIZE = typeArray.BYTES_PER_ELEMENT;

            let buffer = gl.createBuffer();
            if (!buffer) {
                console.error('顶点属性缓冲对象创建失败');
                return;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, typeArray, gl.STREAM_DRAW);
            let vertexAttrib = gl.getAttribLocation(gl.program, attr);
            if (vertexAttrib < 0) {
                console.error('获取属性 '+ attr +' 的下标失败');
                return;
            }
            /**
             * 
             * stride 指定相邻两个顶点间的字节数 默认为0，也就是两个顶点间的距离，即步进参数
             * offset 指定缓冲区对象中的偏移量（以字节为单位），即attribute变量从缓冲区中的何处开始储存。如果是从起始位置开始，该参数应设为0
            //  */
            gl.vertexAttribPointer(vertexAttrib, size, gl.FLOAT, false, FSIZE * strideFactor, FSIZE * offsetFactor);
            gl.enableVertexAttribArray(vertexAttrib);
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
        line-height: 60px;
        padding: 10px;
    }
</style>