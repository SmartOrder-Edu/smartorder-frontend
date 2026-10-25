export interface SubjectProfileListItem {
  subjectId: string
  subjectName: string
  statusClass: string
  statusLabel: string
  mastery: number | null
  color: string
  chapters: { name: string; mastery: number }[]
  misconceptions: string[]
  preferenceOverride: string
  confidence: number | null
  completeness: number | null
}

interface SubjectProfileInput {
  subjectId?: string
  subjectNameCache?: string
  subjectStatus?: string
  knowledgeMastery?: {
    overallMasteryScore?: number
    chapterSummaries?: Record<string, { chapterName?: string; masteryScore?: number; overallMastery?: number }>
    chapters?: Record<string, { chapterName?: string; masteryScore?: number; overallMastery?: number }>
  }
  subjectMisconceptions?: {
    patterns?: Record<string, { title?: string; status?: string }>
  }
  learningPreferenceOverride?: {
    preferredResourceTypes?: string[]
  }
  metadata?: {
    confidence?: number
    completeness?: number
  }
}

interface StudentProfileInput {
  subjectProfiles?: {
    profiles?: Record<string, SubjectProfileInput>
  }
}

const spaceColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899']

const statusMap: Record<string, { cls: string; label: string }> = {
  ACTIVE: { cls: 'good', label: '学习中' },
  PAUSED: { cls: 'warning', label: '已暂停' },
  ARCHIVED: { cls: 'normal', label: '已归档' }
}

const getSubjectProfiles = (profile: StudentProfileInput | null | undefined) =>
  profile?.subjectProfiles?.profiles ?? {}

const getChapterScore = (chapter: Record<string, unknown>) => {
  const score = chapter.masteryScore ?? chapter.overallMastery
  return typeof score === 'number' ? score : 0
}

export const buildSubjectProfileList = (
  profile: StudentProfileInput | null | undefined,
  resourceTypeLabels: Record<string, string>
): SubjectProfileListItem[] => {
  const subjects = getSubjectProfiles(profile)

  return Object.entries(subjects).map(([key, sp], idx) => {
    const statusInfo = statusMap[sp.subjectStatus || ''] || { cls: 'normal', label: '未知' }
    const chapters = sp.knowledgeMastery?.chapterSummaries ?? sp.knowledgeMastery?.chapters

    let mastery: number | null = null
    const chapterList: { name: string; mastery: number }[] = []

    if (chapters) {
      let total = 0
      let count = 0

      for (const [chKey, ch] of Object.entries(chapters)) {
        const chapter = ch as Record<string, unknown> & { chapterName?: string }
        const score = getChapterScore(chapter)
        total += score
        count += 1
        chapterList.push({ name: chapter.chapterName || chKey, mastery: Math.round(score) })
      }

      if (count > 0) {
        mastery = Math.round(total / count)
      }
    } else if (typeof sp.knowledgeMastery?.overallMasteryScore === 'number') {
      mastery = Math.round(sp.knowledgeMastery.overallMasteryScore)
    }

    const misconceptions: string[] = []
    if (sp.subjectMisconceptions?.patterns) {
      for (const p of Object.values(sp.subjectMisconceptions.patterns)) {
        if (p.status === 'ACTIVE' && p.title) {
          misconceptions.push(p.title)
        }
      }
    }

    const preferenceOverride = sp.learningPreferenceOverride?.preferredResourceTypes
      ?.map(type => resourceTypeLabels[type] || type)
      .join('、') || ''

    return {
      subjectId: sp.subjectId || key,
      subjectName: sp.subjectNameCache || sp.subjectId || key,
      statusClass: statusInfo.cls,
      statusLabel: statusInfo.label,
      mastery,
      color: spaceColors[idx % spaceColors.length],
      chapters: chapterList.slice(0, 4),
      misconceptions: misconceptions.slice(0, 3),
      preferenceOverride,
      confidence: sp.metadata?.confidence ?? null,
      completeness: sp.metadata?.completeness ?? null
    }
  })
}
