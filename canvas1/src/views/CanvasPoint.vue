<script setup lang="js">
    import { getWebGLContext, initShaders } from '../../lib/cuon-utils'
    
    export default {
        mounted() {
            this.main();
        },
        methods: {
            main() {
                // 定点着色器程序
                /**
                 * vec4 gl_Position 表示顶点位置 【必传值】
                 * float gl_PointSize 表示点的尺寸（像素数）【非必传值】
                 */
                let VSHADER_SOURCE = 
                `void main() {
                    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
                    gl_PointSize = 10.0;
                }`;

                // 片元着色器程序
                /**
                 * vec4 gl_FragColor 指定片元颜色（RGBA格式）
                 */
        
                let FSHADER_SHOURCE = 
                `void main() {
                    gl_FragColor = vec4(0.0, 1.0, 0.0, 0.5);
                }`;

                // 获取canvas元素
                var canvas = document.getElementById('point');
                // 获取webGL绘图上下文
                var gl = getWebGLContext(canvas);
                if (!gl) {
                    console.error('获取webGL上下文失败');
                    return;
                }
            
                // 初始化着色器
                if(!initShaders(gl,VSHADER_SOURCE, FSHADER_SHOURCE)) {
                    console.error('着色器初始化失败');
                    return;
                }
                
                // 清空颜色缓冲时的颜色值 RGBA
                gl.clearColor(0.1, 0.0, 1.0, 1.0); 

                // 把指定的缓冲区清空为预设的值
                gl.clear(gl.COLOR_BUFFER_BIT);

                // 渲染数组中的原始数据 绘制一个点
                gl.drawArrays(gl.POINTS, 0, 1);
            }
        }
    }

</script>

<template>
    <div class="paint-point">
        <canvas id="point" width="400" height="400"></canvas>
    </div>
</template>