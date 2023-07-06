<template>
    <div class="canvas-hello-quadrangle">
        <canvas id="hello-quad" height="600" width="400"></canvas>
    </div>
</template>

<script lang="jg">
    import { getWebGLContext, initShaders } from "@lib/cuon-utils";

    export default {
        mounted() {
            this.initHandle();
        },

        methods: {
            initHandle() {
                // 顶点着色器
                let VSHADERS_SOURCE = `
                    attribute vec4 a_Position;
                    attribute vec4 a_Color;

                    varying vec4 v_Color;

                    void main() {
                        gl_Position = a_Position;
                        v_Color = a_Color;
                    }
                `;

                // 片元着色器
                let FSHADER_SOURCE = `
                    precision mediump float;
                    varying vec4 v_Color;
                    void main() {
                        gl_FragColor = v_Color;
                    }
                `;

                let canvas = document.getElementById('hello-quad');
                let gl = getWebGLContext(canvas);
                if (!gl) {
                    console.error('获取webGL上下文失败');
                    return;
                }
                if (!initShaders(gl, VSHADERS_SOURCE, FSHADER_SOURCE)) {
                    console.error('着色器初始化失败');
                    return;
                }

                let n =  this.initVertexBuffer(gl);

                if (n < 0) {
                   console.error('创建缓冲区对象失败');
                   return;
                }
                
                gl.clearColor(0.2, 0.5, 0.8, 1.0);

                gl.clear(gl.COLOR_BUFFER_BIT);

                // TRIANGLES和 TRIANGLE_FAN主要在区别在连接各顶点的方式不同
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // type 绘制类型 offset从第几个开始绘制 count绘制总个数
                // gl.drawArrays(gl.TRIANGLE_FAN, 0, n)

            },
            /**
             * gl webGL上下文
             * return number 定点个数
             */
            initVertexBuffer(gl) {
                let n = 4;
                let vertices = new Float32Array(n * 6);
                vertices.set([
                    -0.5, 0.5, 0.0,  1.0, 0.0, 0.0,
                    -0.5, -0.5, 0.0, 0.0, 1.0, 0.0,
                    0.5, 0.5, 0.0,   0.0, 0.0, 1.0,
                    0.5, -0.5, 0.0,  1.0, 1.0, 1.0,
                ], 0);

                const FSIZE = vertices.BYTES_PER_ELEMENT;
                let vertexBuffer = gl.createBuffer();

                gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

                gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW, 0, n);

                let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
                //告诉显卡从当前绑定的缓冲区中读取定点数据
                gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
                // 打开属性数组列表中指定索引处的顶点属性数组
                gl.enableVertexAttribArray(a_Position);


                let a_Color = gl.getAttribLocation(gl.program, 'a_Color');
                //告诉显卡从当前绑定的缓冲区中读取定点数据
                gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
                // 打开属性数组列表中指定索引处的顶点属性数组
                gl.enableVertexAttribArray(a_Color);

                return n;
            }
        }
    }
</script>