<template>
  <el-drawer
    v-model="agentStore.tracePanelVisible"
    title="Agent 执行过程"
    direction="rtl"
    size="420px"
    :z-index="2000"
  >
    <div class="trace-container" v-if="timelineNodes.length > 0">
      <div class="timeline">
        <div
          v-for="node in timelineNodes"
          :key="node.seq"
          class="timeline-node"
          :class="'node-' + node.type"
        >
          <!-- 时间线圆点 -->
          <div class="timeline-dot" :class="nodeDotClass(node)"></div>

          <!-- 节点内容 -->
          <div class="timeline-content">
            <!-- 路由结果 -->
            <div v-if="node.type === 'route'" class="node-route">
              <div class="node-header">
                <el-icon><Guide /></el-icon>
                <span class="node-title">意图路由</span>
              </div>
              <div class="node-body">
                <span class="route-intent">{{ node.detail }}</span>
                <span class="route-mode" v-if="node.label">{{ node.label }}</span>
              </div>
            </div>

            <!-- 思考 -->
            <div v-else-if="node.type === 'think'" class="node-think">
              <div class="node-header">
                <el-icon><ChatDotRound /></el-icon>
                <span class="node-title">思考</span>
                <span class="node-duration" v-if="node.durationMs">{{ formatDuration(node.durationMs) }}</span>
              </div>
              <div class="node-body">
                <p class="think-text">{{ node.detail }}</p>
              </div>
            </div>

            <!-- 工具调用 -->
            <div v-else-if="node.type === 'tool'" class="node-tool">
              <div class="node-header">
                <el-icon :color="toolDotColor(node.status)"><Tools /></el-icon>
                <span class="node-title">{{ node.toolName }}</span>
                <el-tag :type="toolTagType(node.status)" size="small">
                  {{ toolStatusText(node.status) }}
                </el-tag>
                <span class="node-duration" v-if="node.durationMs">{{ formatDuration(node.durationMs) }}</span>
              </div>
              <div class="node-body" v-if="node.arguments || node.result">
                <el-collapse>
                  <el-collapse-item title="查看详情">
                    <div class="tool-detail" v-if="node.arguments">
                      <div class="detail-label">入参</div>
                      <pre>{{ formatJson(node.arguments) }}</pre>
                    </div>
                    <div class="tool-detail" v-if="node.result">
                      <div class="detail-label">结果</div>
                      <pre>{{ formatJson(node.result) }}</pre>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </div>

            <!-- 子 Agent -->
            <div v-else-if="node.type === 'sub_agent'" class="node-subagent">
              <div class="node-header">
                <el-icon :color="toolDotColor(node.status)"><Cpu /></el-icon>
                <span class="node-title">{{ node.agentName }}</span>
                <el-tag :type="toolTagType(node.status)" size="small">
                  {{ toolStatusText(node.status) }}
                </el-tag>
                <span class="node-duration" v-if="node.durationMs">{{ formatDuration(node.durationMs) }}</span>
              </div>
              <div class="node-body" v-if="node.summary">
                <p class="sub-summary">{{ node.summary }}</p>
              </div>
            </div>

            <!-- 阶段切换 -->
            <div v-else-if="node.type === 'phase'" class="node-phase">
              <div class="node-header">
                <el-icon><Flag /></el-icon>
                <span class="node-title">阶段切换</span>
              </div>
              <div class="node-body">
                <span>{{ node.detail }}</span>
              </div>
            </div>

            <!-- 错误 -->
            <div v-else-if="node.type === 'error'" class="node-error">
              <div class="node-header">
                <el-icon color="#f56c6c"><WarningFilled /></el-icon>
                <span class="node-title">错误</span>
              </div>
              <div class="node-body">
                <span class="error-text">{{ node.detail }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="trace-empty">
      <el-empty description="暂无追踪数据">
        <template #description>
          <p>该消息没有可用的执行追踪数据</p>
          <p class="trace-empty-hint">追踪数据在以下情况不可用：</p>
          <ul class="trace-empty-reasons">
            <li>消息来自历史记录加载（历史消息未保存追踪）</li>
            <li>Agent 尚未开始执行任务</li>
            <li>追踪数据已在新一轮对话中被清除</li>
          </ul>
        </template>
      </el-empty>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAgentStore, type AgentTraceEvent } from '@/stores/agent'

