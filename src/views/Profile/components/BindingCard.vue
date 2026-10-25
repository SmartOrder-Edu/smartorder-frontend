<template>
  <div class="binding-card">
    <!-- 平台 Logo 圆形容器 -->
    <div class="platform-logo">
      <svg v-if="provider === 'gitee'" viewBox="0 0 24 24" width="18" height="18">
        <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z" fill="#C71D23"/>
      </svg>
      <svg v-else-if="provider === 'github'" viewBox="0 0 1024 1024" width="18" height="18">
        <path d="M512 0C229.25 0 0 229.25 0 512c0 226.25 146.69 418.13 350.16 485.83 25.59 4.69 34.94-11.12 34.94-24.69 0-12.19-.47-52.56-.69-95.31-142.44 30.94-172.5-60.44-172.5-60.44-23.31-59.25-56.88-75-56.88-75-46.5-31.81 3.53-31.13 3.53-31.13 51.41 3.63 78.44 52.81 78.44 52.81 45.63 78.19 119.75 55.63 148.94 42.56 4.63-33.06 17.88-55.63 32.44-68.38-113.69-12.94-233.19-56.88-233.19-253.06 0-55.88 20-101.56 52.81-137.44-5.31-12.94-22.88-65.06 5-135.56 0 0 43.06-13.81 141.06 52.56 40.94-11.38 84.88-17.06 128.5-17.25 43.63.19 87.63 5.88 128.63 17.25 97.88-66.38 140.88-52.56 140.88-52.56 27.94 70.5 10.38 122.63 5.06 135.56 32.88 35.88 52.75 81.56 52.75 137.44 0 196.69-119.75 239.94-233.81 252.56 18.38 15.88 34.75 47.13 34.75 94.94 0 68.56-.63 123.75-.63 140.63 0 13.69 9.25 29.63 35.25 24.63C877.44 930 1024 738.13 1024 512 1024 229.25 794.75 0 512 0z" fill="#24292e"/>
      </svg>
    </div>

    <!-- 中间详情 -->
    <div class="binding-details">
      <div class="binding-header-row">
        <span class="binding-platform-name">{{ provider === 'gitee' ? 'Gitee 码云' : 'GitHub' }}</span>
        <BindingStatus :bound="bound" />
      </div>

      <div class="binding-meta">
        <template v-if="bound && providerInfo">
          <div class="meta-row-info">
            <span>绑定用户：</span>
            <strong>{{ providerInfo.providerUsername || '未知' }}</strong>
          </div>
          <div class="meta-row-info" v-if="providerInfo.providerEmail">
            <span>绑定主邮箱：</span>
            <strong>{{ providerInfo.providerEmail }}</strong>
          </div>
          <div class="meta-row-info">
            <span>最近同步：</span>
            <strong>{{ displayTime }}</strong>
          </div>
        </template>
        <template v-else>
          <span class="binding-placeholder-desc">
            一键快捷登录与身份同步
          </span>
        </template>
      </div>
    </div>

    <!-- 右侧解绑/绑定按钮 -->
    <UnbindButton
      :bound="bound"
      @click="handleAction"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BindingStatus from './BindingStatus.vue'
import UnbindButton from './UnbindButton.vue'

const props = defineProps<{
  provider: 'gitee' | 'github'
  bound: boolean
  providerInfo?: {
    providerUsername?: string
    providerEmail?: string
    lastLoginTime?: string | number
  }
}>()

const emit = defineEmits<{
  (e: 'bind'): void
  (e: 'unbind'): void
}>()

const displayTime = computed(() => {
  if (!props.providerInfo?.lastLoginTime) return '暂无数据'
  const t = props.providerInfo.lastLoginTime
  if (typeof t === 'number' || !isNaN(Date.parse(t))) {
    const d = new Date(t)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  return String(t)
})

const handleAction = () => {
  if (props.bound) {
    emit('unbind')
  } else {
    emit('bind')
  }
}
</script>

<style scoped>
.binding-card {
  min-height: 80px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background:
    linear-gradient(
      135deg,
      rgba(240, 253, 250, 0.65),
      rgba(255, 255, 255, 0.95)
    );
  border: 1px solid rgba(20, 184, 166, 0.24);
  border-radius: 12px;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
  box-sizing: border-box;
  height: 100%;
}

.binding-card:hover {
  border-color: rgba(20, 184, 166, 0.48);
  box-shadow: 0 8px 24px rgba(15, 118, 110, 0.09);
  transform: translateY(-2px);
}

.platform-logo {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 3px 8px rgba(31, 45, 61, 0.05);
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.22s ease;
}

.binding-card:hover .platform-logo {
  transform: scale(1.06);
  box-shadow: 0 4px 10px rgba(31, 45, 61, 0.08);
}

.binding-details {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.binding-header-row {
  display: flex;
  align-items: center;
}

.binding-platform-name {
  font-size: 13px;
  font-weight: 650;
  color: #111827;
}

.binding-meta {
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #8290a5;
}

.meta-row-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.binding-meta strong {
  color: #344054;
  font-weight: 550;
}

.binding-placeholder-desc {
  font-size: 12px;
  color: #98a2b3;
}

/* 响应式 */
@media (max-width: 700px) {
  .binding-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
    gap: 12px;
  }
  .binding-card .unbind-button {
    margin-left: 0;
    width: 100%;
    margin-top: 6px;
  }
}

/* 深色模式适配 */
html[data-theme='dark'] .binding-card {
  background: var(--account-card-bg, #1a222e);
  border-color: var(--account-border, #2c3745);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

html[data-theme='dark'] .binding-card:hover {
  background: var(--account-card-hover, #202a37);
  border-color: rgba(20, 184, 166, 0.45);
}

html[data-theme='dark'] .platform-logo {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

/* 深色模式下不反转 Logo，保持本色 */
html[data-theme='dark'] .platform-logo svg {
  filter: none;
}

html[data-theme='dark'] .binding-platform-name {
  color: var(--account-text-primary, #f5f7fa);
}

html[data-theme='dark'] .binding-meta {
  color: var(--account-text-secondary, #b4bdca);
}

html[data-theme='dark'] .binding-meta strong {
  color: var(--account-text-primary, #f5f7fa);
}

html[data-theme='dark'] .binding-placeholder-desc {
  color: var(--account-text-muted, #7f8a99);
}
</style>
