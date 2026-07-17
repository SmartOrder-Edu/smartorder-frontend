/**
 * 运营管理端本地 Mock 数据及接口拦截处理器
 * 提供高仿真、可交互（增删改查及状态变更）的内存级 Mock 体验
 */

// 1. 定义兼容性循环引用辅助函数，防止前端组件中 statsRes.data / statsRes.data.data 报错
function createCompatibleMock(rawObj: any) {
  const mockObj = { ...rawObj, code: 200 };
  
  // 双重代理循环引用，确保不论怎么访问 .data 都能拿到自身
  Object.defineProperty(mockObj, 'data', {
    get() { return mockObj; },
    configurable: true,
    enumerable: true
  });
  
  return mockObj;
}

// ==========================================
// 内存模拟数据库 (In-Memory Database)
// ==========================================

// 1.1 大盘 ECharts 数据统计
const dashboardStats = {
  userCount: 64,
  agentExecutionCount: 305,
  pendingRAGJobCount: 5,
  pendingFeedbackCount: 3
};

const dashboardCharts = {
  trendDates: ['07-11', '07-12', '07-13', '07-14', '07-15', '07-16', '07-17'],
  successCounts: [1240, 1580, 1820, 2100, 2650, 3120, 3400],
  failCounts: [45, 68, 112, 95, 140, 75, 110],
  fileTypeDistribution: [
    { name: 'PDF', value: 145 },
    { name: 'Markdown', value: 92 },
    { name: 'Word (DOCX)', value: 48 },
    { name: 'TEXT', value: 25 },
    { name: 'HTML', value: 18 }
  ],
  feedbackTypeDistribution: [
    { name: '体验评价', value: 45 },
    { name: '功能建议', value: 82 },
    { name: 'Bug反馈', value: 38 },
    { name: '其他意见', value: 15 }
  ]
};

// 1.2 工具审计日志 (25条)
let toolExecutions = [
  {
    id: "1001",
    userName: "赵铁柱",
    toolName: "web_search",
    status: "SUCCESS",
    durationMs: 1420,
    createTime: "2026-07-17T10:48:32.000Z",
    arguments: JSON.stringify({ query: "Spring Boot 3.3 新特性 异步注解" }),
    result: JSON.stringify({ status: "success", count: 5, hits: ["Spring Boot 3.3.0 Release Notes", "Virtual Threads in Spring Boot 3"] }),
    traceId: "tr-7389c8a9-192a-4db3",
    conversationId: "conv-10927389",
    errorMessage: ""
  },
  {
    id: "1002",
    userName: "李美华",
    toolName: "pdf_parser",
    status: "SUCCESS",
    durationMs: 2580,
    createTime: "2026-07-17T10:45:15.000Z",
    arguments: JSON.stringify({ fileId: "file-902", startPage: 1, endPage: 10 }),
    result: JSON.stringify({ pagesParsed: 10, textLength: 14502, hasImages: true }),
    traceId: "tr-28491bbd-8c10-9b37",
    conversationId: "conv-88492019",
    errorMessage: ""
  },
  {
    id: "1003",
    userName: "王小明",
    toolName: "code_executor",
    status: "FAILED",
    durationMs: 840,
    createTime: "2026-07-17T10:42:01.000Z",
    arguments: JSON.stringify({ language: "python", code: "print(1 / 0)" }),
    result: "",
    traceId: "tr-998d7fa2-9382-7ab1",
    conversationId: "conv-77625143",
    errorMessage: "ZeroDivisionError: division by zero\n  at <module> (script.py:1)"
  },
  {
    id: "1004",
    userName: "系统小助手",
    toolName: "rag_retriever",
    status: "SUCCESS",
    durationMs: 350,
    createTime: "2026-07-17T10:39:10.000Z",
    arguments: JSON.stringify({ kbId: "kb-102", query: "Redis 分布式锁续期机制", topK: 3 }),
    result: JSON.stringify({ matchedChunks: 3, highestScore: 0.89, chunks: ["使用 Redisson 看门狗机制进行锁自动续期...", "后台定时任务每10秒检测一次..."] }),
    traceId: "tr-3891bbd0-cfa2-8b37",
    conversationId: "conv-99201827",
    errorMessage: ""
  },
  {
    id: "1005",
    userName: "张三锋",
    toolName: "image_generator",
    status: "TIMEOUT",
    durationMs: 15000,
    createTime: "2026-07-17T10:30:00.000Z",
    arguments: JSON.stringify({ prompt: "扫码点餐系统 3D 风格前台大厅示意图", ratio: "16:9" }),
    result: "",
    traceId: "tr-447e8da9-bbd1-47fa",
    conversationId: "conv-38491028",
    errorMessage: "Gateway Timeout: Upstream image server did not respond within 15 seconds."
  },
  {
    id: "1006",
    userName: "李四光",
    toolName: "ppt_builder",
    status: "SUCCESS",
    durationMs: 4890,
    createTime: "2026-07-17T10:25:12.000Z",
    arguments: JSON.stringify({ topic: "JVM 垃圾回收算法演进", slideCount: 8, outline: "1. 引入 2. 标记清除 3. 复制算法 4. 标记整理 5. G1 6. ZGC" }),
    result: JSON.stringify({ pptUrl: "https://smart-order.oss-cn-beijing.aliyuncs.com/study-assets/jvm-gc-slides.pptx" }),
    traceId: "tr-551ad982-f7ab-cfa1",
    conversationId: "conv-28391048",
    errorMessage: ""
  },
  {
    id: "1007",
    userName: "赵铁柱",
    toolName: "web_search",
    status: "REJECTED",
    durationMs: 100,
    createTime: "2026-07-17T10:15:22.000Z",
    arguments: JSON.stringify({ query: "如何破解扫码点餐后台系统" }),
    result: "",
    traceId: "tr-778adfa2-11bc-99d8",
    conversationId: "conv-10927389",
    errorMessage: "Security Guard Policy Violation: Query contains prohibited sensitive keywords."
  }
];