interface TimelineNode {
  type: 'route' | 'think' | 'tool' | 'sub_agent' | 'phase' | 'error'
  seq: number
  label?: string
  detail?: string
  status?: 'running' | 'completed' | 'failed'
  durationMs?: number
  toolName?: string
  arguments?: any
  result?: any
  agentName?: string
  summary?: string
}

const agentStore = useAgentStore()

const traceList = computed(() => {
  return agentStore.traceEvents.filter(
    (e) => e.traceId === agentStore.activeTraceId
  )
})

const timelineNodes = computed<TimelineNode[]>(() => {
  const events = traceList.value
  if (!events.length) return []

  const nodes: TimelineNode[] = []
  const pendingTools: Map<number, AgentTraceEvent> = new Map()
  const pendingSubAgents: Map<number, AgentTraceEvent> = new Map()
  let thinkText = ''
  let thinkSeq = 0
  let thinkTimestamp = 0
  let hasThink = false

  for (const e of events) {
    switch (e.eventType) {
      case 'agent.think.delta': {
        if (!hasThink) {
          thinkSeq = e.seq
          thinkTimestamp = e.timestamp
          hasThink = true
        }
        thinkText += e.payload?.text || ''
        break
      }

      case 'agent.route.completed': {
        nodes.push({
          type: 'route',
          seq: e.seq,
          detail: e.payload?.intentType ? `${e.payload.intentType} · ${e.payload.complexity || '未知'}复杂度` : '',
          label: e.payload?.runMode || '',
        })
        break
      }

      case 'agent.tool.started': {
        pendingTools.set(e.seq, e)
        break
      }

      case 'agent.tool.completed':
      case 'agent.tool.failed': {
        // 找到对应的 started 事件
        const toolName = e.payload?.toolName
        let startedEntry: [number, AgentTraceEvent] | undefined
        for (const [key, val] of pendingTools) {
          if (val.payload?.toolName === toolName && val.payload?.status !== 'completed') {
            startedEntry = [key, val]
            break
          }
        }

        const status = e.eventType === 'agent.tool.completed' ? 'completed' : 'failed'
        nodes.push({
          type: 'tool',
          seq: startedEntry ? startedEntry[1].seq : e.seq,
          toolName: toolName || '未知工具',
          status,
          durationMs: e.payload?.durationMs,
          arguments: startedEntry ? startedEntry[1].payload?.arguments : undefined,
          result: e.payload?.result,
        })

        if (startedEntry) {
          pendingTools.delete(startedEntry[0])
        }
        break
      }

      case 'agent.sub_agent.started': {
        pendingSubAgents.set(e.seq, e)
        break
      }

      case 'agent.sub_agent.completed':
      case 'agent.sub_agent.failed': {
        const agentName = e.payload?.agentName
        let startedEntry: [number, AgentTraceEvent] | undefined
        for (const [key, val] of pendingSubAgents) {
          if (val.payload?.agentName === agentName) {
            startedEntry = [key, val]
            break
          }
        }

        const status = e.eventType === 'agent.sub_agent.completed' ? 'completed' : 'failed'
        nodes.push({
          type: 'sub_agent',
          seq: startedEntry ? startedEntry[1].seq : e.seq,
          agentName: agentName || '未知 Agent',
          status,
          durationMs: e.payload?.durationMs,
          summary: e.payload?.summary,
        })

        if (startedEntry) {
          pendingSubAgents.delete(startedEntry[0])
        }
        break
      }

      case 'agent.phase.change': {
        nodes.push({
          type: 'phase',
          seq: e.seq,
          detail: e.payload?.message || '',
        })
        break
      }

      case 'agent.error': {
        nodes.push({
          type: 'error',
          seq: e.seq,
          detail: e.payload?.message || '未知错误',
        })
        break
      }
    }
  }

  // 如果有思考文本，插入到合适的位置（route 之后，第一个 tool 之前）
  if (hasThink && thinkText.trim()) {
    const thinkNode: TimelineNode = {
      type: 'think',
      seq: thinkSeq,
      detail: thinkText,
      durationMs: undefined, // 无法从事件中精确计算
    }
    // 插入到 route 之后
    const routeIdx = nodes.findIndex(n => n.type === 'route')
    if (routeIdx >= 0) {
      nodes.splice(routeIdx + 1, 0, thinkNode)
    } else {
      nodes.unshift(thinkNode)
    }
  }

  // 处理剩余的 started 事件（未收到 completed/failed）
  for (const [, val] of pendingTools) {
    nodes.push({
      type: 'tool',
      seq: val.seq,
      toolName: val.payload?.toolName || '未知工具',
      status: 'running',
      arguments: val.payload?.arguments,
    })
  }
  for (const [, val] of pendingSubAgents) {
    nodes.push({
      type: 'sub_agent',
      seq: val.seq,
      agentName: val.payload?.agentName || '未知 Agent',
      status: 'running',
    })
  }

  nodes.sort((a, b) => a.seq - b.seq)
  return nodes
})

