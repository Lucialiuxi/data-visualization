import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      cName: 'Home',
      component: () => HomeView,
    },
    {
      path: '/canvas',
      name: 'canvas',
      cName: 'Canvas',
      component: () => import('../views/CanvasView.vue')
    },
    {
      path: '/canvas-point',
      name: 'canvasPoint',
      cName: 'CanvasPoint',
      component: () => import('../views/CanvasPoint.vue')
    },
    {
      path: '/canvas-point-extend',
      name: 'canvasPointExtend',
      cName: 'CanvasPointExtend',
      component: () => import('../views/CanvasPointExtend.vue')
    },
    {
      path: '/clicked-point',
      name: 'clickedPoint',
      cName: '鼠标点击绘点',
      component: () => import('../views/ClickedPoint.vue')
    },
    {
      path: '/colored-point',
      name: 'coloredPoint',
      cName: '改变点的颜色',
      component: () => import('../views/ColoredPoint.vue')
    },
    {
      path: '/multi-point',
      name: 'multiPoint',
      cName: '缓冲区对象绘制多个点',
      component: () => import('../views/MultiPoint.vue')
    },
    {
      path: '/hello-triangle',
      name: 'HelloTriangle',
      cName: '三角形',
      component: () => import('../views/HelloTriangle.vue')
    },
    {
      path: '/hello-Line-strip',
      name: 'HelloLineStrip',
      cName: '线条',
      component: () => import('../views/HelloLineStrip.vue')
    },
    {
      path: '/hello-quad',
      name: 'HelloQuad',
      cName: '矩形',
      component: () => import('../views/HelloQuad.vue')
    },
    {
      path: '/translated-triangle',
      name: '/TranslatedTriangle',
      cName: '平移三角形',
      component: () => import('../views/TranslatedTriangle.vue'),
    },
  ]
})

export default router
