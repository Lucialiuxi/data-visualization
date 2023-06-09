import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue';

export const singleRoutes = {
  path: '/single/:id?',
  component: () => HomeView,
  name: 'single',
  props: {
    params: '简单'
  },
  children: [
    {
      path: 'canvas',
      name: 'canvas',
      component: () => import('../views/single/CanvasView.vue')
    },
    {
      path: 'canvas-point',
      name: 'canvasPoint',
      component: () => import('../views/single/CanvasPoint.vue')
    },
    {
      path: 'canvas-point-extend',
      name: 'canvasPointExtend',
      component: () => import('../views/single/CanvasPointExtend.vue')
    },
    {
      path: 'clicked-point',
      name: '鼠标点击绘点',
      component: () => import('../views/single/ClickedPoint.vue')
    },
    {
      path: 'colored-point',
      name: '改变点的颜色',
      component: () => import('../views/single/ColoredPoint.vue')
    },
    {
      path: 'multi-point',
      name: '缓冲区对象绘制多个点',
      component: () => import('../views/single/MultiPoint.vue')
    },
    {
      path: 'hello-triangle',
      name: '三角形',
      component: () => import('../views/single/HelloTriangle.vue')
    },
    {
      path: 'hello-Line-strip',
      name: '线条',
      component: () => import('../views/single/HelloLineStrip.vue')
    },
    {
      path: 'hello-quad',
      name: '矩形',
      component: () => import('../views/single/HelloQuad.vue')
    },
    {
      path: 'translated-triangle',
      name: '平移三角形',
      component: () => import('../views/single/TranslatedTriangle.vue'),
    },
    {
      path: 'rotated-triangle',
      name: '旋转三角形',
      component: () => import('../views/single/RotatedTriangle.vue'),
    },
    {
      path: 'rotated-triangle-matrix',
      name: '旋转矩阵',
      component: () => import('../views/single/RotatedTriangleMatrix.vue'),
    },
    {
      path: 'translate-triangle-matrix',
      name: '平移矩阵',
      component: () => import('../views/single/TranslateTriangleMatrix.vue'),
    },
    {
      path: 'scale-triangle-matrix',
      name: '缩放矩阵',
      component: () => import('../views/single/ScaleTriangleMatrix.vue'),
    },
  ]
};
export const advanceRoutes = {
  path: '/advance/:id?',
  component: () => HomeView,
  name: 'advance',
  props: {
    params: '进阶'
  },
  children: [

  ]
};
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => HomeView,
      name: 'enter',
      props: {
        params: '准备开始学习吧'
      },
    },
    singleRoutes,
    advanceRoutes,
  ],
})

export default router
