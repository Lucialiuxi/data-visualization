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
      component: () => import('../views/CanvasView.vue')
    },
    {
      path: 'canvas-point',
      name: 'canvasPoint',
      component: () => import('../views/CanvasPoint.vue')
    },
    {
      path: 'canvas-point-extend',
      name: 'canvasPointExtend',
      component: () => import('../views/CanvasPointExtend.vue')
    },
    {
      path: 'clicked-point',
      name: '鼠标点击绘点',
      component: () => import('../views/ClickedPoint.vue')
    },
    {
      path: 'colored-point',
      name: '改变点的颜色',
      component: () => import('../views/ColoredPoint.vue')
    },
    {
      path: 'multi-point',
      name: '缓冲区对象绘制多个点',
      component: () => import('../views/MultiPoint.vue')
    },
    {
      path: 'hello-triangle',
      name: '三角形',
      component: () => import('../views/HelloTriangle.vue')
    },
    {
      path: 'hello-Line-strip',
      name: '线条',
      component: () => import('../views/HelloLineStrip.vue')
    },
    {
      path: 'hello-quad',
      name: '矩形',
      component: () => import('../views/HelloQuad.vue')
    },
    {
      path: 'translated-triangle',
      name: '平移三角形',
      component: () => import('../views/TranslatedTriangle.vue'),
    },
    {
      path: 'rotated-triangle',
      name: '旋转三角形',
      component: () => import('../views/RotatedTriangle.vue'),
    },
    {
      path: 'rotated-triangle-matrix',
      name: '旋转矩阵',
      component: () => import('../views/RotatedTriangleMatrix.vue'),
    },
    {
      path: 'translate-triangle-matrix',
      name: '平移矩阵',
      component: () => import('../views/TranslateTriangleMatrix.vue'),
    },
    {
      path: 'scale-triangle-matrix',
      name: '缩放矩阵',
      component: () => import('../views/ScaleTriangleMatrix.vue'),
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
