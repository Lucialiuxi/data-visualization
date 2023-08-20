<template>
  <div class="wrap">
    <canvas id="init-shaders" height="600" width="600"></canvas>
  </div>
</template>

<script>
export default {
    mounted() {
        this.paintHandle();
    },
    methods: {
        paintHandle() {
            let { vertex: roundV, fragment: roundF } = this.roundShaderSource();
            let { vertex: triangleV, fragment: triangleF } = this.triangleShaderSource();
            let canvas = document.getElementById('init-shaders');
            if (!canvas) {
                console.error('获取canvas节点失败')
                return;
            }
            let gl = this.getWebGLContext(canvas);
            if (!gl) {
                console.error('获取webGL上下文失败');
                return;
            }
            if (!this.initShaders(gl, triangleV, triangleF, 'triangleProgram')) {
                console.error('三角形的着色器初始化失败');
                return;
            }
            if (!this.initShaders(gl, roundV, roundF, 'roundProgram')) {
                console.error('圆的着色器初始化失败');
                return;
            }

            this.initRoundVertexBuffers(gl, 'roundProgram');
            this.initTriangleVertexBuffers(gl, 'triangleProgram');
            
            gl.clearColor(0.93, 0.86, 0.69, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.drawArrays(gl.POINTS, 0, 1);

            this.initTexture(gl, () => {
                gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 0);
            });
        },
        initTriangleVertexBuffers(gl, programName) {
            let vertexAxis = [
                -0.5, 0.5, 0,
                -0.5, -0.5, 0, 
                0.5, 0.5, 0,
            ];
            let texCoords = [
                0.0, 1.0,
                0.0, 0.0,
                1.0, 1.0,
            ];
            let indices = [ 0, 1, 2 ];
            this.initArrayBuffer(gl, programName, vertexAxis, 'a_Position');
            this.initArrayBuffer(gl, programName, texCoords, 'a_TexCoord', 2)
            this.initElementArrayBuffer(gl, indices);
        },
        initRoundVertexBuffers(gl, programName) {
            let vertices = [ 0.5, 0.5, 0.0 ];
            let colors = [ 0.55, 0.39, 0.58 ];

            this.initArrayBuffer(gl, programName, vertices, 'a_Position');
            this.initArrayBuffer(gl, programName, colors, 'a_Color');
        },
        initTexture(gl, callBack) {
            let texture = gl.createTexture();
            let image = new Image();
            image.onload = () => {
                this.LoadTexture(gl, texture, image, callBack);
            };
            image.src = '/img/sunrise.jpg';
        },
        LoadTexture(gl, texture, image, callBack) {
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

            gl.clearColor(0.93, 0.86, 0.69, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            callBack();
        },
        initArrayBuffer(gl, programName, data, attr, size = 3) {
            let typeArray = new Float32Array(data, 0, data.length);

            let buffer = gl.createBuffer();
            if (!buffer) return;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, typeArray, gl.STATIC_DRAW);

            let location = gl.getAttribLocation(gl[programName], attr);

            if (location < 0) {
                console.error('获取顶点属性'+ attr +'的储存下标失败');
                return;
            }
            gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(location);
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
        },
        getWebGLContext(canvas, opt_debug) {
            /**
             * window.WebGLUtils对象上有两个对象属性{ create3DContext: f, setupWebGL:f }
             * setupWebGL 创建webGL上下文
             */
            let gl = window?.WebGLUtils?.setupWebGL(canvas);
            if (!gl) return null;
            if (arguments.length < 2 || opt_debug) {
                gl = window.WebGLDebugUtils.makeDebugContext(gl);
            }
            return gl;
        },
        initShaders(gl, vertexShaderSource, fragmentShaderSource, programName) {
            // 创建webGL程序对象
            let program = gl.createProgram();
            if (!program) return;
            let vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
            let fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

            // 添加预先定义好的顶点着色器和片元着色器
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);

            // 连接程序对象
            gl.linkProgram(program);

            let linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS);
            if (!linkStatus){
                // 返回linking过程中的错误以及webGLProgram objects合法性检查的错误
                let info = gl.getProgramInfoLog(program);
                gl.deleteProgram(program);
                // deleteShader并不会立即删除着色器，而是要等程序对象不在使用该着色器后，才将其删除
                gl.deleteShader(vertexShader);
                gl.deleteShader(vertexShader); 
                console.error('无法编译webGL program' + '\\n' + info);
                return null;
            }
            // 使用程序对象
            gl.useProgram(program);

            gl[programName] = program;
            return true;
        },
        createShader(gl, type, source) {
            // 创建着色器对象
            let shader = gl.createShader(type); //  type: gl.VERTEX_SHADER | gl.FRAGMENT_SHADER
            if (!shader) {
                return;
            }
            // 设置着色器的GLSL程序代码
            gl.shaderSource(shader, source);

            // 编译着色器
            gl.compileShader(shader);
            
            return shader;
        },
        roundShaderSource() {

            let VERTEX_SHADER_SOURCE = `
                precision mediump float;

                attribute vec4 a_Position;
                attribute vec4 a_Color;

                varying vec4 v_Color;

                void main() {
                    gl_Position = a_Position;
                    gl_PointSize = 80.0;
                    v_Color = a_Color;
                }
            `;
            let FRAGMENT_SHADER_SOURCE = `
                precision mediump float;

                varying vec4 v_Color;

                void main() {
                    // gl_PointCoord表示片元所在点内的坐标(值在0.0~1.0之间)，点中心的坐标是(0.5, 0.5)
                    float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
                    if (dist < 0.5) {
                        gl_FragColor = v_Color;
                    } else {
                        discard;
                    }
                }
            `;
            
            return { vertex: VERTEX_SHADER_SOURCE, fragment: FRAGMENT_SHADER_SOURCE };
        },
        triangleShaderSource() {
            let VERTEX_SHADER_SOURCE = `
                precision mediump float;

                attribute vec4 a_Position;
                attribute vec2 a_TexCoord;

                varying vec2 v_TexCoord;

                void main() {
                    gl_Position = a_Position;
                    v_TexCoord = a_TexCoord;
                }
            `;
            let FRAGMENT_SHADER_SOURCE = `
                precision mediump float;

                uniform sampler2D u_Sampler;
                varying vec2 v_TexCoord;

                void main() {
                    // u_Sampler 纹理单元编号 v_TexCoord 纹理坐标
                    gl_FragColor = texture2D(u_Sampler, v_TexCoord);
                }
            `;
            return { vertex: VERTEX_SHADER_SOURCE, fragment: FRAGMENT_SHADER_SOURCE };
        },
    },
}
</script>

<style>

</style>