// 补齐到25条以供分页展示
for (let i = 8; i <= 25; i++) {
  const users = ["赵铁柱", "李美华", "王小明", "张三锋", "李四光", "钱七七"];
  const tools = ["web_search", "pdf_parser", "code_executor", "rag_retriever", "ppt_builder"];
  const statuses = ["SUCCESS", "SUCCESS", "SUCCESS", "FAILED"];
  const duration = Math.floor(Math.random() * 3000) + 150;
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  toolExecutions.push({
    id: (1000 + i).toString(),
    userName: users[i % users.length],
    toolName: tools[i % tools.length],
    status: status,
    durationMs: duration,
    createTime: new Date(Date.now() - i * 3600 * 1000).toISOString(),
    arguments: JSON.stringify({ paramKey: `value_${i}`, testMode: true }),
    result: status === "SUCCESS" ? JSON.stringify({ code: 200, message: "ok", randomNum: Math.random() }) : "",
    traceId: `tr-auto-gen-${i}a9-4b3f-${Date.now().toString().slice(-4)}`,
    conversationId: `conv-auto-gen-${i}920-${i}`,
    errorMessage: status === "FAILED" ? "Simulated exception: internal execution error." : ""
  });
}

// 1.3 资源生成进度日志 (25条)
let resourceLogs = [
  {
    id: "res-log-2001",
    spaceId: "space-101",
    userName: "赵铁柱",
    resourceType: "PPT",
    title: "Java并发编程之AQS独占锁机制剖析",
    status: "COMPLETED",
    resultUrl: "https://smart-order.oss-cn-beijing.aliyuncs.com/study-assets/aqs-slides.pptx",
    generationParams: JSON.stringify({ pages: 12, theme: "blue_tech" }),
    retryCount: 0,
    errorMessage: "",
    createTime: "2026-07-17T10:45:00.000Z",
    updateTime: "2026-07-17T10:47:12.000Z"
  },
  {
    id: "res-log-2002",
    spaceId: "space-101",
    userName: "赵铁柱",
    resourceType: "QUIZ",
    title: "AQS 独占模式核心方法（tryAcquire）随堂小测",
    status: "COMPLETED",
    resultUrl: "",
    generationParams: JSON.stringify({ questionCount: 5, difficulty: "hard" }),
    retryCount: 0,
    errorMessage: "",
    createTime: "2026-07-17T10:43:00.000Z",
    updateTime: "2026-07-17T10:43:45.000Z"
  },
  {
    id: "res-log-2003",
    spaceId: "space-102",
    userName: "李美华",
    resourceType: "DOC",
    title: "扫码点餐微服务拆分与架构设计方案",
    status: "GENERATING",
    resultUrl: "",
    generationParams: JSON.stringify({ wordCount: 5000 }),
    retryCount: 0,
    errorMessage: "",
    createTime: "2026-07-17T10:52:00.000Z",
    updateTime: "2026-07-17T10:52:50.000Z"
  },
  {
    id: "res-log-2004",
    spaceId: "space-103",
    userName: "王小明",
    resourceType: "EXAM",
    title: "MySQL 高可用架构（MHA/MGR）期末摸底试卷",
    status: "FAILED",
    resultUrl: "",
    generationParams: JSON.stringify({ choiceCount: 15, codingCount: 2 }),
    retryCount: 2,
    errorMessage: "Xunfei Avatar API Connection Refused: SocketException after 3 connection attempts. Remote server is unreachable.",
    createTime: "2026-07-17T10:20:00.000Z",
    updateTime: "2026-07-17T10:22:15.000Z"
  },
  {
    id: "res-log-2005",
    spaceId: "space-104",
    userName: "系统自动触发",
    resourceType: "MINDMAP",
    title: "Redis 从哨兵到 Cluster 集群架构知识图谱",
    status: "PENDING",
    resultUrl: "",
    generationParams: JSON.stringify({ depth: 3 }),
    retryCount: 0,
    errorMessage: "",
    createTime: "2026-07-17T10:52:45.000Z",
    updateTime: "2026-07-17T10:52:45.000Z"
  }
];

for (let i = 6; i <= 25; i++) {
  const users = ["赵铁柱", "李美华", "王小明", "张三锋", "钱七七"];
  const types = ["PPT", "DOC", "QUIZ", "EXAM", "MINDMAP"];
  const statuses = ["COMPLETED", "COMPLETED", "COMPLETED", "FAILED"];
  const resType = types[i % types.length];
  const status = statuses[i % statuses.length];
  
  resourceLogs.push({
    id: `res-log-${2000 + i}`,
    spaceId: `space-${100 + i}`,
    userName: users[i % users.length],
    resourceType: resType,
    title: `扫码点餐专项分析之【${resType} - 自动构建技术_${i}】`,
    status: status,
    resultUrl: status === "COMPLETED" ? `https://smart-order.oss-cn-beijing.aliyuncs.com/study-assets/auto-gen-${i}.zip` : "",
    generationParams: JSON.stringify({ index: i, desc: "Automatic simulation parameter" }),
    retryCount: status === "FAILED" ? 1 : 0,
    errorMessage: status === "FAILED" ? "Java heap space OutOfMemoryError during file zip compression." : "",
    createTime: new Date(Date.now() - i * 4 * 3600 * 1000).toISOString(),
    updateTime: new Date(Date.now() - i * 4 * 3600 * 1000 + 120000).toISOString()
  });
}

