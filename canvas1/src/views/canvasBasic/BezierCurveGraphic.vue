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
                this.drawDialogBox(ctx);
            }
        },
        // 绘制一个对话框气泡
        drawDialogBox(ctx) {
            /**
             * quadraticCurveTo(cpx1, cpy1, x, y);
             * cpx1, cpy1控制点
             * x, y 结束点
             */
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(200, 200, 400, 0);
            ctx.strokeStyle = 'red';
            ctx.stroke();
            
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