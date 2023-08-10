<template>
  <div>
    <canvas id="path2d-test" height="600" width="600"></canvas>
  </div>
</template>

<script>
export default {
    mounted() {
        this.paintHandle();
    },
    methods: {
        paintHandle() {
            let canvas = document.getElementById('path2d-test');
            if (canvas.getContext) {
                let ctx = canvas.getContext('2d');
                ctx.strokeStyle = 'red';
                ctx.fillStyle = '#e6f8f3';

                let rectAngle = new Path2D();
                rectAngle.rect(0, 0, 600, 600);

                let circle = new Path2D();
                circle.moveTo(125, 35);
                circle.arc(100, 35, 25, 0, 2 * Math.PI);

                ctx.fill(rectAngle);
                ctx.stroke(circle);
            }
        }
    }
}
</script>

<style>

</style>