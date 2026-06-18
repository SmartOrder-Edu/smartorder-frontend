<template>
  <div class="lottie-icon" :class="{ active: isActive }">
    <lottie-player
      ref="lottiePlayer"
      :src="animationData"
      :autoplay="false"
      :loop="false"
      :style="lottieStyle"
      @click="handleClick"
    />
    <div v-if="isActive" class="icon-glow"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { LottiePlayer } from '@lottiefiles/lottie-player'

const props = defineProps<{
  type: string
  isActive?: boolean
}>()

const lottiePlayer = ref()

// Lottie动画数据
const animations: Record<string, any> = {
  dashboard: {
    v: '5.7.4',
    fr: 24,
    ip: 0,
    op: 72,
    w: 100,
    h: 100,
    nm: 'Dashboard',
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Shape Layer 1',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [50, 50] },
          s: { a: 0, k: [100, 100] },
          sk: { a: 0, k: 0 }
        },
        ao: 0,
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                d: 1,
                ty: 'el',
                l: 2,
                rd: 15,
                nm: 'Ellipse 1',
                mn: 'ADBE Vector Shape - Ellipse'
              },
              {
                ty: 'fl',
                c: { a: 0, k: [0.55, 0.65, 0.96, 1] },
                o: { a: 0, k: 100 },
                r: 1,
                bm: 0,
                nm: 'Fill 1'
              }
            ],
            nm: 'Ellipse 1',
            np: 3
          }
        ],
        ip: 0,
        op: 72,
        st: 0,
        bm: 0
      },
      {
        ddd: 0,
        ind: 2,
        ty: 4,
        nm: 'Shape Layer 2',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [30, 30] },
          s: { a: 0, k: [100, 100] },
          sk: { a: 0, k: 0 }
        },
        ao: 0,
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                d: 1,
                ty: 'el',
                l: 2,
                rd: 10,
                nm: 'Ellipse 2',
                mn: 'ADBE Vector Shape - Ellipse'
              },
              {
                ty: 'fl',
                c: { a: 0, k: [0.93, 0.73, 0.98, 1] },
                o: { a: 0, k: 100 },
                r: 1,
                bm: 0,
                nm: 'Fill 1'
              }
            ],
            nm: 'Ellipse 2',
            np: 3
          }
        ],
        ip: 0,
        op: 72,
        st: 0,
        bm: 0
      },
      {
        ddd: 0,
        ind: 3,
        ty: 4,
        nm: 'Shape Layer 3',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [70, 30] },
          s: { a: 0, k: [100, 100] },
          sk: { a: 0, k: 0 }
        },
        ao: 0,
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                d: 1,
                ty: 'el',
                l: 2,
                rd: 10,
                nm: 'Ellipse 3',
                mn: 'ADBE Vector Shape - Ellipse'
              },
              {
                ty: 'fl',
                c: { a: 0, k: [0.02, 0.73, 0.87, 1] },
                o: { a: 0, k: 100 },
                r: 1,
                bm: 0,
                nm: 'Fill 1'
              }
            ],
            nm: 'Ellipse 3',
            np: 3
          }
        ],
        ip: 0,
        op: 72,
        st: 0,
        bm: 0
      },
      {
        ddd: 0,
        ind: 4,
        ty: 4,
        nm: 'Shape Layer 4',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [30, 70] },
          s: { a: 0, k: [100, 100] },
          sk: { a: 0, k: 0 }
        },
        ao: 0,
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                d: 1,
                ty: 'el',
                l: 2,
                rd: 10,
                nm: 'Ellipse 4',
                mn: 'ADBE Vector Shape - Ellipse'
              },
              {
                ty: 'fl',
                c: { a: 0, k: [0.93, 0.29, 0.6, 1] },
                o: { a: 0, k: 100 },
                r: 1,
                bm: 0,
                nm: 'Fill 1'
              }
            ],
            nm: 'Ellipse 4',
            np: 3
          }
        ],
        ip: 0,
        op: 72,
        st: 0,
        bm: 0
      }
    ],
    ip: 0,
    op: 72,
    fr: 24,
    v: '5.7.4'
  },
  'ai-tutor': {
    v: '5.7.4',
    fr: 24,
    ip: 0,
    op: 72,
    w: 100,
    h: 100,
    nm: 'AI Tutor',
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Face',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [50, 50] },
          s: { a: 1, k: [
            { i: [0, 0, 0, 100], o: [0, 0, 0, 100], t: 0, s: [100, 100] },
            { i: [0, 0, 0, 100], o: [0, 0, 0, 100], t: 12, s: [105, 105] },
            { i: [0, 0, 0, 100], o: [0, 0, 0, 100], t: 24, s: [100, 100] }
          ] },
          sk: { a: 0, k: 0 }
        },
        ao: 0,
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                ty: 'rc',
                d: 1,
                s: { a: 0, k: [30, 30] },
                p: { a: 0, k: [50, 50] },
                r: { a: 0, k: 15 },
                nm: 'Rectangle 1'
              },
              {
                ty: 'fl',
                c: { a: 0, k: [0.55, 0.65, 0.96, 1] },
                o: { a: 0, k: 100 },
                r: 1,
                bm: 0,
                nm: 'Fill 1'
              }
            ],
            nm: 'Face',
            np: 2
          }
        ],
        ip: 0,
        op: 72,
        st: 0,
        bm: 0
      }
    ],
    ip: 0,
    op: 72,
    fr: 24,
    v: '5.7.4'
  }
}

