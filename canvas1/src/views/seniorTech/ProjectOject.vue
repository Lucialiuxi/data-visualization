<template>
  <div class="project-object-wrap">
    <canvas id="project-object" height="600" width="600"></canvas>
  </div>
</template>

<script>
import { getWebGLContext, createProgram } from '@lib/cuon-utils';
import Matrix4 from '@lib/cuon-matrix';
export default {
    mounted() {
        this.paintHandle();
    },
    methods: {
        paintHandle() {
            let {
                SOLID_VSHADER_SOURCE,
                SOLID_FSHADER_SOURCE,
            } = this.getShaderSource();

            let canvas = document.getElementById('project-object');
            let gl = getWebGLContext(canvas);
            if (!gl) {
                console.error('Failed to get the rendering context for WebGL');
                return;
            }

            // 初始化着色器            
            let solidProgram = createProgram(gl, SOLID_VSHADER_SOURCE, SOLID_FSHADER_SOURCE);
         

            // 获取缓冲对象中的属性的存储下标
            this.getSolidLocation(gl, solidProgram);
            // console.log(solidProgram)
            let solidL = this.validate(solidProgram);
            if (!solidL ) return;

            let cube = this.initVertexBuffers(gl);

            gl.enable(gl.DEPTH_TEST);
            gl.clearColor(0.79, 0.86, 0.53, 1.0);

            // 视图投影矩阵
            let viewProjMatrix = new Matrix4();
            viewProjMatrix.setPerspective(
                30.0, 
                canvas.width/canvas.height, 
                1.0, 
                100.0,
            );
            viewProjMatrix.lookAt(
                0.0, 0.0, 15.0, 
                0.0, 0.0, 0.0, 
                0.0, 1.0, 0.0,
            );
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            this.drawSolidCube(gl, solidProgram, cube, viewProjMatrix);
        },
        drawSolidCube(gl, program, cube, viewProjMatrix) {
            gl.useProgram(program);

            this.initAttributeVariable(gl, program.a_Position, cube.vertexBuffer);
            this.initAttributeVariable(gl, program.a_Normal, cube.normalBuffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);

            this.drawCube(gl, program, cube, viewProjMatrix);
        },
        // 绘制立方体的通用方法
        drawCube(gl, program, cube, viewProjMatrix) {
            let modelMatrix = new Matrix4(); // 旋转、平移、缩放等
            let normalMatrix = new Matrix4(); // 法向量变换的矩阵
            let mvpMatrix = new Matrix4();

            modelMatrix.setRotate(30, 1, 1, 1);

            // 根据模型矩阵计算用来变换法向量的矩阵
            normalMatrix.setInverseOf(modelMatrix);
            // 对自身进行转置
            normalMatrix.transpose();
            gl.uniformMatrix4fv(program.u_NormalMatrix, false, normalMatrix.elements);
            
            mvpMatrix.set(viewProjMatrix).multiply(modelMatrix);
            gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);

            gl.drawElements(gl.TRIANGLES, cube.numIndices, cube.indexBuffer.type, 0);
        },
        initAttributeVariable(gl, a_attribute, buffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
            gl.enableVertexAttribArray(a_attribute);
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

            let vertices = [
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
            back = [ 0.0, 0.0, -1.0];
            let normals = [
                ...front, ...front, ...front, ...front,
                ...right, ...right, ...right, ...right, 
                ...top, ...top, ...top, ...top,
                ...left, ...left, ...left,  ...left, 
                ...bottom, ...bottom, ...bottom, ...bottom, 
                ...back, ...back, ...back, ...back,
            ];

            let indices = [
                0, 1, 2,   0, 2, 3, 
                4, 5, 6,   4, 6, 7,
                8, 9,10,   8,10,11, 
                12,13,14,  12,14,15,
                16,17,18,  16,18,19, 
                20,21,22,  20,22,23
            ];
            
            let o = new Object();

            o.vertexBuffer = this.initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
            o.normalBuffer = this.initArrayBufferForLaterUse(gl, normals, 3, gl.FLOAT);
            o.indexBuffer = this.initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);

            if (!this.validate(o)) return;
            o.numIndices = indices.length;
            
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

            return o;
        },
        // 缓冲对象中的属性的存储下标是否存在
        validate(program) {
            return Object.keys(program).every(key => {
                let value = program[key];
                if (typeof value === 'number' && value >= 0) return true;
                if (typeof value === 'object') return true;
                console.error('获取 '+ key + ' 下标失败');
                return false;
            });
        },
        // 获取单色立方体的顶点属性储存下标
        getSolidLocation(gl, program) {
            program.a_Position = gl.getAttribLocation(program, 'a_Position');
            program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
            program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
            program.u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
        },
        // 获取着色器代码
        getShaderSource() {
            let SOLID_VSHADER_SOURCE =`
                attribute vec4 a_Position;
                attribute vec4 a_Normal;
                uniform mat4 u_MvpMatrix;
                uniform mat4 u_NormalMatrix;
                varying vec4 v_Color;
                void main() {  
                    vec3 lightDirection = vec3(0.0, 0.0, 1.0);
                    vec4 color = vec4(0.0, 1.0, 1.0, 1.0);
                    gl_Position = u_MvpMatrix * a_Position;  
                    vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));  
                    float nDotL = max(dot(normal, lightDirection), 0.0);  
                    v_Color = vec4(color.rgb * nDotL, color.a);
                }
            `;
            let SOLID_FSHADER_SOURCE = `
                precision mediump float;
                varying vec4 v_Color;
                void main() {   
                    gl_FragColor = v_Color; 
                }
            `;

           return {
                SOLID_VSHADER_SOURCE,
                SOLID_FSHADER_SOURCE,
            }
        },
        initArrayBufferForLaterUse(gl, data, num, type) {
            let array = new Float32Array(data, 0, data.length);
            let buffer = gl.createBuffer();
            if (!buffer) {
                console.log('Failed to create the buffer object');
                return null;
            }
        
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);

            buffer.num = num;
            buffer.type = type;

            return buffer;
        },
        initElementArrayBufferForLaterUse(gl, data, type) {
            let array = new Uint8Array(data, 0, data.length);
            let buffer = gl.createBuffer();
            if (!buffer) {
                console.log('Failed to create the buffer object');
                return null;
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, array, gl.STATIC_DRAW);

            buffer.type = type;

            return buffer;
        },
    }
}
</script>

<style>

</style>