// 1.4 RAG 向量化解析队列 (20条)
let ragJobs = [
  {
    id: "3001",
    fileName: "2026智能点餐前沿业务场景分析报告.pdf",
    knowledgeBaseName: "智能点餐研究库",
    jobType: "VECTORIZE",
    status: "success",
    progress: 100,
    currentStep: "已完成 (向量索引已成功入库 Milvus)",
    retryCount: 0,
    userName: "赵铁柱",
    createdAt: "2026-07-17T09:15:00.000Z",
    updatedAt: "2026-07-17T09:18:22.000Z",
    fileId: "file-301",
    errorMessage: ""
  },
  {
    id: "3002",
    fileName: "分布式缓存高可用集群核心方案说明.md",
    knowledgeBaseName: "技术架构知识库",
    jobType: "VECTORIZE",
    status: "running",
    progress: 68,
    currentStep: "正在切分段落并调用 text-embedding-v3 进行嵌入 (45/66)",
    retryCount: 0,
    userName: "李美华",
    createdAt: "2026-07-17T10:51:30.000Z",
    updatedAt: "2026-07-17T10:52:45.000Z",
    fileId: "file-302",
    errorMessage: ""
  },
  {
    id: "3003",
    fileName: "用户点餐个性化推荐模型参数调优指南.docx",
    knowledgeBaseName: "推荐算法演练库",
    jobType: "VECTORIZE",
    status: "failed",
    progress: 15,
    currentStep: "尝试解析并提取文档文本结构中...",
    retryCount: 2,
    userName: "王小明",
    createdAt: "2026-07-17T10:10:00.000Z",
    updatedAt: "2026-07-17T10:11:40.000Z",
    fileId: "file-303",
    errorMessage: "NullPointerException: Cannot invoke 'org.apache.poi.xwpf.usermodel.XWPFParagraph.getText()' because 'para' is null\n  at com.smartorder.edu.knowledge.parser.DocxParser.parse(DocxParser.java:54)\n  at com.smartorder.edu.knowledge.parser.DocxParser$$FastClassBySpringCGLIB.invoke(<generated>)"
  },
  {
    id: "3004",
    fileName: "扫码快速点餐后端数据库分库分表DDL.sql",
    knowledgeBaseName: "技术架构知识库",
    jobType: "VECTORIZE",
    status: "pending",
    progress: 0,
    currentStep: "等待执行 (排队等待 RAG 解析线程池调度)",
    retryCount: 0,
    userName: "张三锋",
    createdAt: "2026-07-17T10:52:20.000Z",
    updatedAt: "2026-07-17T10:52:20.000Z",
    fileId: "file-304",
    errorMessage: ""
  }
];

