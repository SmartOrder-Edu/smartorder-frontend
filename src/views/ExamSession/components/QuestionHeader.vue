<template>
  <div class="question-header">
    <div class="question-header-left">
      <!-- 题号胶囊 -->
      <span class="question-index-badge">第 {{ globalIndex }} 题</span>
      <!-- 题型胶囊 -->
      <span class="question-type-badge">{{ typeName }}</span>
      <!-- 关联知识点标签 -->
      <QuestionTag v-for="tag in tags" :key="tag" type="blue">
        {{ tag }}
      </QuestionTag>
      <QuestionTag v-for="kp in kps" :key="kp" kp>
        {{ kp }}
      </QuestionTag>
    </div>
    <!-- 右侧分值 -->
    <div class="question-score">
      {{ score }} 分
    </div>
  </div>
</template>

<script setup lang="ts">
import QuestionTag from './QuestionTag.vue'

defineProps<{
  globalIndex: number
  typeName: string
  tags?: string[]
  kps?: string[]
  score?: number
}>()
</script>

<style scoped>
.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 26px 28px 16px;
}

.question-header-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.question-index-badge {
  background: linear-gradient(135deg, #14b8a6, #0ea5a4);
  color: #ffffff;
  border-radius: 12px;
  padding: 8px 15px;
  font-size: 14.5px;
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.2);
  line-height: 1.2;
}

.question-type-badge {
  background: #f1f5f9;
  color: #334155;
  border-radius: 12px;
  padding: 8px 15px;
  font-size: 13.5px;
  font-weight: 700;
  border: 1px solid #e2e8f0;
  line-height: 1.2;
  transition: all 0.3s ease;
}

.question-score {
  min-width: 58px;
  height: 38px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #ecfdf8;
  color: #0f9f91;
  font-size: 13.5px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  border: 1px solid #ccfbf1;
  transition: all 0.3s ease;
}

@media (max-width: 768px) {
  .question-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 20px 20px 12px;
  }
  
  .question-score {
    align-self: flex-end;
  }
}

/* 深色模式适配 */
html[data-theme='dark'] .question-type-badge {
  background: #1e293b;
  color: #cbd5e1;
  border-color: #334155;
}

html[data-theme='dark'] .question-score {
  background: rgba(20, 184, 166, 0.15);
  color: #2dd4bf;
  border-color: rgba(20, 184, 166, 0.25);
}
</style>
