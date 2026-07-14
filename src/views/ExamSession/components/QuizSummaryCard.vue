<template>
  <div class="quiz-summary-card">
    <!-- 右上角品牌波纹装饰 -->
    <div class="brand-wave-decor"></div>
    
    <!-- 圆环进度区 -->
    <div class="progress-section">
      <QuizProgress :answered="answeredCount" :total="totalCount" />
    </div>

    <!-- 总题数 -->
    <QuizStatItem label="总题数">
      {{ totalCount }} <span class="unit">题</span>
    </QuizStatItem>

    <!-- 正确率预估 -->
    <QuizStatItem 
      label="正确率预估" 
      tooltip="根据当前已作答客观题的正确率或历史数据预估"
    >
      {{ estimatedAccuracy }}%
    </QuizStatItem>

    <!-- 难度分布 (带柱状图) -->
    <QuizStatItem label="难度分布">
      <div class="difficulty-wrapper">
        <span class="text-desc">{{ difficultyText }}</span>
        <div class="mini-bar-chart">
          <div class="bar-item">
            <el-tooltip :content="`基础题约占 ${difficultyDistribution.easy}%`" placement="top">
              <div class="bar-track">
                <div class="bar-fill easy" :style="{ height: difficultyDistribution.easy + '%' }"></div>
              </div>
            </el-tooltip>
            <span class="bar-label">易</span>
          </div>
          <div class="bar-item">
            <el-tooltip :content="`中等题约占 ${difficultyDistribution.medium}%`" placement="top">
              <div class="bar-track">
                <div class="bar-fill medium" :style="{ height: difficultyDistribution.medium + '%' }"></div>
              </div>
            </el-tooltip>
            <span class="bar-label">中</span>
          </div>
          <div class="bar-item">
            <el-tooltip :content="`困难题约占 ${difficultyDistribution.hard}%`" placement="top">
              <div class="bar-track">
                <div class="bar-fill hard" :style="{ height: difficultyDistribution.hard + '%' }"></div>
              </div>
            </el-tooltip>
            <span class="bar-label">难</span>
          </div>
        </div>
      </div>
    </QuizStatItem>

    <!-- 知识覆盖 -->
    <QuizStatItem label="知识覆盖" is-coverage>
      <div class="coverage-tags-wrapper">
        <QuestionTag 
          v-for="tag in coverageTags" 
          :key="tag" 
          type="info" 
          class="coverage-tag"
        >
          {{ tag }}
        </QuestionTag>
        <QuestionTag v-if="!coverageTags || !coverageTags.length" type="default" class="coverage-tag">
          暂无
        </QuestionTag>
      </div>
    </QuizStatItem>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import QuizProgress from './QuizProgress.vue'
import QuizStatItem from './QuizStatItem.vue'
import QuestionTag from './QuestionTag.vue'

const props = defineProps<{
  answeredCount: number
  totalCount: number
  estimatedAccuracy: number
  difficultyText: string
  coverageTags: string[]
}>()

// 根据难度文本计算微柱图比例
const difficultyDistribution = computed(() => {
  const text = props.difficultyText || ''
  if (text.includes('基础') || text.includes('识记')) {
    return { easy: 80, medium: 15, hard: 5 }
  } else if (text.includes('掌握') || text.includes('理解')) {
    return { easy: 50, medium: 40, hard: 10 }
  } else if (text.includes('应用') || text.includes('分析')) {
    return { easy: 30, medium: 50, hard: 20 }
  } else if (text.includes('综合') || text.includes('设计')) {
    return { easy: 20, medium: 45, hard: 35 }
  } else {
    // 进阶推理等
    return { easy: 15, medium: 30, hard: 55 }
  }
})
</script>

<style scoped>
.quiz-summary-card {
  display: grid;
  grid-template-columns: 170px 1fr 1fr 1.25fr 1.25fr;
  gap: 28px;
  align-items: center;
  padding: 28px 32px;
  background: #ffffff;
  border: 1px solid #e8edf4;
  border-radius: 26px;
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.05);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* 品牌装饰波纹 */
.brand-wave-decor {
  position: absolute;
  top: -60px;
  right: -60px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(20, 184, 166, 0.09) 0%, rgba(91, 141, 239, 0.03) 50%, transparent 80%);
  pointer-events: none;
  z-index: 0;
}

.progress-section {
  display: flex;
  justify-content: flex-start;
  border-right: 1.5px solid #edf2f7;
  padding-right: 28px;
  z-index: 1;
}

/* 难度分布布局 */
.difficulty-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mini-bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 48px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.bar-track {
  width: 10px;
  height: 32px;
  background: #f1f5f9;
  border-radius: 999px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
  border-radius: 999px;
  transition: height 0.5s ease;
}

/* 难度颜色配置 */
.bar-fill.easy {
  background: #2dd4bf;
}

.bar-fill.medium {
  background: #f59e0b;
}

.bar-fill.hard {
  background: #ef4444;
}

.bar-label {
  font-size: 10px;
  font-weight: 700;
  color: #98a2b3;
}

.coverage-tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.coverage-tag {
  font-size: 12.5px;
  font-weight: 600;
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  background: #f0f4f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .quiz-summary-card {
    grid-template-columns: 140px 1fr 1fr 1.1fr;
    gap: 20px;
    padding: 24px 28px;
  }
  
  .quiz-summary-card > :last-child {
    grid-column: span 4;
    border-top: 1.5px solid #edf2f7;
    padding-top: 16px;
    margin-top: 8px;
  }
  
  .progress-section {
    padding-right: 20px;
  }
}

@media (max-width: 868px) {
  .quiz-summary-card {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    padding: 24px;
  }
  
  .progress-section {
    grid-column: span 2;
    justify-content: center;
    border-right: none;
    border-bottom: 1.5px solid #edf2f7;
    padding-right: 0;
    padding-bottom: 20px;
    margin-bottom: 4px;
  }
  
  .quiz-summary-card > :last-child {
    grid-column: span 2;
  }
}

@media (max-width: 480px) {
  .quiz-summary-card {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .progress-section,
  .quiz-summary-card > :last-child {
    grid-column: span 1;
  }
}

/* 深色模式适配 */
html[data-theme='dark'] .quiz-summary-card {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.2);
}

html[data-theme='dark'] .brand-wave-decor {
  background: radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, rgba(91, 141, 239, 0.05) 50%, transparent 80%);
}

html[data-theme='dark'] .progress-section {
  border-right-color: #334155;
}

html[data-theme='dark'] .bar-track {
  background: #334155;
}

html[data-theme='dark'] .bar-label {
  color: #64748b;
}

html[data-theme='dark'] .coverage-tag {
  background: #334155;
  color: #cbd5e1;
  border-color: #475569;
}

html[data-theme='dark'] .quiz-summary-card > :last-child {
  border-top-color: #334155;
}

html[data-theme='dark'] .progress-section {
  border-bottom-color: #334155;
}
</style>
