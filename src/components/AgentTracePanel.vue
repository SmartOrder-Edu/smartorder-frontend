<template>
  <el-drawer
    v-model="agentStore.tracePanelVisible"
    title="Agent 执行过程"
    direction="rtl"
    size="420px"
    :z-index="2000"
  >
    <div class="trace-container" v-if="traceList.length > 0">
      <div
        v-for="item in traceList"
        :key="item.seq"
        class="trace-item"
        :class="'trace-' + item.eventType.replace(/\./g, '-')"
      >
        <!-- 思考片段 -->
        <div v-if="item.eventType === 'agent.think.delta'" class="trace-think">
          <el-icon><ChatDotRound /></el-icon>
          <span>{{ item.payload?.text }}</span>
        </div>

        <!-- 工具调用 -->
        <div v-else-if="isToolEvent(item.eventType)" class="trace-tool">
          <div class="tool-header">
            <el-icon :color="toolIconColor(item.eventType)">
              <Tools />
            </el-icon>
            <span class="tool-name">{{ item.payload?.toolName }}</span>
            <el-tag
              :type="toolTagType(item.eventType)"
              size="small"
            >
              {{ toolStatusText(item.eventType) }}
            </el-tag>
          </div>
          <el-collapse v-if="item.eventType === 'agent.tool.completed'">
            <el-collapse-item title="查看详情">
              <div class="tool-detail" v-if="item.payload?.arguments">
                <div class="detail-label">入参</div>
                <pre>{{ formatJson(item.payload?.arguments) }}</pre>
              </div>
              <div class="tool-detail" v-if="item.payload?.result">
                <div class="detail-label">结果</div>
                <pre>{{ formatJson(item.payload?.result) }}</pre>
              </div>
              <div class="tool-detail" v-if="item.payload?.durationMs">
                <div class="detail-label">耗时</div>
                <span>{{ item.payload?.durationMs }}ms</span>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>

        <!-- 子智能体 -->
        <div v-else-if="isSubAgentEvent(item.eventType)" class="trace-subagent">
          <el-icon :color="subAgentIconColor(item.eventType)">
            <Cpu />
          </el-icon>
          <span>{{ item.payload?.agentName }}</span>
          <el-tag :type="subAgentTagType(item.eventType)" size="small">
            {{ subAgentStatusText(item.eventType) }}
          </el-tag>
          <span v-if="item.payload?.summary" class="sub-summary">
            &mdash; {{ item.payload?.summary }}
          </span>
        </div>

        <!-- 阶段变化 -->
        <div v-else-if="item.eventType === 'agent.phase.change'" class="trace-phase">
          <el-icon><Flag /></el-icon>
          <span>{{ item.payload?.message }}</span>
        </div>

        <!-- 路由完成 -->
        <div v-else-if="item.eventType === 'agent.route.completed'" class="trace-route">
          <el-icon><Guide /></el-icon>
          <span>意图: {{ item.payload?.intentType }} ({{ item.payload?.complexity }})</span>
          <span class="route-mode">{{ item.payload?.runMode }}</span>
        </div>

        <!-- 错误 -->
        <div v-else-if="item.eventType === 'agent.error'" class="trace-error">
          <el-icon color="#f56c6c"><WarningFilled /></el-icon>
          <span>{{ item.payload?.message }}</span>
        </div>

        <!-- 其他事件 -->
        <div v-else class="trace-other">
          <span class="event-type">{{ item.eventType }}</span>
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
import { useAgentStore } from '@/stores/agent'

const agentStore = useAgentStore()

const traceList = computed(() => {
  return agentStore.traceEvents.filter(
    (e) => e.traceId === agentStore.activeTraceId
  )
})

// === 工具事件 ===
function isToolEvent(type: string) {
  return type === 'agent.tool.started' || type === 'agent.tool.completed' || type === 'agent.tool.failed'
}
function toolIconColor(type: string) {
  return type === 'agent.tool.failed' ? '#f56c6c' : type === 'agent.tool.completed' ? '#67c23a' : '#409eff'
}
function toolTagType(type: string): 'success' | 'danger' | 'warning' | 'info' | '' {
  if (type === 'agent.tool.completed') return 'success'
  if (type === 'agent.tool.failed') return 'danger'
  return 'info'
}
function toolStatusText(type: string) {
  if (type === 'agent.tool.started') return '执行中'
  if (type === 'agent.tool.completed') return '完成'
  return '失败'
}

// === 子智能体事件 ===
function isSubAgentEvent(type: string) {
  return type === 'agent.sub_agent.started' || type === 'agent.sub_agent.completed' || type === 'agent.sub_agent.failed'
}
function subAgentIconColor(type: string) {
  return type === 'agent.sub_agent.failed' ? '#f56c6c' : type === 'agent.sub_agent.completed' ? '#67c23a' : '#409eff'
}
function subAgentTagType(type: string): 'success' | 'danger' | 'warning' | 'info' | '' {
  if (type === 'agent.sub_agent.completed') return 'success'
  if (type === 'agent.sub_agent.failed') return 'danger'
  return 'info'
}
function subAgentStatusText(type: string) {
  if (type === 'agent.sub_agent.started') return '执行中'
  if (type === 'agent.sub_agent.completed') return '完成'
  return '失败'
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
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.trace-item {
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  font-size: 13px;
}
.trace-think {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--el-color-info);
}
.trace-tool .tool-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.trace-tool .tool-name {
  font-weight: 600;
  flex: 1;
}
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
.trace-subagent {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sub-summary {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.trace-phase {
  display: flex;
  align-items: center;
  gap: 8px;
}
.trace-route {
  display: flex;
  align-items: center;
  gap: 8px;
}
.route-mode {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  padding: 0 6px;
  border-radius: 3px;
  font-size: 11px;
}
.trace-error {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f56c6c;
}
.trace-other {
  color: var(--el-text-color-secondary);
}
.event-type {
  font-family: monospace;
  font-size: 11px;
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
