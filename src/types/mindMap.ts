/**
 * 思维导图数据契约——前后端必须一致。
 * 后端：GenerateMindMapTool 发射 agent.mindmap.created 事件，payload 即 MindMapData。
 * 前端：useAgentStore.handleEvent 接收，MindMapCard.vue 用 AntV X6 渲染。
 */

export interface MindMapNode {
  /** 节点唯一标识，后端规范化为 n0, n1, ... */
  id: string
  /** 节点显示文本 */
  label: string
  /** 父节点 id；根节点为 null */
  parentId: string | null
  /** 层级，根=0；后端自动补全 */
  level?: number
  /** 十六进制颜色，后端按 level 分配默认色板 */
  color?: string
  /** 节点备注，可选 */
  note?: string
}

export interface MindMapEdge {
  /** 源节点 id */
  source: string
  /** 目标节点 id */
  target: string
  /** 边标签，可选 */
  label?: string
}

export interface MindMapData {
  /** 导图主题/根节点标题 */
  topic: string
  /** 节点列表（树形，parentId 构造父子关系） */
  nodes: MindMapNode[]
  /** 额外跨分支关联边（父子关系无需在此重复声明） */
  edges: MindMapEdge[]
  /** 布局类型，目前固定 'mindmap'，预留扩展 */
  layout: 'mindmap'
}
