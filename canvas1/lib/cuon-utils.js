// cuon-utils.js (c) 2012 kanda and matsuda
/**
 * Create a program object and make current
 * @param gl GL context
 * @param vshader a vertex shader program (string)
 * @param fshader a fragment shader program (string)
 * @return true, if the program object was created and successfully made current 
 */
export function initShaders(gl, vshader, fshader) {
  var program = createProgram(gl, vshader, fshader);
  if (!program) {
    console.log('Failed to create program');
    return false;
  }

  gl.useProgram(program); // 将定义好的WebGLProgram 对象添加到当前的渲染状态中
  gl.program = program;

  return true;
}

/**
 * Create the linked program object
 * @param gl GL context
 * @param vshader a vertex shader program (string)
 * @param fshader a fragment shader program (string)
 * @return created program object, or null if the creation has failed
 */
function createProgram(gl, vshader, fshader) {
  // Create shader object
  var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
  var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
  if (!vertexShader || !fragmentShader) {
    return null;
  }

  // 创建程序对象
  var program = gl.createProgram();
  if (!program) {
    return null;
  }

  // 为程序对象分配着色器
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  // 连接程序对象
  gl.linkProgram(program);

  // Check the result of linking
  var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    // 返回参数中指定的webProgram object的信息，包括在linking过程中的错误以及webProgram objects合法检查的错误
    var error = gl.getProgramInfoLog(program);
    console.log('Failed to link program: ' + error);
    gl.deleteProgram(program);
    gl.deleteShader(fragmentShader); // deleteShader并不会立即删除着色器，而是要等到程序对象不再使用该着色器后，才将其删除
    gl.deleteShader(vertexShader);
    return null;
  }
  return program;
}

/**
 * Create a shader object
 * @param gl GL 指定渲染上下文
 * @param type  指定顶点着色器程序代码string gl.VERTEX_SHADER || gl.FRAGMENT_SHADER
 * @param source shader program (string) 着色器程序的源代码
 * @return created shader object, or null if the creation has failed.
 */
function loadShader(gl, type, source) {
  // 创建一个 WebGLShader 着色器对象
  var shader = gl.createShader(type);
  if (shader == null) {
    console.log('unable to create shader');
    return null;
  }

  // 设置着色器的GLSL程序代码
  gl.shaderSource(shader, source);

  // 用于编译一个GLSL着色器，使其成为二进制数据
  gl.compileShader(shader);

  // 返回给定的着色器信息【编译状态】
  var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    var error = gl.getShaderInfoLog(shader); // 获取shader指定的着色器的信息日志
    console.log('Failed to compile shader: ' + error);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/** 
 * 获取WebGL绘图上下文
 * Initialize and get the rendering for WebGL
 * @param canvas <cavnas> element
 * @param opt_debug flag to initialize the context for debugging
 * @return the rendering context for WebGL
 */
export function getWebGLContext(canvas, opt_debug) {
  // Get the rendering context for WebGL
  var gl = window?.WebGLUtils?.setupWebGL(canvas);
  if (!gl) return null;

  // if opt_debug is explicitly false, create the context for debugging
  if (arguments.length < 2 || opt_debug) {
    gl = window.WebGLDebugUtils.makeDebugContext(gl);
  }

  return gl;
}
