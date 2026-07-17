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
  userCount: 1248,
  agentExecutionCount: 14205,
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

for (let i = 5; i <= 20; i++) {
  const users = ["赵铁柱", "李美华", "王小明", "张三锋", "钱七七"];
  const extensions = [".pdf", ".docx", ".md", ".txt"];
  const ext = extensions[i % extensions.length];
  const statuses = ["success", "success", "failed"];
  const status = statuses[i % statuses.length];
  
  ragJobs.push({
    id: (3000 + i).toString(),
    fileName: `运营决策及点餐报表自动化归档文档_${i}${ext}`,
    knowledgeBaseName: i % 2 === 0 ? "智能点餐研究库" : "技术架构知识库",
    jobType: "VECTORIZE",
    status: status,
    progress: status === "success" ? 100 : 35,
    currentStep: status === "success" ? "已完成" : "提取文本报错",
    retryCount: status === "failed" ? 1 : 0,
    userName: users[i % users.length],
    createdAt: new Date(Date.now() - i * 6 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 6 * 3600 * 1000 + 300000).toISOString(),
    fileId: `file-300-${i}`,
    errorMessage: status === "failed" ? "IOException: Connection reset by peer during python service request." : ""
  });
}

// 1.5 用户反馈列表 (15条)
let feedbacks = [
  {
    id: "1",
    type: 3, // Bug反馈
    content: "多人同时扫同一个桌码点餐时，购物车里的菜品数量偶尔会出现乱序和延迟同步，体验极差，希望尽快优化！",
    imageUrls: ["https://smart-order.oss-cn-beijing.aliyuncs.com/feedback/demo-cart-error.png"],
    status: 1, // 待人工复核
    createTime: "2026-07-17T09:30:00.000Z",
    aiAnalysisResult: JSON.stringify({
      score: 92,
      isValid: true,
      reason: "反馈描述了多人协同点餐这一具体场景下的并发同步Bug。提供了清晰的并发场景现象（菜品数量乱序、延迟同步），可信度极高。建议立即审核通过，安排测试复现。"
    }),
    reviewRemark: "",
    replyContent: "",
    replyTime: ""
  },
  {
    id: "2",
    type: 2, // 功能建议
    content: "希望前台扫码加点菜品时，能增加一个‘常用搭配推荐’的折叠区域，展示跟我目前购物车菜品绝配的饮料或者小吃，能刺激消费。",
    imageUrls: [],
    status: 5, // 已采纳
    createTime: "2026-07-16T14:20:00.000Z",
    aiAnalysisResult: JSON.stringify({
      score: 88,
      isValid: true,
      reason: "该建议属于高价值的营销功能提案，旨在提高客单价。逻辑完整清晰，具有很高的实用价值和可落地性。建议采纳并在下个季度排入开发计划。"
    }),
    reviewRemark: "高价值建议，已转交产品经理。感谢支持！",
    replyContent: "十分感谢您的宝贵建议！我们认为‘常用搭配推荐’确实是能促进商家营收、方便用户下单的绝佳设计。我们已将该提案提交给产品团队，目前正安排在后续的迭代中进行排期。为表谢意，为您发放一张50元京东E卡！",
    replyTime: "2026-07-17T09:05:00.000Z"
  },
  {
    id: "3",
    type: 1, // 体验评价
    content: "垃圾软件，点个餐还要强制我关注公众号，而且弹窗关都关不掉，用户体验极其恶劣，再也不用这个点餐了！",
    imageUrls: [],
    status: 4, // 已驳回
    createTime: "2026-07-17T08:15:00.000Z",
    aiAnalysisResult: JSON.stringify({
      score: 45,
      isValid: false,
      reason: "用户表达了对强制关注公众号这一普遍行业规范的不满，情绪化用词较多。虽指出了用户痛点，但内容没有实质性的建设性反馈，属于规则投诉。建议驳回并采用标准格式答复。"
    }),
    reviewRemark: "违反审核标准，纯属发泄情绪且与实际功能故障无关。",
    replyContent: "您好，非常抱歉给您带来了不佳的体验。强制关注公众号通常为商家的自主设置选项。我们后续将引导商家优化点餐流程，提供更便捷的游客模式。感谢您的反馈！",
    replyTime: "2026-07-17T10:12:00.000Z"
  },
  {
    id: "4",
    type: 2, // 功能建议
    content: "呼叫服务员功能只能呼叫服务，希望能细化选项：如‘加水’、‘拿餐巾纸’、‘催菜’、‘结账’。这样服务员可以直接带着相应的东西过来，省得跑两趟。",
    imageUrls: [],
    status: 0, // 待AI初审
    createTime: "2026-07-17T10:50:00.000Z",
    aiAnalysisResult: "",
    reviewRemark: "",
    replyContent: "",
    replyTime: ""
  }
];

