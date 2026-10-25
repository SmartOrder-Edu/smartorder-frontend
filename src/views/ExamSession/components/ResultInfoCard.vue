<template>
  <div class="result-info-grid">
    <!-- 我的作答 -->
    <div class="result-info-card user-answer-card">
      <div class="card-title-row">
        <div class="bullet-dot blue"></div>
        <span>我的作答</span>
      </div>
      <div class="compare-content text-pre">{{ userAnswer || '（未作答）' }}</div>
    </div>
    <!-- 参考答案 -->
    <div class="result-info-card correct-answer-card">
      <div class="card-title-row">
        <div class="bullet-dot green"></div>
        <span>参考/正确答案</span>
      </div>
      <div class="compare-content text-pre">{{ correctAnswer }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  userAnswer?: string
  correctAnswer: string
}>()
</script>

<style scoped>
.result-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 18px;
}

.result-info-card {
  min-height: 100px;
  padding: 18px 22px;
  border-radius: 16px;
  border: 1.5px solid #e4eaf1;
  background: #ffffff;
  transition: all 0.2s ease;
}

.result-info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
}

/* 我的作答使用浅蓝边线强调 */
.user-answer-card {
  border-left: 4px solid #3b82f6;
  border-color: #eff6ff #eff6ff #eff6ff #3b82f6;
}

/* 参考答案使用浅绿边线强调 */
.correct-answer-card {
  border-left: 4px solid #10b981;
  border-color: #f0fdf4 #f0fdf4 #f0fdf4 #10b981;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 800;
  color: #475569;
  margin-bottom: 10px;
  transition: color 0.3s ease;
}

.bullet-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.bullet-dot.blue {
  background: #3b82f6;
}

.bullet-dot.green {
  background: #10b981;
}

.compare-content {
  font-size: 15px;
  font-weight: 700;
  color: #182230;
  line-height: 1.65;
  word-break: break-word;
  transition: color 0.3s ease;
}

.text-pre {
  white-space: pre-wrap;
}

@media (max-width: 640px) {
  .result-info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

/* 深色模式适配 */
html[data-theme='dark'] .result-info-card {
  background: #151e2e;
  border-color: #243049;
}

html[data-theme='dark'] .user-answer-card {
  border-color: #1a2a47 #1a2a47 #1a2a47 #3b82f6;
}

html[data-theme='dark'] .correct-answer-card {
  border-color: #142e26 #142e26 #142e26 #10b981;
}

html[data-theme='dark'] .card-title-row {
  color: #94a3b8;
}

html[data-theme='dark'] .compare-content {
  color: #cbd5e1;
}
</style>
