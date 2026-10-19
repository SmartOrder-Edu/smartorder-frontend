<template>
  <section class="learning-contribution">
    <div class="calendar-head">
      <div>
        <h4>学习活跃度</h4>
        <p>{{ rangeLabel }} · {{ activeDayCount }} 天有记录 · 共 {{ totalMinutes }} 分钟</p>
      </div>
      <div class="calendar-summary">
        <span>连续 {{ currentStreak }} 天</span>
        <span>完成 {{ totalCompletedTasks }}/{{ totalPlannedTasks }} 任务</span>
      </div>
    </div>

    <div class="calendar-body">
      <div class="weekday-labels">
        <span v-for="label in weekdayLabels" :key="label">{{ label }}</span>
      </div>
      <div class="calendar-grid" :style="{ '--week-count': weekColumns.length }">
        <div v-for="(week, weekIndex) in weekColumns" :key="weekIndex" class="calendar-week">
          <div
            v-for="day in week"
            :key="day.key"
            class="calendar-day"
            :class="[`level-${day.level}`, { outside: day.outsideRange }]"
            :title="day.tooltip"
            :aria-label="day.tooltip"
          >
            <span class="sr-only">{{ day.tooltip }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="calendar-foot">
      <span>{{ bestDayLabel }}</span>
      <div class="legend" aria-label="学习活跃度图例">
        <span>少</span>
        <i v-for="level in [0, 1, 2, 3, 4]" :key="level" :class="`level-${level}`"></i>
        <span>多</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LearningRecordVO } from '@/types/learningSpace'

const props = defineProps<{
  records: LearningRecordVO[]
}>()

interface CalendarDay {
  key: string
  date: Date
  minutes: number
  completed: number
  planned: number
  focusLevel: number
  level: number
  outsideRange: boolean
  tooltip: string
}

const weekdayLabels = ['一', '三', '五']

const sortedRecords = computed(() =>
  [...props.records].sort((a, b) => a.recordDate.localeCompare(b.recordDate))
)

const recordByDate = computed(() => {
  const map = new Map<string, LearningRecordVO>()
  for (const record of sortedRecords.value) {
    const existing = map.get(record.recordDate)
    if (!existing) {
      map.set(record.recordDate, { ...record })
      continue
    }
    map.set(record.recordDate, {
      ...existing,
      studyDurationMinutes: existing.studyDurationMinutes + record.studyDurationMinutes,
      tasksCompleted: existing.tasksCompleted + record.tasksCompleted,
      tasksPlanned: existing.tasksPlanned + record.tasksPlanned,
      focusLevel: Math.max(existing.focusLevel || 0, record.focusLevel || 0),
    })
  }
  return map
})

const today = computed(() => startOfDay(new Date()))

const startDate = computed(() => {
  const firstRecord = sortedRecords.value[0]?.recordDate
  if (!firstRecord) return addDays(today.value, -6)
  return parseDate(firstRecord)
})

const endDate = computed(() => {
  const lastRecord = sortedRecords.value[sortedRecords.value.length - 1]?.recordDate
  const latest = lastRecord ? parseDate(lastRecord) : today.value
  return latest > today.value ? latest : today.value
})

const gridStart = computed(() => startOfWeek(startDate.value))
const gridEnd = computed(() => endOfWeek(endDate.value))

