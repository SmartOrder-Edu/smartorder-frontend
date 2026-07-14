<template>
  <div class="avatar-wrapper">
    <img :src="avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" alt="头像" />
    
    <!-- 上传 loading 遮罩 -->
    <div v-if="uploading" class="uploading-overlay">
      <span class="upload-spinner"></span>
    </div>

    <!-- 相机编辑按钮 -->
    <label class="avatar-edit-button" :class="{ disabled: uploading }">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
      <input type="file" accept="image/*" hidden :disabled="uploading" @change="handleChange" />
    </label>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  avatar: string
  uploading: boolean
}>()

const emit = defineEmits<{
  (e: 'change', event: Event): void
}>()

const handleChange = (event: Event) => {
  emit('change', event)
}
</script>

<style scoped>
.avatar-wrapper {
  position: relative;
  width: 96px;
  height: 96px;
  flex-shrink: 0;
}

.avatar-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid #ffffff;
  box-shadow:
    0 0 0 2px rgba(20, 184, 166, 0.22),
    0 10px 24px rgba(15, 118, 110, 0.12);
  transition: transform 0.3s ease;
}

.avatar-wrapper:hover img {
  transform: scale(1.02);
}

.uploading-overlay {
  position: absolute;
  inset: 3px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.upload-spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.avatar-edit-button {
  position: absolute;
  right: -2px;
  bottom: 2px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #ffffff;
  background: #14b8a6;
  border: 2.5px solid #ffffff;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.25);
  cursor: pointer;
  z-index: 3;
  transition: all 0.2s ease;
}

.avatar-edit-button:hover {
  background: #0d9488;
  transform: scale(1.08);
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.35);
}

.avatar-edit-button.disabled {
  pointer-events: none;
  opacity: 0.6;
}

/* 深色模式适配 */
html[data-theme='dark'] .avatar-wrapper img {
  border-color: var(--account-card-bg, #1a222e);
  box-shadow:
    0 0 0 2px rgba(20, 184, 166, 0.3),
    0 10px 24px rgba(0, 0, 0, 0.4);
}

html[data-theme='dark'] .avatar-edit-button {
  border-color: var(--account-card-bg, #1a222e);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
