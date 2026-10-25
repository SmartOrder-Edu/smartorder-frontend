<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="发布到资源广场"
    width="520px"
    top="15vh"
    @open="onOpen"
    @close="$emit('update:visible', false)"
  >
    <div class="publish-form">
      <div class="form-item">
        <label>文件</label>
        <div class="file-info-box">
          <span class="file-info-name">{{ file?.name || '未知文件' }}</span>
          <span class="file-info-size">{{ file?.size ? formatSize(file.size) : '' }}</span>
        </div>
      </div>

      <div class="form-item">
        <label>资源标题 <span class="required">*</span></label>
        <el-input v-model="form.title" placeholder="请输入资源标题" maxlength="100" show-word-limit />
      </div>

      <div class="form-item">
        <label>资源描述</label>
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="简要描述资源的内容和适用场景..."
          maxlength="500"
          show-word-limit
        />
      </div>

      <div class="form-item">
        <label>分类 <span class="required">*</span></label>
        <el-select v-model="form.category" placeholder="选择资源分类" style="width: 100%">
          <el-option
            v-for="opt in categoryOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          >
            <div class="category-option">
              <span class="category-icon" v-html="opt.icon"></span>
              <span class="category-label">{{ opt.label }}</span>
            </div>
          </el-option>
        </el-select>
      </div>

      <div class="form-item">
        <label>标签</label>
        <div class="tag-input-area">
          <el-tag
            v-for="(tag, idx) in form.tags"
            :key="idx"
            closable
            size="small"
            @close="removeTag(idx)"
            style="margin-right: 4px; margin-bottom: 4px;"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="tagInputVisible"
            ref="tagInputRef"
            v-model="tagInputValue"
            size="small"
            style="width: 80px"
            @keyup.enter="addTag"
            @blur="addTag"
          />
          <el-button
            v-else
            size="small"
            @click="showTagInput"
            :disabled="form.tags.length >= 5"
          >
            + 添加标签
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" :disabled="!canSubmit" @click="handleSubmit">
        确认发布
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { publishToSquare } from '@/api/resource-square'

interface DriveItem {
  id: string
  name: string
  type: 'file' | 'folder'
  extension: string
  size: number
}

const props = defineProps<{
  visible: boolean
  file: DriveItem | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'success'): void
}>()

const submitting = ref(false)

const categoryOptions = [
  { value: 'doc', label: '文档', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>' },
  { value: 'mindmap', label: '思维导图', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="5" r="2"/><line x1="12" y1="9" x2="12" y2="3"/></svg>' },
  { value: 'video', label: '视频', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>' },
  { value: 'quiz', label: '练习题', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
  { value: 'case', label: '案例', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>' },
]

const form = reactive({
  title: '',
  description: '',
  tags: [] as string[],
  category: 'doc' as string,
})

// 标签输入
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref<any>(null)

const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus?.()
  })
}

const addTag = () => {
  const val = tagInputValue.value.trim()
  if (val && !form.tags.includes(val) && form.tags.length < 5) {
    form.tags.push(val)
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

const removeTag = (idx: number) => {
  form.tags.splice(idx, 1)
}

const canSubmit = computed(() => {
  return form.title.trim() && form.category
})

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return size.toFixed(i === 0 ? 0 : 1) + ' ' + units[i]
}

const resetForm = () => {
  form.title = ''
  form.description = ''
  form.tags = []
  form.category = 'doc'
}

const onOpen = () => {
  resetForm()
  if (props.file) {
    const name = props.file.name
    const dotIndex = name.lastIndexOf('.')
    form.title = dotIndex > 0 ? name.substring(0, dotIndex) : name
  }
}

const handleSubmit = async () => {
  if (!canSubmit.value || !props.file) return

  submitting.value = true
  try {
    await publishToSquare({
      fileId: props.file.id,
      title: form.title.trim(),
      description: form.description.trim(),
      tags: JSON.stringify(form.tags),
      category: form.category,
    })
    ElMessage.success('发布成功！资源已出现在资源广场')
    emit('success')
    emit('update:visible', false)
  } catch (err: any) {
    // API 错误由 request 拦截器处理
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.publish-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-item label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 6px;
}

.form-item .required {
  color: #ef4444;
}

.file-info-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #f1f5f9;
  border-radius: 8px;
  font-size: 0.875rem;
}

.file-info-name {
  color: #1e293b;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.file-info-size {
  color: #64748b;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.tag-input-area {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.category-option {
  display: flex;
  align-items: center;
  gap: 6px;
}

.category-icon {
  display: inline-flex;
  align-items: center;
  color: #6366f1;
  flex-shrink: 0;
}

.category-label {
  line-height: 1;
}
</style>