const calendarDays = computed<CalendarDay[]>(() => {
  const days: CalendarDay[] = []
  const cursor = new Date(gridStart.value)
  while (cursor <= gridEnd.value) {
    const key = formatDateKey(cursor)
    const record = recordByDate.value.get(key)
    const minutes = record?.studyDurationMinutes || 0
    const completed = record?.tasksCompleted || 0
    const planned = record?.tasksPlanned || 0
    const focusLevel = record?.focusLevel || 0
    const outsideRange = cursor < startDate.value || cursor > endDate.value
    days.push({
      key,
      date: new Date(cursor),
      minutes,
      completed,
      planned,
      focusLevel,
      level: outsideRange ? 0 : activityLevel(minutes),
      outsideRange,
      tooltip: buildTooltip(key, minutes, completed, planned, focusLevel, outsideRange),
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
})

const weekColumns = computed(() => {
  const weeks: CalendarDay[][] = []
  for (let index = 0; index < calendarDays.value.length; index += 7) {
    weeks.push(calendarDays.value.slice(index, index + 7))
  }
  return weeks
})

const totalMinutes = computed(() =>
  sortedRecords.value.reduce((sum, record) => sum + Number(record.studyDurationMinutes || 0), 0)
)

const totalCompletedTasks = computed(() =>
  sortedRecords.value.reduce((sum, record) => sum + Number(record.tasksCompleted || 0), 0)
)

const totalPlannedTasks = computed(() =>
  sortedRecords.value.reduce((sum, record) => sum + Number(record.tasksPlanned || 0), 0)
)

const activeDayCount = computed(() =>
  Array.from(recordByDate.value.values()).filter(record => Number(record.studyDurationMinutes || 0) > 0).length
)

const currentStreak = computed(() => {
  let streak = 0
  const cursor = new Date(endDate.value)
  while (cursor >= startDate.value) {
    const record = recordByDate.value.get(formatDateKey(cursor))
    if (!record || Number(record.studyDurationMinutes || 0) <= 0) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
})

const rangeLabel = computed(() => {
  if (!sortedRecords.value.length) return '近 7 天'
  return `${formatMonthDay(startDate.value)} - ${formatMonthDay(endDate.value)}`
})

const bestDayLabel = computed(() => {
  const best = sortedRecords.value.reduce<LearningRecordVO | null>((candidate, record) => {
    if (!candidate) return record
    return record.studyDurationMinutes > candidate.studyDurationMinutes ? record : candidate
  }, null)
  if (!best || best.studyDurationMinutes <= 0) return '暂无学习活跃记录'
  return `最高活跃：${formatMonthDay(parseDate(best.recordDate))} · ${best.studyDurationMinutes} 分钟`
})

function activityLevel(minutes: number) {
  if (minutes <= 0) return 0
  if (minutes < 20) return 1
  if (minutes < 45) return 2
  if (minutes < 90) return 3
  return 4
}

function buildTooltip(
  dateKey: string,
  minutes: number,
  completed: number,
  planned: number,
  focusLevel: number,
  outsideRange: boolean
) {
  if (outsideRange) return `${dateKey} 不在当前数据范围内`
  if (minutes <= 0) return `${dateKey} 暂无学习记录`
  const focus = focusLevel > 0 ? `，专注 ${focusLevel}/5` : ''
  return `${dateKey} 学习 ${minutes} 分钟，完成 ${completed}/${planned} 任务${focus}`
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function startOfWeek(date: Date) {
  const result = startOfDay(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  return result
}

function endOfWeek(date: Date) {
  const result = startOfWeek(date)
  result.setDate(result.getDate() + 6)
  return result
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
</script>

<style scoped>
.learning-contribution {
  padding: 18px;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff, #f8fafc);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
}

.calendar-head,
.calendar-foot {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.calendar-head h4 {
  margin: 0;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.35;
}

.calendar-head p,
.calendar-foot {
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 600;
}

.calendar-head p {
  margin: 4px 0 0;
}

.calendar-summary {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.calendar-summary span {
  display: inline-flex;
  min-height: 26px;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #ecfdfb;
  color: #0a9e94;
  font-size: 0.72rem;
  font-weight: 800;
}

.calendar-body {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 8px;
  margin-top: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.weekday-labels {
  display: grid;
  grid-template-rows: repeat(7, 14px);
  gap: 4px;
  padding-top: 0;
  color: #94a3b8;
  font-size: 0.66rem;
  font-weight: 700;
}

.weekday-labels span {
  grid-row: span 2;
  align-self: center;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(var(--week-count), 14px);
  gap: 4px;
  min-width: max-content;
}

.calendar-week {
  display: grid;
  grid-template-rows: repeat(7, 14px);
  gap: 4px;
}

.calendar-day,
.legend i {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.calendar-day {
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.calendar-day:not(.outside):hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.12);
}

.outside {
  opacity: 0.35;
}

.level-0 {
  background: #e2e8f0;
}

.level-1 {
  background: #b9f3de;
}

.level-2 {
  background: #62d69e;
}

.level-3 {
  background: #18a96b;
}

.level-4 {
  background: #087443;
}

.calendar-foot {
  align-items: center;
  margin-top: 12px;
}

.legend {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #94a3b8;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 768px) {
  .calendar-head,
  .calendar-foot {
    flex-direction: column;
    align-items: flex-start;
  }

  .calendar-summary {
    justify-content: flex-start;
  }
}
</style>