// 1.5 用户反馈列表 (15条)
let feedbacks = [
  {
    id: "1",
    type: 3, // Bug反馈
    content: "在多人协作学习空间中，多Agent协同规划的学习路径任务偶尔会出现乱序，且小组成员的执行状态有十几秒的延迟同步，体验极差，希望尽快优化！",
    imageUrls: ["https://smart-order.oss-cn-beijing.aliyuncs.com/feedback/agent-path-error.png"],
    status: 1, // 待人工复核
    createTime: "2026-07-17T09:30:00.000Z",
    aiAnalysisResult: JSON.stringify({
      score: 92,
      isValid: true,
      reason: "反馈描述了多人协同学习空间中，多Agent任务流在调度同步学习状态时的并发乱序缺陷。涉及高并发多线程下状态持久化的Bug，可信度极高。建议审核通过，加急安排研发排错。"
    }),
    reviewRemark: "",
    replyContent: "",
    replyTime: ""
  },
  {
    id: "2",
    type: 2, // 功能建议
    content: "希望前台在展示‘知识库思维导图’时，能增加一个‘一键导出高清 PNG 图片’的折叠功能，目前只能在线浏览，不方便打印复习。",
    imageUrls: [],
    status: 5, // 已采纳
    createTime: "2026-07-16T14:20:00.000Z",
    aiAnalysisResult: JSON.stringify({
      score: 88,
      isValid: true,
      reason: "该建议属于典型的高价值交互体验优化方案，旨在增强知识导出的便捷性。逻辑完整清晰，具有很高的实用价值和可落地性。建议采纳并在下个版本排期开发。"
    }),
    reviewRemark: "高价值建议，已转交前端产品经理。感谢支持！",
    replyContent: "十分感谢您的宝贵建议！我们认为‘一键导出高清 PNG 图谱’确实是能够极大方便学员线下复习、笔记整理的优秀设计。我们已将该提案提交给前端交互团队，目前正安排在后续的迭代中进行排期。为表谢意，系统自动为您发放 5 元支付宝红包，祝您学习愉快！\n【系统发放奖品：支付宝 5元红包，兑换码：ALIPAY-5-XGZ9021A】",
    replyTime: "2026-07-17T09:05:00.000Z"
  },
  {
    id: "3",
    type: 1, // 体验评价
    content: "这个个性化推荐算法有点激进啊，我刚在第一阶段测评中错了一道高阶题，系统就把第二阶段难度直接拉满了，根本不考虑基础薄弱者的认知负荷，希望能温和过渡。",
    imageUrls: [],
    status: 4, // 已驳回
    createTime: "2026-07-17T08:15:00.000Z",
    aiAnalysisResult: JSON.stringify({
      score: 55,
      isValid: true,
      reason: "用户反馈个性化推荐算法在学习难度梯度调节上过于陡峭，给学习者带来了认知超载。这属于推荐系统在能力界定参数上的阈值策略优化，非故障故障Bug，建议反馈至算法调优组并做好兜底提示。"
    }),
    reviewRemark: "属于算法策略调优建议，非核心功能故障，已移交算法专项小组进行参数平滑测试。",
    replyContent: "您好，非常抱歉给您带来了高难度的学习压力。我们的个性化推荐算法默认是基于能力上限探索的。我们后续会考虑加入‘平滑度调节器’，让不同学习风格的学员能自主选择‘激进’或‘稳健’的推荐梯度。感谢您的反馈！",
    replyTime: "2026-07-17T10:12:00.000Z"
  },
  {
    id: "4",
    type: 2, // 功能建议
    content: "点击‘一键生成 PPT 课件’后，后台生成任务偶尔会出现超时。希望能在界面进度条下方展示 Agent 正在执行哪一个子任务（例如：提炼大纲、设计模板、渲染结构等），防止我们以为卡死。",
    imageUrls: [],
    status: 0, // 待AI初审
    createTime: "2026-07-17T10:50:00.000Z",
    aiAnalysisResult: "",
    reviewRemark: "",
    replyContent: "",
    replyTime: ""
  },
  {
    id: "5",
    type: 3, // Bug反馈
    content: "在大模型AI对话助手界面，当连续发送包含 Markdown 表格的复杂提问时，界面在移动端（微信小程序）会出现排版错乱，导致单元格溢出屏幕且无法横向滚动，极度影响移动端答疑体验。",
    imageUrls: [],
    status: 5, // 已采纳
    createTime: "2026-07-14T15:51:00.000Z",
    aiAnalysisResult: JSON.stringify({
      score: 85,
      isValid: true,
      reason: "该问题反馈了移动端AI对话框中 Markdown 表格渲染的自适应排版 Bug。在移动设备上溢出且未提供滚动条，属于界面响应式设计的缺陷，对C端体验影响较大。建议前端优化 Markdown 表格组件，添加 overflow-x: auto。"
    }),
    reviewRemark: "已确认该移动端样式溢出缺陷，已安排前端研发小组修复。",
    replyContent: "您好，非常感谢您对知序智学移动端体验的细心关注！我们已复现了在微信小程序下 Markdown 表格无法横向滚动的 Bug。目前前端团队已针对移动端表格组件进行了自适应优化并添加了滚动条支持，该优化将在下个微信小程序版本更新后正式生效。非常感谢您的热心反馈，特奖励 5 元支付宝红包，请在您的奖品中心查收！\n【系统发放奖品：支付宝 5元红包，兑换码：ALIPAY-5-MBX8812D】",
    replyTime: "2026-07-15T01:30:00.000Z"
  },
  {
    id: "6",
    type: 1, // 体验评价
    content: "体验了一下智能知识库解析功能，PDF 文档一键导入并转化为思维导图确实很震撼，不过解析超过 10MB 的英文教材时，反应有点慢（大概等了2分钟），建议在加载动画里加一些解析进度的百分比提示，而不是干等着，容易让人以为系统崩溃了。",
    imageUrls: [],
    status: 3, // 有效反馈
    createTime: "2026-07-14T03:51:00.000Z",
    aiAnalysisResult: JSON.stringify({
      score: 78,
      isValid: true,
      reason: "用户对智能解析大文件时的等待体验提出了合理优化诉求。并非系统缺陷，但缺乏加载进度提示会导致体验打折扣。建议在 RAG 解析流水线中引入分段解析进度反馈，并在前端展示百分比。"
    }),
    reviewRemark: "已移交产品部门，作为后续提升大文件上传及解析等待体验的交互优化参考。",
    replyContent: "您好，非常高兴您能喜欢我们的 PDF 一键转思维导图功能！关于大文件解析时间较长且缺乏细分进度条的问题，我们非常认同您的看法。由于 PDF 文档（尤其是英文教材）的 OCR、分段切片及向量化需要消耗较多计算资源，确实容易产生长等待。我们已经把‘显示解析百分比进度’的优化案提交给交互设计团队，后续版本将逐步加入实时进度展示，避免用户产生焦虑。感谢您的反馈！",
    replyTime: "2026-07-14T07:20:00.000Z"
  },
  {
    id: "7",
    type: 2, // 功能建议
    content: "建议平台加入类似‘王者荣耀’排位赛的实时PK刷题模式，学生可以联机对战PK微积分或逻辑题，这样能大大增加趣味性，吸引更多人来玩。",
    imageUrls: [],
    status: 4, // 已驳回
    createTime: "2026-07-13T15:51:00.000Z",
    aiAnalysisResult: JSON.stringify({
      score: 45,
      isValid: false,
      reason: "该建议期望引入实时联机竞技刷题模式（游戏化PK）。虽然出发点是增加趣味性，但对于知序智学偏向严肃考研及专业课学习的定位不够匹配，且研发及运维联机服务器的成本过高，建议先以个人趣味挑战、积分排行榜形式兜底，暂不开放实时联机PK功能。"
    }),
    reviewRemark: "经评估，联机竞技刷题模式与本平台定位（严肃学术及专业备考）有偏差，且开发维护成本较高，暂不采纳。",
    replyContent: "您好，感谢您别出心裁的有趣提议！我们也非常期望能在学习中引入更多激励机制。不过，知序智学目前定位是面向研究生备考、专业资质考试的深度学习平台，更注重沉浸式与个人化训练。若引入实时的玩家对战，可能容易引入过多娱乐性元素，干扰考生的复习状态。因此该方案我们暂不予采用。后续我们会设计更温和的‘每日个人挑战榜’等轻量化趣味组件，再次感谢您的建言！",
    replyTime: "2026-07-14T02:10:00.000Z"
  },
  {
    id: "8",
    type: 3, // Bug反馈
    content: "小程序端在网络不稳定（比如地铁上）的时候，提交每日测评，有时候会弹出‘提交失败’，但是重新连上网后发现系统竟然扣除了我 5 个积分（正常提交也扣积分），而且还没有本次的测评记录。白白扣了积分还找不到考试结果，希望能退回积分并修复这个防重提交机制。",
    imageUrls: [],
    status: 5, // 已采纳
    createTime: "2026-07-13T03:51:00.000Z",
    aiAnalysisResult: JSON.stringify({
      score: 90,
      isValid: true,
      reason: "涉及积分结算的幂等性与分布式事务回退 Bug。小程序端在弱网或网络瞬断时，网络请求虽返回超时，但后端可能已经执行了扣分操作，且由于客户端报错未成功建立测评历史记录。此问题直接影响用户资产与核心流程，属于高危漏洞，建议立即审核通过，安排后端排查接口防重及幂等逻辑。"
    }),
    reviewRemark: "高危积分结算漏洞，已紧急提交后端团队修复防重与扣分事务。已为该用户手工补偿 10 倍积分。",
    replyContent: "您好，非常抱歉在地铁等弱网环境下给您带来了极差的测评体验！经研发团队排查，确实存在客户端因网络延时报错、而后端已经扣减积分且数据库事务未回滚的一致性缺陷。我们已在最新的后端更新中上线了幂等性验证和重试回滚机制，完美解决了防重提交问题。同时，我们已将扣除 the 5 积分以及额外赠送的 50 积分手工补发到您的账户中。非常感谢您的纠错反馈，已为您发放 5 元支付宝红包，祝您备考顺利！\n【系统发放奖品：支付宝 5元红包，兑换码：ALIPAY-5-PQA9012N】",
    replyTime: "2026-07-13T06:45:00.000Z"
  },
  {
    id: "9",
    type: 1, // 体验评价
    content: "智能导师角色‘小知’的性格设定非常暖心，每次回答不仅提供专业的解题思路，还会适度鼓励我。但是，回答的字数有时过长（一页密密麻麻全是字），能不能增加一个‘精简模式/大纲模式’，让我们可以一键切换看精简版结论？",
    imageUrls: [],
    status: 3, // 有效反馈
    createTime: "2026-07-12T15:51:00.000Z",
    aiAnalysisResult: JSON.stringify({
      score: 76,
      isValid: true,
      reason: "用户对AI导师回复文字量过大存在阅读疲劳。该体验反馈非常合理，代表了一类期望快速获取核心考点的用户需求。建议在AI对话气泡下方增加‘缩写/大纲化’或者‘一键精简’的功能按钮，利用大模型进行二次精简输出。"
    }),
    reviewRemark: "已移交AI应用开发组，计划在‘小知’对话界面上新增‘字数控制（详细/精简）’的动态切换选项。",
    replyContent: "您好，听到您喜欢我们AI导师‘小知’的鼓励，我们感到十分欣慰！对于‘文字过多、阅读疲劳’的问题，我们也非常赞同。不同场景下用户的阅读节奏不同，有时确实只需看三言两语的干货。我们正着手在对话面板的常用工具中加入‘一键缩写’或切换‘极简模式’的功能。再次感谢您陪伴知序智学成长，祝您学习愉快！",
    replyTime: "2026-07-13T01:15:00.000Z"
  },
  {
    id: "10",
    type: 2, // 功能建议
    content: "能否在平台里直接接入各大主流网盘（比如百度网盘、阿里云盘等）的一键登录下载？因为我的很多学习资料都在网盘里，每次都要先下载到本地再上传到知序智能知识库，非常繁琐。",
    imageUrls: [],
    status: 4, // 已驳回
    createTime: "2026-07-12T03:51:00.000Z",
    aiAnalysisResult: JSON.stringify({
      score: 50,
      isValid: false,
      reason: "建议接入第三方主流网盘 direct download 授权。虽然这能简化用户上传路径，但接入多个网盘的 OAuth 授权、大文件直连中转对于服务安全、带宽流量以及版权合规等方面有极高风险。目前更建议推广现有的本地拖拽上传和浏览器插件抓取功能，网盘对接计划暂缓。"
    }),
    reviewRemark: "对接主流网盘涉及第三方平台授权限制、流量带宽以及版权合规性风险，短期内暂不具备可行性，做驳回处理。",
    replyContent: "您好，非常理解您期望一键同步网盘资料的迫切需求。然而，直接对接百度网盘或阿里云盘的 API 接口，不仅需要处理极其严格的第三方授权凭证，更涉及版权合规、敏感内容审核以及大流量带宽下载的运维压力。从平台安全和合规角度出发，我们短期内无法直接打通网盘。建议您使用我们新上线的‘浏览器插件’，它能帮您快速同步网页端公开的学术文档。感谢您的理解与建言！",
    replyTime: "2026-07-12T08:30:00.000Z"
  },
  {
    id: "11",
    type: 3, // Bug反馈
    content: "在‘错题集’界面，如果我把错题加入了‘已掌握’列表，刷新页面后它们居然又重新出现在了错题集里。也就是说‘掌握’状态根本没有写入数据库，太浪费复习时间了，请求排查！",
    imageUrls: [],
    status: 3, // 有效反馈
    createTime: "2026-07-11T15:51:00.000Z",
    aiAnalysisResult: JSON.stringify({
      score: 82,
      isValid: true,
      reason: "错题集状态更新未持久化。可能是前端在操作‘已掌握’时，仅在内存中改变了状态，或调用的 API 接口发生异常被拦截，导致数据没有真正写入 DB。需要核对错题状态更新的接口调用和持久化机制。"
    }),
    reviewRemark: "已定位到错题集持久化更新的控制器（Controller）存在事务未提交的缺陷，已修复。",
    replyContent: "您好，非常抱歉给您的复习带来了不便！技术团队已定位到此问题：在错题分类操作时，由于后端事务注解 @Transactional 在特定异常下回滚导致写入数据库失败，但前端没有显示报错。我们已经完成了修复并发布上线，现在‘已掌握’状态会永久保存了。感谢您的及时反馈，您的监督让知序智学更加完善！",
    replyTime: "2026-07-12T02:20:00.000Z"
  },
  {
    id: "12",
    type: 2, // 功能建议
    content: "建议在‘生成课件’导出的 PPT 模版中，增加一些支持深色模式的现代科技风格。目前系统自带的模版基本都是白底浅色系的，在暗光教室里播放投影时非常刺眼，而且科技感不够强。",
    imageUrls: [],
    status: 5, // 已采纳
    createTime: "2026-07-11T03:51:00.000Z",
    aiAnalysisResult: JSON.stringify({
      score: 84,
      isValid: true,
      reason: "关于增加深色模式/极客科技风课件模版的建议，具有很高实用性。在很多讲座和汇报场景中，黑底或深蓝底的 PPT 更具现代感且护眼。开发成本适中（属于模板库扩展）。"
    }),
    reviewRemark: "已转交设计与课件模板组，将在下个季度的模板库更新中加入‘极客深蓝’和‘赛博朋克’两款深色PPT模板。",
    replyContent: "您好，非常棒的建议！PPT 模版的视觉格调直接影响着最终的展示效果，深色模式模板确实是目前很多理工科和科技项目汇报的刚需。设计团队已将‘极客科技深蓝版’和‘护眼暗黑版’的设计稿提上日程，预计在 8 月初更新进系统课件库。非常感谢您的宝贵建议！已发放 5 元支付宝红包，祝您使用愉快！\n【系统发放奖品：支付宝 5元红包，兑换码：ALIPAY-5-KLS2918Z】",
    replyTime: "2026-07-11T07:05:00.000Z"
  },
  {
    id: "13",
    type: 1, // 体验评价
    content: "智能课件生成的排版逻辑很不错，大纲提炼也很精准。但是在生成逻辑图和关系网时，文字稍微多一点，各种方框和箭头就会叠在一起，甚至连线还会交叉，看起来像蜘蛛网，体验不够完美，能否优化拓扑图的力导向布局算法？",
    imageUrls: [],
    status: 3, // 有效反馈
    createTime: "2026-07-10T15:51:00.000Z",
    aiAnalysisResult: JSON.stringify({
      score: 79,
      isValid: true,
      reason: "用户指出关系网拓扑图节点重叠与文本重合缺陷。属于典型的图可视化布局算力参数调整问题。建议调整组件排斥力，加入文字字数截断与自适应排版控制。"
    }),
    reviewRemark: "属于图可视化性能和布局问题，已转交给前端团队，将对关系网组件进行节点防重叠和字符截断优化。",
    replyContent: "您好，感谢您对我们图谱生成功能的深入体验！图谱节点重叠、连线交叉确实是一个较为复杂的计算几何问题。我们的前端团队已经针对该拓扑图组件（基于 G6 库）的力导向（Force Layout）参数进行了重构，调大了节点间的排斥力，并加入了自动折行和文字溢出省略。目前已在开发环境测试完毕，下周就会上线。感谢您的反馈！",
    replyTime: "2026-07-11T01:40:00.000Z"
  },
  {
    id: "14",
    type: 3, // Bug反馈
    content: "我昨天充值购买系统专业版会员，支付成功了，但是会员期限还是显示的普通版。我想退款或者立即给我开通！",
    imageUrls: [],
    status: 2, // 已被AI拦截
    createTime: "2026-07-10T03:51:00.000Z",
    aiAnalysisResult: JSON.stringify({
      score: 30,
      isValid: false,
      reason: "系统检测到该内容包含充值、退款及个人资金敏感词。根据初审规则，判定为财务账务类紧急工单，非日常功能性或Bug反馈。系统已自动拦截本记录并同步派发加急财务工单，不进入常规审核流。"
    }),
    reviewRemark: "属于充值不到账的账务类加急问题，已为用户转接人工财务通道并于10分钟内成功开通。已从常规反馈中拦截/关闭。",
    replyContent: "您好，给您带来不便了！由于此反馈包含充值与账务退款等紧急敏感业务，根据系统规范，本常规审核通道已予以拦截，并已将您的诉求一键流转给专门的‘财务工单通道’。经财务核实，微信支付回调有几分钟的网络拥堵，我们已在昨日下午为您手工补发并多赠送了 7 天会员。祝您使用愉快，如有疑问可拨打客服电话！",
    replyTime: "2026-07-10T04:05:00.000Z"
  },
  {
    id: "15",
    type: 2, // 功能建议
    content: "目前‘思维导图’的编辑是全鼠标操作，能不能引入类似 XMind 的键盘快捷键？比如按 Tab 新建子节点，按 Enter 新建兄弟节点，按 Delete 删除。对于做笔记的人来说，双手不离键盘效率真的会高很多。",
    imageUrls: [],
    status: 5, // 已采纳
    createTime: "2026-07-09T15:51:00.000Z",
    aiAnalysisResult: JSON.stringify({
      score: 87,
      isValid: true,
      reason: "高价值交互建议。对效率工具而言，键盘快捷键是实现流畅输入的关键。实现此建议能够极大提升深度复习和笔记用户的留存度，属于低成本高回报的功能，极力推荐采纳。"
    }),
    reviewRemark: "非常赞的快捷键体验优化，已安排前端团队排期开发，将于近期版本支持 Tab/Enter 等基础导图快捷操作。",
    replyContent: "您好，非常感谢您对思维导图交互细节的精彩建议！我们深深地感到：做笔记、整理知识时的流畅感对大家至关重要，键盘快捷键（Tab/Enter/Del）的缺失确实降低了编辑效率。产品经理在收到您的反馈后，已立即召集开发团队进行了快捷键功能评估，并将该功能列为最高优先级的交互体验改进。我们已于本周完成了该特性的部署，您现在就可以在思维导图中使用这些快捷键了！特为您送上 5 元支付宝红包作为感谢，祝您学业有成！\n【系统发放奖品：支付宝 5元红包，兑换码：ALIPAY-5-XWY0982E】",
    replyTime: "2026-07-10T01:30:00.000Z"
  }
];

