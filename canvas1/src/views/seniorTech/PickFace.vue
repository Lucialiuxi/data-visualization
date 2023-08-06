<template>
  <div>
    <p>鼠标选中单面 被选中的面颜色改为白色</p>
    <canvas id="pick-face" height="600" width="600"></canvas>
  </div>
</template>
<script>
import { initShaders, getWebGLContext } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';

let pink = [ 0.98, 0.88, 0.93 ],
    red = [ 1.0, 0.0, 0.0 ],
    yellow = [ 1.0, 1.0, 0.0 ],
    blue = [ 0.0, 0.8, 1.0 ],
    cyan = [ 0.4, 0.6, 0.6 ],
    green = [ 0.13, 0.7, 0.67 ],
    background = [ 0.9, 0.97, 0.95 ]; // canvas背景色

export default {
    data() {
        return {
            cubeColors: [],
        };
    },
    mounted(){
        let colors = [ pink, red, yellow, blue, cyan, green ];
        this.cubeColors = colors.map(item => this.transferToRGB(item));
        this.paint();
    },
    methods: {
        paint() {
            let VSHADER_SOURCE = `
                precision highp float;
                
                attribute vec4 a_Position;
                attribute vec4 a_Color;
                attribute float a_Face; // 立方体表面编号⭐️【赋值的时候不能用int类型】

                uniform mat4 u_MvpMatrix; // 模型视图投影矩阵
                uniform mat4 u_ModelMatrix; // 模型矩阵
                uniform int u_PickedFace; // 被选中表面的编号⭐️
               

                varying vec4 v_Color;

                void main () {
                    gl_Position = u_MvpMatrix * a_Position;
                    
                    int face = int(a_Face);
                    if (u_PickedFace != -1 && face == u_PickedFace) {
                        v_Color = vec4(1.0, 1.0, 1.0, 1.0);
                    } else {
                        v_Color = a_Color;
                    }
                }
            `;
            let FSHADER_SOURCE = `
                precision highp float;

                varying vec4 v_Color;

                void main() {
                    gl_FragColor = v_Color;
                }
            `;
            
            let canvas = document.getElementById('pick-face');
            let gl = getWebGLContext(canvas);
            if (!gl) {
                console.error('webGL上下文获取失败');
                return;
            }
            if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
                console.error('着色器初始化失败');
                return;
            }
            
            let u_PickedFace = gl.getUniformLocation(gl.program, 'u_PickedFace');
            gl.uniform1i(u_PickedFace, -1); // 初始化设置为未选中状态

            let n = this.initVertexBuffers(gl);
            this.initEventHandle(gl, n, canvas, u_PickedFace);
            this.draw(gl, n, canvas);
        },
        // 事件监听
        initEventHandle(gl, n, canvas, u_PickedFace) {
            let picked = false;
            let rect = canvas.getBoundingClientRect();
            canvas.onmousedown = (ev) => {
                let { clientX, clientY } = ev;
                if (
                    rect.left <= clientX && clientX <= rect.right 
                    && rect.top <= clientY && clientY <= rect.bottom
                ) { // 鼠标在canvas上
                    let x_in_canvas = clientX - rect.left,
                    y_in_canvas = rect.bottom - clientY;
                    picked = this.check(gl, n, x_in_canvas, y_in_canvas, u_PickedFace, canvas);
                    if (picked) {
                        console.log('立方体被选中');
                    }
                }

            };
            canvas.onmouseup = (ev) => {
                if (picked) {
                    gl.uniform1i(u_PickedFace, -1);
                    this.draw(gl, n, canvas);
                    picked = false;
                }
            };
        },
        check(gl, n, x, y, u_PickedFace, canvas) {
            let picked = false, pickOrder = -1;
            gl.uniform1i(u_PickedFace, pickOrder);
            this.draw(gl, n, canvas);
            // 读取点击位置的颜色颜色值
            var pixels = new Uint8Array(4); // 存储像素的数组
            // 从当前的颜色帧缓冲中读取指定矩形的像素矩形并转换为类型数组
            gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            this.cubeColors.forEach((c, i) => {
                if (
                    (pixels[0] === c[0] || pixels[0] === c[0] + 1 || pixels[0] === c[0] - 1) && 
                    (pixels[1] === c[1] || pixels[1] === c[1] + 1 || pixels[1] === c[1] - 1) && 
                    (pixels[2] === c[2] || pixels[2] === c[2] + 1 || pixels[2] === c[2] - 1)
                ) { // webGL内部的取色规则既不是向上取整 又不是向下取整  也不是四舍五入，所以只能加判断条件
                    pickOrder = i;
                }
            });
            if (pickOrder !== -1) {
                picked = true;
                gl.uniform1i(u_PickedFace, pickOrder);
                this.draw(gl, n, canvas);
            }
            return picked;
        },
        draw(gl, n, canvas) {
            this.matrixHandle(gl, canvas);
            gl.clearColor(...background, 1.0);
            // 消除隐藏面
            gl.enable(gl.DEPTH_TEST);

            // 启动多边形位移
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.polygonOffset(0.01, 0.01);

            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            
            gl.drawElements(gl.TRIANGLE_STRIP, 8, gl.UNSIGNED_BYTE, 0);
            gl.drawElements(gl.TRIANGLE_STRIP, 8, gl.UNSIGNED_BYTE,  n/6 * 2);
            gl.drawElements(gl.TRIANGLE_STRIP, 8, gl.UNSIGNED_BYTE, n/6 * 4);
        },
        getUniformLocation(gl, attr) {
            let location = gl.getUniformLocation(gl.program, attr);
            if (location < 0) {
                console.error('获取 '+ attr + ' 下标失败');
                return;
            }
            return location;
        },
        // 矩阵相关
        matrixHandle(gl, canvas) {
            // 模型矩阵
            let modelMatrix = new Matrix4();
            // 模型视图投影矩阵
            let mvpMatrix = new Matrix4();
        
            modelMatrix.setRotate(30, 0, 0, 1); // 绕Z轴旋转30°

            // 创建矩阵 & 设置透视投影可视空间
            mvpMatrix.setPerspective(
                30,
                canvas.width/canvas.height,
                1,
                100,
            );
            // 设置观察信息
            mvpMatrix.lookAt(
                5, -2, 7, // 观察视点
                0, 0, 0, // 观察目标点
                0, 1, 0, // 上方向
            );

            mvpMatrix.multiply(modelMatrix);

            let u_ModelMatrix = this.getUniformLocation(gl, 'u_ModelMatrix');
            let u_MvpMatrix = this.getUniformLocation(gl, 'u_MvpMatrix');

            gl.uniformMatrix4fv(u_ModelMatrix, false,  modelMatrix.elements);
            gl.uniformMatrix4fv(u_MvpMatrix, false,  mvpMatrix.elements);
        },
        // 创建顶点缓冲对象
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
            // 每个面的顶点排序
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
            let colors = [
                ...pink, ...pink, ...pink, ...pink,
                ...red, ...red, ...red, ...red,
                ...yellow, ...yellow, ...yellow, ...yellow,
                ...blue, ...blue, ...blue, ...blue,
                ...cyan, ...cyan, ...cyan, ...cyan,
                ...green, ...green, ...green, ...green,
            ];
            // 每个面的编号
            let faceOrders = [
                0, 0, 0, 0,
                1, 1, 1, 1,
                2, 2, 2, 2,
                3, 3, 3, 3,
                4, 4, 4, 4,
                5, 5, 5, 5,
            ];
            // 索引
            let indices = [
                0, 1, 2, 3,
                4, 5, 6, 7,
                8, 9, 10, 11,
                12, 13, 14, 15,
                16, 17, 18, 19, 
                20, 21, 22, 23,
            ];

            this.initArrayBuffer(gl, vertexAxis, 'a_Position');
            this.initArrayBuffer(gl, colors, 'a_Color');
            this.initArrayBuffer(gl, faceOrders, 'a_Face', 1, gl.UNSIGNED_BYTE);
            this.initElementArrayBuffer(gl, indices);
            return indices.length;
        },
        // 创建顶点属性的缓冲对象
        initArrayBuffer(gl, array, attr, size = 3, type = gl.FLOAT) {
            let typeArray = type === gl.FLOAT ? 
            new Float32Array(array, 0, array.length) :
            new Uint8Array(array, 0, array.length);

            let buffer = gl.createBuffer();
            if (!buffer) {
                console.error(attr + ' 顶点属性缓冲对象创建失败');
                return;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, typeArray, gl.STATIC_DRAW);
            let vertexAttrib = gl.getAttribLocation(gl.program, attr);
            if (vertexAttrib < 0) {
                console.error('获取属性 '+ attr +' 的下标失败');
                return;
            }
            gl.vertexAttribPointer(vertexAttrib, size, type, false, 0, 0);
            gl.enableVertexAttribArray(vertexAttrib);
        },
        // 创建元素索引的缓冲对象
        initElementArrayBuffer(gl, array) {
            let typeArray = new Uint8Array(array, 0, array.length);
            let buffer = gl.createBuffer();
            if (!buffer) {
                console.error('元素索引的缓冲对象创建失败');
                return;
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, typeArray, gl.STATIC_DRAW);
        },
        transferToRGB(percentColor) {
            return percentColor.map(item => {
                let c = Math.round(item * 255);
                return c;
            });
        },
    }
}
</script>

<style>

</style>