<template>
  <div class="home-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>Vue 3 + TypeScript + Webpack</h1>
          <el-menu
            mode="horizontal"
            :default-active="activeMenu"
            router
            class="nav-menu"
          >
            <el-menu-item index="/">首页</el-menu-item>
            <el-menu-item index="/about">关于</el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <el-main>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8">
            <el-card class="feature-card">
              <template #header>
                <div class="card-header">
                  <el-icon><component :is="Setting" /></el-icon>
                  <span>完整配置</span>
                </div>
              </template>
              <p>TypeScript + Webpack + Vue 3 完整配置</p>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-card class="feature-card">
              <template #header>
                <div class="card-header">
                  <el-icon><component :is="Collection" /></el-icon>
                  <span>组件库</span>
                </div>
              </template>
              <p>集成 Element Plus UI 组件库</p>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-card class="feature-card">
              <template #header>
                <div class="card-header">
                  <el-icon><component :is="Document" /></el-icon>
                  <span>状态管理</span>
                </div>
              </template>
              <p>Pinia 状态管理方案</p>
            </el-card>
          </el-col>
        </el-row>

        <el-divider />

        <el-button type="primary" @click="handleClick">
          点击测试
        </el-button>
        <el-alert
          v-if="showAlert"
          title="欢迎使用 Vue3 + TypeScript + Webpack 项目模板！"
          type="success"
          :closable="false"
          style="margin-top: 20px"
        />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Setting, Collection, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const showAlert = ref(false)

const activeMenu = computed(() => route.path)

const handleClick = () => {
  showAlert.value = !showAlert.value
  ElMessage.success('操作成功！')
}
</script>

<style lang="scss" scoped>
.home-container {
  height: 100%;

  .el-container {
    height: 100%;
  }

  .el-header {
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color);
    display: flex;
    align-items: center;
    padding: 0 20px;

    .header-content {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;

      h1 {
        margin: 0;
        font-size: 20px;
        color: var(--el-text-color-primary);
      }

      .nav-menu {
        border-bottom: none;
      }
    }
  }

  .el-main {
    background-color: var(--el-bg-color-page);
  }

  .feature-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}
</style>
