<template>
  <div class="canvas-multi-texture">
    <canvas id="multi-texture" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { getWebGLContext, initShaders } from '@lib/cuon-utils';

export default {
    data() {
        return {
            textureArray: [
                {
                    textureLoaded: false,
                    imgSrc: '/img/girl3.webp',
                    samplerName: 'u_Sampler0'
                },
                {
                    textureLoaded: false,
                    imgSrc: '/img/night.jpeg',
                    samplerName: 'u_Sampler1'
                },
            ]
        }
    },
    mounted() {
        
        this.paintHandle();
    },
    methods: {
        paintHandle() {
            let VSHADER_SOURCE = `
                precision highp float;

                attribute vec4 a_Position;

                attribute vec2 a_TexCoord;
                varying vec2 v_TexCoord;

                void main() {
                    gl_Position = a_Position;
                    v_TexCoord = a_TexCoord;
                }
            `;

            let FSHADER_SOURCE = `
                precision mediump float;

                uniform sampler2D u_Sampler0;
                uniform sampler2D u_Sampler1;

                varying vec2 v_TexCoord; // 纹理坐标

                void main() {
                    // 获取纹素颜色
                    vec4 color0 = texture2D(u_Sampler0, v_TexCoord);
                    vec4 color1 = texture2D(u_Sampler1, v_TexCoord);
                    
                    gl_FragColor = color0 * color1;
                }
            `;

            let canvas = document.getElementById('multi-texture');
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
            if (n < 0) {
                console.error('顶点缓冲对象初创建失败');
                return;
            }

            this.textureArray.forEach((item, i) => {
                    if (!this.initTextures(gl, n, i)) {
                    console.error('纹理加载出错');
                    return;
                }
            })
        },
        initVertexBuffers(gl) {
            let n = 4;
            let vertices = new Float32Array([
                -0.5, 0.5, 0.0, 1.0,  // x y s t
                -0.5, -0.5, 0.0, 0.0,
                0.5, 0.5, 1.0, 1.0,
                0.5, -0.5, 1.0, 0.0,
            ]);

            // 系统支持的经度范围
            let systemPrecision = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT);
            console.log('systemPrecision', systemPrecision)

            // 强类型数组中每个元素占用的字节数
            const FSIZE = vertices.BYTES_PER_ELEMENT;

            let vertexBuffer = gl.createBuffer();
            if (!vertexBuffer) {
                return -1;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
            
            let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
            gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
            gl.enableVertexAttribArray(a_Position);

            let a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
            gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
            gl.enableVertexAttribArray(a_TexCoord);

            return n;
        },
        // 初始化纹理
        initTextures(gl, n, i) {
            // 创建纹理对象
            let texture = gl.createTexture();
            if (!texture) {
                return;
            }

            // 获取u_Sampler的存储位置
            let u_Sampler = gl.getUniformLocation(gl.program, this.textureArray[i].samplerName);

            // 创建一个图片对象
            let image = new Image();
            image.onload = () => {
                console.log('---',i,u_Sampler, image)
                this.loadTexture(gl, n, texture, u_Sampler, image, i);
            }
            image.src = this.textureArray[i].imgSrc;
            return true;
        },
        // 加载纹理
        loadTexture(gl, n, texture, u_Sampler, image, i) {
            // 对纹理图像进行Y轴翻转【webGL纹理坐标系统中的t轴（Y轴）的方向和PNG、BMP、JPG等格式图片的坐标系统的Y轴方向是相反的】
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

            let attr = 'TEXTURE' + String(i);
            // 开启0号纹理单元
            gl.activeTexture(gl[attr]);
            

            let newTextureArray = this.textureArray.map((item, index) => {
                let newItem = Object.assign({}, item);
                if (i === index) {
                    newItem.textureLoaded = true;
                }
                return newItem;
            });
            this.textureArray = newTextureArray;

            // 向target绑定纹理对象
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // 配置纹理参数
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            // 指定二维纹理图像 gl.texImage2D(target, level, internal format, type, image)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

            // 将0号纹理传递给着色器
            gl.uniform1i(u_Sampler, i);

            gl.clearColor(0.0, 0.5, 0.5, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            if (this.textureArray.every(item => !!item.textureLoaded)) {
                console.log(this.textureArray)
                console.log('执行了')
                gl.drawArrays(gl.TRIANGLE_STRIP, false, n);
            }
        }
    }
}
</script>

<style>

</style>