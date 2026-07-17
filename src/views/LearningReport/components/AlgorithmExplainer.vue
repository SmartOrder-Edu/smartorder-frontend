<template>
  <div class="algorithm-explainer" :class="{ expanded }">
    <button
      class="explainer-toggle"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <span class="explainer-icon" aria-hidden="true">
        <component :is="SparklesIconComp" :size="14" />
      </span>
      <span class="explainer-label">为什么这么判断？</span>
      <svg class="explainer-icon-svg" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M565.096296 289.185185s-0.948148 0 0 0c-110.933333-20.859259-208.592593 40.77037-237.985185 148.859259-14.222222 53.096296-24.651852 101.451852 44.562963 221.866667 14.222222 25.6 11.377778 70.162963 8.533333 95.762963-1.896296 14.222222 64.474074 36.02963 89.125926 42.666667l95.762963-509.155556z" fill="#FDB813"/>
        <path d="M732.918519 513.896296c11.377778-111.881481-56.888889-203.851852-166.874075-224.711111h-0.948148L469.333333 798.340741c25.6 2.844444 94.814815 6.637037 98.607408-7.585185 6.637037-25.6 20.859259-67.318519 42.666666-86.281482C719.644444 618.192593 727.22963 568.888889 732.918519 513.896296z" fill="#FD9B13"/>
        <path d="M467.437037 806.874074c-7.585185-0.948148-12.325926-7.585185-14.222222-14.222222l-38.874074-256c-0.948148-5.688889 0.948148-11.377778 4.74074-15.170371 3.792593-3.792593 9.481481-5.688889 15.170371-4.74074l167.822222 31.288889c5.688889 0.948148 10.42963 4.740741 12.325926 9.481481 1.896296 4.740741 1.896296 11.377778-0.948148 16.118519L486.4 798.340741c-3.792593 6.637037-11.377778 10.42963-18.962963 8.533333z m-14.222222-251.259259l27.496296 182.992592L572.681481 578.37037l-119.466666-22.755555z" fill="#F12A3F"/>
        <path d="M375.466667 709.214815l-25.6 137.481481c0 2.844444 1.896296 5.688889 7.585185 10.42963l65.422222 54.992593c5.688889 4.740741 15.17037 8.533333 23.703704 10.429629l36.029629-193.422222-107.14074-19.911111z" fill="#2D4375"/>
        <path d="M482.607407 729.125926l-36.029629 193.422222c9.481481 1.896296 18.014815 1.896296 25.6-0.948148l80.592592-27.496296c6.637037-1.896296 10.42963-4.740741 11.377778-6.637037L589.748148 749.037037l-107.140741-19.911111z" fill="#1E2D4F"/>
        <path d="M612.503704 217.125926c-3.792593 18.014815-20.859259 29.392593-38.874074 26.548148-18.014815-3.792593-30.340741-20.859259-26.548149-38.874074l18.962963-100.503704c3.792593-18.014815 20.859259-29.392593 38.874075-26.548148 18.014815 3.792593 30.340741 20.859259 26.548148 38.874074l-18.962963 100.503704z" fill="#FDB813"/>
        <path d="M382.103704 228.503704c10.42963 15.17037 6.637037 36.02963-8.533334 46.459259-15.17037 10.42963-36.02963 6.637037-46.459259-8.533333l-57.837037-84.385186c-10.42963-15.17037-6.637037-36.02963 8.533333-46.459259 15.17037-10.42963 36.02963-6.637037 46.45926 8.533334l57.837037 84.385185zM757.57037 298.666667c-15.17037 10.42963-18.962963 31.288889-8.533333 46.459259 10.42963 15.17037 31.288889 18.962963 46.459259 8.533333l84.385185-57.837037c15.17037-10.42963 18.962963-31.288889 8.533334-46.459259-10.42963-15.17037-31.288889-18.962963-46.459259-8.533333l-84.385186 57.837037z" fill="#FDB813"/>
        <path d="M252.207407 361.244444c18.014815 3.792593 30.340741 20.859259 26.548149 38.874075-3.792593 18.014815-20.859259 29.392593-38.874075 26.548148l-100.503703-18.962963c-18.014815-3.792593-30.340741-20.859259-26.548148-38.874074 3.792593-18.014815 20.859259-29.392593 38.874074-26.548149l100.503703 18.962963zM931.081481 488.296296c18.014815 3.792593 30.340741 20.859259 26.548149 38.874074-3.792593 18.014815-20.859259 29.392593-38.874074 26.548149l-100.503704-18.962963c-18.014815-3.792593-30.340741-20.859259-26.548148-38.874075 3.792593-18.014815 20.859259-29.392593 38.874074-26.548148l100.503703 18.962963z" fill="#FDB813"/>
        <path d="M593.540741 807.822222c1.896296-7.585185-3.792593-15.17037-11.377778-16.118518l-107.140741-19.911111-4.740741 27.496296 107.140741 19.911111c6.637037 0.948148 14.222222-3.792593 16.118519-11.377778z" fill="#CEEFF6"/>
        <path d="M366.933333 750.933333c-7.585185-1.896296-15.17037 3.792593-16.118518 11.377778-1.896296 7.585185 3.792593 15.17037 11.377778 16.118519l107.14074 19.911111 4.740741-27.496297-107.140741-19.911111zM356.503704 808.77037c-7.585185-1.896296-15.17037 3.792593-16.118519 11.377778-1.896296 7.585185 3.792593 15.17037 11.377778 16.118519l107.140741 19.911111 4.74074-27.496297-107.14074-19.911111z" fill="#FFFFFF"/>
        <path d="M570.785185 848.592593l-107.140741-19.911112-4.74074 27.496297 107.14074 19.911111c7.585185 1.896296 15.17037-3.792593 16.118519-11.377778 1.896296-7.585185-2.844444-15.17037-11.377778-16.118518z" fill="#CEEFF6"/>
      </svg>
    </button>

    <transition name="expand">
      <div v-if="expanded" class="explainer-content">
        <p v-if="hint" class="explainer-hint">{{ hint }}</p>
        <article v-for="item in evidence.items" :key="item.label" class="explainer-item">
          <span class="item-label">{{ item.label }}</span>
          <p class="item-value">{{ item.value }}</p>
        </article>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getIcon } from '@/assets/icons/create'