// 补齐反馈列表
for (let i = 5; i <= 15; i++) {
  const types = [1, 2, 3];
  const statuses = [3, 4, 5];
  const type = types[i % types.length];
  const status = statuses[i % statuses.length];
  
  feedbacks.push({
    id: i.toString(),
    type: type,
    content: `这是用户提交的自动生成模拟反馈内容_${i}。内容描述了关于点餐界面排版、或者是支付流程、退单流程的局部建议，以保持开发环境的数据丰满性。`,
    imageUrls: [],
    status: status,
    createTime: new Date(Date.now() - i * 12 * 3600 * 1000).toISOString(),
    aiAnalysisResult: JSON.stringify({
      score: 70 + (i % 30),
      isValid: true,
      reason: `这是关于反馈_${i}的AI分析日志报告。模型认定此反馈具有中等合规性与参考价值。`
    }),
    reviewRemark: status === 5 ? "同意采纳，已发放小额奖励积分。" : "归档保存。",
    replyContent: status === 5 ? "感谢您的精彩建议，您的回馈是我们前进的动力！" : "感谢您的建议，我们将持续关注相关性能并适度调优。",
    replyTime: new Date(Date.now() - i * 12 * 3600 * 1000 + 3600000).toISOString()
  });
}

// 1.6 奖品卡密总账 (30条)
let prizes = [
  {
    id: "1",
    name: "京东卡 50 元",
    prizeCode: "JD-E-50-XGZ9021A",
    status: 1, // 已发放
    userId: "1001",
    feedbackId: "2",
    feedbackTitle: "希望前台扫码加点菜品时能增加推荐搭配...",
    allocateTime: "2026-07-17T09:05:00.000Z",
    createTime: "2026-07-15T08:00:00.000Z"
  },
  {
    id: "2",
    name: "京东卡 10 元",
    prizeCode: "JD-E-10-HUA9820C",
    status: 0, // 可用
    userId: "",
    feedbackId: "",
    feedbackTitle: "",
    allocateTime: "",
    createTime: "2026-07-15T08:00:00.000Z"
  },
  {
    id: "3",
    name: "美团外卖 20 元优惠券",
    prizeCode: "MT-WM20-CNY7739X",
    status: 2, // 已作废
    userId: "",
    feedbackId: "",
    feedbackTitle: "",
    allocateTime: "",
    createTime: "2026-07-16T11:00:00.000Z"
  },
  {
    id: "4",
    name: "系统会员 30 天激活码",
    prizeCode: "SYS-VIP30-8849-2019",
    status: 0, // 可用
    userId: "",
    feedbackId: "",
    feedbackTitle: "",
    allocateTime: "",
    createTime: "2026-07-17T09:30:00.000Z"
  }
];

for (let i = 5; i <= 30; i++) {
  const prizeNames = ["京东卡 10 元", "系统积分 100 额度", "精美保温杯兑换卡", "系统 VIP 7天体验卡"];
  const statuses = [0, 0, 1]; // 可用概率更高
  const name = prizeNames[i % prizeNames.length];
  const status = statuses[i % statuses.length];
  
  prizes.push({
    id: i.toString(),
    name: name,
    prizeCode: `${name.startsWith("京东") ? "JD" : "SYS"}-CODE-${100000 + i}-${Date.now().toString().slice(-4)}`,
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
      
      // 如果采纳为优质建议，自动增加发放卡密的可用库存计数
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
