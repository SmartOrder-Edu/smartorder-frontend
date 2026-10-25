import type { WeeklyReportResponse } from '@/types/learningReport'

/**
 * 学习周报 mock 数据
 * TODO: 后端接口就绪后改为 return request.get<WeeklyReportResponse>('/learning-report/weekly')
 */
const mockResponse: WeeklyReportResponse = {
  report: {
    studentName: '谢同学',
    range: '07/10 - 07/16',
    mainConclusion: '本周你的"链表基础"掌握明显提升，但"递归调用栈"仍存在步骤缺失问题。',
    metrics: [
      { label: '学习天数', value: '6 天' },
      { label: '累计时长', value: '8.5 h' },
      { label: '完成任务', value: '18' },
      { label: '完成练习', value: '64' },
      { label: '掌握知识点', value: '12' },
      { label: '待巩固', value: '4' },
    ],
    trend: [
      { day: 'D1', value: 42 },
      { day: 'D2', value: 48 },
      { day: 'D3', value: 54 },
      { day: 'D4', value: 57 },
      { day: 'D5', value: 63 },
      { day: 'D6', value: 71 },
      { day: 'D7', value: 76 },
    ],
    mastery: [
      { name: '链表遍历', start: 46, current: 82, delta: 36 },
      { name: '链表反转', start: 38, current: 69, delta: 31 },
      { name: '递归调用栈', start: 44, current: 41, delta: -3 },
      { name: '二叉树遍历', start: 52, current: 60, delta: 8 },
    ],
    weaknesses: [
      { rank: '01', name: '递归调用栈', reason: '主要错因：步骤缺失。能说出大方向，但容易漏掉返回过程。', count: 4, trend: '仍需加强', risk: 'high' },
      { rank: '02', name: 'SQL 多表连接', reason: '主要错因：条件误用。连接条件和筛选条件混在一起。', count: 3, trend: '较上周减少 40%', risk: 'medium' },
      { rank: '03', name: '链表指针更新', reason: '主要错因：细节遗漏。更新顺序偶尔导致断链。', count: 2, trend: '已明显改善', risk: 'low' },
    ],
    causes: [
      { title: '步骤缺失', desc: '你知道解题方向，但在执行链路中容易跳过关键中间状态。' },
      { title: '条件误用', desc: '你对知识点有基本理解，但在具体适用条件上判断不稳定。' },
      { title: '细节遗漏', desc: '不是不会，而是编码或推导时缺少最后一轮校验。' },
    ],
    adjustments: [
      { time: '周一 20:12', title: '补齐前置缺口', action: '检测到"递归调用栈"影响二叉树遍历，已插入 15 分钟复习任务。', status: '已执行' },
      { time: '周二 18:40', title: '增加验证题', action: '"链表反转"掌握度提升但证据不足，已增加 1 道过程追踪题。', status: '已完成' },
      { time: '周三 21:05', title: '调整题目难度', action: '连续答对 3 道基础题后，后续题目难度从 2 级调整到 3 级。', status: '生效中' },
      { time: '周五 09:30', title: '安排遗忘复习', action: '"数据库事务"进入高遗忘风险，已安排周四轻量复习。', status: '已加入计划' },
      { time: '周六 22:16', title: '修正任务时长', action: '编程题实际用时偏长，下周同类任务估时已从 25 分钟修正为 35 分钟。', status: '已更新' },
    ],
    reviewRisks: [
      { name: '数据库事务', risk: 'high', advice: '建议明天复习', status: '已加入计划' },
      { name: '链表反转', risk: 'medium', advice: '3 天后轻量验证', status: '待确认' },
      { name: '栈和队列', risk: 'low', advice: '暂不安排', status: '观察中' },
    ],
    nextWeek: [
      '优先修复递归调用栈的步骤执行问题',
      '完成链表反转验证练习，确认掌握稳定性',
      '对数据库事务进行一次短时复习，降低遗忘风险',
    ],
    nextWeekSummary: '下周前两天将以"补前置 + 验证练习"为主，后半周恢复正常学习推进。',
    agentSummary: '本周你的链表基础掌握明显提升，说明你在基础结构理解上进步很快。当前最需要继续修复的是递归调用栈的步骤执行问题，系统已经为你安排好了下周前两天的重点任务。',
    grades: [
      { label: '学习状态', value: '稳步进步' },
      { label: '计划执行度', value: '较高' },
      { label: '节奏建议', value: '补弱后推进' },
    ],
  },
  evidenceMap: {
    mastery: {
      title: '掌握度如何评估',
      items: [
        { label: '输入数据', value: '任务完成记录、练习正确率、答题耗时、同类题连续表现和最近复习间隔。' },
        { label: '计算方式', value: '用最近表现提高权重，结合知识点前后置关系，避免单次答对直接判定为已掌握。' },
        { label: '可靠度', value: '当同一知识点有多次练习、测评和复习记录时，判断可靠度会提高。' },
      ],
    },
    weakness: {
      title: '错因如何归类',
      items: [
        { label: '步骤缺失', value: '题目思路正确，但过程记录或答案中缺少关键中间状态。' },
        { label: '条件误用', value: '概念能识别，但在适用条件、边界条件或题目场景迁移时发生偏差。' },
        { label: '细节遗漏', value: '主体思路稳定，错误集中在符号、顺序、指针更新或最后校验。' },
      ],
    },
    adjustments: {
      title: '系统为什么调整计划',
      items: [
        { label: '路径调整', value: '当前知识点依赖的前置能力不稳定时，系统会插入短复习任务。' },
        { label: '难度调整', value: '连续稳定答对后提升难度；出现高置信错因时降低推进速度。' },
        { label: '估时修正', value: '使用实际学习时长回写同类任务估时，减少后续计划过载。' },
      ],
    },
    review: {
      title: '复习优先级如何排序',
      items: [
        { label: '遗忘风险', value: '综合上次复习时间、掌握度、最近错因和知识点重要性。' },
        { label: '下周策略', value: '优先安排高风险且影响后续学习路径的知识点，再补充轻量验证任务。' },
        { label: '执行承接', value: '高风险项会直接进入计划，低风险项保持观察，不打断当前主线。' },
      ],
    },
  },
}

export const learningReportApi = {
  /** 获取最近 7 天学习周报 */
  getWeeklyReport(): Promise<WeeklyReportResponse> {
    // TODO: 后端就绪后改为 return request.get<WeeklyReportResponse>('/learning-report/weekly')
    return Promise.resolve(mockResponse)
  },
}

export default learningReportApi
