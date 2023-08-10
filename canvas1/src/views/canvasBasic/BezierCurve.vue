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
                
                ctx.beginPath();
                ctx.moveTo(10, 10);
                /**
                 * 二次贝塞尔曲线:
                 * quadraticCurveTo(cp1x, cp1y, x, y)
                 * cp1x, cp1y为一个控制点
                 * x, y 为结束点
                 */
                ctx.quadraticCurveTo(50, 400, 300, 300);
                ctx.strokeStyle = '#af9f1c';
                ctx.stroke();
                this.drawSmallCircle(ctx, 10, 10, 3, 'yellowgreen'); // 起点
                this.drawSmallCircle(ctx, 50, 400, 3, 'red'); // 控制点
                this.drawSmallCircle(ctx, 300, 300, 3, 'green'); // 结束点
                this.drawDashLine(ctx, 10, 10, 50, 400); // 连接起点和控制点
                this.drawDashLine(ctx, 50, 400, 300, 300); // 连接控制点和结束点

                ctx.setLineDash([]); // 讲之前设置的虚线转换为实线
                ctx.beginPath();
                ctx.moveTo(580, 10);
                /**
                 * 三次贝尔塞曲线
                 * bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
                 * cp1x, cp1y为控制点一
                 * cp2x, cp2y为控制点二
                 * x, y 为结束点
                 */
                ctx.bezierCurveTo(150, 100, 500, 150, 400, 400);
                ctx.strokeStyle = "lightBlue";
                ctx.stroke();

                this.drawSmallCircle(ctx, 580, 10, 3, 'yellowgreen'); // 起点
                this.drawSmallCircle(ctx, 150, 100, 3, 'red'); // 控制点一
                this.drawSmallCircle(ctx, 500, 150, 3, 'purple'); // 控制点二
                this.drawSmallCircle(ctx, 400, 400, 3, 'green'); // 结束点

                this.drawDashLine(ctx, 150, 100, 580, 10);
                this.drawDashLine(ctx, 500, 150, 400, 400);
            }
        },
        drawSmallCircle(ctx, x, y, radius, color) {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 360*Math.PI/180, true);
            ctx.fillStyle = color;
            ctx.fill();
        },
        drawDashLine(ctx, x1, y1, x2, y2) {
            ctx.beginPath();
            /**
             * 在填充线时使用虚线模式
             * setLineDash(segments)
             * segments number[] 一组描述交替绘制线段和间距（坐标空间单位）长度的数字
             */
            ctx.setLineDash([ 5, 5 ]); 
            ctx.moveTo(x1, y1); // 线的起点
            ctx.lineTo(x2, y2); // 线的终点
            ctx.strokeStyle = 'black';
            ctx.stroke();
        }
    }
}
  </script>