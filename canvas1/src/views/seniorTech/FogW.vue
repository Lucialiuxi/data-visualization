<template>
  <div class="fog-wrap">
    <canvas id="fog" height="600" width="600"></canvas>
  </div>
</template>

<script scope>
/**
 * 雾化因子 = (终点 - 当前点与视点间的距离) / (终点 - 起点)
 * 起点 <= 当前点与视点间的距离 <=终点
 * 
 * 
 * 当前点与视点间的距离 用内置函数distance计算
 * dist = distance(当前点, 视点)
 * 
 * 雾化因子 用内置函数clamp计算
 * factor = clamp((终点 - dist) / (终点 - 起点), 0.0, 1.0)
 * 
 * 片元颜色用 内置函数mix计算
 * 片元颜色 = mix(物体表面颜色,雾的颜色,雾化因子*雾化因子)
 */
import { getWebGLContext, initShaders } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';

export default {
    data() {
        return {
            fogColor: [ 0.9, 1, 1, 1 ],
            eyePosition: [ -25, -65, 35 ],
        }
    },
    mounted() {
        this.paintHandle();
    },
    methods: {
        paintHandle() {
            let VSHADER_SOURCE = `
                precision mediump float;

                attribute vec4 a_Position;
                attribute vec4 a_Color;

                uniform mat4 u_MvpMatrix;

                varying vec4 v_Color;
                varying float v_Dist;

                void main() {
                    gl_Position = u_MvpMatrix * a_Position;

                    // 雾化因子 = (终点 - 当前点与视点间的距离) / (终点 - 起点)
                    float v_Dist = gl_Position.w;
                    
                    v_Color = a_Color;
                }
            `;
            let FSHADER_SOURCE = `
                precision mediump float;

                uniform vec2 u_FogDistance; // 视点分别跟 雾化起点、雾化终点 之间的距离
                uniform vec3 u_ViewerPosition; // 世界坐标下的视点位置

                varying vec4 v_Color;
                varying float v_Dist;

                uniform vec4 u_FogColor; // 雾的颜色

                void main() {
                    float fogFactor = clamp((u_FogDistance.y - v_Dist) / (u_FogDistance.y - u_FogDistance.x), 0.0, 1.0);
                    // clamp(x, minVal, maxVal) 将x限制在minVal和maxVal之间，即返回min(max(x, minVal), maxVal)
                    gl_FragColor = mix(u_FogColor, v_Color, fogFactor);
                }
            `;

            let canvas = document.getElementById('fog');
            if (!canvas) {
                console.error('canvas dom 获取失败');
                return;
            }
            let gl = getWebGLContext(canvas);
            if (!gl) {
                console.error('webGL上下文获取失败');
            }

            if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
                console.error('着色器初始化失败');
                return;
            }
            let n = this.initVertexBuffers(gl);
            this.matrixHandle(gl, canvas);
            this.fogHandle(gl);
            this.draw(gl, n);
        },
        draw(gl, n) {
            gl.clearColor(...this.fogColor);
            
            // 隐藏面消除【解决顶点渲染顺序问题】
            gl.enable(gl.DEPTH_TEST);

            // 多边形位移【解决深度冲突导致的颜色显示斑驳的问题】
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.polygonOffset(0.01, 0.01);

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.drawElements(gl.TRIANGLE_STRIP, 8, gl.UNSIGNED_BYTE, 0);
            gl.drawElements(gl.TRIANGLE_STRIP, 8, gl.UNSIGNED_BYTE, n/6 * 2);
            gl.drawElements(gl.TRIANGLE_STRIP, 8, gl.UNSIGNED_BYTE, n/6 * 4);
        },
        fogHandle(gl) {
            let u_FogColor = gl.getUniformLocation(gl.program, 'u_FogColor');
            gl.uniform4f(u_FogColor, ...this.fogColor);
            let u_ViewerPosition = gl.getUniformLocation(gl.program, 'u_ViewerPosition');
            gl.uniform3f(u_ViewerPosition, ...this.eyePosition); // 世界坐标下
            let u_FogDistance = gl.getUniformLocation(gl.program, 'u_FogDistance');
            gl.uniform2f(u_FogDistance, 55, 100);
        },
        matrixHandle(gl, canvas) {
            // 模型矩阵
            let modelMatrix = new Matrix4();
            // 模型视图透视投影矩阵
            let mvpMatrix = new Matrix4();
            mvpMatrix.setPerspective(
                10,
                canvas.width/canvas.height,
                1,
                100,
            );
            mvpMatrix.lookAt(
                ...this.eyePosition, // 视点
                0, 0, 0, // 观察点
                0, 1, 0, // 上方向
            );
            modelMatrix.setRotate(10, 1, 1, 0);

            mvpMatrix.multiply(modelMatrix);

            let u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
            gl.uniformMatrix4fv(u_MvpMatrix, false,  mvpMatrix.elements);
        },
        initVertexBuffers(gl) {
            // 顶点坐标
            let v0 = [ 1.0, 1.0, 1.0 ],
                v1 = [ -1.0, 1.0, 1.0 ],
                v2 = [ -1.0, -1.0, 1.0 ],
                v3 = [ 1.0, -1.0, 1.0 ],
                v4 = [ 1.0, -1.0, -1.0 ],
                v5 = [ 1.0, 1.0, -1.0 ],
                v6 = [ -1.0, 1.0, -1.0 ],
                v7 = [ -1.0, -1.0, -1.0 ]; 
            let vertexAxis = [
                // 正面 1203
                ...v1, ...v2, ...v0, ...v3,
                // 背面 6754
                ...v6, ...v7,...v5, ...v4, 
                // 左面 2716
                ...v2, ...v7,...v1, ...v6, 
                // 右面 3405
                ...v3, ...v4,...v0, ...v5, 
                // 顶面 1605
                ...v1, ...v6,...v0, ...v5,
                // 底面 2734
                ...v2, ...v7,...v3, ...v4, 
            ];

            // 颜色
            let pink = [ 0.98, 0.88, 0.93 ],
                red = [ 0.85, 0.0, 0.3 ],
                yellow = [ 1.0, 1.0, 0.0 ],
                blue = [ 0.0, 0.8, 1.0 ],
                // 青色
                cyan = [ 0.4, 0.6, 0.6 ],
                green = [ 0.13, 0.7, 0.67 ];
            let colors = [
                ...pink, ...pink, ...pink, ...pink,
                ...red, ...red, ...red, ...red,
                ...yellow, ...yellow, ...yellow, ...yellow,
                ...blue, ...blue, ...blue, ...blue,
                ...cyan, ...cyan, ...cyan, ...cyan,
                ...green, ...green, ...green, ...green,
            ];
            let index = [
                0, 1, 2, 3, 
                4, 5, 6, 7, 
                8, 9, 10, 11, 
                12, 13, 14, 15, 
                16,17, 18, 19, 
                20, 21, 22, 23,
            ];
            this.initArrayButter(gl, vertexAxis, 'a_Position');
            this.initArrayButter(gl, colors, 'a_Color');
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