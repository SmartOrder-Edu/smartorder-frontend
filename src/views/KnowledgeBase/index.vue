<template>
  <AppLayout>
    <div class="kb-page">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">知识库管理</h1>
          <p class="page-desc">建立专属你的知识大脑，支持各种文档、笔记的智能解析与检索</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>
            新建知识库
          </el-button>
        </div>
      </div>

      <!-- 搜索与筛选 -->
      <div class="filter-bar">
        <el-input v-model="searchKeyword" placeholder="搜索知识库名称..." prefix-icon="Search" clearable style="max-width: 300px;" />
        <div class="filter-tags">
          <span 
            v-for="cat in categories" 
            :key="cat" 
            class="filter-chip"
            :class="{ active: activeCategory === cat }"
            @click="activeCategory = cat"
          >
            {{ cat }}
          </span>
        </div>
      </div>

      <!-- 知识库列表 -->
      <div class="kb-grid">
        <el-card shadow="hover" class="kb-card" v-for="kb in filteredKBs" :key="kb.id" :style="{ '--kb-color': kb.color || '#409EFF' }">
          <div class="kb-card-header">
            <div class="kb-icon" :style="{ backgroundColor: (kb.color || '#409EFF') + '20', color: kb.color || '#409EFF' }">
              <el-icon v-if="!kb.icon"><Folder /></el-icon>
              <span v-else>{{ kb.icon }}</span>
            </div>
            <div class="kb-actions">
              <el-dropdown trigger="click" @command="handleCommand($event, kb)">
                <span class="el-dropdown-link" @click.stop>
                  <el-icon class="more-icon"><MoreFilled /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">
                      <el-icon><Edit /></el-icon>编辑信息
                    </el-dropdown-item>
                    <el-dropdown-item command="upload">
                      <el-icon><Upload /></el-icon>上传文件
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" class="danger">
                      <el-icon><Delete /></el-icon>删除知识库
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          
          <div class="kb-card-body" @click="goToDetail(kb.id)">
            <h3 class="kb-name">{{ kb.name }}</h3>
            <p class="kb-desc">{{ kb.description || '暂无描述' }}</p>
          </div>

          <div class="kb-card-footer">
            <div class="kb-stats">
              <el-tooltip content="文件数量" placement="top">
                <span class="stat-item">
                  <el-icon><Document /></el-icon> {{ kb.file_count || 0 }}
                </span>
              </el-tooltip>
              <el-tooltip content="文档切片" placement="top">
                <span class="stat-item">
                  <el-icon><Grid /></el-icon> {{ kb.chunk_count || 0 }}
                </span>
              </el-tooltip>
              <el-tag size="small" :type="kb.status === 'active' ? 'success' : 'info'" round>{{ kb.status === 'active' ? '正常' : '已归档' }}</el-tag>
            </div>
            <div class="kb-time">
              更新于 {{ formatDate(kb.updated_at) }}
            </div>
          </div>
        </el-card>

        <!-- 空状态或新建入口 -->
        <div class="kb-card create-card" @click="openCreateDialog" v-if="filteredKBs.length === 0 && searchKeyword === ''">
          <div class="create-content">
            <el-icon class="create-icon"><FolderAdd /></el-icon>
            <h3>创建第一个知识库</h3>
            <p>支持 PDF, Word, Markdown 等多种格式</p>
            <el-button type="primary" plain>立即创建</el-button>
          </div>
        </div>
      </div>

      <el-empty v-if="filteredKBs.length === 0 && searchKeyword !== ''" description="未找到相关知识库" />

      <!-- 新建/编辑弹窗 -->
      <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" destroy-on-close custom-class="kb-dialog">
        <el-form :model="kbForm" :rules="rules" ref="formRef" label-width="100px" label-position="top">
          <el-row :gutter="20">
            <el-col :span="16">
              <el-form-item label="名称" prop="name">
                <el-input v-model="kbForm.name" placeholder="请输入知识库名称，如：操作系统知识库" maxlength="50" show-word-limit />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="分类" prop="category">
                <el-select v-model="kbForm.category" placeholder="选择分类" allow-create filterable>
                  <el-option label="课程学习" value="课程学习" />
                  <el-option label="项目资料" value="项目资料" />
                  <el-option label="论文阅读" value="论文阅读" />
                  <el-option label="个人笔记" value="个人笔记" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="描述" prop="description">
            <el-input type="textarea" v-model="kbForm.description" placeholder="简单描述一下该知识库的内容范围和用途" :rows="3" />
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="主题色">
                <el-color-picker v-model="kbForm.color" :predefine="predefineColors" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="图标标识">
                <el-input v-model="kbForm.icon" placeholder="输入 Emoji，例如 📚" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-collapse class="advanced-settings">
            <el-collapse-item title="高级 AI 配置 (RAG)" name="1">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="向量模型">
                    <el-select v-model="kbForm.embedding_model">
                      <el-option label="bge-m3 (推荐)" value="bge-m3" />
                      <el-option label="text-embedding-3-small" value="text-embedding-3-small" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="分块策略">
                    <el-select v-model="kbForm.chunk_strategy">
                      <el-option label="递归分块 (Recursive)" value="recursive" />
                      <el-option label="按标题分块 (Markdown)" value="markdown" />
                      <el-option label="按句子分块 (Sentence)" value="sentence" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="默认召回数量 (Top K)">
                    <el-input-number v-model="kbForm.retrieval_top_k" :min="1" :max="20" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="相似度阈值">
                    <el-slider v-model="kbForm.score_threshold" :step="0.05" :min="0" :max="1" show-stops />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-collapse-item>
          </el-collapse>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitForm" :loading="saving">确定</el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

