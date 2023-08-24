<template>
  <div>
    <p>将渲染后的三维图形作为纹理贴图 <br/>贴到另一个三维物体上</p>
    <canvas id="frame-buffer-object" height="600" width="600"></canvas>
  </div>
</template>

<script>
import Matrix4 from '@lib/cuon-matrix';

export default {
    mounted() {
        this.paintHandle();
    },
    methods: {
        async paintHandle() {
            let { 
                TEX_VSHADER_SOURCE,
                TEX_FASHDER_SOURCE,
            } = this.getShaderSource();
            
            let canvas = document.getElementById('frame-buffer-object');
            let gl = this.getWebGLContext(canvas);
            if (!gl) {
                console.error('获取webGL上下文失败');
                return;
            }
            this.createWebGLProgram(gl, TEX_VSHADER_SOURCE, TEX_FASHDER_SOURCE);

            let n = this.initVertexBuffers(gl);
            this.matrixHandle(gl, canvas);
            await this.initTexture(gl, n);
            // this.draw(gl, n);
            this.initFramebufferObject(gl, canvas);
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

            modelMatrix.setRotate(10, 1, 0, 0); // 绕X轴旋转
            modelMatrix.rotate(20, 0, 1, 0); // 绕Y轴旋转

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
        // 初始化帧缓冲区
        async initFramebufferObject(gl, canvas) {
            // 创建帧缓冲区对象
            let framebuffer = gl.createFramebuffer();
            
            // 创建纹理对象并设置其尺寸和参数
            let texture = await this.initTexture(gl);
            
            // 创建渲染缓冲区对象
            let renderbuffer = gl.createRenderbuffer();

            // 绑定渲染缓冲区对象
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
            // 初始化一个渲染缓冲区对象的数据存储
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, canvas.width, canvas.height);


            // 将缓冲区的颜色关联对象指定为一个纹理对象
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

            // 将帧缓冲区的深度关联对象指定为渲染缓冲区对象
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

            // 检查帧缓冲区是否正确配置
            let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            console.log('status',  gl.bindFrameBuffer)
            // 在缓冲区进行绘制
            gl.bindFrameBuffer(gl.FRAMEBUFFER, framebuffer);
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
        async initTexture(gl) {
            let texture = gl.createTexture();
            let image = new Image();
            image.src = '/img/water.webp';

            let u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
            if (u_Sampler < 0) {
                console.error('获取u_Sampler储存位置失败');
                return;
            }

            let loaded = await this.loadImg(image);
            if (!loaded) {
                console.error('加载图片出错：' + loaded);
                return null;
            }
            return this.loadTexture(gl,texture, u_Sampler, image);
        },
        // 加载纹理
        loadTexture(gl,texture, u_Sampler, image) {
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
            return texture;
        },
        /** 
         * 获取webGL上下文
         * @param {*} canvas 
         * @param {*} opt_debug 当gl.getError返回错误时要调用的函数。如果未指定，则默认函数调用console.log并显示消息
         */
        getWebGLContext(canvas, opt_debug) {
            // 创建webGL上下文
            let gl = window?.WebGLUtils?.setupWebGL(canvas);
            if (!gl) return;
            if (arguments.length < 2 || opt_debug) {
                // 给定WebGL上下文返回一个可调用的包装的上下文
                gl = window?.WebGLDebugUtils?.makeDebugContext(gl);
            }
            return gl;
        },
        /**
         * 创建着色器
         * @param {*} gl webGL上下文
         * @param {*} vertexShaderSource 用于顶点着色器的GLSL的程序代码
         * @param {*} fragmentShaderSource 用于片元着色器的GLSL的程序代码
         */
        createWebGLProgram(gl, vertexShaderSource, fragmentShaderSource,) {
            // 创建webGL程序对象
            let program = gl.createProgram();
            if (!program)  return;

            // 创建着色器
            let vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
            let fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
            
            // 把顶点着色器和片元着色器添加到webGL程序对象上
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);

            // 连接程序对象
            gl.linkProgram(program);

            // 获取连接状态
            let linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS);
            if (!linkStatus) {
                // 获取linking过程中的错误
                let info = gl.getProgramInfoLog(program);
                /**
                 * deleteShader并不会立即删除着色器，
                 * 而是等到程序对象不在使用该着色器后，才将其删除
                 */
                gl.deleteShader(vertexShader);
                gl.deleteShader(fragmentShader);
                console.error('无法编译webGL program:  '+ info);
                return null;
            }

            // 使用程序对象
            gl.useProgram(program);
            gl.program = program;
        },
        /**
         * 创建着色器
         * @param {*} gl webGL上下文
         * @param {*} type gl.VERTEX_SHADER | gl.FRAGMENT_SHADER
         * @param {*} source  用于着色器的GLSL的程序代码
         */
        createShader(gl, type, source) {
            // 创建着色器对象
            let shader = gl.createShader(type);
            if (!shader) return;

            // 设置着色器的GLSL的程序代码
            gl.shaderSource(shader, source);

            // 编译着色器
            gl.compileShader(shader);

            return shader;
        },
        getShaderSource() {
            let TEX_VSHADER_SOURCE = `
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
            let TEX_FASHDER_SOURCE = `
                precision mediump float;

                uniform sampler2D u_Sampler;
                varying vec2 v_TexCoord;

                void main() {
                    gl_FragColor = texture2D(u_Sampler, v_TexCoord);
                }
            `;
            return {
                TEX_VSHADER_SOURCE,
                TEX_FASHDER_SOURCE,
            }
        },
        loadImg(image) {
            return new Promise((resolve, reject) => {
                image.onload = () => {
                    resolve(true);
                };
                image.onerror = (error) => {
                     reject(error);
                };
            })
        }
    }
}
</script>

<style>

</style>