let prizes = [
  {
    id: "1",
    name: "支付宝 5元红包",
    prizeCode: "ALIPAY-5-XGZ9021A",
    status: 1, // 已发放
    userId: "1001",
    feedbackId: "2",
    feedbackTitle: "希望前台在展示‘知识库思维导图’时能增加一键导出...",
    allocateTime: "2026-07-17T09:05:00.000Z",
    createTime: "2026-07-15T08:00:00.000Z"
  },
  {
    id: "2",
    name: "支付宝 1元红包",
    prizeCode: "ALIPAY-1-HUA9820C",
    status: 0, // 可用
    userId: "",
    feedbackId: "",
    feedbackTitle: "",
    allocateTime: "",
    createTime: "2026-07-15T08:00:00.000Z"
  },
  {
    id: "3",
    name: "创意金属书签",
    prizeCode: "ITEM-BOOKMARK-CNY7739X",
    status: 2, // 已作废
    userId: "",
    feedbackId: "",
    feedbackTitle: "",
    allocateTime: "",
    createTime: "2026-07-16T11:00:00.000Z"
  },
  {
    id: "4",
    name: "简约皮质本子",
    prizeCode: "ITEM-NOTEBOOK-8849-2019",
    status: 0, // 可用
    userId: "",
    feedbackId: "",
    feedbackTitle: "",
    allocateTime: "",
    createTime: "2026-07-17T09:30:00.000Z"
  }
];

