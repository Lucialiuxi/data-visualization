<template>
  <div>
    <p>将渲染后的三维图形作为纹理贴图 <br/>贴到另一个三维物体上</p>
    <canvas id="frame-buffer-object" height="600" width="600"></canvas>
  </div>
</template>

<script>
export default {
    mounted() {

    },
    methods: {
        paintHandle() {

        }, 
        /** 
         * 获取webGL上下文
         * @param {*} canvas 
         * @param {*} opt_debug 当gl.getError返回错误时要调用的函数。如果未指定，则默认函数调用console.log并显示消息
         */
        getWebGLContext(canvas, opt_debug) {
            // 创建webGL上下文
            let gl = window?.webGLUtils?.setupWebGL(canvas);
            if (!gl) return;
            if (arguments.length < 2 || opt_debug) {
                // 给定WebGL上下文返回一个可调用的包装的上下文
                gl = window.webGLDebugUtils.makeDebugContext(gl);
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

            return gl;
        },
        /**
         * 创建着色器
         * @param {*} gl webGL上下文
         * @param {*} type gl.VERTEX_SHADER | gl.FRAGMENT_SHADER
         * @param {*} source  用于着色器的GLSL的程序代码
         */
        createShader(gl, type, source) {
            // 创建着色器对象
            let shader = gl.createShader(gl, type);
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
    }
}
</script>

<style>

</style>