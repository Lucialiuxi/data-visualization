<template>
  <div class="look-at-blended-triangles-wrap">
    <canvas id="look-at-blended-triangles" height="600" width="600"></canvas>
  </div>
</template>
<script>
/**
 * 开启混合功能
 * gl.enable(gl.BLEND);
 * 
 * 指定混合函数
 * gl.blendFunc(src_factor, dst_factor)
 * src_factor 指定 源颜色 在混合后颜色中的权重因子
 * dst_factor 指定 目标颜色 在混合后颜色中的权重因子
 * 
 */
import { initShaders, getWebGLContext } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';

// 品红色
let magenta = [ 0.67, 0, 0.73, 0.3 ],
    red = [ 1.0, 0.0, 0.0, 0.4 ],
    yellow = [ 1.0, 1.0, 0.0, 0.5 ];
export default {
    mounted() {
        this.paintHandle();
    },
    methods: {
        paintHandle() {
            let VSHADER_SOURCE = `
                precision mediump float;

                attribute vec4 a_Position;
                uniform vec4 u_Color;
                uniform mat4 u_viewMatrix;

                varying vec4 v_Color;

                void main() {
                    gl_Position = u_viewMatrix * a_Position;
                    v_Color = u_Color;
                }
            `;
            let FASHADER_SOURCE = `
                precision mediump float;
                varying vec4 v_Color;

                void main() {
                    gl_FragColor = v_Color;
                }
            `;

            let canvas = document.getElementById('look-at-blended-triangles');
            if (!canvas) {
                console.error('获取canvas节点失败');
                return;
            }
            let gl = getWebGLContext(canvas);
            if (!gl) {
                console.error('获取webGL上下文失败');
                return;
            }

            if (!initShaders(gl, VSHADER_SOURCE, FASHADER_SOURCE)) {
                console.error('着色器初始化失败');
                return;
            }

            let n = this.initVertexBuffers(gl);

            gl.clearColor(0.66, 0.88, 0.9, 1);
            // 处理深度冲突
            gl.enable(gl.DEPTH_TEST);
            
            // 开启a混合
            gl.enable(gl.BLEND);
            // gl.blendFunc(gl.SRC_ALPHA_SATURATE, gl.ZERO);
            // gl.blendFunc(gl.ONE, gl.ZERO); // 没区别
            // gl.blendFunc(gl.ONE_DST_COLOR, gl.ONE_MINUS_SRC_COLOR);
            // gl.blendFunc(gl.SRC_COLOR, gl.ONE_MINUS_SRC_COLOR);
            gl.blendFunc(gl.DST_COLOR, gl.DST_COLOR); // 显示在最前的三角形是最后绘制的，所以目标是现实在里视点最近的三角形

            // 使用预设值来清空缓冲
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            let viewMatrix = new Matrix4();
            let modelMatrix = new Matrix4();
            let projMatrix = new Matrix4();
            projMatrix.setPerspective(15, 1, 1, 100);
            viewMatrix.setLookAt(
                1, 1, 5,
                0, 0, 0,
                0, 1, 0,
            );
            let u_viewMatrix = gl.getUniformLocation(gl.program, 'u_viewMatrix');
            let u_Color = gl.getUniformLocation(gl.program, 'u_Color');
            this.draw(gl, n, viewMatrix, modelMatrix, projMatrix, u_viewMatrix,u_Color,  magenta, [ 0, 0, 0 ]);
            this.draw(gl, n, viewMatrix, modelMatrix, projMatrix, u_viewMatrix, u_Color, red, [ 0, 0, 0.5 ]);
            this.draw(gl, n, viewMatrix, modelMatrix, projMatrix, u_viewMatrix, u_Color, yellow, [ 0, 0, 1 ]);
        },
        draw(gl, n, viewMatrix,  modelMatrix, projMatrix, u_viewMatrix, u_Color, color ,translateArgs) {
            let mvpMatrix = new Matrix4();
            modelMatrix.setTranslate(...translateArgs);
            mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
            gl.uniformMatrix4fv(u_viewMatrix, false, mvpMatrix.elements);
            gl.uniform4f(u_Color, ...color);
            gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
        },
        initVertexBuffers(gl) {
            let vertexAxis = [
                0.0, 0.31, 0.0,
                -0.31, -0.31, 0.0,
                0.31, -0.31, 0.0,
            ];
            let index = [ 0, 1, 2 ];

            this.initArrayButter(gl, vertexAxis, 'a_Position');
            this.initElementArrayBuffer(gl, index);
            return index.length;
        },
        // 创建顶点缓冲对象
        initArrayButter(gl, data, attr) {
            let typeArray = new Float32Array(data, 0, data.length);
            let buffer = gl.createBuffer();
            if (!buffer) {
                console.error('创建顶点缓冲对象失败');
                return;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, typeArray, gl.STATIC_DRAW);
            let location = gl.getAttribLocation(gl.program, attr);
            if (location < 0) {
                console.error('顶点属性' + attr + '储存下标获取失败');
                return;
            }
            gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(location);
        },
        // 创建索引缓冲对象
        initElementArrayBuffer(gl, data) {
            let typeArray = new Uint8Array(data, 0, data.length);
            let buffer = gl.createBuffer();
            if (!buffer) {
                console.error('创建索引缓冲对象失败');
                return;
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, typeArray, gl.STATIC_DRAW);
        },
    }
}
</script>

<style>

</style>