import { ref, nextTick } from 'vue'
import { streamAgentChat, type PlanSummary } from '@/api/agent'

export interface ChatMessage {
  role: 'user' | 'ai'
  content: string
  planSummary?: PlanSummary
  timestamp: number
}

export function useAgentChat(scrollCallback?: () => void) {
  const messages = ref<ChatMessage[]>([])
  const isStreaming = ref(false)
  const currentAiText = ref('')
  const conversationId = ref<string | null>(null)
  const abortController = ref<AbortController | null>(null)

  function sendMessage(text: string) {
    if (isStreaming.value) return

    // 添加用户消息
    messages.value.push({
      role: 'user',
      content: text,
      timestamp: Date.now()
    })

    currentAiText.value = ''
    isStreaming.value = true

    const ctrl = streamAgentChat(
      { message: text, conversationId: conversationId.value || undefined },
      (token) => {
        currentAiText.value += token
        if (scrollCallback) nextTick(scrollCallback)
      },
      (plan) => {
        // Plan created — 在消息末尾添加 PlanSummary
        // 先完成当前 AI 消息，再附加 Plan 卡片
        if (currentAiText.value) {
          messages.value.push({
            role: 'ai',
            content: currentAiText.value,
            planSummary: plan,
            timestamp: Date.now()
          })
          currentAiText.value = ''
        } else {
          messages.value.push({
            role: 'ai',
            content: '学习计划已生成！',
            planSummary: plan,
            timestamp: Date.now()
          })
        }
        if (scrollCallback) nextTick(scrollCallback)
      },
      (cid) => {
        // Done — 将剩余的 AI 文本作为消息提交
        if (currentAiText.value) {
          messages.value.push({
            role: 'ai',
            content: currentAiText.value,
            timestamp: Date.now()
          })
          currentAiText.value = ''
        }
        if (cid) conversationId.value = cid
        isStreaming.value = false
        if (scrollCallback) nextTick(scrollCallback)
      },
      (error) => {
        // Error
        if (currentAiText.value) {
          currentAiText.value += `\n\n[错误: ${error}]`
        } else {
          messages.value.push({
            role: 'ai',
            content: `[错误: ${error}]`,
            timestamp: Date.now()
          })
        }
        isStreaming.value = false
        if (scrollCallback) nextTick(scrollCallback)
      }
    )

    abortController.value = ctrl
  }

  function stopStreaming() {
    abortController.value?.abort()
    isStreaming.value = false
    if (currentAiText.value) {
      messages.value.push({
        role: 'ai',
        content: currentAiText.value,
        timestamp: Date.now()
      })
      currentAiText.value = ''
    }
  }

  function clearChat() {
    stopStreaming()
    messages.value = []
    conversationId.value = null
  }

  return {
    messages,
    isStreaming,
    currentAiText,
    conversationId,
    sendMessage,
    stopStreaming,
    clearChat
  }
}
