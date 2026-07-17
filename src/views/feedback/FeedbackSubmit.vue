<template>
  <AppLayout>
    <div class="feedback-page-container">
    <el-row :gutter="24" class="content-row">
      <!-- 左侧：反馈表单提交区 -->
      <el-col :span="11" class="animate__animated animate__fadeInLeft">
        <div class="feedback-form-card">
          <!-- 标题区，完美还原截图 -->
          <div class="feedback-card-title">
            {{ isEditing ? '编辑我的反馈' : '意见反馈 & 体验建议' }}
            <el-tag v-if="isEditing" type="warning" closable @close="cancelEdit" class="edit-tag" size="small">
              编辑模式
            </el-tag>
          </div>
          <div class="feedback-card-subtitle">
            您的每一个声音，都有 AI + 人工双重机制认真倾听与答复。
          </div>

          <el-form 
            ref="formRef" 
            :model="formData" 
            :rules="rules" 
            label-position="top"
            :hide-required-asterisk="true"
            @submit.prevent
          >
            <el-form-item prop="type">
              <template #label>
                <span class="custom-label">反馈类型 <span class="required-star">*</span></span>
              </template>
              <el-select v-model="formData.type" placeholder="请选择" style="width: 100%" size="large">
                <el-option label="体验评价" :value="1" />
                <el-option label="功能建议" :value="2" />
                <el-option label="Bug反馈" :value="3" />
                <el-option label="其他意见" :value="4" />
              </el-select>
            </el-form-item>

            <el-form-item label="反馈标题" prop="title">
              <el-input 
                v-model="formData.title" 
                placeholder="简要概括你的反馈 (15字内)" 
                maxlength="15" 
                show-word-limit
                size="large"
              />
            </el-form-item>

            <el-form-item prop="content">
              <template #label>
                <span class="custom-label">详细内容 <span class="required-star">*</span> <span class="label-desc">(最少10字)</span></span>
              </template>
              <el-input
                v-model="formData.content"
                type="textarea"
                :rows="6"
                placeholder="请描述场景、问题、建议，内容越详细越容易通过审核"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="图片上传 (选填)">
              <el-upload
                class="premium-uploader"
                action="/api/upload" 
                :file-list="fileList"
                :on-preview="handlePictureCardPreview"
                :on-remove="handleRemove"
                :on-success="handleUploadSuccess"
                :limit="3"
                :show-file-list="false"
              >
                <div class="upload-dashed-trigger">
                  <span class="upload-trigger-text">点击上传截图 (最多3张)</span>
                </div>
              </el-upload>
              
              <!-- 自定义画廊展示，极致美观 -->
              <div v-if="formData.imageUrls && formData.imageUrls.length > 0" class="uploaded-gallery animate__animated animate__fadeIn">
                <div v-for="(url, idx) in formData.imageUrls" :key="idx" class="gallery-item">
                  <el-image 
                    :src="url" 
                    :preview-src-list="formData.imageUrls"
                    :initial-index="idx"
                    fit="cover" 
                    class="gallery-image"
                  />
                  <div class="gallery-mask">
                    <el-icon class="mask-icon" @click.stop="handleRemoveUrl(idx)"><Delete /></el-icon>
                  </div>
                </div>
              </div>
            </el-form-item>

            <el-form-item label="联系方式 (选填)" prop="contact">
              <el-input 
                v-model="formData.contact" 
                placeholder="手机号/微信，方便我们回复你" 
                size="large"
              />
            </el-form-item>

            <div class="submit-action-box">
              <el-button 
                type="info" 
                size="large" 
                @click="isEditing ? cancelEdit() : handleResetForm()"
                class="cancel-btn"
              >
                {{ isEditing ? '取消编辑' : '重置' }}
              </el-button>
              <el-button 
                type="primary" 
                size="large" 
                :loading="submitting" 
                @click="handleSubmit"
                class="submit-btn"
              >
                {{ isEditing ? '保存修改' : '提交反馈' }}
              </el-button>
            </div>
          </el-form>
        </div>
      </el-col>

      <!-- 右侧：我的反馈历史列表 -->
      <el-col :span="13" class="animate__animated animate__fadeInRight">
        <div class="history-card">
          <div class="card-header-title" style="margin-bottom: 24px;">
            <div style="display: flex; align-items: center; font-size: 18px; font-weight: 700; color: #1e293b;">
              <el-icon class="header-icon" style="color: #3b82f6; margin-right: 8px;"><List /></el-icon>
              <span>反馈历史与答复</span>
            </div>
          </div>

          <div v-loading="loadingHistory" class="history-list-wrapper">
            <div v-if="historyList.length > 0" class="history-list">
              <div 
                v-for="item in historyList" 
                :key="item.id" 
                class="history-item"
              >
                <div class="item-top">
                  <span class="item-time">{{ formatDateTime(item.createTime) }}</span>
                  <el-tag :type="getTypeTagType(item.type)" size="small" effect="plain" style="border-radius: 6px;">
                    {{ getTypeText(item.type) }}
                  </el-tag>
                  <el-tag :type="getStatusTagType(item.status)" size="small" effect="dark" class="status-tag" style="border-radius: 6px;">
                    {{ getStatusText(item.status) }}
                  </el-tag>
                </div>

                <div class="item-content" style="margin: 12px 0;">
                  <h4 v-if="item.title" style="margin: 0 0 6px 0; font-size: 15px; color: #1e293b; font-weight: 600;">{{ item.title }}</h4>
                  <p class="content-summary" style="font-size: 14px; color: #475569; line-height: 1.6;">{{ item.content }}</p>
                  <div v-if="item.imageUrls && item.imageUrls.length > 0" class="item-images" style="display: flex; gap: 8px; margin-top: 10px;">
                    <el-image 
                      v-for="(url, idx) in item.imageUrls" 
                      :key="idx" 
                      :src="url" 
                      :preview-src-list="item.imageUrls"
                      :initial-index="Number(idx)"
                      fit="cover" 
                      class="thumb-img"
                      style="width: 56px; height: 56px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: zoom-in;"
                    />
                  </div>
                </div>

                <div class="item-footer">
                  <div class="official-reply-trigger" v-if="item.replyContent">
                    <el-button 
                      type="success" 
                      link 
                      :icon="ChatDotSquare" 
                      @click="showReply(item)"
                      style="font-weight: 600;"
                    >
                      查看官方答复
                    </el-button>
                  </div>
                  <div class="item-actions">
                    <el-button 
                      v-if="item.status === 0 || item.status === 1" 
                      type="primary" 
                      link 
                      :icon="Edit" 
                      @click="startEdit(item)"
                    >
                      编辑
                    </el-button>
                    <el-popconfirm
                      title="确定要删除这条反馈记录吗？此操作无法恢复。"
                      confirm-button-text="确定"
                      cancel-button-text="取消"
                      @confirm="handleDelete(item.id)"
                    >
                      <template #reference>
                        <el-button type="danger" link :icon="Delete">删除</el-button>
                      </template>
                    </el-popconfirm>
                  </div>
                </div>
              </div>

              <!-- 分页 -->
              <div class="history-pagination">
                <el-pagination
                  v-model:current-page="queryParams.page"
                  v-model:page-size="queryParams.size"
                  layout="prev, pager, next"
                  :total="totalHistory"
                  @current-change="handlePageChange"
                  small
                />
              </div>
            </div>
            
            <div v-else class="empty-history">
              <el-empty description="期待听到您的声音，留下您的反馈吧！" />
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 提交成功/重审成功提示弹窗 -->
    <el-dialog v-model="successVisible" title="操作成功" width="420px" center align-center class="success-dialog">
      <div class="success-dialog-content">
        <el-icon class="success-icon" color="#10b981" :size="56"><CircleCheckFilled /></el-icon>
        <h3 style="margin-top: 16px; font-size: 20px; font-weight: 700; color: #1e293b;">反馈已成功提交</h3>
        <p style="color: #64748b; margin-top: 8px; font-size: 14px;">DeepSeek AI 正在对您的内容进行高速初审评估中...</p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px; margin-top: 20px;">
          <p style="color: #15803d; font-size: 13px; font-weight: 600; margin: 0;">🎉 感谢您的反馈！人工客服与技术团队将在复核通过后第一时间给您答复。</p>
        </div>
      </div>
      <template #footer>
        <div style="display: flex; justify-content: center; margin-top: 10px;">
          <el-button type="primary" @click="successVisible = false" size="large" style="border-radius: 10px; width: 160px; background-color: #3b82f6; border-color: #3b82f6;">我知道了</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 官方回复抽屉 -->
    <el-drawer
      v-model="replyDrawerVisible"
      title="官方答复详情"
      direction="rtl"
      size="400px"
      class="reply-drawer"
    >
      <div v-if="selectedFeedbackForReply" class="drawer-body">
        <div class="feedback-orig-box">
          <div style="font-weight: 700; color: #475569; margin-bottom: 6px; font-size: 14px;">您的反馈原内容</div>
          <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">{{ selectedFeedbackForReply.content }}</p>
        </div>
        <div class="reply-content-box animate__animated animate__fadeInUp">
          <div style="font-weight: 700; color: #047857; margin-bottom: 12px; font-size: 15px; display: flex; align-items: center; gap: 6px;">
            <el-icon><ChatLineRound /></el-icon> 官方正式回复
          </div>
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #065f46; line-height: 1.6; white-space: pre-wrap;">{{ selectedFeedbackForReply.replyContent }}</p>
          <span style="font-size: 12px; color: #059669; display: block; border-top: 1px dashed rgba(16, 185, 129, 0.2); padding-top: 10px;" v-if="selectedFeedbackForReply.replyTime">
            答复时间：{{ formatDateTime(selectedFeedbackForReply.replyTime) }}
          </span>
        </div>
      </div>
    </el-drawer>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { EditPen, List, Plus, Edit, Delete, ChatDotSquare, ChatLineRound, CircleCheckFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '@/api/request'

// 基础变量
const formRef = ref<FormInstance>()
const submitting = ref(false)
const successVisible = ref(false)
const loadingHistory = ref(false)

// 编辑状态
const isEditing = ref(false)
const editingId = ref<number | null>(null)

// 上传图片映射
const fileList = ref<any[]>([])
const previewImageUrl = ref('')
const previewVisible = ref(false)

const formData = reactive({
  type: undefined as number | undefined,
  title: '',
  content: '',
  imageUrls: [] as string[],
  contact: ''
})

const rules = reactive<FormRules>({
  type: [
    { required: true, message: '请选择反馈类型', trigger: 'change' }
  ],
  title: [
    { max: 15, message: '反馈标题不能超过15个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '详细内容不能为空', trigger: 'blur' },
    { min: 10, message: '详细内容最少为10字', trigger: 'blur' }
  ]
})

// 历史反馈分页参数
const queryParams = reactive({
  page: 1,
  size: 5
})
const historyList = ref<any[]>([])
const totalHistory = ref(0)

// 官方回复抽屉
const replyDrawerVisible = ref(false)
const selectedFeedbackForReply = ref<any>(null)

// 格式化时间
const formatDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return ''
  const date = new Date(dateTimeStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 类型转换
const getTypeText = (type: number) => {
  switch (type) {
    case 1: return '体验评价'
    case 2: return '功能建议'
    case 3: return 'Bug反馈'
    default: return '其他意见'
  }
}

const getTypeTagType = (type: number) => {
  switch (type) {
    case 1: return 'info'
    case 2: return 'success'
    case 3: return 'danger'
    default: return undefined
  }
}

// 状态标签
const getStatusText = (status: number) => {
  switch (status) {
    case 0: return 'AI评估中'
    case 1: return '待人工复核'
    case 2: return '已被AI拦截'
    case 3: return '已录入(有效)'
    case 4: return '已被驳回'
    case 5: return '已被采纳'
    default: return '处理中'
  }
}

const getStatusTagType = (status: number) => {
  switch (status) {
    case 0: return 'info'
    case 1: return 'warning'
    case 2: return 'danger'
    case 3: return 'primary'
    case 4: return 'danger'
    case 5: return 'success'
    default: return undefined
  }
}

// 获取我的反馈历史记录
const fetchMyHistory = async () => {
  loadingHistory.value = true
  try {
    const res = await request.get('/feedback/my-page', { params: queryParams })
    if (res) {
      historyList.value = res.records || []
      totalHistory.value = res.total || 0
    }
  } catch (error) {
    console.error(error)
  } finally {
    loadingHistory.value = false
  }
}

const handlePageChange = (val: number) => {
  queryParams.page = val
  fetchMyHistory()
}

// 上传图片处理
const handleRemove = (uploadFile: any) => {
  const url = uploadFile.response?.data?.url || uploadFile.url
  const index = formData.imageUrls.indexOf(url)
  if (index > -1) {
    formData.imageUrls.splice(index, 1)
  }
}

const handleRemoveUrl = (index: number) => {
  formData.imageUrls.splice(index, 1)
  fileList.value.splice(index, 1)
}

const handlePictureCardPreview = (uploadFile: any) => {
  previewImageUrl.value = uploadFile.url!
  previewVisible.value = true
}

const handleUploadSuccess = (response: any, uploadFile: any) => {
  if (response.code === 200) {
    formData.imageUrls.push(response.data.url)
    fileList.value.push(uploadFile)
  } else {
    ElMessage.error(response.msg || '图片上传失败')
  }
}

// 重置表单方法
const handleResetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  formData.title = ''
  formData.contact = ''
  formData.imageUrls = []
  fileList.value = []
}

// 提交反馈与保存修改
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (isEditing.value && editingId.value) {
          // 修改反馈
          await request.put(`/feedback/${editingId.value}`, formData)
          ElMessage.success('修改成功，已为您重新触发AI审核')
          successVisible.value = true
          cancelEdit()
          fetchMyHistory()
        } else {
          // 提交新反馈
          await request.post('/feedback/submit', formData)
          ElMessage.success('提交成功')
          successVisible.value = true
          handleResetForm()
          fetchMyHistory()
        }
      } catch (error) {
        console.error(error)
      } finally {
        submitting.value = false
      }
    }
  })
}

