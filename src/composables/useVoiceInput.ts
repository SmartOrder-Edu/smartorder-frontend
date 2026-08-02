import { onBeforeUnmount, ref, type Ref } from 'vue'

// Minimal Web Speech API types (TS lib 默认不包含)
interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}
interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((ev: SpeechRecognitionEvent) => void) | null
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

export interface UseVoiceInputOptions {
  /** 每次识别结果更新后回调（如触发 textarea autoResize） */
  onUpdate?: () => void
  /** 识别结束后回调（如重新聚焦输入框） */
  onEnd?: () => void
  /** 语言，默认 zh-CN */
  lang?: string
}

/**
 * Web Speech API 语音输入封装。
 * 将识别结果实时回填到 target ref，保留录音前已有文本（追加而非覆盖）。
 * 浏览器不支持时 voiceUnsupported=true，调用方据此隐藏麦克风按钮。
 */
export function useVoiceInput(target: Ref<string>, options: UseVoiceInputOptions = {}) {
  const SpeechRecognitionImpl: SpeechRecognitionCtor | null =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
  const voiceUnsupported = !SpeechRecognitionImpl
  const isListening = ref(false)
  let recognition: SpeechRecognitionLike | null = null
  let voiceBaseText = ''

  function stopVoice() {
    recognition?.stop()
  }

  function startVoice() {
    if (!SpeechRecognitionImpl) return
    recognition = new SpeechRecognitionImpl()
    recognition.lang = options.lang ?? 'zh-CN'
    recognition.interimResults = true
    recognition.continuous = false
    recognition.maxAlternatives = 1
    voiceBaseText = target.value
    recognition.onstart = () => {
      isListening.value = true
    }
    recognition.onresult = (ev: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i]
        if (r.isFinal) final += r[0].transcript
        else interim += r[0].transcript
      }
      target.value = (voiceBaseText + final + interim).replace(/^\s+/, '')
      options.onUpdate?.()
    }
    recognition.onerror = (ev: SpeechRecognitionErrorEvent) => {
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
        console.warn('[voice] 麦克风权限被拒绝')
      }
    }
    recognition.onend = () => {
      isListening.value = false
      recognition = null
      options.onEnd?.()
    }
    try {
      recognition.start()
    } catch (e) {
      isListening.value = false
      recognition = null
    }
  }

  function toggleVoice() {
    if (!SpeechRecognitionImpl) return
    if (isListening.value) {
      stopVoice()
      return
    }
    startVoice()
  }

  onBeforeUnmount(() => {
    recognition?.abort()
    recognition = null
  })

  return { isListening, voiceUnsupported, toggleVoice, stopVoice }
}