for (let i = 5; i <= 30; i++) {
  const prizeNames = [
    "支付宝 1元红包", 
    "支付宝 2元红包", 
    "支付宝 5元红包", 
    "精美中性笔", 
    "简约皮质本子", 
    "创意金属书签"
  ];
  const statuses = [0, 0, 1]; // 可用概率更高
  const name = prizeNames[i % prizeNames.length];
  const status = statuses[i % statuses.length];
  
  let prefix = "ITEM";
  if (name.includes("1元")) prefix = "ALIPAY-1";
  else if (name.includes("2元")) prefix = "ALIPAY-2";
  else if (name.includes("5元")) prefix = "ALIPAY-5";
  else if (name.includes("笔")) prefix = "ITEM-PEN";
  else if (name.includes("本子")) prefix = "ITEM-NOTEBOOK";
  else if (name.includes("书签")) prefix = "ITEM-BOOKMARK";

  prizes.push({
    id: i.toString(),
    name: name,
    prizeCode: `${prefix}-CODE-${100000 + i}-${Date.now().toString().slice(-4)}`,
    status: status,
    userId: status === 1 ? (2000 + i).toString() : "",
    feedbackId: status === 1 ? (10 + i).toString() : "",
    feedbackTitle: status === 1 ? `关于点餐退款、结算细节的优化建言_${i}` : "",
    allocateTime: status === 1 ? new Date(Date.now() - i * 5 * 3600 * 1000).toISOString() : "",
    createTime: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  });
}

