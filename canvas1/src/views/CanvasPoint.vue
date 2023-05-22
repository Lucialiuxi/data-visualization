<script setup lang="js">
    import { getWebGLContext, initShaders } from '../../lib/cuon-utils'
    
    export default {
        mounted() {
            this.main();
        },
        methods: {
            main() {
                // 定点着色器程序
                let VSHADER_SOURCE = 
                `void main() {
                    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
                    gl_PointSize = 10.0;
                }`;

                // 片元着色器程序
                let FSHADER_SHOURCE = 
                `void main() {
                    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
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
                
                // 使用完全不透明的黑色清除所有图像
                gl.clearColor(0.0, 0.0, 0.0, 1.0); 

                // 用上面指定的颜色清除缓冲区
                gl.clear(gl.COLOR_BUFFER_BIT);

                // 绘制一个点
                gl.drawArrays(gl.POINTS, 0, 1)
            }
        }
    }

</script>

<template>
    <div class="paint-point">
        <canvas id="point" width="400" height="400"></canvas>
    </div>
</template>