// 进入编辑模式
const startEdit = (item: any) => {
  isEditing.value = true
  editingId.value = item.id
  formData.type = item.type
  formData.title = item.title || ''
  formData.content = item.content
  formData.contact = item.contact || ''
  formData.imageUrls = [...(item.imageUrls || [])]
  
  // 回显图片
  fileList.value = formData.imageUrls.map((url, idx) => ({
    name: `img-${idx}`,
    url: url,
    status: 'success'
  }))
  
  // 滚动到顶部表单
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const cancelEdit = () => {
  isEditing.value = false
  editingId.value = null
  handleResetForm()
}

// 删除反馈
const handleDelete = async (id: number) => {
  try {
    await request.delete(`/feedback/${id}`)
    ElMessage.success('反馈记录已成功删除')
    if (editingId.value === id) {
      cancelEdit()
    }
    fetchMyHistory()
  } catch (error) {
    console.error(error)
  }
}

// 展开官方回复抽屉
const showReply = (item: any) => {
  selectedFeedbackForReply.value = item
  replyDrawerVisible.value = true
}

onMounted(() => {
  fetchMyHistory()
})
</script>

<style scoped>
.feedback-page-container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 10px 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.content-row {
  margin-top: 10px;
}

/* 左侧表单卡片 */
.feedback-form-card {
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.01);
  padding: 36px 30px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.feedback-form-card:hover {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.01);
}

