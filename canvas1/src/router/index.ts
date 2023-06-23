import { createRouter, createWebHistory } from 'vue-router'


export const singleRoutes = {
  path: '/simple/:id?',
  component: () => import('../views/HomeView.vue'),
  name: 'simple',
  props: {
    params: '简单'
  },
  children: [
    {
      path: 'canvas',
      name: 'canvas',
      component: () => import('../views/simple/CanvasView.vue')
    },
    {
      path: 'canvas-point',
      name: 'canvasPoint',
      component: () => import('../views/simple/CanvasPoint.vue')
    },
    {
      path: 'canvas-point-extend',
      name: 'canvasPointExtend',
      component: () => import('../views/simple/CanvasPointExtend.vue')
    },
    {
      path: 'clicked-point',
      name: '鼠标点击绘点',
      component: () => import('../views/simple/ClickedPoint.vue')
    },
    {
      path: 'colored-point',
      name: '改变点的颜色',
      component: () => import('../views/simple/ColoredPoint.vue')
    },
    {
      path: 'multi-point',
      name: '缓冲区对象绘制多个点',
      component: () => import('../views/simple/MultiPoint.vue')
    },
    {
      path: 'hello-triangle',
      name: '三角形',
      component: () => import('../views/simple/HelloTriangle.vue')
    },
    {
      path: 'hello-Line-strip',
      name: '线条',
      component: () => import('../views/simple/HelloLineStrip.vue')
    },
    {
      path: 'hello-quad',
      name: '矩形',
      component: () => import('../views/simple/HelloQuad.vue')
    },
    {
      path: 'translated-triangle',
      name: '平移三角形',
      component: () => import('../views/simple/TranslatedTriangle.vue'),
    },
    {
      path: 'rotated-triangle',
      name: '旋转三角形',
      component: () => import('../views/simple/RotatedTriangle.vue'),
    },
    {
      path: 'rotated-triangle-matrix',
      name: '旋转矩阵',
      component: () => import('../views/simple/RotatedTriangleMatrix.vue'),
    },
    {
      path: 'translate-triangle-matrix',
      name: '平移矩阵',
      component: () => import('../views/simple/TranslateTriangleMatrix.vue'),
    },
    {
      path: 'scale-triangle-matrix',
      name: '缩放矩阵',
      component: () => import('../views/simple/ScaleTriangleMatrix.vue'),
    },
  ]
};
export const advanceRoutes = {
  path: '/advance/:id?',
  component: () => import('../views/HomeView.vue'),
  name: 'advance',
  props: {
    params: '进阶(Matrix4函数)'
  },
  children: [
    {
      path: 'rotated-triangle-matrix',
      name: '旋转矩阵',
      component: () => import('../views/advance/RotatedTriangleMatrix.vue'),
    },
    {
      path: 'rotated-translate-triangle',
      name: '旋转平移矩阵',
      component: () => import('../views/advance/RotatedTranslateTriangle.vue'),
    },
    {
      path: 'rotating-triangle',
      name: '旋转动画',
      component: () => import('../views/advance/RotatingTriangle.vue')
    }
  ]
};

// 颜色和纹理
let rasterize  = {
  path: '/rasterize/:id?',
  name: 'rasterize',
  displayName: '颜色和纹理',
  component: () => import('../views/HomeView.vue'),
  props: {
    params: '颜色与纹理-基础'
  },
  children: [
    {
      path: 'multiAttributeSize',
      name: '多顶点位置&大小',
      component: () => import('../views/rasterization/MultiAttributeSize.vue')
    },
    {
      path: 'multiAttributeColor',
      name: '顶点多个颜色',
      component: () => import('../views/rasterization/MultiAttributeColor.vue')
    },
    {
      path: 'TriangleFragCoord',
      name: '逐片元修改颜色',
      component: () => import('../views/rasterization/TriangleFragCoord.vue')
    },
    {
      path: 'TextureQuad',
      name: '带纹理的矩形',
      component: () => import('../views/rasterization/TextureQuad.vue')
    },
    {
      path: 'TextureQuadRepeat',
      name: '带纹理的矩形-试验',
      component: () => import('../views/rasterization/TextureRepeat.vue')
    },
    {
      path: 'MultiTexture',
      name: '多幅纹理',
      component: () => import('../views/rasterization/MultiTexture.vue')
    },
  ]
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../views/HomeView.vue'),
      name: 'enter',
      props: {
        params: '准备开始学习吧'
      },
    },
    singleRoutes,
    advanceRoutes,
    rasterize,
  ],
})

export default router
