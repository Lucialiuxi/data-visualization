import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => HomeView,
    },
    {
      path: '/canvas',
      name: 'canvas',
      component: () => import('../views/CanvasView.vue')
    },
    {
      path: '/canvas-point',
      name: 'canvasPoint',
      component: () => import('../views/CanvasPoint.vue')
    },
    {
      path: '/canvas-point-extend',
      name: 'canvasPointExtend',
      component: () => import('../views/CanvasPointExtend.vue')
    },
    {
      path: '/clicked-point',
      name: '鼠标点击绘点',
      component: () => import('../views/ClickedPoint.vue')
    },
    {
      path: '/colored-point',
      name: '改变点的颜色',
      component: () => import('../views/ColoredPoint.vue')
    },
    {
      path: '/multi-point',
      name: '缓冲区对象绘制多个点',
      component: () => import('../views/MultiPoint.vue')
    },
    {
      path: '/hello-triangle',
      name: '三角形',
      component: () => import('../views/HelloTriangle.vue')
    },
    {
      path: '/hello-Line-strip',
      name: '线条',
      component: () => import('../views/HelloLineStrip.vue')
    },
    {
      path: '/hello-quad',
      name: '矩形',
      component: () => import('../views/HelloQuad.vue')
    },
    {
      path: '/translated-triangle',
      name: '平移三角形',
      component: () => import('../views/TranslatedTriangle.vue'),
    },
    {
      path: '/rotated-triangle',
      name: '平移三角形',
      component: () => import('../views/RotatedTriangle.vue'),
    },
  ]
})

export default router
