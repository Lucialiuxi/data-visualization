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

                // 给canvas设置背景色
                ctx.fillStyle = '#e6f8f3';
                ctx.fillRect(0, 0, 600, 600);

                this.drawDialogBox(ctx);
                this.drawHeart(ctx);
            }
        },
        // 绘制一个空心的心
        drawHeart(ctx) {
            /**
             * 三次贝尔塞曲线
             * bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x, y)
             * cpx1, cpy1控制点一
             * cpx1, cpy1控制点二
             * x, y 结束点
             */
            ctx.beginPath();
            ctx.moveTo(200, 120);
            ctx.strokeStyle = 'pink';
            ctx.bezierCurveTo(70, 50, 200, 200, 200, 200);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(200, 120);
            ctx.bezierCurveTo(320, 50, 200, 200, 200, 200);
            ctx.stroke();

        },
        // 绘制一个对话框气泡
        drawDialogBox(ctx) {
            /**
             * quadraticCurveTo(cpx1, cpy1, x, y);
             * cpx1, cpy1控制点
             * x, y 结束点
             */
            ctx.beginPath();
            ctx.moveTo(75, 25);
            ctx.quadraticCurveTo(25, 25, 25, 62.5);
            // ctx.strokeStyle = 'red';
            ctx.stroke();
            // this.drawSmallCircle(ctx, 75, 25, 2, 'green');
            // this.drawSmallCircle(ctx, 25, 25, 2, 'pink');
            // this.drawSmallCircle(ctx, 25, 62.5, 2, 'blue');


            ctx.beginPath();
            ctx.moveTo(75, 25);
            ctx.quadraticCurveTo(125, 25, 125, 62.5);
            // ctx.strokeStyle = 'green';
            ctx.stroke();
            // this.drawSmallCircle(ctx, 125, 25, 2, 'green');

            ctx.beginPath();
            ctx.moveTo(25, 62.5);
            ctx.quadraticCurveTo(25, 100, 50, 100);
            // ctx.strokeStyle = 'darkblue';
            ctx.stroke();
            // this.drawSmallCircle(ctx, 25, 100, 2, 'darkblue');

            ctx.beginPath();
            ctx.moveTo(50, 100);
            ctx.quadraticCurveTo(50, 120, 30, 120);
            // ctx.strokeStyle = 'lightgreen';
            ctx.stroke();
            // this.drawSmallCircle(ctx, 50, 120, 2, 'lightgreen');


            ctx.beginPath();
            ctx.moveTo(70, 100);
            ctx.quadraticCurveTo(60, 120, 30, 120);
            // ctx.strokeStyle = 'darkred';
            ctx.stroke();
            // this.drawSmallCircle(ctx, 60, 120, 2, 'darkred');

            ctx.beginPath();
            ctx.moveTo(70, 100);
            ctx.quadraticCurveTo(125, 100, 125, 62.5);
            // ctx.strokeStyle = 'purple';
            ctx.stroke();
            // this.drawSmallCircle(ctx, 60, 130, 2, 'purple');
            
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