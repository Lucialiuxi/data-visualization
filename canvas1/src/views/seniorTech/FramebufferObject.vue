<template>
  <div>
    <p>将渲染后的三维图形作为纹理贴图 <br/>贴到另一个三维物体上</p>
    <canvas id="frame-buffer-object" height="600" width="600"></canvas>
  </div>
</template>

<script>
import Matrix4 from '@lib/cuon-matrix';

export default {
    data() {
        return {
            // 离屏绘制尺寸
            OFFSCREEN_WIDTH: 256,
            OFFSCREEN_HEIGHT: 256
        }
    },
    mounted() {
        this.paintHandle();
    },
    methods: {
        async paintHandle() {
            let { 
                TEX_VSHADER_SOURCE,
                TEX_FSHADER_SOURCE,

                ROUND_VSHADER_SOURCE,
                ROUND_FSHADER_SOURCE,
                
                QUAD_VSHADER_SOURCE,
                QUAD_FSHADER_SOURCE,
            } = this.getShaderSource();
            
            let canvas = document.getElementById('frame-buffer-object');
            let gl = this.getWebGLContext(canvas);
            if (!gl) {
                console.error('获取webGL上下文失败');
                return;
            }
            let cubeProgram = this.createWebGLProgram(
                gl, 
                TEX_VSHADER_SOURCE, 
                TEX_FSHADER_SOURCE, 
            );

            let roundProgram = this.createWebGLProgram(
                gl, 
                ROUND_VSHADER_SOURCE,
                ROUND_FSHADER_SOURCE,
            );

            let quadProgram = this.createWebGLProgram(
                gl, 
                QUAD_VSHADER_SOURCE,
                QUAD_FSHADER_SOURCE,
            );

            let cubeBuffer = this.initCubeVertexBuffers(gl, cubeProgram);
            
            let texture = await this.initTexture(gl, cubeProgram);

            let roundBuffer = this.initRoundVertexBuffer(gl, roundProgram);
            
            // let quadBuffer = this.initQuadVertexBuffers(gl, quadProgram);

            gl.clearColor(0.9, 0.97, 0.95, 1);

            // 开启隐藏面消除
            gl.enable(gl.DEPTH_TEST);
            // 开启多边形位移
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            this.drawCube(gl, cubeProgram, cubeBuffer, texture);
            this.drawRound(gl, roundProgram, roundBuffer);
            // this.drawQuad(gl, quadProgram, quadBuffer);

            // let frameBuffer = this.initFramebufferObject(gl, texture);
            
        }, 
        drawQuad(gl, program, buffers) {
            gl.useProgram(program);

            let { vertexBuffer, texCoordBuffer, indexBuffer, vertexCount } = buffers;
            gl.useProgram(program);

            this.initAttributeVariable(gl, program, vertexBuffer, 'a_Position');
            this.initAttributeVariable(gl, program, texCoordBuffer, 'a_TexCoord');

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            this.drawElements(gl.TRIANGLE_STRIP, vertexCount, indexBuffer.type, 0);
        },
        drawRound(gl, program, buffers) {
            gl.useProgram(program);
            let { vertexBuffer, indexBuffer, vertexCount } = buffers;
            this.initAttributeVariable(gl, program, vertexBuffer, 'a_Position');
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.drawElements(gl.POINTS, vertexCount, indexBuffer.type, 0);
        },
        drawCube(gl, program, buffers, texture) {
            let { vertexBuffer, texCoordBuffer, indexBuffer } = buffers;
            gl.useProgram(program);


            this.initAttributeVariable(gl, program, vertexBuffer, 'a_Position');
            this.initAttributeVariable(gl, program, texCoordBuffer, 'a_TexCoord');

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);

            this.matrixHandle(gl, program);

            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.drawElements(gl.TRIANGLE_STRIP, buffers.vertexCount, gl.UNSIGNED_BYTE, 0); // mode, count, type, offset
        },
        initAttributeVariable(gl, program, buffer, attr) {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

            gl.vertexAttribPointer(program[attr], buffer.size, buffer.type, false, 0, 0);
            gl.enableVertexAttribArray(program[attr]);
        },
        initRoundVertexBuffer(gl, program) {
            let vertices = [ -0.8, 0.8, 0.0 ];
            let indices = [ 0 ];

            gl.useProgram(program);
            let a_Color = gl.getUniformLocation(program, 'a_Color');
            if (a_Color < 0) {
                console.error('获取a_Color的存储下标失败');
                return;
            }
            gl.uniform4f(a_Color, 0.44, 0.57, 0.58, 1.0);

            let buffers = new Object();
            buffers.vertexBuffer = this.initArrayBuffer(gl, program, vertices, 'a_Position', 3);
            buffers.indexBuffer = this.initElementArrayBuffer(gl, indices);
            buffers.vertexCount = indices.length;
            return buffers;
        },
        // 矩阵相关
        matrixHandle(gl, program) {
            // 视图矩阵
            let viewMatrix = new Matrix4();
            // 模型矩阵
            let modelMatrix = new Matrix4();
            // 模型视图投影矩阵
            let mvpMatrix = new Matrix4();

            // 透视投影
            viewMatrix.setPerspective(
                30,
                1,
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
            modelMatrix.scale(0.5, 0.5, 0.5);

            mvpMatrix.multiply(viewMatrix).multiply(modelMatrix);

            let u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
            gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
        },
        // 初始化帧缓冲区
        initFramebufferObject(gl, texture) {
            // 创建帧缓冲区对象
            let framebuffer = gl.createFramebuffer();

            framebuffer.texture = texture;

            // 创建渲染缓冲区对象
            let renderbuffer = gl.createRenderbuffer();

            // 绑定渲染缓冲区对象
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
            // 初始化一个渲染缓冲区对象的数据存储
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.OFFSCREEN_WIDTH, this.OFFSCREEN_HEIGHT);

            // 在缓冲区进行绘制
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

            // 将缓冲区的颜色关联对象指定为一个纹理对象
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

            // 将帧缓冲区的深度关联对象指定为渲染缓冲区对象
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

            // 检查帧缓冲区是否正确配置
            let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if (!status) {
                console.error('帧缓冲区是配置有误');
                return;
            }
            return framebuffer;
        },
        initQuadVertexBuffers(gl, program) {
            console.log(program)
            let v0 = [ 1.0, 1.0, 1.0 ],
                v1 = [ -1.0, 1.0, 1.0 ],
                v2 = [ -1.0, -1.0, 1.0 ],
                v3 = [ 1.0, -1.0, 1.0 ];
            let vertices = [
                ...v1, ...v2, ...v0, ...v3,
            ];
            let texCoords = [
                0.0, 1.0, // topL
                0.0, 0.0, // bottomL
                1.0, 1.0, // topR
                1.0, 0.0, // bottomR
            ];
            let indices = [ 0, 1, 2, 3 ];

            let buffers = new Object();

            program.u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
            buffers.vertexBuffer = this.initArrayBuffer(gl, program, vertices, 'a_Position', 3);
            buffers.texCoordBuffer = this.initArrayBuffer(gl, program, texCoords, 'a_TexCoord', 2);
            buffers.indexBuffer = this.initElementArrayBuffer(gl, indices);
            buffers.vertexCount = indices.length;

            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

            return buffers;
        },
        // 创建立方体的顶点缓冲对象
        initCubeVertexBuffers(gl, program) {
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

            let buffers = new Object();
            program.u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
            buffers.vertexBuffer = this.initArrayBuffer(gl, program, vertexAxis, 'a_Position', 3);
            buffers.texCoordBuffer = this.initArrayBuffer(gl, program, texCoords, 'a_TexCoord', 2);
            buffers.indexBuffer = this.initElementArrayBuffer(gl, indices);
            buffers.vertexCount = indices.length;

            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

            return buffers;
        },
        // 创建顶点数组缓冲对象
        initArrayBuffer(gl, program, array, attr, size) {
            let data = new Float32Array(array, 0, array.length);
            let arrayBuffer = gl.createBuffer();
            if (!arrayBuffer) {
                console.error('数组缓冲对象:'+ attr + '创建失败');
                return;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
            arrayBuffer.size = size;
            arrayBuffer.type = gl.FLOAT;

            let location = gl.getAttribLocation(program, attr);
            if (location < 0) {
                console.error(attr + '的存储位置获取失败');
                return;
            }
            program[attr] = gl.getAttribLocation(program, attr);

            return arrayBuffer;
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
            elementArrayBuffer.type = gl.UNSIGNED_BYTE;
            return elementArrayBuffer;
        },
        //初始化纹理
        async initTexture(gl, program) {
            let texture = gl.createTexture();
            let image = new Image();
            image.src = '/img/water.webp';

            let loaded = await this.loadImg(image);
            if (!loaded) {
                console.error('加载图片出错：' + loaded);
                return null;
            }
            return this.loadTexture(gl, program, texture, image);
        },
        // 加载纹理
        loadTexture(gl, program, texture, image) {
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

            gl.useProgram(program);
            gl.uniform1i(program.u_Sampler, 0);
            gl.bindTexture(gl.TEXTURE_2D, null); // Unbind texture
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
        createWebGLProgram(gl, vertexShaderSource, fragmentShaderSource) {
            console.log(gl)
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

            return program;
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

                uniform vec3 u_LightPosition; // 入射光位置（世界坐标）
                
                void main() {
                    gl_Position = u_MvpMatrix * a_Position;
                    v_TexCoord = a_TexCoord;
                }
            `;
            let TEX_FSHADER_SOURCE = `
                precision mediump float;

                uniform sampler2D u_Sampler;
                varying vec2 v_TexCoord;

                void main() {
                    gl_FragColor = texture2D(u_Sampler, v_TexCoord);
                }
            `;

            let ROUND_VSHADER_SOURCE = `
                precision mediump float;

                attribute vec4 a_Position;

                void main() {
                    gl_Position = a_Position;
                    gl_PointSize = 50.0;
                }
            `;
            let ROUND_FSHADER_SOURCE = `
                precision mediump float;
                uniform vec4 a_Color;

                void main() {
                    // gl_PointCoord表示片元所在点内的坐标（值在0.0~1.0之间),点的中心坐标是(0.5, 0.5) 
                    // 计算片元离点中心的距离
                    float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
                    if (dist < 0.5) {
                        gl_FragColor = a_Color;
                    } else {
                        discard;
                    }
                }
            `;
            

            let QUAD_VSHADER_SOURCE = `
                precision mediump float;

                attribute vec4 a_Position;
                attribute vec2 a_TexCoord;

                varying vec2 v_TexCoord;

                void main() {
                    gl_Position = a_Position;
                    a_TexCoord = v_TexCoord;
                }
            `;
            let QUAD_FSHADER_SOURCE = `
                precision mediump float;

                uniform sampler2D u_Sampler;

                varying vec2 v_TexCoord;

                void main() {
                    gl_FragColor = texture2D(u_Sampler, v_TexCoord);
                }
            `;
            
            return {
                TEX_VSHADER_SOURCE,
                TEX_FSHADER_SOURCE,
                ROUND_VSHADER_SOURCE,
                ROUND_FSHADER_SOURCE,
                QUAD_VSHADER_SOURCE,
                QUAD_FSHADER_SOURCE,
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