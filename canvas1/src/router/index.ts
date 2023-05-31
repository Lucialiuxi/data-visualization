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
      name: 'clickedPoint',
      component: () => import('../views/ClickedPoint.vue')
    },
    {
      path: '/colored-point',
      name: 'coloredPoint',
      component: () => import('../views/ColoredPoint.vue')
    },
    {
      path: '/multi-point',
      name: 'multiPoint',
      component: () => import('../views/MultiPoint.vue')
    },
    {
      path: '/hello-triangle',
      name: 'HelloTriangle',
      component: () => import('../views/HelloTriangle.vue')
    },
    {
      path: '/hello-Line-strip',
      name: 'HelloLineStrip',
      component: () => import('../views/HelloLineStrip.vue')
    },
    {
      path: '/hello-quad',
      name: 'HelloQuad',
      component: () => import('../views/HelloQuad.vue')
    },
  ]
})

export default router
