<template>
  <div>
    <canvas id="joint-model" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { initShaders, getWebGLContext } from '@lib/cuon-utils.js';
import Matrix4 from '@lib/cuon-matrix.js';

/**
 * 运动描述：
 *  大臂arm1：左右方向键控制arm1(同时带动整条手臂)水平转动（绕Y轴）；
 *  小臂arm2：上下方向键控制arm2绕joint1关节垂直转动（绕Z轴）。
 *  手掌palm: 使用xz键控制palm绕x轴旋转
 *  手指finger1: as键控制finger1绕x轴旋转
 *  手指finger1: qw键控制finger1绕x轴旋转
 * 
 *  ❓ 如何做到arm2变化，arm1不变
 */
export default {
    data() {
        return {
            verticalAngle: 0, // arm2旋转的垂直角度
            horizontalAngle: 0, // 整条手臂旋转的水平角度
            palmAngle: 0, // 手腕绕x轴旋转的角度
            finger1Angle: 0,  // finger1绕x轴旋转的角度
            finger2Angle: 0,  // finger2绕x轴旋转的角度
            viewProjMatrix: new Matrix4(), // 视图投影矩阵
            modelMatrix: new Matrix4(),// 模型矩阵
            mvpMatrix: new Matrix4(), // 模型视图投影矩阵
            normalMatrix: new Matrix4(), // 法向量变换矩阵,
            g_matrixStack: [], // 存储矩阵的栈
        }
    },
    mounted() {
        this.paint();
    },
    methods: {
        paint() {
            // 顶点着色器
            let VSHADER_SOURCE = `
                precision mediump float;

                attribute vec4 a_Position;
                attribute vec4 a_Color;
                attribute vec4 a_Normal; // 法向量

                uniform mat4 u_MvpMatrix; // 模型视图投影矩阵
                uniform mat4 u_ModelMatrix; // 模型矩阵
                uniform mat4 u_NormalMatrix; // 法向量变换矩阵

                uniform vec3 u_LightPosition; // 点光源坐标

                varying vec4 v_Color;
                varying vec3 v_Normal;
                varying vec3 v_LightDirection; // 点光源方向方向
                
                void main() {
                    gl_Position = u_MvpMatrix * a_Position;
                    
                    // 变换后的法向量
                    v_Normal = vec3(u_NormalMatrix * a_Normal);

                    // 点光源坐标是在世界坐标 所以要先把顶点坐标转化成世界坐标
                    vec3 vertexPosition = vec3(u_ModelMatrix * a_Position);
                    // 光线方向
                    v_LightDirection = normalize(u_LightPosition - vertexPosition);

                    v_Color = a_Color;
                }
            `;

            // 片元着色器
            let FSHADER_SOURCE = `
                precision mediump float;

                varying vec4 v_Color;
                varying vec3 v_Normal;
                varying vec3 v_LightDirection; // 点光源方向方向


                uniform vec3 u_LightColor; // 光线颜色
                uniform vec3 u_AmbientColor; // 环境光颜色

                void main() {
                    // 世界坐标下的法向量
                    vec3 normal = normalize(v_Normal);

                    // 环境光的放射光颜色 = 环境光颜色 * 表面基底色
                    vec3 ambientColor = u_AmbientColor * u_LightColor;

                    // 反射光颜色 = 入射光颜色 * 表面基地色 * cosø
                    float dotLN = max(dot(v_LightDirection, v_Normal), 0.0);
                    vec3 diffuseColor = u_LightColor * v_Color.rgb * dotLN;

                    gl_FragColor = vec4(diffuseColor + ambientColor, v_Color.a);
                }
            `;


            let canvas = document.getElementById('joint-model');
            let gl = getWebGLContext(canvas);
            if (!gl) {
                console.error('获取webGL上下文失败');
                return;
            }
            if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
                console.error('着色器初始化失败');
                return;
            }

            let n = this.initVertexBuffers(gl);

            
            this.viewProjMatrix.setPerspective(
                50,
                canvas.width/canvas.height,
                1,
                100,
            );
            this.viewProjMatrix.lookAt(
                6, 2, 10,
                0, 0, 0,
                0, 1, 0,
            );

            this.lightEffect(gl);

            this.draw(gl, n);

            document.onkeydown = ({ keyCode }) => {
                console.log(keyCode)
                switch(keyCode){
                    case 37: // 左键
                        this.horizontalAngle -= 5;
                        this.draw(gl, n);
                    break;
                    case 39:  // 右键
                        this.horizontalAngle += 5;
                        this.draw(gl, n);
                    break;
                    case 38: // 上键
                        if (this.verticalAngle <= 15) {
                            this.verticalAngle += 5;
                            this.draw(gl, n);
                        }
                    break;
                    case 40:  // 下键
                        if (this.verticalAngle >= -15) {
                            this.verticalAngle -= 5;
                            this.draw(gl, n);
                        }
                    case 88: // x
                    if (this.palmAngle >= -15) {
                            this.palmAngle -= 5;
                            this.draw(gl, n);
                        }
                    break;

                    case 90: // z
                        if (this.palmAngle <= 15) {
                            this.palmAngle += 5;
                            this.draw(gl, n);
                        }
                    break;

                    case 65: // a
                        if (this.finger1Angle <= 40) {
                            this.finger1Angle += 5;
                            this.draw(gl, n);
                        }
                    break;
                    case 83: // s
                        if (this.finger1Angle >= -5) {
                            this.finger1Angle -= 5;
                            this.draw(gl, n);
                        }
                    break;

                    case 81: // q
                        if (this.finger2Angle <= 40) {
                            this.finger2Angle += 5;
                            this.draw(gl, n);
                        }
                    break;
                    case 87: // w
                        if (this.finger2Angle >= -5) {
                            this.finger2Angle -= 5;
                            this.draw(gl, n);
                        }
                    break;
                }
            };
        },
        // 光照
        lightEffect(gl) {
            // 光线颜色
            let u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
            gl.uniform3f(u_LightColor, 1, 1, 1);

            // 点光源位置
            let u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
            gl.uniform3f(u_LightPosition, 3, 4, 5);

            //环境光颜色
            let u_AmbientColor = gl.getUniformLocation(gl.program, 'u_AmbientColor');
            gl.uniform3f(u_AmbientColor, 0.1, 0.1, 0.1);

        },
        uniformMatrixHandle(gl, attr, matrix) {
            let location = gl.getUniformLocation(gl.program, attr);
            if (location < 0) {
                console.error('获取' + attr + '下标失败');
                return;
            }
            gl.uniformMatrix4fv(location, false, matrix.elements);
        },
        pushMatrix(m) { // 将矩阵压入栈
            let m2 = new Matrix4(m);
            this.g_matrixStack.push(m2);

        },
        popMatrix() { // 从栈中弹出矩阵
            return this.g_matrixStack.pop();
        },
        drawBox(
            gl, 
            n, 
            modelMatrix, 
            mvpMatrix, 
            normalMatrix, 
            scaleObj,
        ) {
             if (scaleObj) modelMatrix.scale(scaleObj.x, scaleObj.y, scaleObj.z);
            this.mvpMatrix.set(this.viewProjMatrix); // 复制视图投影矩阵
            this.mvpMatrix.multiply(modelMatrix);

            // 求逆转矩阵
            normalMatrix.setInverseOf(modelMatrix); // 求modelMatrix的逆矩阵
            this.normalMatrix.transpose(); // 在对本身进行转置

            this.uniformMatrixHandle(gl, 'u_ModelMatrix', modelMatrix);
            this.uniformMatrixHandle(gl, 'u_MvpMatrix', mvpMatrix);
            this.uniformMatrixHandle(gl, 'u_NormalMatrix', normalMatrix);

            gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
        },
        draw(gl, n) {
            // 设置清空颜色缓冲时的颜色值
            gl.clearColor(0.95, 0.93, 0.81, 1);
            // 隐藏面消除
            gl.enable(gl.DEPTH_TEST);
            // 多边形位移
            gl.enable(gl.POLYGON_OFFSET_FILL);
            // 使用预设值来清空缓冲
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

            // --- 底座base
            this.modelMatrix.setTranslate(0, -2.1, 0); // y中心从0到-2.1,顶面在-2
            this.drawBox(
                gl, 
                n, 
                this.modelMatrix, 
                this.mvpMatrix, 
                this.normalMatrix, 
            );

            // --- 大臂arm1
            this.modelMatrix.translate(0, 1.1, 0); // y 中心从-2.1 到 -1， 顶面在Y轴-2移动到0
            this.modelMatrix.rotate(this.horizontalAngle, 0, 1, 0);
            this.pushMatrix(this.modelMatrix);

            this.drawBox(
                gl, 
                n, 
                this.modelMatrix, 
                this.mvpMatrix, 
                this.normalMatrix, 
                { x: 0.4,  y: 10, z:  0.4}
            );
            
            this.modelMatrix = this.popMatrix();
            // --- 小臂arm2
            this.modelMatrix.translate(0, 2, 0);  // y中心从 -1 到 1 ,顶面在y轴 0 移动到 2, y移动到2
            this.modelMatrix.rotate(this.verticalAngle, 0, 0, 1);
            this.pushMatrix(this.modelMatrix);  
            this.drawBox(
                gl, 
                n, 
                this.modelMatrix, 
                this.mvpMatrix, 
                this.normalMatrix, 
                { x: 0.6, y: 10, z:  0.6},
            );

            this.modelMatrix = this.popMatrix();
            // --- palm
            this.modelMatrix.translate(0, 1.3, 0);  // y中心从 1 到 2.3， 顶面从2移动到2.6
            this.modelMatrix.rotate(this.palmAngle, 1, 0, 0);
            this.pushMatrix(this.modelMatrix);  
            this.drawBox(
                gl, 
                n, 
                this.modelMatrix, 
                this.mvpMatrix, 
                this.normalMatrix, 
                { x: 0.8, y: 3, z:  0.2 }
            );

            this.modelMatrix = this.popMatrix();
            // --- finger1
            this.modelMatrix.translate(-0.5, 0.6, 0);  // y中心从 2.3 到 2.9， 顶面从2.6移动到3.2 
            this.pushMatrix(this.modelMatrix);  
            this.modelMatrix.rotate(this.finger1Angle, 1, 0, 0);
            this.drawBox(
                gl, 
                n, 
                this.modelMatrix, 
                this.mvpMatrix, 
                this.normalMatrix, 
                { x: 0.1, y: 3, z:  0.1 }
            );

            this.modelMatrix = this.popMatrix();
            // --- finger2
            this.modelMatrix.translate(1, 0, 0);  // y中心从 2.3 到 2.9， 顶面从2.6移动到3.2 
            this.modelMatrix.rotate(this.finger2Angle, 1, 0, 0);
            this.pushMatrix(this.modelMatrix);  
            this.drawBox(
                gl, 
                n, 
                this.modelMatrix, 
                this.mvpMatrix, 
                this.normalMatrix, 
                { x: 0.1, y: 3, z:  0.1 }
            );
        },
        // 创建缓冲对象
        initVertexBuffers(gl) {
            let v0 = [ 1.0, 0.1, 1.0 ],
                v1 = [ -1.0, 0.1, 1.0 ],
                v2 = [ -1.0, -0.1, 1.0 ],
                v3 = [ 1.0, -0.1, 1.0 ],
                v4 = [ 1.0, -0.1, -1.0 ],
                v5 = [ 1.0, 0.1, -1.0 ],
                v6 = [ -1.0, 0.1, -1.0 ],
                v7 = [ -1.0, -0.1, -1.0 ];

            // 顶点坐标
            let vertexAxis = [
                // front
                ...v0, ...v1, ...v2, ...v3,
                // back
                ...v4, ... v5, ...v6, ...v7,
                // left
                ...v1, ...v6, ...v7, ...v2,
                // right
                ...v0, ...v3, ...v4, ...v5,
                // top
                ...v0, ...v1, ...v6, ...v5,
                // bottom
                ...v2, ...v3, ...v4, ...v7,
            ];
            // 每个面的法向量
            let top = [  0.0, 1.0, 0.0 ], 
                bottom = [ 0.0, -1.0, 0.0 ],
                left = [ -1.0, 0.0, 0.0 ],
                right = [ 1.0, 0.0, 0.0 ],
                front = [ 0.0, 0.0, 1.0 ],
                back = [ 0.0, 0.0, -1.0];

            let normals = [
                ...front, ...front, ...front, ...front,
                ...back, ...back, ...back, ...back,
                ...left, ...left, ...left, ...left,
                ...right, ...right, ...right, ...right,
                ...top, ...top, ...top, ...top,
                ...bottom, ...bottom, ...bottom, ...bottom,
            ];

            // 索引
            let indices = [
                0, 1, 2,  0, 2, 3, // front
                4, 5, 6,  4, 6, 7, // back
                8, 9, 10,  8, 10, 11, // left
                12, 13, 14,  12, 14, 15, // right
                16, 17, 18,  16, 18, 19, // top
                20, 21, 22,  20, 22, 23, // bottom
            ];

            let a_Color = gl.getAttribLocation(gl.program, 'a_Color');
            if(!a_Color) {
                console.error('获取a_Color存储下标失败');
                return;
            }
            gl.vertexAttrib3f(a_Color, 0.77, 0.34, 0.1);


            this.initArrayBuffer(gl, vertexAxis, 'a_Position');
            this.initArrayBuffer(gl, normals, 'a_Normal');
            this.initElementArrayBuffer(gl, indices);
            return indices.length;
        },
        // 创建顶点缓冲对象
        initArrayBuffer(gl, array, attr) {
            let typeArray = new Float32Array(array, 0.0, array.length);
            let buffer = gl.createBuffer();
            if (!buffer) {
                console.error('创建顶点缓冲对象失败');
                return;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, typeArray, gl.STATIC_DRAW);

            let location = gl.getAttribLocation(gl.program, attr);
  
            if (location < 0) {
                console.error('获取储存变量'+ attr + '的下标失败');
                return;
            }
            gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0.0, 0);
            gl.enableVertexAttribArray(location);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        },
        // 创建索引缓冲对象
        initElementArrayBuffer(gl, array) {
            let typeArray = new Uint8Array(array, 0.0, array.length);
            let buffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, typeArray, gl.STATIC_DRAW);
        },
    },
}
/**
 * 问题：
 * 1 调用3次只画出2个立方体，第3个未生效:
 *  原因：是translate值过大 显示超出了可视区
 * 2 arm2垂直旋转的时候，每次旋转都会拉伸
 *  原因：setTranslate、 setScale、translate、scale 都是基于物体中心的, translate的值会跟矩阵前一次设置的scale相乘
 *  解决：绘制下一个矩阵之前，把前一个矩阵（不包含scale的矩阵）存入栈中，下一个矩阵使用前一次存入栈中不包含scale的矩阵
 * 
 * 3 setTranslate和setScale也是基于原本的矩阵，并没有新建
 * 
 * 
 */
</script>