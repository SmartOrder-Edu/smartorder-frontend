import { onMounted, ref } from 'vue'
import learningReportApi from '@/api/learningReport'
import type { EvidenceMap, WeeklyLearningReport } from '@/types/learningReport'

/**
 * 加载学习周报数据
 * 后端就绪后只需改 src/api/learningReport.ts 的 getWeeklyReport 实现
 */
export function useReportData() {
  const report = ref<WeeklyLearningReport | null>(null)
  const evidenceMap = ref<EvidenceMap | null>(null)
  const loading = ref(true)
  const error = ref<unknown>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const { report: r, evidenceMap: e } = await learningReportApi.getWeeklyReport()
      report.value = r
      evidenceMap.value = e
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  return { report, evidenceMap, loading, error, reload: load }
}
