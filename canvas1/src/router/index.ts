import { createRouter, createWebHistory } from 'vue-router'

const canvasBasic = {
  path: '/canvasBasic/:id?',
  name: 'canvasBasic',
  component: () => import('../views/HomeView.vue'),
  props: {
    params: 'canvas基础',
  },
  children: [
    {
      path: 'simple-graphic',
      name: '简单的图形',
      component: () => import('../views/canvasBasic/SimpleGraphic.vue'),
    },
    {
      path: 'bezier-curve',
      name: '贝尔塞曲线',
      component: () => import('../views/canvasBasic/BezierCurve.vue'),
    },
    {
      path: 'bezier-curve-graphic',
      name: '图形(by贝尔塞)',
      component: () => import('../views/canvasBasic/BezierCurveGraphic.vue'),
    },
    {
      path: 'path-2d',
      name: 'Path2D',
      component: () => import('../views/canvasBasic/Path2DTest.vue'),
    }
  ],
};
const singleRoutes = {
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

const advanceRoutes = {
  path: '/advance/:id?',
  component: () => import('../views/HomeView.vue'),
  name: 'advance',
  aliasOf: '进阶(Matrix4函数)',
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

// 颜色和纹理(光栅shan化)
const rasterizeRoutes  = {
  path: '/rasterize/:id?',
  name: 'rasterize',
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

// 三维空间
 const threeDimensionalSpace = {
  path: '/threeDimensional/:id?',
  component: () => import('../views/HomeView.vue'),
  name: 'threeDimensional',
  props: {
    params: '进入三维世界'
  },
  children: [
    {
      path: 'lookAtTriangles',
      name: '视线、视点',
      component: () => import('../views/threeDimensionalSpace/LookAtTriangles.vue'),
    },
    {
      path: 'lookAtRotatedTriangles',
      name: '指定视点',
      component: () => import('../views/threeDimensionalSpace/LookAtRotatedTriangles.vue'),
    },
    {
      path: 'LookAtRotatedTriangle_mvMatrix',
      name: '模型视图矩阵',
      component: () => import('../views/threeDimensionalSpace/LookAtRotatedTriangle_mvMatrix.vue'),
    },
    {
      path: 'lookAtTrianglesWidthKeys',
      name: '用键盘改变视点',
      component: () => import('../views/threeDimensionalSpace/LookAtTrianglesWidthKeys.vue'),
    },
    {
      path: 'orthographicView',
      name: '正射投影-键盘改变可视空间大小',
      component: () => import('../views/threeDimensionalSpace/OrthographicView.vue'),
    },
    {
      path: 'lookAtTriangleWithKeys_ViewVolume',
      name: '正射投影-补缺角',
      component: () => import('../views/threeDimensionalSpace/LookAtTrianglesWidthKeys_ViewVolume.vue'),
    },
    {
      path: 'orthoView_halfSize',
      name: '正射投影-可视空间宽高比压缩',
      component: () => import('../views/threeDimensionalSpace/OrthographicView_halfSize.vue'),
    },
    {
      path: 'perspectiveView',
      name: '透视投影',
      component: () => import('../views/threeDimensionalSpace/PerspectiveView.vue'),
    },
    {
      path: 'perspectiveView_mvp',
      name: '透视投影-移动复制',
      component: () => import('../views/threeDimensionalSpace/PerspectiveView_mvp.vue'),
    },
    {
      path: 'perspectiveView_mvpMatrix',
      name: '透视投影-前后关系',
      component: () => import('../views/threeDimensionalSpace/PerspectiveView_mvpMatrix.vue'),
    },
    {
      path: 'zFighting',
      name: '深度冲突',
      component: () => import('../views/threeDimensionalSpace/ZFighting.vue'),
    },
    {
      path: 'hello-cube-strip',
      name: '立方体【drawArrays条状带三角形】',
      component: () => import('../views/threeDimensionalSpace/HelloCube_STRIP.vue'),
    },
    {
      path: 'hello-cube-fan',
      name: '立方体【drawArrays三角扇-wrong】',
      component: () => import('../views/threeDimensionalSpace/HelloCube-FAN.vue'),
    },
    {
      path: 'hello-cube-drawElements',
      name: '立方体【drawElements三角扇-wrong】',
      component: () => import('../views/threeDimensionalSpace/HelloCube_drawElements.vue'),
    },
    {
      path: 'hello-cube_drawElements_triangles',
      name: '立方体【drawElements-三角形】',
      component: () => import('../views/threeDimensionalSpace/HelloCube_drawElements_triangles.vue'),
    },
    {
      path: 'colored_cube',
      name: '立方体【单色面-三角形】',
      component: () => import('../views/threeDimensionalSpace/Colored_cube.vue',)
    },
    {
      path: 'colored_cube_fan',
      name: '立方体【单色面-三角扇-wrong】',
      component: () => import('../views/threeDimensionalSpace/Colored_cube_fan.vue',)
    },
    {
      path: 'colored_cube_strip',
      name: '立方体【单色面-三角带】',
      component: () => import('../views/threeDimensionalSpace/Colored_cube_strip.vue',)
    },
  ]
}

// 光照
const light = {
  path: '/light/:id?',
  component: () => import('../views/HomeView.vue'),
  name: 'light',
  props: {
    params: '光照',
  },
  children: [
    {
      path: 'red-cube',
      name: '平行光',
      component: () => import('../views/light/RedCube.vue'),
    },
    {
      path: 'red-cube-animation',
      name: '平行光 动画',
      component: () =>  import('../views/light/RedCube_animation.vue'),
    },
    {
      path: 'red-cube-ambient',
      name: '平行光+环境光',
      component: () =>  import('../views/light/RedCube_ambient.vue'),
    },
    {
      path: 'red-cube-rotate-translate',
      name: '平行光+环境光-[旋转+平移]',
      component: () => import('../views/light/RedCubeRotateTranslate.vue'),
    },
    {
      path: 'point-lighted-cube',
      name: '点光源光',
      component: () => import('../views/light/PointLightedCube.vue'),
    },
    {
      path: 'point-lighted-cube-animation',
      name: '点光源光-动画',
      component: () => import('../views/light/PointLightedCube_animation.vue'),
    },
    {
      path: 'point-lighted-cube-per-fragment',
      name: '点光源-逐片元计算',
      component: () => import('../views/light/PointLightedCube_perFragment.vue'),
    }
  ]
};

// 层次模型
const models = {
  path: '/model/:id?',
  component: () => import('../views/HomeView.vue'),
  name: 'model',
  props: {
    params: '层次模型',
  },
  children: [
    {
      path: 'joint-model',
      name: '单关节模型',
      component: () => import('../views/model/JointModel.vue'), 
    },
    {
      path: 'multi-joint-model',
      name: '多节点模型',
      component: () => import('../views/model/MultiJointModel.vue'), 
    },
  ],
}

// 高级技术
const seniorTech = {
  path: '/seniorTech/:id?',
  component: () => import('../views/HomeView.vue'),
  name: 'seniorTech',
  props: {
    params: '高级技术',
  },
  children: [
    {
      path: 'rotate-object',
      name: '鼠标控制物体旋转',
      component: () => import('../views/seniorTech/RotateObject.vue'), 
    },
    {
      path: 'pick-object',
      name: '选中物体',
      component: () => import('../views/seniorTech/PickObject.vue'), 
    },
    {
      path: 'pick-face',
      name: '选中单面',
      component: () => import('../views/seniorTech/PickFace.vue'), 
    },
    {
      path: 'hud',
      name: '平视显示器',
      component: () => import('../views/seniorTech/HUD.vue'), 
    },
    {
      path: 'fog',
      name: '雾化',
      component: () => import('../views/seniorTech/Fog.vue')
    },
    {
      path: 'fog-w',
      name: '雾化(使用w分量--wrong)',
      component: () => import('../views/seniorTech/FogW.vue')
    },
    {
      path: 'rounded-point',
      name: '圆点',
      component: () => import('../views/seniorTech/RoundedPoint.vue')
    },
    {
      path: 'blend-a-cube',
      name: '混合a[cube]',
      component: () => import('../views/seniorTech/BlendColor.vue')
    },
    {
      path: 'blend-a-triangles',
      name: '混合a[triangles]',
      component: () => import('../views/seniorTech/LookAtBlendedTiangles.vue')
    },
    {
      path: 'init-shaders',
      name: '切换着色器1',
      component: () => import('../views/seniorTech/InitShaders.vue'),
    },
    {
      path: 'project-object',
      name: '切换着色器2',
      component: () => import('../views/seniorTech/ProjectOject.vue'),
    },
    {
      path: 'frame-buffer-object',
      name: '渲染到纹理',
      component: () => import('../views/seniorTech/FramebufferObject.vue')
    },
  ],
}
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    canvasBasic,
    singleRoutes,
    advanceRoutes,
    rasterizeRoutes,
    threeDimensionalSpace,
    light,
    models,
    seniorTech,
  ],
})

export default router