.feedback-card-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.edit-tag {
  font-weight: normal;
}

.feedback-card-subtitle {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 32px;
}

/* 表单控件全局优化 */
:deep(.el-form-item) {
  margin-bottom: 26px;
}

:deep(.el-form-item__label) {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  padding-bottom: 8px !important;
}

.custom-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.required-star {
  color: #ef4444;
  margin-left: 4px;
}

.label-desc {
  color: #64748b;
  font-weight: normal;
  font-size: 12px;
  margin-left: 6px;
}

/* 输入框圆角与边框 */
:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-select .el-input__wrapper) {
  border-radius: 12px !important;
  background-color: #ffffff;
  border: 1px solid #cbd5e1 !important;
  box-shadow: none !important;
  transition: all 0.2s ease-in-out;
  padding: 10px 14px;
}

:deep(.el-textarea__inner) {
  padding: 14px;
  font-family: inherit;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover),
:deep(.el-select:hover .el-input__wrapper) {
  border-color: #94a3b8 !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus),
:deep(.el-select .el-input__wrapper.is-focus) {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08) !important;
}

/* 大横条图片上传触发器 */
.premium-uploader {
  width: 100%;
}

.upload-dashed-trigger {
  width: 100%;
  height: 72px;
  border: 1.5px dashed #cbd5e1;
  border-radius: 12px;
  background-color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease-in-out;
}

