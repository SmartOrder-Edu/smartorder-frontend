<template>
  <nav v-if="headings.length >= 3" class="resource-toc" :class="{ collapsed }">
    <button class="toc-toggle" type="button" @click="collapsed = !collapsed">
      <svg class="toc-icon" viewBox="0 0 1024 1024" width="14" height="14">
        <path d="M857.6 25.6a76.8 76.8 0 0 1 76.8 76.8v819.2a76.8 76.8 0 0 1-76.8 76.8H166.4a76.8 76.8 0 0 1-76.8-76.8V102.4a76.8 76.8 0 0 1 76.8-76.8h691.2z m-102.4 678.4H473.6l-2.2528 0.064a38.4 38.4 0 0 0 0 76.672L473.6 780.8h281.6l2.2528-0.064a38.4 38.4 0 0 0 0-76.672L755.2 704z m0-230.4H473.6l-2.2528 0.064a38.4 38.4 0 0 0 0 76.672L473.6 550.4h281.6l2.2528-0.064a38.4 38.4 0 0 0 0-76.672L755.2 473.6z m0-230.4H473.6l-2.2528 0.064a38.4 38.4 0 0 0 0 76.672L473.6 320h281.6l2.2528-0.064a38.4 38.4 0 0 0 0-76.672L755.2 243.2z" fill="#6B57FE"/>
        <path d="M281.6 691.2a51.2 51.2 0 1 1 0 102.4 51.2 51.2 0 0 1 0-102.4z m0-230.4a51.2 51.2 0 1 1 0 102.4 51.2 51.2 0 0 1 0-102.4z m0-230.4a51.2 51.2 0 1 1 0 102.4 51.2 51.2 0 0 1 0-102.4z" fill="#FFBA00"/>
      </svg>
      <span>目录</span>
      <span class="toggle-arrow" :class="{ open: !collapsed }">‹</span>
    </button>
    <ul v-show="!collapsed" class="toc-list">
      <li
        v-for="(h, index) in headings"
        :key="index"
        class="toc-item"
        :class="{ active: activeIndex === index }"
        :style="{ paddingLeft: (h.level - 1) * 12 + 'px' }"
      >
        <a :href="`#${h.id}`" @click.prevent="scrollToHeading(h.id, index)">
          {{ h.text }}
        </a>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps<{
  markdown: string
  contentSelector?: string
}>()

interface Heading {
  id: string
  text: string
  level: number
}

const collapsed = ref(false)
const activeIndex = ref(0)

const headings = computed<Heading[]>(() => {
  if (!props.markdown) return []
  const result: Heading[] = []
  const lines = props.markdown.split('\n')
  for (const line of lines) {
    const match = line.match(/^(#{1,4})\s+(.+)$/)
    if (!match) continue
    const level = match[1].length
    const text = match[2].trim()
    // 去掉 markdown 链接语法，保留纯文本
    const clean = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    const id = `heading-${result.length}`
    result.push({ id, text: clean, level })
  }
  return result
})

let observer: IntersectionObserver | null = null

function assignHeadingIds(): boolean {
  const selector = props.contentSelector || '.content-panel'
  const container = document.querySelector(selector)
  if (!container) return false
  const headingEls = container.querySelectorAll('h1, h2, h3, h4')
  if (headingEls.length === 0) return false
  const headingList = headings.value
  const len = Math.min(headingEls.length, headingList.length)
  for (let i = 0; i < len; i++) {
    headingEls[i].id = headingList[i].id
  }
  return true
}

function setupObserver() {
  if (observer) observer.disconnect()
  if (!assignHeadingIds()) {
    // MarkdownRenderer hasn't rendered yet — retry after a tick
    setTimeout(setupObserver, 100)
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible.length > 0) {
        const id = visible[0].target.id
        const idx = headings.value.findIndex((h) => h.id === id)
        if (idx >= 0) activeIndex.value = idx
      }
    },
    { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
  )

  for (const h of headings.value) {
    const el = document.getElementById(h.id)
    if (el) observer.observe(el)
  }
}

function scrollToHeading(id: string, index: number) {
  activeIndex.value = index
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

watch(
  () => headings.value.length,
  () => nextTick(setupObserver),
)

onMounted(() => {
  nextTick(setupObserver)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped lang="scss">
.resource-toc {
  position: sticky;
  top: 24px;
  width: 200px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
  font-size: 0.8125rem;
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
}

.toc-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 14px;
  border: 0;
  background: transparent;
  color: #334155;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: rgba(148, 163, 184, 0.06);
  }
}

.toc-icon {
  flex-shrink: 0;
  margin-right: 6px;
}

.toggle-arrow {
  display: inline-block;
  font-size: 1rem;
  transition: transform 0.2s;
  transform: rotate(-90deg);

  &.open {
    transform: rotate(90deg);
  }
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0 14px 10px;
  overflow-y: auto;
}

.toc-item {
  a {
    display: block;
    padding: 5px 8px;
    border-radius: 6px;
    color: #64748b;
    text-decoration: none;
    line-height: 1.4;
    transition: all 0.15s;
    font-size: 0.8rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      background: rgba(10, 158, 148, 0.06);
      color: #0f172a;
    }
  }

  &.active a {
    background: rgba(10, 158, 148, 0.1);
    color: #0a9e94;
    font-weight: 600;
  }
}
</style>
