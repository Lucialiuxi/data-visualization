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
                precision mediump float;
                uniform vec4 u_FragColor;
                void main() {
                    gl_FragColor = u_FragColor;
                }
            `;

            // 获取canvas元素
            let canvas = document.getElementById('colored-point');
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
            // 获取uniform变量的储存位置
            let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

            // 将顶点位置传给attribute变量
            gl.vertexAttrib3f(a_Position, 0.0, 0.0, 0.0);
            gl.vertexAttrib1f(a_PointSize, 10.0);

            this.clickHandle(this, gl, canvas, a_Position, u_FragColor);

            // 设置canvas背景色
            gl.clearColor(0.2, 0.1, 0.4, 1.0);

            // 把指定的缓冲区清空为预设的值
            gl.clear(gl.COLOR_BUFFER_BIT);
        },

        // canvas画布点击事件
        clickHandle(that, gl, canvas, a_Position, u_FragColor) {
            let g_points = []; // 鼠标点击位置数组
            let g_color = []; // 给不同象限的点不同的颜色
            canvas.onmousedown = function (ev) {
                console.log('点击了')
                let x = ev.clientX; // 鼠标点击处x坐标
                let y = ev.clientY; // 鼠标点击处y坐标
                let rect = ev.target.getBoundingClientRect();

                let halfHeight = rect.height/2;
                let halfWidth = 200; // 动态宽度不可读 获取不到 暂时写死
                // 因为webGL中轴坐标区间为-1.0到1.0 所有要将x坐标点除以canvas长或者宽的一半
                let rx = ((x-rect.left) - halfWidth) / halfWidth;
                let ry = (halfHeight - (y - rect.top)) / halfHeight;
                
                // 将坐标存储到g_points数组中
                g_points.push({ x: rx, y: ry });
                
                g_color.push(that.getColorsHandle(rx, ry));

                console.log('g_points', g_points)
                console.log('g_color', g_color)
                // 把指定的缓冲区清空为预设的值
                gl.clear(gl.COLOR_BUFFER_BIT);
                
                // 点击画布以后绘制点
                that.drawPointsHandle(gl, a_Position, g_points, u_FragColor, g_color);
            }
        },

        // 点击画布以后绘制点
        drawPointsHandle(gl, a_Position,g_points, u_FragColor, g_color) {
            let len = g_points.length;
            for(let i = 0; i < len ; i ++) {
                // 将点的位置传递到变量a_Position中
                gl.vertexAttrib3f(a_Position, g_points[i].x, g_points[i].y, 0.0);
                // 将点的颜色按象限区分颜色
                gl.uniform4f(u_FragColor, ...g_color[i]);
                // 绘制点
                gl.drawArrays(gl.POINTS, 0 , 5.0);
            }
        },

        /**
         * 将点的颜色按象限区分
         * @param {*} x 在webGL坐标中的x轴位置
         * @param {*} y 在webGL坐标中的y轴位置
         */
        getColorsHandle(x, y) {
            if (x >= 0.0 && y >= 0.0) { // 在第一象限
                return [1.0, 0.0, 0.0, 1.0]
            } else if(x <= 0.0 && y >= 0.0 ) { // 在第二象限
                return [0.0, 1.0, 0.0, 1.0]
            } else if(x >= 0.0 && y <= 0.0 ) { // 在第三象限
                return [0.0, 0.0, 1.0, 1.0]
            } else { // 在第四象限
                return [1.0, 1.0, 1.0, 1.0]
            }
        }
    }
 }
</script>

<template>
    <div class="canvas-colored-point">
        <canvas id="colored-point" height="600" width="400"></canvas>
    </div>
</template>