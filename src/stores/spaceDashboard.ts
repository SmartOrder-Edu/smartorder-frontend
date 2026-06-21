import { defineStore } from 'pinia'
import { ref } from 'vue'
import { spaceDashboardApi, taskApi } from '@/api/spaceDashboard'
import type { SpaceDashboardVO, TaskVO, TaskStatus } from '@/types/learningSpace'

export const useSpaceDashboardStore = defineStore('spaceDashboard', () => {
  const dashboard = ref<SpaceDashboardVO | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchDashboard(spaceId: string) {
    loading.value = true
    error.value = null
    try {
      dashboard.value = await spaceDashboardApi.getDashboard(spaceId)
    } catch (e: any) {
      error.value = e.message || '获取空间数据失败'
    } finally {
      loading.value = false
    }
  }

  async function startTask(taskId: string) {
    try {
      await taskApi.updateStatus(taskId, 'in_progress')
      updateLocalTaskStatus(taskId, 'in_progress')
    } catch (e: any) {
      console.error('Failed to start task:', e)
    }
  }

  async function completeTask(taskId: string, actualMinutes: number) {
    try {
      await taskApi.complete(taskId, { actualDurationMinutes: actualMinutes })
      updateLocalTaskStatus(taskId, 'completed')
      // Update local stats
      if (dashboard.value) {
        const task = findTask(taskId)
        if (task) {
          task.actualDurationMinutes = actualMinutes
          task.completedAt = new Date().toISOString()
        }
      }
    } catch (e: any) {
      console.error('Failed to complete task:', e)
    }
  }

  function findTask(taskId: string): TaskVO | undefined {
    if (!dashboard.value) return undefined
    return dashboard.value.todayTasks.find(t => t.id === taskId)
      || dashboard.value.pendingTasks.find(t => t.id === taskId)
      || dashboard.value.overdueTasks.find(t => t.id === taskId)
  }

  function updateLocalTaskStatus(taskId: string, status: TaskStatus) {
    if (!dashboard.value) return
    for (const list of [dashboard.value.todayTasks, dashboard.value.pendingTasks, dashboard.value.overdueTasks]) {
      const task = list.find(t => t.id === taskId)
      if (task) {
        task.status = status
        break
      }
    }
  }

  return {
    dashboard,
    loading,
    error,
    fetchDashboard,
    startTask,
    completeTask,
  }
})