// ==========================================
// 接口处理器路由分发 (Mock Router Handler)
// ==========================================

export async function handleAdminMock(config: any): Promise<any> {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  const params = config.params || {};
  const data = config.data || {};

  console.log(`[Admin Mock Interceptor] 拦截请求: ${method.toUpperCase()} ${url}`, { params, data });

  // 延时模拟，增加仿真体验
  await new Promise(resolve => setTimeout(resolve, 350));

  // 1. 系统大盘看板接口
  if (url.includes('/admin/dashboard/stats')) {
    // 动态调整 RAG 和 反馈的未审核数
    const pendingRAG = ragJobs.filter(j => j.status === 'pending' || j.status === 'running').length;
    const pendingFeedback = feedbacks.filter(f => f.status === 0 || f.status === 1).length;
    
    const statsObj = {
      ...dashboardStats,
      pendingRAGJobCount: pendingRAG,
      pendingFeedbackCount: pendingFeedback,
      userCount: dashboardStats.userCount
    };
    return createCompatibleMock(statsObj);
  }

  if (url.includes('/admin/dashboard/charts')) {
    return createCompatibleMock(dashboardCharts);
  }

  // 2. 智能体工具审计接口
  if (url.includes('/admin/agent/tool/list')) {
    const page = parseInt(params.page) || 1;
    const size = parseInt(params.size) || 10;
    const toolName = params.toolName || '';
    const status = params.status || '';

    let filtered = [...toolExecutions];
    if (toolName) {
      filtered = filtered.filter(item => item.toolName.toLowerCase().includes(toolName.toLowerCase()));
    }
    if (status) {
      filtered = filtered.filter(item => item.status === status);
    }

    const start = (page - 1) * size;
    const records = filtered.slice(start, start + size);

    return createCompatibleMock({
      records,
      total: filtered.length,
      page,
      size
    });
  }

  // 3. 资源生成日志接口
  if (url.includes('/admin/agent/resource/list')) {
    const page = parseInt(params.page) || 1;
    const size = parseInt(params.size) || 10;
    const resourceType = params.resourceType || '';
    const status = params.status || '';

    let filtered = [...resourceLogs];
    if (resourceType) {
      filtered = filtered.filter(item => item.resourceType === resourceType);
    }
    if (status) {
      filtered = filtered.filter(item => item.status === status);
    }

    const start = (page - 1) * size;
    const records = filtered.slice(start, start + size);

    return createCompatibleMock({
      records,
      total: filtered.length,
      page,
      size
    });
  }

  // 4. RAG 引擎解析队列接口
  if (url.includes('/admin/rag/jobs/retry/')) {
    // 处理重试请求 POST /admin/rag/jobs/retry/{id}
    const id = url.substring(url.lastIndexOf('/') + 1);
    const job = ragJobs.find(j => j.id === id);
    if (job) {
      job.status = 'pending';
      job.progress = 0;
      job.currentStep = '排队中，已重置报错信息';
      job.errorMessage = '';
      job.updatedAt = new Date().toISOString();
      return createCompatibleMock(null);
    }
    return { code: 500, message: "任务未找到" };
  }

  if (url.includes('/admin/rag/jobs')) {
    const page = parseInt(params.page) || 1;
    const size = parseInt(params.size) || 10;
    const status = params.status || '';

    let filtered = [...ragJobs];
    if (status) {
      filtered = filtered.filter(item => item.status === status);
    }

    const start = (page - 1) * size;
    const records = filtered.slice(start, start + size);

    return createCompatibleMock({
      records,
      total: filtered.length,
      page,
      size
    });
  }

  // 5. 用户反馈人工复核接口
  if (url.includes('/admin/feedback/stats')) {
    const pendingReview = feedbacks.filter(f => f.status === 0 || f.status === 1).length;
    const aiRejected = feedbacks.filter(f => f.status === 2).length;
    const accepted = feedbacks.filter(f => f.status === 5).length;
    
    return createCompatibleMock({
      pendingReview,
      aiRejected,
      accepted
    });
  }

  if (url.match(/\/admin\/feedback\/\d+\/review$/)) {
    // 提交审核 POST /admin/feedback/{id}/review
    const segments = url.split('/');
    const id = segments[segments.length - 2];
    const feedback = feedbacks.find(f => f.id === id);
    if (feedback) {
      feedback.status = data.status; // 3: 有效, 4: 驳回, 5: 采纳
      feedback.reviewRemark = data.reviewRemark || '';
      feedback.replyContent = data.replyContent || '';
      feedback.replyTime = new Date().toISOString();
      
      // 如果采纳为优质建议，自动从未发放的奖品库中分发一个卡密
      if (Number(data.status) === 5) {
        const availablePrize = prizes.find(p => p.status === 0);
        if (availablePrize) {
          availablePrize.status = 1; // 已发放
          availablePrize.userId = "1001"; // 模拟分配给当前用户
          availablePrize.feedbackId = feedback.id;
          availablePrize.feedbackTitle = feedback.content.length > 22 ? feedback.content.slice(0, 22) + '...' : feedback.content;
          availablePrize.allocateTime = new Date().toISOString();
          
          // 联动追加到回复内容中，供前端直观展示
          feedback.replyContent = (data.replyContent || '') + `\n【系统发放奖品：${availablePrize.name}，兑换码：${availablePrize.prizeCode}】`;
        } else {
          feedback.replyContent = (data.replyContent || '') + `\n【系统提醒：当前可用奖品库存不足，未能自动发放奖品，请尽快录入卡密】`;
        }
      }
      
      return createCompatibleMock(feedback);
    }
    return { code: 500, message: "未找到该反馈记录" };
  }

  if (url.includes('/admin/feedback/page')) {
    const page = parseInt(params.page) || 1;
    const size = parseInt(params.size) || 10;
    const type = params.type;
    const status = params.status;

    let filtered = [...feedbacks];
    if (type !== undefined && type !== '') {
      filtered = filtered.filter(item => item.type === Number(type));
    }
    if (status !== undefined && status !== '') {
      filtered = filtered.filter(item => item.status === Number(status));
    }

    const start = (page - 1) * size;
    const records = filtered.slice(start, start + size);

    return createCompatibleMock({
      records,
      total: filtered.length,
      page,
      size
    });
  }

  // 6. 卡密兑换大厅接口
  if (url.includes('/admin/prize/stats')) {
    const availableInventory = prizes.filter(p => p.status === 0).length;
    const allocatedCount = prizes.filter(p => p.status === 1).length;
    const discardedCount = prizes.filter(p => p.status === 2).length;
    
    return createCompatibleMock({
      availableInventory,
      allocatedCount,
      discardedCount
    });
  }

  if (url.match(/\/admin\/prize\/\d+\/discard$/)) {
    // 作废卡密 POST /admin/prize/{id}/discard
    const segments = url.split('/');
    const id = segments[segments.length - 2];
    const prize = prizes.find(p => p.id === id);
    if (prize) {
      prize.status = 2; // 作废
      return createCompatibleMock(null);
    }
    return { code: 500, message: "卡密记录未找到" };
  }

  if (url.includes('/admin/prize/create')) {
    // 批量创建 POST /admin/prize/create
    const name = data.name;
    const codes = data.prizeCodes || [];
    
    codes.forEach((codeStr: string, idx: number) => {
      prizes.unshift({
        id: (Date.now() + idx).toString(),
        name: name,
        prizeCode: codeStr,
        status: 0, // 可用
        userId: "",
        feedbackId: "",
        feedbackTitle: "",
        allocateTime: "",
        createTime: new Date().toISOString()
      });
    });
    return createCompatibleMock(null);
  }

  if (url.includes('/admin/prize/page')) {
    const page = parseInt(params.page) || 1;
    const size = parseInt(params.size) || 10;
    const name = params.name || '';
    const status = params.status;

    let filtered = [...prizes];
    if (name) {
      filtered = filtered.filter(item => item.name.includes(name));
    }
    if (status !== undefined && status !== '') {
      filtered = filtered.filter(item => item.status === Number(status));
    }

    const start = (page - 1) * size;
    const records = filtered.slice(start, start + size);

    return createCompatibleMock({
      records,
      total: filtered.length,
      page,
      size
    });
  }

  // 兜底返回 null
  return null;
}