import { Plus, Search, MoreFilled, Edit, Upload, Delete, Folder, FolderAdd, Document, Grid } from '@element-plus/icons-vue'
import AppLayout from '@/components/layout/AppLayout.vue'

// 模拟数据接口
interface KnowledgeBase {
  id: number
  name: string
  description: string
  category: string
  icon: string
  color: string
  embedding_model: string
  chunk_strategy: string
  retrieval_top_k: number
  score_threshold: number
  file_count: number
  chunk_count: number
  status: string
  updated_at: string
}

// 模拟状态
const searchKeyword = ref('')
const activeCategory = ref('全部')
const categories = ['全部', '课程学习', '项目资料', '论文阅读', '个人笔记']
const predefineColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#8A2BE2', '#722ED1']

const kbList = ref<KnowledgeBase[]>([
  {
    id: 1,
    name: '计算机网络核心笔记',
    description: '考研复习使用的计网知识点汇总，包含谢希仁版教材总结。',
    category: '课程学习',
    icon: '🌐',
    color: '#409EFF',
    embedding_model: 'bge-m3',
    chunk_strategy: 'recursive',
    retrieval_top_k: 5,
    score_threshold: 0.3,
    file_count: 12,
    chunk_count: 350,
    status: 'active',
    updated_at: '2026-05-12T10:00:00Z'
  },
  {
    id: 2,
    name: '英语六级真题阅读',
    description: '历年六级阅读真题文章和解析，用于RAG辅助翻译与长难句分析。',
    category: '课程学习',
    icon: '📖',
    color: '#67C23A',
    embedding_model: 'text-embedding-3-small',
    chunk_strategy: 'sentence',
    retrieval_top_k: 8,
    score_threshold: 0.4,
    file_count: 35,
    chunk_count: 1200,
    status: 'active',
    updated_at: '2026-05-10T14:30:00Z'
  },
  {
    id: 3,
    name: 'Vue3与前端工程化',
    description: '收集的前端开发规范、组件库文档及个人最佳实践总结。',
    category: '项目资料',
    icon: '⚡',
    color: '#E6A23C',
    embedding_model: 'bge-m3',
    chunk_strategy: 'markdown',
    retrieval_top_k: 5,
    score_threshold: 0.3,
    file_count: 8,
    chunk_count: 180,
    status: 'active',
    updated_at: '2026-05-08T09:15:00Z'
  }
])

const filteredKBs = computed(() => {
  return kbList.value.filter(kb => {
    const matchKeyword = kb.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) || 
                         (kb.description && kb.description.toLowerCase().includes(searchKeyword.value.toLowerCase()))
    const matchCategory = activeCategory.value === '全部' || kb.category === activeCategory.value
    return matchKeyword && matchCategory
  })
})

// 表单弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('新建知识库')
const saving = ref(false)
const formRef = ref()