import type { EvidenceSection } from '@/types/learningReport'

defineProps<{
  evidence: EvidenceSection
  /** 一句话引导，如「掌握度评估基于以下信号」 */
  hint?: string
}>()

const expanded = ref(false)
const SparklesIconComp = getIcon('SparklesIcon')
</script>

<style scoped lang="scss">
.algorithm-explainer {
  margin-top: 1rem;
  border: 1px dashed var(--border-color-strong, #cbd5e1);
  border-radius: 12px;
  background: rgba(11, 183, 170, 0.03);
  overflow: hidden;
  transition: border-color 0.25s ease, background 0.25s ease;

  &.expanded {
    border-style: solid;
    border-color: var(--border-primary);
    background: rgba(11, 183, 170, 0.06);
  }
}

.explainer-toggle {
  width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  text-align: left;
  transition: color 0.2s ease;

  &:hover {
    color: var(--primary-deep);
  }
}

.explainer-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(11, 183, 170, 0.18), rgba(6, 182, 212, 0.1));
  color: var(--primary-color);
}

.explainer-label {
  flex: 1;
}

.explainer-icon-svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.explainer-content {
  padding: 0 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.explainer-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 0 0 0.2rem;
  line-height: 1.5;
}

.explainer-item {
  padding: 0.7rem 0.9rem;
  background: var(--panel-bg);
  border-radius: 8px;
  border: 1px solid var(--border-soft);

  .item-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--primary-deep);
    margin-bottom: 0.25rem;
    letter-spacing: 0.04em;
  }

  .item-value {
    font-size: 0.82rem;
    line-height: 1.55;
    color: var(--text-secondary);
    margin: 0;
  }
}

.expand-enter-active,
.expand-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
