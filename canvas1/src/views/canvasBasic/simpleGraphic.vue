<template>
    <div>
      <canvas id="simple-graphic" height="600" width="600"></canvas>
    </div>
  </template>
  <script>
  export default {
      mounted(){
          this.paint();
      },
      methods: {
          paint() {
              let canvas = document.getElementById('simple-graphic');
              if (canvas.getContext) {
                  let ctx = canvas.getContext('2d');
  
                  // 填充矩形
                  ctx.fillStyle='#f77f00';
                  ctx.fillRect(35, 35, 55, 50);
  
                  // 矩形边框
                  ctx.strokeRect(10, 10, 110, 100);
  
                  // 清除指定矩形区域，让清除部分完全透明
                  ctx.clearRect(35, 35, 25, 25);
  
                  // ctx.font 描述绘制文字时，当前字体样式的属性
                  ctx.font = "bold 48px fantasy";
  
                  // ctx.strokeText(text, x, y[, maxWidth])
                  ctx.strokeText(
                      'HUD:Head Up Display Triangle is drawn by Canvas 2D API.' +
                      ' Cube is Drawn by WebGL API.' +
                      ' Current Angle:' + 
                      this.currentAngle,
                      0,
                      300,
                      600,
                  );
  
                  ctx.strokeStyle = 'rgb(255, 0, 0 )'; // ？ ctx.fillStyle生效了 此处未生效
  
                  // --绘制一个填充三角形---------------- start
                  ctx.beginPath(); // 新建一条路径
                  ctx.moveTo(400, 400); // 将新的一个子路径的起始点移动到(x,y)
                  ctx.lineTo(450, 450); // 使用直线连接子路径的重点到(x,y)【并不会真正的绘制】
                  ctx.lineTo(400, 450);
                  ctx.fill(); // 通过填充途径的内容区域形成实心的图形
                  // --绘制一个填充三角形---------------- end
  
                  // --绘制一个描边三角形---------------- start
                  ctx.beginPath(); // 新建一条路径
                  ctx.moveTo(400, 100); // 将新的一个子路径的起始点移动到(x,y)
                  ctx.lineTo(450, 100); // 使用直线连接子路径的重点到(x,y)【并不会真正的绘制】
                  ctx.lineTo(450, 150);
                  ctx.lineTo(400, 100);
                  ctx.stroke(); // 通过线条来绘制图形轮廓
                  ctx.closePath();
                  // --绘制一个描边三角形---------------- end
  
                  // --绘制一个笑脸----------------start
                  let centerX = 300, centerY = 200;
                  ctx.beginPath();
                  // 弧度 = 圆心角度数 * π / 180
                  let endAngle =  360 * Math.PI / 180
                  /**
                   * 绘制圆弧路径的方法：
                   * void ctx.act(x, y, radius, startAngle, endAngle, anticlockwise);
                   * x,y 圆心坐标
                   * startAngle圆弧的起始点， X轴方向开始计算，单独以弧度表示
                   * endAngle 圆弧的终点，单位以弧度表示
                   * anticlockwise 是否为逆时针绘制
                   */
                  ctx.arc(centerX, centerY, 50, 0, endAngle, true);
                  ctx.fill(); 
  
                  ctx.beginPath();
                  ctx.arc(centerX - 20, centerY -5, 5, 0, endAngle, true);
                  ctx.stroke(); // 使用非零环绕规则，根据当前的画线样式，绘制当前或者已经存在的路径的方法
  
                  ctx.beginPath();
                  ctx.arc(centerX + 20, centerY -5, 5, 0, endAngle, true);
                  ctx.stroke();
  
                  ctx.beginPath();
                  ctx.arc(centerX, centerY, 40, 15 * Math.PI / 180, 165 * Math.PI / 180, false);
                  ctx.stroke();
                 // --绘制一个笑脸----------------end
  
              }
          },
      }
  }
  </script>