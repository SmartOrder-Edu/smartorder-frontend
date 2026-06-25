# 数字人组件集成到 AI 学习伙伴页面

## 目标
将 `AssistantPanel` 数字人组件集成到 `src/views/AITutor/index.vue` 页面的聊天区域左侧，作为独立可收起的面板。

## 修改文件清单

### 1. `src/views/AITutor/index.vue`

#### 1.1 添加组件导入
在 `<script setup>` 部分的 import 区域添加：
```typescript
import AssistantPanel from '@/components/AssistantPanel.vue'
import { ArrowRight } from '@element-plus/icons-vue'
```

#### 1.2 添加响应式状态
在现有的 ref 声明区域添加：
```typescript
const isAssistantCollapsed = ref(false)
const latestAiMessageForAvatar = ref('')
```

#### 1.3 添加 AI 消息监听
需要监听 AI 回复消息，将最新的 AI 消息传递给数字人组件。可以在 `messages` 变化的 watcher 中提取最后一条 AI 消息：
```typescript
watch(() => messages.value, (newMessages) => {
  const lastAiMessage = [...newMessages].reverse().find(m => m.role === 'ai')
  if (lastAiMessage) {
    latestAiMessageForAvatar.value = lastAiMessage.content
  }
}, { deep: true })
```

#### 1.4 修改模板结构
在 `<div class="tutor-container">` 内部，在历史侧边栏和聊天区域之间添加：

```vue
<!-- 数字人展开按钮（收起状态时显示） -->
<div 
  v-if="isAssistantCollapsed" 
  class="expand-btn-avatar" 
  @click="isAssistantCollapsed = false"
  title="展开数字人"
>
  <el-icon><ArrowRight /></el-icon>
</div>

<!-- 数字人面板 -->
<AssistantPanel 
  v-show="!isAssistantCollapsed"
  :latestAiMessage="latestAiMessageForAvatar"
  @collapse="isAssistantCollapsed = true"
/>
```

#### 1.5 调整 grid 布局
修改 `.tutor-container` 的样式：
```css
.tutor-container {
  display: grid;
  grid-template-columns: auto auto 1fr 280px;  /* 新增一列给数字人 */
  gap: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
```

#### 1.6 添加样式
```css
/* 数字人展开按钮 */
.expand-btn-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 100%;
  background: rgba(99, 102, 241, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 8px;
}

.expand-btn-avatar:hover {
  background: rgba(99, 102, 241, 0.15);
}

.expand-btn-avatar .el-icon {
  color: #6366f1;
  font-size: 16px;
}
```

### 2. 占位图处理

由于 `src/assets/images/digital-human-placeholder.png` 不存在，有两种处理方案：

**方案 A**：修改 AssistantPanel.vue，移除占位图引用（因为数字人加载时已经有 loading 状态）

**方案 B**：创建一个简单的 SVG 占位图

推荐方案 A，修改 AssistantPanel.vue 中的：
```vue
<!-- 移除这行 -->
<img v-if="!isLoading && !isAvatarReady" src="/src/assets/images/digital-human-placeholder.png" class="fallback-image" />
```

## 集成顺序

1. ✅ 创建 `src/api/avatar.ts`（已完成）
2. ✅ 创建 `src/components/AssistantPanel.vue`（已完成）
3. ⬜ 修改 `src/components/AssistantPanel.vue` - 移除不存在的占位图引用
4. ⬜ 修改 `src/views/AITutor/index.vue`：
   - 添加导入
   - 添加状态
   - 添加消息监听
   - 修改模板
   - 调整布局
   - 添加样式

## 注意事项

1. **RTCPlayer SDK** 已存在于 `src/utils/player/` 目录，路径已修正
2. **后端接口** 需要确保 `/teacher/avatar/auth-info` 可用
3. **样式冲突** AssistantPanel 使用 scoped 样式，不会影响外部
4. **响应式布局** 数字人面板可收起，不会影响其他区域的使用
