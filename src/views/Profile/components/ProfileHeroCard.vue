<template>
  <div class="hero-card">
    <!-- 左侧：头像 + 基本信息 -->
    <div class="hero-left">
      <div class="hero-avatar-wrapper">
        <div class="hero-avatar" :style="avatarStyle">
          <span class="avatar-text" v-if="!hero.avatar">{{ initials }}</span>
          <img v-else :src="hero.avatar" :alt="hero.name" class="avatar-img" />
        </div>
        <div class="hero-level-badge" v-if="hero.overallLevel">{{ hero.overallLevel }}</div>
      </div>

      <div class="hero-info">
        <div class="hero-name-row">
          <h2 class="hero-name">{{ hero.name }}</h2>
          <span class="hero-identity-tag">{{ hero.identity }}</span>
        </div>

        <div class="hero-meta" v-if="hero.direction || hero.level">
          <span v-if="hero.direction" class="meta-item">
            <el-icon :size="13"><School /></el-icon>
            {{ hero.direction }}
          </span>
          <span v-if="hero.level" class="meta-item">
            <el-icon :size="13"><Star /></el-icon>
            {{ hero.level }}
          </span>
        </div>

        <p class="hero-goal" v-if="hero.goal">
          <el-icon :size="13"><Flag /></el-icon>
          {{ hero.goal }}
        </p>

        <!-- 学习画像标签：对应参考图中头像右侧的蓝色能力标签 -->
        <div class="hero-tags">
          <span>{{ hero.direction || '计算机科学与技术' }}</span>
          <span>{{ hero.level || '进阶学习者' }}</span>
          <span>{{ hero.identity || '自主学习者' }}</span>
        </div>
      </div>
    </div>

    <!-- 右侧：统计数字 -->
    <div class="hero-right">
      <div class="hero-stat">
        <div class="stat-value">
          <span class="stat-num">{{ hero.overallMastery }}</span>
          <span class="stat-unit">%</span>
        </div>
        <span class="stat-label">综合掌握度</span>
      </div>
      <div class="hero-stat">
        <div class="stat-value">
          <span class="stat-num">{{ (hero.weeklyMinutes / 60).toFixed(1) }}</span>
          <span class="stat-unit">h</span>
        </div>
        <span class="stat-label">每周学习</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { School, Star, Flag } from '@element-plus/icons-vue'
import type { HeroData } from '../types/profile'

const props = defineProps<{
  hero: HeroData
  loading?: boolean
}>()

const initials = computed(() => {
  return (props.hero.name || '?').charAt(0).toUpperCase()
})

// 渐变头像背景
const avatarColors = [
  'linear-gradient(135deg, #2563eb, #4f46e5)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
]

const avatarStyle = computed(() => ({
  background: props.hero.avatar ? 'transparent' : avatarColors[0],
}))
</script>

<style scoped lang="scss">
.hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  flex-wrap: wrap;
  padding: 2px 0;
}

// ===== 左侧 =====
.hero-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  min-width: 240px;
}

.hero-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.hero-avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 3px solid #8bb7ff;
  background: #eaf3ff;
  box-shadow: 0 12px 26px rgba(47, 109, 246, 0.16);
}

.avatar-text {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-level-badge {
  position: absolute;
  bottom: 2px;
  right: -8px;
  background: #fff;
  border: 1px solid #cfe0ff;
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 10px;
  font-weight: 600;
  color: #2f6df6;
  white-space: nowrap;
  box-shadow: 0 8px 16px rgba(47, 109, 246, 0.12);
}

// ===== 信息 =====
.hero-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.hero-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.hero-name {
  font-size: 25px;
  font-weight: 800;
  color: #101a33;
  margin: 0;
  line-height: 1.14;
  letter-spacing: 0;
}

.hero-identity-tag {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(47, 109, 246, 0.1);
  color: #2f6df6;
  font-weight: 700;
}

.hero-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #63708a;
}

.hero-goal {
  font-size: 12px;
  color: #63708a;
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  line-height: 1.4;
  max-width: 560px;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  span {
    display: inline-flex;
    align-items: center;
    min-height: 26px;
    padding: 5px 10px;
    border-radius: 8px;
    background: #eaf3ff;
    color: #2f6df6;
    font-size: 12px;
    font-weight: 700;
  }
}

// ===== 右侧统计 =====
.hero-right {
  display: flex;
  gap: 12px;
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 100%;
    justify-content: space-around;
  }
}

.hero-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 96px;
  min-height: 74px;
  padding: 10px 14px;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(207, 224, 255, 0.86);
  box-shadow: 0 12px 24px rgba(47, 109, 246, 0.08);
}

.stat-value {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.stat-num {
  font-size: 29px;
  font-weight: 800;
  color: #101a33;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-unit {
  font-size: 13px;
  color: #667085;
}

.stat-label {
  font-size: 11px;
  color: #7c879c;
}

@media (max-width: 640px) {
  .hero-avatar {
    width: 72px;
    height: 72px;
  }

  .hero-name {
    font-size: 20px;
  }
}
</style>
