<script setup lang="js">
import { getWebGLContext, initShaders } from '@lib/cuon-utils';
 export default {
    mounted() {
        this.initHandle();
    },
    methods: {
        // 初始化
        initHandle() {
            // 定点着色器程序
            let VSHADER_SOURCE = `
                attribute vec4 a_Position;
                attribute float a_PointSize;
                void main() {
                    gl_Position = a_Position;
                    gl_PointSize = a_PointSize;
                }
            `;
            // 片元着色器
            let FSHADER_SHOURCE = `
                void main() {
                    gl_FragColor = vec4(0.0, 1.0, 0.0, 0.5);
                }
            `;

            // 获取canvas元素
            let canvas = document.getElementById('clicked-point');
            //获取webgl上下文
            let gl = getWebGLContext(canvas);

            if (!gl) {
                console.error('获取webGL上下文失败');
                return;
            }

            // 初始化着色器
            if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SHOURCE)){
                console.error('着色器初始化失败');
                return;
            }


            // 获取attribute变量的储存位置
            let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
            let a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');

            // 将顶点位置传给attribute变量
            gl.vertexAttrib3f(a_Position, 0.0, 0.0, 0.0);
            gl.vertexAttrib1f(a_PointSize, 10.0);

            this.clickHandle(gl, canvas, a_Position);

            // 设置canvas背景色
            gl.clearColor(0.0, 0.1, 0.4, 1.0);

            // 把指定的缓冲区清空为预设的值
            gl.clear(gl.COLOR_BUFFER_BIT);
        },

        // canvas画布点击事件
        clickHandle(gl, canvas, a_Position) {
            let g_points = []; // 鼠标点击位置数组
            canvas.onmousedown = function (ev) {
                console.log('点击了')
                let x = ev.clientX; // 鼠标点击处x坐标
                let y = ev.clientY; // 鼠标点击处y坐标
                let rect = ev.target.getBoundingClientRect();

                let halfHeight = rect.height/2;
                let halfWidth = 200; // 动态宽度为只读 暂时写死
                let rx = ((x-rect.left) - halfHeight) / halfHeight;
                let ry = (halfWidth - (y - rect.top)) / halfWidth;
                
                // 将坐标存储到g_points数组中
                g_points.push(rx);
                g_points.push(ry);


                let len = g_points.length;
                for(let i = 0; i < len ; i += 2) {
                    // 将点的位置传递到变量a_Position中
                    gl.vertexAttrib3f(a_Position, g_points[i], g_points[i+1], 0.0);
                    // 把指定的缓冲区清空为预设的值
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    gl.drawArrays(gl.POINTS, 0 , 5.0);
                }
            }
        }
    }
 }
</script>

<template>
    <div class="canvas-clicked-point">
        <canvas id="clicked-point" height="400" width="400"></canvas>
    </div>
</template>