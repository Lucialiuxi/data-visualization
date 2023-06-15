<template>
  <div class="canvas-multi-attribute-size">
    <canvas id="multi-attribute-size" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { getWebGLContext, initShaders }  from '@lib/cuon-utils';
/**
 * 如果顶点着色器与【片元着色器中有类型和命名都相同的varying变量，
 * 那么顶点着色器赋给该变量的值就会被自动地传给片元着色器
 */
export default {
    mounted() {
        this.paintHandle()
    },
    methods: {
        paintHandle() {
            let VSHADERS_SOURCE =  `
                precision mediump float;
                attribute vec4 a_Position;
                attribute float a_PointSize;

                attribute vec4 a_Color;
                varying vec4 v_Color; // varying变量

                void main() {
                    gl_Position = a_Position;
                    gl_PointSize = a_PointSize;
                    v_Color = a_Color; // 将数据传给片元着色器
                }
            `;
            let FSHADERS_SOURCE = `
                precision mediump float;
                varying vec4 v_Color;
                void main() {
                    gl_FragColor = v_Color; // 从顶点着色器接受数据
                }
            `;
            let canvas = document.getElementById('multi-attribute-size');
            let gl =  getWebGLContext(canvas);

            if(!gl) {
                console.error('获取webGL上下文失败')
                return;
            }

            if (!initShaders(gl, VSHADERS_SOURCE, FSHADERS_SOURCE)) {
                console.error('着色器初始化失败');
                return;
            }
            let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
            gl.uniform4f(u_FragColor, 0.0, 1.0, 1.0, 1.0);

            let n = this.initVertexBuffers(gl);
            if(n < 0) {
                console.error('创建缓冲对象失败');
                return;
            }

            gl.clearColor(0.3, 0.2, 0.3, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // gl.drawArrays(gl.TRIANGLES, 0, n);  // 渐变色三角形
            gl.drawArrays(gl.POINTS, 0, n);
        },
        initVertexBuffers(gl) {
            let n = 3;

            // 把顶点位置和大小放一起
            let verticesSizesColor = new Float32Array(18);
            verticesSizesColor.set([
                0.0,0.5, 10.0,  1.0, 0.0, 0.0, // x y size  color(r, g, b)
                -0.5,-0.5, 20.0,  0.0, 1.0, 0.0,
                0.5,-0.5, 30.0,  0.0, 0.0, 1.0,
            ]);

            let vertexSizeColorBuffer = gl.createBuffer();

            // TypeArray.BYTES_PER_ELEMENT属性代表了强类型数组中每个元素所占用的字节数
            const FSIZE = verticesSizesColor.BYTES_PER_ELEMENT;

            if (!vertexSizeColorBuffer) {
                return -1;
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexSizeColorBuffer);

            gl.bufferData(gl.ARRAY_BUFFER, verticesSizesColor, gl.STATIC_DRAW);
            
            let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
            let a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
            let a_Color = gl.getAttribLocation(gl.program, 'a_Color');

            /**
             * 告诉显卡从当前绑定的缓冲区中读取顶点数据
             * gl.vertexAttribArrayPointer(location, size, type, normalized, stride, offset)
             * size 指定缓冲区中每个顶点的分量个数
             * type 指定数据格式
             * normalized 是否将非浮点型的数据归一化到[0, 1] 或者 [-1, 1]区间
             * stride 指定相邻两个顶点间的字节数 默认为0，也就是两个顶点间的距离，即步进参数
             * offset 指定缓冲区对象中的偏移量（以字节为单位），即attribute变量从缓冲区中的何处开始储存。如果是从起始位置开始，该参数应设为0
             */
            gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 6, 0);
            // 打开属性列表中指定索引处通用顶点属性数组
            gl.enableVertexAttribArray(a_Position);

            gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, FSIZE * 6 , FSIZE * 2);
            gl.enableVertexAttribArray(a_PointSize);

            gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6 , FSIZE * 3);
            gl.enableVertexAttribArray(a_Color);
            return n;
        },
    }
}
</script>

<style>

</style>