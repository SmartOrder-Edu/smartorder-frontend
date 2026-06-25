import { onScopeDispose, ref } from 'vue'
import type { LessonCue, LessonTimeline, TimelinePlayerState } from '@/types/study'

interface TimelinePlayerHandlers {
  applyCue: (cue: LessonCue) => void
  resetScene: () => void
  onEnded?: () => void
}

const MIN_MANUAL_STEP_MS = 800

export function useTimelinePlayer(handlers: TimelinePlayerHandlers) {
  const audioRef = ref<HTMLAudioElement | null>(null)
  const currentTimeMs = ref(0)
  const status = ref<TimelinePlayerState['status']>('idle')
  const playbackRate = ref(1)
  const activeTimelineId = ref<string | null>(null)
  const firedCueIds = ref<Set<string>>(new Set())

  let timeline: LessonTimeline | null = null
  let cueCursor = 0
  let frameId: number | null = null
  let startedAtMs = 0

  const playerState = {
    status,
    currentTimeMs,
    playbackRate,
    activeTimelineId,
    firedCueIds,
  }

  function load(nextTimeline: LessonTimeline) {
    stopFrameLoop()
    timeline = normalizeTimeline(nextTimeline)
    cueCursor = 0
    currentTimeMs.value = 0
    activeTimelineId.value = timeline.id
    firedCueIds.value = new Set()
    status.value = 'ready'
    handlers.resetScene()

    if (audioRef.value && timeline.audioUrl) {
      audioRef.value.src = timeline.audioUrl
      audioRef.value.load()
    }
  }

  async function play() {
    if (!timeline || status.value === 'playing') return

    if (timeline.clockSource === 'audio' && audioRef.value) {
      audioRef.value.playbackRate = playbackRate.value
      await audioRef.value.play()
    } else {
      startedAtMs = performance.now() - currentTimeMs.value / playbackRate.value
    }

    status.value = 'playing'
    startFrameLoop()
  }

  function pause() {
    if (status.value !== 'playing') return
    syncCurrentTime()
    status.value = 'paused'
    pauseAudio()
    stopFrameLoop()
  }

  function waitForUser() {
    if (!timeline) return
    syncCurrentTime()
    status.value = 'waiting_user'
    pauseAudio()
    stopFrameLoop()
  }

  async function continueFromWait() {
    if (!timeline || status.value !== 'waiting_user') return

    const nextCue = timeline.cues[cueCursor]
    if (nextCue && timeline.clockSource === 'internal') {
      currentTimeMs.value = Math.max(currentTimeMs.value, nextCue.startMs)
    }

    await play()
  }

  function seek(targetMs: number) {
    if (!timeline) return

    const boundedMs = clamp(targetMs, 0, timeline.durationMs)
    currentTimeMs.value = boundedMs

    if (audioRef.value && timeline.clockSource === 'audio') {
      audioRef.value.currentTime = boundedMs / 1000
    }

    rebuildSceneAt(boundedMs)

    if (status.value === 'playing' && timeline.clockSource === 'internal') {
      startedAtMs = performance.now() - boundedMs / playbackRate.value
    }
  }

  function setPlaybackRate(rate: number) {
    playbackRate.value = clamp(rate, 0.5, 2)
    if (audioRef.value) {
      audioRef.value.playbackRate = playbackRate.value
    }
    if (status.value === 'playing' && timeline?.clockSource === 'internal') {
      startedAtMs = performance.now() - currentTimeMs.value / playbackRate.value
    }
  }

  function stop() {
    stopFrameLoop()
    pauseAudio()
    timeline = null
    cueCursor = 0
    currentTimeMs.value = 0
    activeTimelineId.value = null
    firedCueIds.value = new Set()
    status.value = 'idle'
  }

  function handleAudioEnded() {
    finishTimeline()
  }

  function startFrameLoop() {
    stopFrameLoop()

    const tick = () => {
      if (!timeline || status.value !== 'playing') return

      syncCurrentTime()
      runDueCues()

      if (status.value !== 'playing') return

      if (currentTimeMs.value >= timeline.durationMs) {
        finishTimeline()
        return
      }

      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)
  }

  function stopFrameLoop() {
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId)
      frameId = null
    }
  }

  function syncCurrentTime() {
    if (!timeline) return

    if (timeline.clockSource === 'audio' && audioRef.value) {
      currentTimeMs.value = audioRef.value.currentTime * 1000
      return
    }

    if (status.value === 'playing') {
      currentTimeMs.value = Math.min(
        timeline.durationMs,
        (performance.now() - startedAtMs) * playbackRate.value,
      )
    }
  }

  function runDueCues() {
    if (!timeline) return

    while (cueCursor < timeline.cues.length) {
      const cue = timeline.cues[cueCursor]
      if (!cue || cue.startMs > currentTimeMs.value) return

      cueCursor += 1
      if (firedCueIds.value.has(cue.id)) continue

      firedCueIds.value = new Set([...firedCueIds.value, cue.id])
      handlers.applyCue(cue)

      if (status.value === 'waiting_user' || status.value === 'paused') return
    }
  }

  function rebuildSceneAt(targetMs: number) {
    if (!timeline) return

    handlers.resetScene()
    firedCueIds.value = new Set()
    cueCursor = 0

    while (cueCursor < timeline.cues.length) {
      const cue = timeline.cues[cueCursor]
      if (!cue || cue.startMs > targetMs) break

      cueCursor += 1
      firedCueIds.value = new Set([...firedCueIds.value, cue.id])
      handlers.applyCue(cue)
    }
  }

  function finishTimeline() {
    if (!timeline) return

    currentTimeMs.value = timeline.durationMs
    status.value = 'ended'
    stopFrameLoop()
    pauseAudio()
    handlers.onEnded?.()
  }

  function pauseAudio() {
    if (audioRef.value && !audioRef.value.paused) {
      audioRef.value.pause()
    }
  }

  onScopeDispose(() => {
    stop()
  })

  return {
    audioRef,
    currentTimeMs,
    status,
    playbackRate,
    activeTimelineId,
    firedCueIds,
    playerState,
    load,
    play,
    pause,
    waitForUser,
    continueFromWait,
    seek,
    setPlaybackRate,
    stop,
    handleAudioEnded,
  }
}

function normalizeTimeline(timeline: LessonTimeline): LessonTimeline {
  return {
    ...timeline,
    durationMs: Math.max(timeline.durationMs, MIN_MANUAL_STEP_MS),
    cues: [...timeline.cues].sort((a, b) => a.startMs - b.startMs),
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