function nodeDotClass(node: TimelineNode): string {
  if (node.type === 'error' || node.status === 'failed') return 'dot-error'
  if (node.status === 'completed') return 'dot-success'
  if (node.status === 'running') return 'dot-running'
  if (node.type === 'phase') return 'dot-phase'
  if (node.type === 'route') return 'dot-route'
  if (node.type === 'think') return 'dot-think'
  return ''
}

function toolDotColor(status?: string): string {
  if (status === 'failed') return '#f56c6c'
  if (status === 'completed') return '#67c23a'
  return '#409eff'
}

function toolTagType(status?: string): 'success' | 'danger' | 'warning' | 'info' | '' {
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'danger'
  return 'info'
}

function toolStatusText(status?: string): string {
  if (status === 'running') return '执行中'
  if (status === 'completed') return '完成'
  if (status === 'failed') return '失败'
  return ''
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m${Math.round((ms % 60000) / 1000)}s`
}

function formatJson(obj: any): string {
  try {
    return typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}
</script>

<style scoped>
.trace-container {
  padding: 0 4px;
}

/* 时间线 */
.timeline {
  position: relative;
  padding-left: 24px;
}

/* 时间线竖线 */
.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 4px;
  bottom: 4px;
  width: 2px;
  background: #e4e7ed;
  border-radius: 1px;
}

.timeline-node {
  position: relative;
  margin-bottom: 12px;
}

.timeline-node:last-child {
  margin-bottom: 0;
}

/* 时间线圆点 */
.timeline-dot {
  position: absolute;
  left: -17px;
  top: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #c0c4cc;
  border: 2px solid white;
  z-index: 1;
  box-shadow: 0 0 0 2px #c0c4cc;
}

.timeline-dot.dot-route { background: #8b5cf6; box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2); }
.timeline-dot.dot-think { background: #909399; box-shadow: 0 0 0 2px rgba(144, 147, 153, 0.2); }
.timeline-dot.dot-success { background: #67c23a; box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2); }
.timeline-dot.dot-running { background: #409eff; box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2); }
.timeline-dot.dot-error { background: #f56c6c; box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2); }
.timeline-dot.dot-phase { background: #e6a23c; box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.2); }

/* 节点内容卡片 */
.timeline-content {
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
}

/* 节点头部 */
.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-title {
  font-weight: 600;
  flex: 1;
}

.node-duration {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

/* 节点主体 */
.node-body {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* 路由 */
.node-route .route-intent {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.node-route .route-mode {
  display: inline-block;
  margin-left: 8px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  padding: 0 6px;
  border-radius: 3px;
  font-size: 11px;
}

/* 思考 */
.node-think .think-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
}

/* 工具 */
.tool-detail {
  margin-top: 8px;
}

.tool-detail .detail-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.tool-detail pre {
  font-size: 12px;
  background: var(--el-fill-color);
  padding: 8px;
  border-radius: 4px;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 子 Agent */
.node-subagent .sub-summary {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 错误 */
.node-error .error-text {
  color: #f56c6c;
  font-size: 12px;
}

/* 空状态 */
.trace-empty {
  padding-top: 40px;
}
.trace-empty-hint {
  margin-top: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}
.trace-empty-reasons {
  margin-top: 8px;
  padding-left: 20px;
  text-align: left;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.8;
}
</style>