const animationData = computed(() => {
  // 返回简化版动画数据
  const baseAnim = {
    v: '5.7.4',
    fr: 30,
    ip: 0,
    op: 60,
    w: 100,
    h: 100,
    nm: 'Icon',
    ddd: 0,
    assets: [],
    layers: []
  }

  // 根据type返回不同的动画
  switch (props.type) {
    case 'dashboard':
      return {
        ...baseAnim,
        layers: [
          {
            ddd: 0,
            ind: 1,
            ty: 4,
            nm: 'Grid',
            sr: 1,
            ks: { o: { a: 0, k: 100 }, r: { a: 1, k: [{ i: [0, 0, 0, 100], o: [0, 0, 0, 100], t: 0, s: [0] }, { i: [0, 0, 0, 100], o: [0, 0, 0, 100], t: 30, s: [90] }] }, p: { a: 0, k: [50, 50] }, s: { a: 0, k: [100, 100] } },
            shapes: [{
              ty: 'gr',
              it: [
                { d: 1, ty: 'rc', d: [{ a: 0, k: [3, 3, 20, 20] }], nm: 'rect' },
                { ty: 'fl', c: { a: 0, k: [0.55, 0.65, 0.96, 1] }, o: { a: 0, k: 100 }, r: 1 }
              ],
              nm: 'Rect 1'
            }],
            ip: 0,
            op: 60
          },
          {
            ddd: 0,
            ind: 2,
            ty: 4,
            nm: 'Dot 1',
            sr: 1,
            ks: { o: { a: 1, k: [{ i: [0, 0, 0, 100], o: [0, 0, 0, 100], t: 0, s: [30] }, { i: [0, 0, 0, 100], o: [0, 0, 0, 100], t: 15, s: [100] }, { i: [0, 0, 0, 100], o: [0, 0, 0, 100], t: 30, s: [30] }] }, p: { a: 0, k: [35, 35] }, s: { a: 0, k: [100, 100] } },
            shapes: [{
              ty: 'gr',
              it: [
                { d: 1, ty: 'el', l: 2, rd: 4 },
                { ty: 'fl', c: { a: 0, k: [1, 1, 1, 1] }, o: { a: 0, k: 100 }, r: 1 }
              ],
              nm: 'Dot'
            }],
            ip: 0,
            op: 60
          }
        ]
      }
    case 'ai-tutor':
      return {
        ...baseAnim,
        layers: [
          {
            ddd: 0,
            ind: 1,
            ty: 4,
            nm: 'Bot',
            sr: 1,
            ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [50, 50] }, s: { a: 1, k: [{ i: [0, 0, 0, 100], o: [0, 0, 0, 100], t: 0, s: [100, 100] }, { i: [0, 0, 0, 100], o: [0, 0, 0, 100], t: 30, s: [110, 110] }, { i: [0, 0, 0, 100], o: [0, 0, 0, 100], t: 60, s: [100, 100] }] } },
            shapes: [{
              ty: 'gr',
              it: [
                { d: 1, ty: 'el', l: 2, rd: 20 },
                { ty: 'fl', c: { a: 0, k: [0.55, 0.65, 0.96, 1] }, o: { a: 0, k: 100 }, r: 1 }
              ],
              nm: 'Face'
            }],
            ip: 0,
            op: 60
          },
          {
            ddd: 0,
            ind: 2,
            ty: 4,
            nm: 'Eyes',
            sr: 1,
            ks: { o: { a: 1, k: [{ i: [0, 0, 0, 100], o: [0, 0, 0, 100], t: 0, s: [100] }, { i: [0, 0, 0, 100], o: [0, 0, 0, 100], t: 25, s: [0] }, { i: [0, 0, 0, 100], o: [0, 0, 0, 100], t: 35, s: [100] }, { i: [0, 0, 0, 100], o: [0, 0, 0, 100], t: 60, s: [100] }] }, p: { a: 0, k: [50, 50] }, s: { a: 0, k: [100, 100] } },
            shapes: [{
              ty: 'gr',
              it: [
                { d: 1, ty: 'el', l: 2, rd: 3 },
                { d: 1, ty: 'el', l: 2, rd: 3 },
                { ty: 'fl', c: { a: 0, k: [1, 1, 1, 1] }, o: { a: 0, k: 100 }, r: 1 }
              ],
              nm: 'Eyes'
            }],
            ip: 0,
            op: 60
          }
        ]
      }
    default:
      return baseAnim
  }
})

const lottieStyle = computed(() => ({
  width: '32px',
  height: '32px'
}))

const handleClick = () => {
  if (lottiePlayer.value) {
    lottiePlayer.value.seek(0)
    lottiePlayer.value.play()
  }
}

// 监听激活状态变化
watch(() => props.isActive, (newVal) => {
  if (newVal && lottiePlayer.value) {
    nextTick(() => {
      lottiePlayer.value.seek(0)
      lottiePlayer.value.play()
    })
  }
})

onMounted(() => {
  // 如果是激活状态，播放动画
  if (props.isActive && lottiePlayer.value) {
    nextTick(() => {
      lottiePlayer.value.play()
    })
  }
})
</script>

<style scoped>
.lottie-icon {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lottie-icon lottie-player {
  width: 32px;
  height: 32px;
}

.icon-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: glow-pulse 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}
</style>
