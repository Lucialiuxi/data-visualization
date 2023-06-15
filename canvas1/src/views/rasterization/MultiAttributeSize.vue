<template>
  <div class="canvas-multi-attribute-size">
    <canvas id="multi-attribute-size" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { getWebGLContext, initShaders }  from '@lib/cuon-utils';

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
                void main() {
                    gl_Position = a_Position;
                    gl_PointSize = a_PointSize;
                }
            `;
            let FSHADERS_SOURCE = `
                precision mediump float;
                uniform vec4 u_FragColor;
                void main() {
                    gl_FragColor = u_FragColor;
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

            gl.drawArrays(gl.POINTS, 0, n);
        },
        initVertexBuffers(gl) {
            let n = 3;

            // 把顶点位置和大小放一起
            let verticesSizes = new Float32Array(9);
            verticesSizes.set([
                0.0, 0.5, 10.0, // x y size
                -0.5, -0.5, 20.0,
                0.5, -0.5, 30.0,
            ]);

            let vertexSizeBuffer = gl.createBuffer();

            // TypeArray.BYTES_PER_ELEMENT属性代表了强类型数组中每个元素所占用的字节数
            const FSIZE = verticesSizes.BYTES_PER_ELEMENT;

            if (!vertexSizeBuffer) {
                return -1;
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexSizeBuffer);

            gl.bufferData(gl.ARRAY_BUFFER, verticesSizes, gl.STATIC_DRAW);
            
            let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
            let a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');

            /**
             * 告诉显卡从当前绑定的缓冲区中读取顶点数据
             * gl.vertexAttribArrayPointer(location, size, type, normalized, stride, offset)
             * size 指定缓冲区中每个顶点的分量个数
             * type 指定数据格式
             * normalized 是否将非浮点型的数据归一化到[0, 1] 或者 [-1, 1]区间
             * stride 指定相邻两个顶点间的字节数 默认为0，也就是两个顶点间的距离，即步进参数
             * offset 指定缓冲区对象中的偏移量（以字节为单位），即attribute变量从缓冲区中的何处开始储存。如果是从起始位置开始，该参数应设为0
             */
            gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 3, 0);
            // 打开属性列表中指定索引处通用顶点属性数组
            gl.enableVertexAttribArray(a_Position);

            gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, FSIZE * 3 , FSIZE * 2);
            gl.enableVertexAttribArray(a_PointSize);
            return n;
        },
    }
}
</script>

<style>

</style>