.upload-dashed-trigger:hover {
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.02);
}

.upload-trigger-text {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.2px;
}

.upload-dashed-trigger:hover .upload-trigger-text {
  color: #3b82f6;
}

/* 自定义回显画廊 */
.uploaded-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.gallery-item {
  position: relative;
  width: 84px;
  height: 84px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  cursor: pointer;
}

.gallery-item:hover .gallery-mask {
  opacity: 1;
}

.mask-icon {
  font-size: 20px;
  color: #ffffff;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
}

.mask-icon:hover {
  transform: scale(1.2);
}

/* 按钮组对齐与样式 */
.submit-action-box {
  margin-top: 36px;
  display: flex;
  gap: 16px;
  width: 100%;
}

.cancel-btn {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  background-color: #f1f5f9 !important;
  border: none !important;
  color: #475569 !important;
  transition: all 0.2s ease-in-out;
}

.cancel-btn:hover {
  background-color: #e2e8f0 !important;
  transform: translateY(-1px);
}

.submit-btn {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  background-color: #3b82f6 !important;
  border: none !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transition: all 0.2s ease-in-out;
}

.submit-btn:hover {
  background-color: #2563eb !important;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.25);
  transform: translateY(-1px);
}

.submit-btn:active, .cancel-btn:active {
  transform: translateY(0);
}

/* 右侧历史卡片 */
.history-card {
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.01);
  padding: 36px 30px;
  min-height: 500px;
}

.history-list-wrapper {
  min-height: 400px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.25s ease-in-out;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.03);
  border-color: #e2e8f0;
}

.item-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-time {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.status-tag {
  margin-left: auto;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px dashed #e2e8f0;
  padding-top: 14px;
  margin-top: 12px;
}

.item-actions {
  display: flex;
  gap: 16px;
  margin-left: auto;
}

.empty-history {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.history-pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* 官方答复抽屉与弹窗 */
.success-dialog-content {
  text-align: center;
  padding: 10px 0;
}

.success-icon {
  animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleIn {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* 抽屉样式 */
.drawer-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.feedback-orig-box {
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}

.reply-content-box {
  background: #f0fdf4;
  border: 1px solid #d1fae5;
  padding: 20px;
  border-radius: 14px;
}
</style>
