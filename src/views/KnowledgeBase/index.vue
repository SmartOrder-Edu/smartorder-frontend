<template>
  <AppLayout>
    <div class="kb-page">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">知识库管理</h1>
          <p class="page-desc">建立专属你的知识大脑，支持各种文档、笔记的智能解析与检索</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="openCreateDialog" size="large">
            <el-icon><Plus /></el-icon>
            <span style="margin-left: 4px;">新建知识库</span>
          </el-button>
        </div>
      </div>

      <!-- 数据概览面板 -->
      <div class="overview-cards">
        <div class="stat-card">
          <div class="stat-icon bg-blue"><el-icon><DataBoard /></el-icon></div>
          <div class="stat-info">
            <span class="stat-label">知识库总数</span>
            <span class="stat-value">{{ kbStats.knowledgeBaseCount }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-green"><el-icon><Document /></el-icon></div>
          <div class="stat-info">
            <span class="stat-label">累计文件数</span>
            <span class="stat-value">{{ kbStats.fileCount }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-orange"><el-icon><DataAnalysis /></el-icon></div>
          <div class="stat-info">
            <span class="stat-label">总知识切片</span>
            <span class="stat-value">{{ kbStats.chunkCount }}</span>
          </div>
        </div>
      </div>

      <!-- 搜索与筛选 -->
      <div class="filter-bar">
        <el-input v-model="searchKeyword" placeholder="搜索知识库名称..." prefix-icon="Search" clearable class="search-input" />
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
        <el-card shadow="hover" class="kb-card" v-for="kb in filteredKBs" :key="kb.id" :style="{ '--kb-color': '#409EFF' }" @click="goToDetail(kb.id)">
          <div class="kb-card-header">
            <div class="kb-icon" :style="kb.coverUrl ? {} : { backgroundColor: '#409EFF20', color: '#409EFF' }">
              <img v-if="kb.coverUrl" :src="kb.coverUrl" alt="cover" class="kb-cover-img" />
              <el-icon v-else><Folder /></el-icon>
            </div>
            <div class="kb-actions">
              <el-dropdown trigger="click" @command="handleCommand($event, kb)">
                <el-button class="kb-settings-btn" circle size="default" @click.stop>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
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
          
          <div class="kb-card-body">
            <h3 class="kb-name">{{ kb.name }}</h3>
            <p class="kb-desc">{{ kb.description || '暂无描述' }}</p>
          </div>

          <div class="kb-card-footer" @click.stop>
            <div class="kb-stats">
              <el-tooltip content="文件数量" placement="top">
                <span class="stat-item">
                  <el-icon><Document /></el-icon> {{ kb.fileCount || 0 }}
                </span>
              </el-tooltip>
              <el-tooltip content="文档切片" placement="top">
                <span class="stat-item">
                  <el-icon><Grid /></el-icon> {{ kb.documentCount || 0 }}
                </span>
              </el-tooltip>
            </div>
            
            <div class="kb-time" v-if="kb.updatedAt">
              更新于 {{ formatDate(kb.updatedAt) }}
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
            <el-col :span="24">
              <el-form-item label="封面图片">
                <el-upload
                  class="cover-uploader"
                  action="#"
                  :http-request="handleCoverUpload"
                  :before-upload="beforeCoverUpload"
                  :show-file-list="false"
                  accept="image/*"
                >
                  <template v-if="kbForm.coverUrl">
                    <img :src="kbForm.coverUrl" class="cover-image" />
                    <div class="cover-hover-mask">
                      <el-icon><Camera /></el-icon>
                      <span>更换封面</span>
                    </div>
                  </template>
                  <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
                </el-upload>
              </el-form-item>
            </el-col>
          </el-row>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { uploadKnowledgeBaseCover, createKnowledgeBase, updateKnowledgeBase, getKnowledgeBaseList, getKnowledgeBaseStats, KnowledgeBaseListRespVO, KnowledgeBaseStatsVO } from '@/api/knowledgeBase'

const router = useRouter()

import { Plus, Search, MoreFilled, Edit, Upload, Delete, Folder, FolderAdd, Document, Grid, Camera, DataBoard, DataAnalysis } from '@element-plus/icons-vue'
import AppLayout from '@/components/layout/AppLayout.vue'

// 模拟状态
const searchKeyword = ref('')
const activeCategory = ref('全部')
const categories = ['全部', '课程学习', '项目资料', '论文阅读', '个人笔记']

const kbList = ref<KnowledgeBaseListRespVO[]>([])

// 统计状态
const kbStats = ref<KnowledgeBaseStatsVO>({
  knowledgeBaseCount: 0,
  fileCount: 0,
  chunkCount: 0
})

// 获取列表数据
const fetchKbList = async () => {
  try {
    const list = await getKnowledgeBaseList()
    kbList.value = list || []
  } catch (error) {
    console.error('获取知识库列表失败:', error)
  }
}

// 获取统计数据
const fetchKbStats = async () => {
  try {
    const stats = await getKnowledgeBaseStats()
    if (stats) {
      kbStats.value = stats
    }
  } catch (error) {
    console.error('获取知识库统计信息失败:', error)
  }
}

onMounted(() => {
  fetchKbList()
  fetchKbStats()
})

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
  coverUrl: '',
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

const handleCommand = (command: string, kb: KnowledgeBaseListRespVO) => {
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

// 图片上传前的拦截
const beforeCoverUpload = (file: File) => {
  if (!file.type.startsWith('image/')) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (file.size / 1024 / 1024 > 5) {
    ElMessage.error('图片大小不能超过 5MB！')
    return false
  }
  return true
}

// 自定义上传行为，调用我们配置的接口
const handleCoverUpload = async (options: any) => {
  try {
    const file = options.file as File
    const url = await uploadKnowledgeBaseCover(file)
    // 接口返回成功的阿里云 OSS 链接，赋值给表单，这样界面就会显示出图片
    kbForm.coverUrl = url
    ElMessage.success('封面上传成功')
  } catch (error) {
    ElMessage.error('封面上传失败，请重试')
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      saving.value = true
      try {
        if (kbForm.id === 0) {
          // 调用后端创建接口
          await createKnowledgeBase({
            name: kbForm.name,
            category: kbForm.category,
            description: kbForm.description,
            coverUrl: kbForm.coverUrl
          })
          ElMessage.success('知识库创建成功')
          
          fetchKbList() // 刷新列表
        } else {
          // 调用后端更新接口
          await updateKnowledgeBase({
            id: kbForm.id,
            name: kbForm.name,
            category: kbForm.category,
            description: kbForm.description,
            coverUrl: kbForm.coverUrl
          })
          ElMessage.success('知识库保存成功')
          fetchKbList() // 刷新列表
        }
        dialogVisible.value = false
      } catch (error: any) {
        console.error(error)
      } finally {
        saving.value = false
      }
    }
  })
}

const goToDetail = (id: number) => {
  router.push(`/knowledge-base/${id}`)
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '未知时间'
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

/* 概览统计面板 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  margin-bottom: 24px;

  .stat-card {
    background-color: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: box-shadow 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    
    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #fff;
      
      &.bg-blue { background-color: var(--el-color-primary); }
      &.bg-green { background-color: var(--el-color-success); }
      &.bg-orange { background-color: var(--el-color-warning); }
    }
    
    .stat-info {
      display: flex;
      flex-direction: column;
      
      .stat-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-bottom: 4px;
      }
      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }
  }
}

.filter-bar {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 24px;
  background-color: var(--el-bg-color);
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);

  ::v-deep .search-input {
    max-width: 300px;
    .el-input__wrapper {
      border-radius: 8px;
    }
  }

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
      overflow: hidden;
      
      .kb-cover-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    /* 优化的编辑按钮 */
    .kb-settings-btn {
      border: none;
      background: transparent;
      color: var(--el-text-color-secondary);
      font-size: 16px;
      transition: all 0.3s;
      
      &:hover {
        background-color: var(--el-fill-color);
        color: var(--el-color-primary);
        transform: rotate(90deg);
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

.cover-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: var(--el-color-primary);
    .cover-hover-mask {
      opacity: 1;
    }
  }

  .cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .cover-hover-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #fff;
    opacity: 0;
    transition: opacity 0.3s;
    
    .el-icon {
      font-size: 24px;
      margin-bottom: 4px;
    }
    
    span {
      font-size: 12px;
    }
  }

  .cover-uploader-icon {
    font-size: 28px;
    color: #8c939d;
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