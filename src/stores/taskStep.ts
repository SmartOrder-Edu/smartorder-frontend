import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { taskStepApi } from '@/api/spaceDashboard'
import type { TaskStepVO, StepStatus } from '@/types/learningSpace'

export const useTaskStepStore = defineStore('taskStep', () => {
  const steps = ref<TaskStepVO[]>([])
  const currentStepIndex = ref(0)
  const loading = ref(false)

  const currentStep = computed(() => steps.value[currentStepIndex.value] || null)
  const totalEstimatedMinutes = computed(() => steps.value.reduce((s, st) => s + st.estimatedMinutes, 0))
  const completedSteps = computed(() => steps.value.filter(s => s.status === 'completed').length)

  async function fetchSteps(taskId: number) {
    loading.value = true
    try {
      steps.value = await taskStepApi.getSteps(taskId)
      const firstIncomplete = steps.value.findIndex(s => s.status !== 'completed')
      currentStepIndex.value = firstIncomplete >= 0 ? firstIncomplete : 0
    } finally {
      loading.value = false
    }
  }

  function goToStep(index: number) {
    if (index >= 0 && index < steps.value.length) {
      // Mark current step as in_progress if pending
      const step = steps.value[index]
      if (step.status === 'pending') {
        step.status = 'in_progress'
      }
      currentStepIndex.value = index
    }
  }

  function nextStep() {
    if (currentStepIndex.value < steps.value.length - 1) {
      // Complete current step
      steps.value[currentStepIndex.value].status = 'completed'
      currentStepIndex.value++
      const next = steps.value[currentStepIndex.value]
      if (next.status === 'pending') {
        next.status = 'in_progress'
      }
    }
  }

  function prevStep() {
    if (currentStepIndex.value > 0) {
      currentStepIndex.value--
    }
  }

  function updateStepStatus(index: number, status: StepStatus) {
    if (index >= 0 && index < steps.value.length) {
      steps.value[index].status = status
    }
  }

  function skipStep(index: number) {
    updateStepStatus(index, 'skipped')
    if (index === currentStepIndex.value) {
      nextStep()
    }
  }

  return {
    steps,
    currentStepIndex,
    currentStep,
    loading,
    totalEstimatedMinutes,
    completedSteps,
    fetchSteps,
    goToStep,
    nextStep,
    prevStep,
    updateStepStatus,
    skipStep,
  }
})
