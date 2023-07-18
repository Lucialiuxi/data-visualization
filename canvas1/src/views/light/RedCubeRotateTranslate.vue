<template>
  <div class="white-cube-wrap">
    <p>漫反射--环境光</p>
    <canvas id="white-cube" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { getWebGLContext, initShaders } from '@lib/cuon-utils.js';
import Matrix4, { Vector3 } from '@lib/cuon-matrix.js';

/**
 * 漫反射光颜色 = 入射光颜色 * 表面基地色 * （光线方向·法线方向）
 * 
 * 环境反射光颜色 = 入射光颜色 * 表面基地色
 * 
 * 表面的反射光颜色 = 漫反射颜色 + 环境反射光颜色
 */
export default {
    mounted() {
        this.paint();
    },
    methods: {
        paint() {
            let VSHADER_SOURCE =  `
                precision mediump float;

                attribute vec4 a_Position;
                attribute vec4 a_Normal; // 法向量
                attribute vec4 a_Color;

                uniform mat4 u_MvpMatrix; // 视图投影矩阵
                
                uniform vec3 u_LightColor; // 入射光颜色
                uniform vec3 u_EnvironmentColor; // 环境光颜色

                uniform vec3 u_LightDirection; // 归一化的世界坐标

                varying vec4 v_Color;

                void main() {
                    gl_Position = u_MvpMatrix * a_Position;

                    // 对a_Normal进行归一化,保持矢量方向不变但长度为1 normalize()是计算归一化的内置函数
                    vec3 normal = normalize(vec3(a_Normal)); 

                    // 计算光线方向和法向量的点积。内置函数dot：计算点积；内置函数max：比较大小，返回最小值
                   float LDotN = max(dot(u_LightDirection, normal), 0.0); // 点积小于0，意味着入射角大于90度，入射角大于90度说明光线照射在表面的背面

                   // 计算漫反射光的颜色
                   vec3 diffuseColor = u_LightColor * vec3(a_Color) * LDotN;
                   // 计算环境光产生的反射光颜色
                   vec3 ambient = u_EnvironmentColor * vec3(a_Color);
                   v_Color = vec4(diffuseColor + ambient, a_Color.a);
                }

            `;
            let FSHADER_SOURCE = `
                precision mediump float;
                varying vec4 v_Color;
                void main() {
                    gl_FragColor = v_Color;
                }
            `;

            let canvas = document.getElementById('white-cube');
            let gl = getWebGLContext(canvas);
            if (!gl) {
                console.error('获取webGL上下文失败');
                return;
            }

            if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
                console.error('初始化着色器失败');
                return;
            }

            let n = this.initVertexBuffers(gl);
            if (n < 0) return;

            gl.clearColor(0.1, 0.2, 0.3, 1.0);
            gl.enable(gl.DEPTH_TEST);

            this.lightEffect(gl);

            let mvpMatrix = new Matrix4();
            mvpMatrix.setPerspective(
                30, // 垂直视角
                canvas.width/canvas.height, // aspect宽高比应与canvas的宽高比一直，才不会导致图片变形
                1, // near
                100, // far
            );
            mvpMatrix.lookAt(
                3, 3, 13, // 视点
                0, 0, 0, // 目标点
                0, 1, 0, // 上方向
            );
            let u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
            u_MvpMatrix && gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            
            gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
        },
        lightEffect(gl) {
            // 光线颜色
            let u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
            // 设置光线颜色（白色）
            gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);

            // 环境光颜色
            let u_EnvironmentColor = gl.getUniformLocation(gl.program, 'u_EnvironmentColor');
            gl.uniform3f(u_EnvironmentColor, 0.2, 0.2, 0.2);

            // 法线方向
            let u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
            
            // 设置光线方向（世界坐标系下的）
            let lightDirection = new Vector3([0.5, 3.0, 4.0]);
            lightDirection.normalize(); // 归一化
            u_LightDirection && gl.uniform3fv(u_LightDirection, lightDirection.elements);
        },
        initVertexBuffers(gl) {
            // 立方体每个点的坐标
            let v0 = [ 1.0, 1.0, 1.0 ],
                v1 = [ -1.0, 1.0, 1.0 ],
                v2 = [ -1.0, -1.0, 1.0 ],
                v3 = [ 1.0, -1.0, 1.0 ],
                v4 = [ 1.0, -1.0, -1.0 ],
                v5 = [ 1.0, 1.0, -1.0 ],
                v6 = [ -1.0, 1.0, -1.0 ],
                v7 = [ -1.0, -1.0, -1.0 ];

             // 顶点坐标
            let vertexAxis = [
                // 正面
                ...v0, ...v1, ...v2, ...v3,
                // 右面
                ...v0, ...v3, ...v4,...v5,
                // 上面
                ...v0, ...v5, ...v6, ...v1,
                // 左面
                ...v1, ...v6, ...v7, ...v2, 
                // 下面
                ...v7, ...v4, ...v3, ...v2,
                // 背面
                ...v4, ...v7, ...v6, ...v5,
            ];
            // 每个面的法向量
            let top = [  0.0, 1.0, 0.0 ], 
            bottom = [ 0.0, -1.0, 0.0 ],
            left = [ -1.0, 0.0, 0.0 ],
            right = [ 1.0, 0.0, 0.0 ],
            front = [ 0.0, 0.0, 1.0 ],
            behind = [ 0.0, 0.0, -1.0];

           // 每个面的法向量[一个平面只有一个法向量]
            let normals = [
                ...front, ...front, ...front, ...front,

                ...right, ...right, ...right, ...right, 

                ...top, ...top, ...top, ...top,

                ...left, ...left, ...left,  ...left, 

                ...bottom, ...bottom, ...bottom, ...bottom, 

                ...behind, ...behind, ...behind, ...behind,
            ];

            let red = [1.0, 0.0, 0.0];
            let colors = [
                ...red, ...red, ...red, ...red,
                ...red, ...red, ...red, ...red,
                ...red, ...red, ...red, ...red,
                ...red, ...red, ...red, ...red,
                ...red, ...red, ...red, ...red,
                ...red, ...red, ...red, ...red,
            ];

            let normalsArray = new Float32Array(normals, 0, normals.length);
            this.initArrayBuffer(gl, normalsArray, 'a_Normal');

            let colorArray = new Float32Array(colors, 0, colors.length);
            this.initArrayBuffer(gl, colorArray, 'a_Color');

            // 顶点坐标
            let vertices = new Float32Array(vertexAxis, 0, vertexAxis.length);
            this.initArrayBuffer(gl, vertices, 'a_Position');

            // 索引
            let indices = [
                0, 1, 2,   0, 2, 3,    // front
                4, 5, 6,   4, 6, 7,    // right
                8, 9,10,   8,10,11,    // top
                12,13,14,  12,14,15,    // left
                16,17,18,  16,18,19,    // bottom
                20,21,22,  20,22,23     // back
            ];
            // 立方体每个面的三角扇顶点索引【绘制顺序】
            this.initElementArrayBuffer(gl, indices);


            return indices.length;
        },
        // 初始化顶点缓冲对象
        initArrayBuffer(gl, typeArray, attribAttr) {
            let buffer  = gl.createBuffer();
            if (!buffer) {
                console.error('创建缓冲对象失败');
                return -1;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, typeArray, gl.STATIC_DRAW);
            let attrib = gl.getAttribLocation(gl.program, attribAttr);
            if (attrib < 0) {
                console.error(attribAttr + '顶点属性储存位置获取失败');
                return -1;
            }
            gl.vertexAttribPointer(attrib, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(attrib);  
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            return true;
        },
        // 初始化顶点缓冲对象
        initElementArrayBuffer(gl, indices) {
            // 立方体每个面的三角扇顶点索引【绘制顺序】
            let index = new Uint8Array(indices, 0, indices.length);
            let indexBuffer  = gl.createBuffer();
            if (!indexBuffer) {
                return -1;
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);
        },
    }
}
</script>

<style>

</style>