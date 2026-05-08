<template>
  <div class="about-container">
    <el-page-header @back="goBack">
      <template #content>
        <span class="text-large font-600">关于项目</span>
      </template>
    </el-page-header>

    <el-card class="about-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>项目信息</span>
        </div>
      </template>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="项目名称">Vue 3 + TypeScript + Webpack</el-descriptions-item>
        <el-descriptions-item label="框架版本">Vue 3.4+</el-descriptions-item>
        <el-descriptions-item label="语言">TypeScript 5.3+</el-descriptions-item>
        <el-descriptions-item label="构建工具">Webpack 5.89+</el-descriptions-item>
        <el-descriptions-item label="UI 组件库">Element Plus 2.5+</el-descriptions-item>
        <el-descriptions-item label="状态管理">Pinia 2.1+</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="about-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>项目结构</span>
        </div>
      </template>

      <pre class="structure-tree"><code>vue3-ts-webpack/
├── public/              # 静态资源
├── src/
│   ├── api/            # API 接口
│   ├── assets/         # 资源文件
│   │   ├── images/
│   │   ├── styles/
│   │   └── fonts/
│   ├── components/     # 公共组件
│   ├── composables/    # 组合式函数
│   ├── directives/     # 自定义指令
│   ├── layouts/        # 布局组件
│   ├── router/         # 路由配置
│   ├── stores/         # 状态管理
│   ├── types/          # 类型定义
│   ├── utils/          # 工具函数
│   ├── views/          # 页面组件
│   ├── App.vue
│   └── main.ts
└── webpack.config.js</code></pre>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.about-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;

  .about-card {
    .card-header {
      font-weight: 600;
    }

    .structure-tree {
      background-color: var(--el-bg-color-page);
      padding: 15px;
      border-radius: 4px;
      font-size: 13px;
      line-height: 1.6;
      overflow-x: auto;
    }
  }
}
</style>
