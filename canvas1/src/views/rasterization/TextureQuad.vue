<template>
  <div class="canvas-texture-quad">
    <canvas id="texture-quad" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { getWebGLContext, initShaders } from '@lib/cuon-utils';

export default {
    mounted() {
        this.paintHandle();
    },
    methods: {
        paintHandle(){
            let VSHADER_SOURCE = `
                precision mediump float;
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
                uniform sampler2D u_Sampler;
                varying vec2 v_TexCoord;
                
                void main() {
                    gl_FragColor = texture2D(u_Sampler, v_TexCoord);
                }
            `;

            let canvas = document.getElementById('texture-quad');
            let gl = getWebGLContext(canvas);

            if (!gl) {
                console.error('获取webGL上下文失败');
                return;
            }
            if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
                console.error('着色器初始化失败');
                return;
            }

            let n = this.initVertexBuffer(gl);
            if(n < 0) {
                console.error('缓冲区对象创建失败');
                return;
            }

            if (!this.initTextures(gl, n)) {
                console.error('配置纹理出错');
                return;
            }

            gl.clearColor(0.3, 0.2, 0.3, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        },

        initVertexBuffer(gl) {
            let n = 4;
            let verticesTexCoords = new Float32Array([
                -0.5, 0.5, 0.0, 1.0,
                -0.5, -0.5, 0.0, 0.0,
                0.5, 0.5, 1.0, 1.0,
                0.5, -0.5, 1.0, 0.0,
            ]);


            const FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;

            let vertexBuffer = gl.createBuffer();
            if (!vertexBuffer) {
                return -1;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

            let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
            gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
            gl.enableVertexAttribArray(a_Position);


            let a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
            gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
            gl.enableVertexAttribArray(a_TexCoord);

            return n;
        },
        initTextures(gl, n) {
            // 创建纹理对象
            let texture = gl.createTexture();

            // 获取u_Sampler的存储位置
            let u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');

            // 创建一个图片对象
            let image = new Image();
            // 注册图片加载时间的响应函数
            image.onload = () => {
                this.loadTexture(gl, n, texture, u_Sampler, image);
            };
            // 浏览器开始加载图像
            image.src = '/img/water.webp';
            return true;
        },
        loadTexture(gl, n, texture, u_Sampler, image) {
            // 对纹理图像进行y轴翻转
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
            // 激活0号纹理单元
            gl.activeTexture(gl.TEXTURE0);
            // 向target绑定纹理对象
            gl.bindTexture(gl.TEXTURE_2D, texture);
            // 配置纹理参数(非二次幂图片)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            // 配置纹理图像
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
            // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            // gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, image);
            // gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE_ALPHA, gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, image);

            // 将0号传递给着色器
            gl.uniform1i(u_Sampler, 0);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
        }
    }
}
</script>

<style>

</style>