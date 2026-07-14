<template>
  <div class="learning-space-cards">
    <template v-for="(card, index) in cards" :key="cardKey(card, index)">
      <LearningSpaceDashboardCard
        v-if="card.cardType === 'learning_space_dashboard'"
        :result="card"
      />
      <LearningSpaceListCard
        v-else
        :result="card"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import LearningSpaceDashboardCard from './LearningSpaceDashboardCard.vue'
import LearningSpaceListCard from './LearningSpaceListCard.vue'
import type { LearningSpaceCardPayload } from '@/composables/useAgentChat'

defineProps<{
  cards: LearningSpaceCardPayload[]
}>()

function cardKey(card: LearningSpaceCardPayload, index: number): string {
  const spaceId = card.dashboard?.space?.id || card.space?.id
  return `${card.cardType}-${spaceId || index}`
}
</script>

<style scoped>
.learning-space-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(100%, 720px);
  margin-top: 12px;
}
</style>