const initialForm = {
  id: 0,
  name: '',
  description: '',
  category: '课程学习',
  icon: '📚',
  color: '#409EFF',
  embedding_model: 'bge-m3',
  chunk_strategy: 'recursive',
  retrieval_top_k: 5,
  score_threshold: 0.3
}
const kbForm = reactive({ ...initialForm })

const rules = {
  name: [
    { required: true, message: '请输入知识库名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

const openCreateDialog = () => {
  dialogTitle.value = '新建知识库'
  Object.assign(kbForm, initialForm)
  dialogVisible.value = true
}

const handleCommand = (command: string, kb: KnowledgeBase) => {
  if (command === 'edit') {
    dialogTitle.value = '编辑知识库'
    Object.assign(kbForm, kb)
    dialogVisible.value = true
  } else if (command === 'delete') {
    ElMessageBox.confirm(
      `确定要删除知识库 "${kb.name}" 吗？此操作将无法恢复，文件也将一并删除。`,
      '删除警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    ).then(() => {
      kbList.value = kbList.value.filter(item => item.id !== kb.id)
      ElMessage.success('删除成功')
    }).catch(() => {})
  } else if (command === 'upload') {
    ElMessage.info('假装打开了上传文件抽屉：' + kb.name)
  }
}

const submitForm = () => {
  if (!formRef.value) return
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      saving.value = true
      setTimeout(() => {
        if (kbForm.id === 0) {
          // 新建
          kbList.value.unshift({
            ...kbForm,
            id: Date.now(),
            file_count: 0,
            chunk_count: 0,
            status: 'active',
            updated_at: new Date().toISOString()
          } as KnowledgeBase)
          ElMessage.success('创建成功')
        } else {
          // 编辑
          const index = kbList.value.findIndex(k => k.id === kbForm.id)
          if (index !== -1) {
            kbList.value[index] = { ...kbList.value[index], ...kbForm }
            ElMessage.success('保存成功')
          }
        }
        saving.value = false
        dialogVisible.value = false
      }, 500)
    }
  })
}

const goToDetail = (id: number) => {
  router.push(`/knowledge-base/${id}`)
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
.kb-page {
  padding: 0;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .header-left {
    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 8px 0;
    }
    .page-desc {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin: 0;
    }
  }
}

.filter-bar {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 24px;

  .filter-tags {
    display: flex;
    gap: 8px;

    .filter-chip {
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      color: var(--el-text-color-regular);
      background-color: var(--el-fill-color-light);
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background-color: var(--el-fill-color);
      }

      &.active {
        background-color: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        font-weight: 500;
      }
    }
  }
}

.kb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.kb-card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -12px rgba(0, 0, 0, 0.1);
    border-color: var(--kb-color, var(--el-color-primary));
  }

  ::v-deep .el-card__body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .kb-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;

    .kb-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .more-icon {
      font-size: 18px;
      color: var(--el-text-color-secondary);
      padding: 4px;
      border-radius: 4px;
      transition: background-color 0.2s;
      
      &:hover {
        background-color: var(--el-fill-color);
        color: var(--el-text-color-primary);
      }
    }
  }

  .kb-card-body {
    flex: 1;
    margin-bottom: 20px;

    .kb-name {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 8px 0;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .kb-desc {
      font-size: 13px;
      color: var(--el-text-color-regular);
      margin: 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  .kb-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: 12px;

    .kb-stats {
      display: flex;
      gap: 12px;
      align-items: center;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }

    .kb-time {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
  }
}

.create-card {
  border: 2px dashed var(--el-border-color);
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  
  &:hover {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    
    .create-icon {
      color: var(--el-color-primary);
    }
  }

  .create-content {
    text-align: center;
    
    .create-icon {
      font-size: 48px;
      color: var(--el-text-color-secondary);
      margin-bottom: 12px;
      transition: color 0.3s;
    }

    h3 {
      font-size: 16px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin: 0 0 8px 0;
    }

    p {
      font-size: 13px;
      color: var(--el-text-color-regular);
      margin: 0 0 16px 0;
    }
  }
}

.advanced-settings {
  margin-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  
  ::v-deep .el-collapse-item__header {
    font-size: 14px;
    color: var(--el-text-color-regular);
  }
}
</style>