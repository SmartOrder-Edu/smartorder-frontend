import type {
  CanvasContent,
  MasteryJudge,
  ScriptStep,
  StudyChatMessage,
  StudyMode,
  TeachingSegment,
} from '@/types/study'

// ============================================================
// 学习会话（Study Session）Mock 数据生成
// 对应讨论方案的 6 阶段学习脚本：
//   1.回顾前置 → 2.动态例子 → 3.跟做例题 → 4.掌握判断 → 5.提高/补基础 → 6.总结
// ============================================================

export function getMockScriptSteps(taskId: string): ScriptStep[] {
  const t = `${taskId}`
  return [
    {
      id: `${t}-s1`,
      phase: 'review',
      title: '回顾前置概念',
      subtitle: '极限定义 · 函数可导性',
      estimatedMinutes: 8,
      status: 'pending',
      canvasType: 'concept',
    },
    {
      id: `${t}-s2`,
      phase: 'example',
      title: '看一个动态例子',
      subtitle: '0/0 型不定式如何化简',
      estimatedMinutes: 10,
      status: 'pending',
      canvasType: 'example',
    },
    {
      id: `${t}-s3`,
      phase: 'practice',
      title: '跟做一道题',
      subtitle: 'sin x / x 求极限',
      estimatedMinutes: 10,
      status: 'pending',
      canvasType: 'practice',
    },
    {
      id: `${t}-s4`,
      phase: 'assessment',
      title: '系统判断掌握情况',
      subtitle: '一道易错题检验',
      estimatedMinutes: 8,
      status: 'pending',
      canvasType: 'assessment',
    },
    {
      id: `${t}-s5`,
      phase: 'advanced',
      title: '进入提高题 / 补基础',
      subtitle: '根据掌握情况自适应',
      estimatedMinutes: 12,
      status: 'pending',
      canvasType: 'derivation',
    },
    {
      id: `${t}-s6`,
      phase: 'summary',
      title: '本次总结与画像更新',
      subtitle: 'Agent 整理本次学习记录',
      estimatedMinutes: 5,
      status: 'pending',
      canvasType: 'summary',
    },
  ]
}

export function getMockCanvasContent(step: ScriptStep, mode: StudyMode): CanvasContent {
  const base = getBaseContent(step, mode)
  const teachingFlow = getMockTeachingFlow(step, mode)
  return { ...base, teachingFlow }
}

function getBaseContent(step: ScriptStep, mode: StudyMode): Omit<CanvasContent, 'teachingFlow'> {
  switch (step.canvasType) {
    case 'concept':
      return {
        type: 'concept',
        markdown: `# 回顾：极限与可导性

学习洛必达法则前，Agent 先带你回顾两个前置概念。

## 1. 极限的严谨定义

函数 $f(x)$ 在 $x \\to a$ 时的极限为 $L$，记作 $\\lim_{x \\to a} f(x) = L$。

直观理解：当 $x$ 越来越接近 $a$ 时，$f(x)$ 越来越接近 $L$。

## 2. 函数可导

$f(x)$ 在点 $a$ 处可导，等价于极限 $\\lim_{x \\to a} \\frac{f(x)-f(a)}{x-a}$ 存在。

> Agent 判断：你在基本极限定义上掌握稳定，但**对"去心邻域"的理解**有偏差。本次会重点澄清。`,
        mermaid: `flowchart LR
  A[极限定义] --> B[连续性]
  A --> C[可导性]
  B --> D[洛必达法则<br/>适用条件]
  C --> D`,
        agentNote: 'Agent：注意"去心邻域"——洛必达不要求函数在 a 点本身有定义。',
      }
    case 'example':
      return {
        type: 'example',
        markdown: `# 动态例子：0/0 型从何而来

观察 $f(x) = \\sin x$ 与 $g(x) = x$ 在 $x \\to 0$ 时的行为。`,
        exampleSteps: [
          {
            id: 'ex1',
            label: '代入 x = 0',
            markdown: `代入 $x = 0$：

- 分子 $\\sin 0 = 0$
- 分母 $0 = 0$

得到 $\\frac{0}{0}$，这是**不定式**，不能直接得出极限。`,
          },
          {
            id: 'ex2',
            label: '观察趋势',
            markdown: `取 $x$ 趋近 0 时的若干值：

| $x$ | $\\sin x$ | $\\sin x / x$ |
|----|---------|--------------|
| 0.1 | 0.0998 | 0.9983 |
| 0.01 | 0.0099998 | 0.99998 |
| 0.001 | 0.0009999998 | 0.99999998 |

比值趋向 **1**。`,
          },
          {
            id: 'ex3',
            label: '用洛必达法则验证',
            markdown: `分子分母分别求导：

$$\\frac{(\\sin x)'}{(x)'} = \\frac{\\cos x}{1} \\to 1 \\quad (x \\to 0)$$

洛必达法则给出同样结果 ✓`,
          },
        ],
      }
    case 'practice':
      return {
        type: 'practice',
        markdown: `# 跟做一道题

Agent 给你一道基础题，做完提交，Agent 会判断你的掌握情况。`,
        question: {
          id: 'pq1',
          prompt: '求下列极限',
          body: `求 $\\lim_{x \\to 0} \\dfrac{e^x - 1}{x}$。

提示：判断是否为 0/0 型，再考虑洛必达法则。`,
          answer: '1',
          hint: '分子分母在 x=0 处都为 0，属于 0/0 型。对分子分母分别求导。',
          errorExplanation: `**正确解法：**

1. 判型：$e^0 - 1 = 0$，$0 = 0$，属于 0/0 型 ✓
2. 应用洛必达：
   $$\\lim_{x \\to 0} \\frac{(e^x - 1)'}{(x)'} = \\lim_{x \\to 0} \\frac{e^x}{1} = 1$$

**你可能的错误**：忘记验证是否为不定式，或对 $e^x$ 求导不熟。Agent 已记录。`,
        },
      }
    case 'assessment':
      return {
        type: 'assessment',
        markdown: `# 掌握判断：一道易错题

下面这题，**洛必达法则是否适用**？回答"适用"或"不适用"。`,
        question: {
          id: 'aq1',
          prompt: '判断洛必达法则是否适用',
          body: `求 $\\lim_{x \\to 0} \\dfrac{x^2 \\sin \\frac{1}{x}}{x}$。

有人写出：
$$\\lim_{x \\to 0} \\frac{2x\\sin\\frac{1}{x} - \\cos\\frac{1}{x}}{1}$$

这一步洛必达是否适用？`,
          answer: '不适用',
          hint: '关键看导数极限是否存在。$\\cos\\frac{1}{x}$ 在 $x\\to 0$ 时表现如何？',
          errorExplanation: `**不适用！**

洛必达法则要求 $\\lim \\frac{f'(x)}{g'(x)}$ **存在或为 ∞**。

这里 $\\cos\\frac{1}{x}$ 在 $x \\to 0$ 时**振荡无极限**，导数极限不存在，洛必达法则**不适用**。

**正确做法**：直接约分
$$\\lim_{x \\to 0} x \\sin\\frac{1}{x} = 0 \\quad (\\text{无穷小} \\times \\text{有界量})$$

**Agent 提醒**：这是高频错误点，已加入你的画像"洛必达适用条件"薄弱项。`,
        },
      }
    case 'derivation':
      return {
        type: 'derivation',
        markdown: `# 提高：洛必达与泰勒展开的协作

当洛必达法则需要多次使用时，**泰勒展开**往往更高效。

## 推导

求 $\\lim_{x \\to 0} \\frac{x - \\sin x}{x^3}$

**方法一：洛必达（3 次）**

$$\\frac{1-\\cos x}{3x^2} \\to \\frac{\\sin x}{6x} \\to \\frac{\\cos x}{6} = \\frac{1}{6}$$

**方法二：泰勒展开**

$\\sin x = x - \\frac{x^3}{6} + o(x^3)$，代入：

$$\\frac{x - (x - \\frac{x^3}{6} + o(x^3))}{x^3} = \\frac{\\frac{x^3}{6} + o(x^3)}{x^3} \\to \\frac{1}{6}$$

> Agent 建议：**能泰勒就别连用洛必达**，更不易错。`,
        agentNote: 'Agent：泰勒展开是你下一阶段要重点练的替代方法。',
      }
    case 'summary':
      return {
        type: 'summary',
        markdown: `# 本次学习总结

## 你完成了什么
- 回顾了极限与可导性两个前置概念
- 通过动态例子理解了 0/0 型的来源
- 跟做 1 道基础题 + 1 道易错判断题
- 学习了洛必达与泰勒展开的协作思路

## Agent 画像更新
- ✅ **掌握稳定**：0/0 型基础应用
- ⚠️ **仍需巩固**：洛必达适用条件（振荡型导数极限）
- 🎯 **下一步建议**：练习 3 道泰勒展开题，巩固替代方法

## 学习记录
本次学习已保存到学习记录，将影响下次会话的难度与节奏。`,
      }
  }
}

// ============================================================
// v2: 分段式教学流 Mock（Agent 主动教学交互）
// ============================================================

export function getMockTeachingFlow(step: ScriptStep, mode: StudyMode): { segments: TeachingSegment[]; currentSegmentIndex: number; isActive: boolean; isPaused: boolean } {
  const id = step.id
  switch (step.canvasType) {
    case 'concept':
      return makeFlow([
        { id: `${id}-c1`, type: 'text', markdown: '学习洛必达法则前，Agent 先带你回顾两个前置概念。', autoAdvanceMs: 3500, agentCommentary: '我们先回顾一下极限的定义，这是洛必达法则的基石。' },
        { id: `${id}-c2`, type: 'formula', markdown: '## 1. 极限的严谨定义\n\n函数 $f(x)$ 在 $x \\to a$ 时的极限为 $L$，记作 $\\lim_{x \\to a} f(x) = L$。\n\n直观理解：当 $x$ 越来越接近 $a$ 时，$f(x)$ 越来越接近 $L$。\n\n> Agent 提示：极限关心的是**趋近过程**，不要求函数在 a 点本身有定义。', autoAdvanceMs: 5500, agentCommentary: '记住，极限关心的是"趋近过程"，不要求函数在 a 点本身有定义。' },
        { id: `${id}-c3`, type: 'text', markdown: '## 2. 函数可导\n\n$f(x)$ 在点 $a$ 处可导，等价于极限 $\\lim_{x \\to a} \\frac{f(x)-f(a)}{x-a}$ 存在。\n\n可导本质上也是一个极限是否存在的问题——这就是洛必达法则为什么依赖于可导性。', autoAdvanceMs: 5000, agentCommentary: '可导本质上也是一个极限是否存在的问题。' },
        { id: `${id}-c4`, type: 'diagram', markdown: '```mermaid\nflowchart LR\n  A[极限定义] --> B[连续性]\n  A --> C[可导性]\n  B --> D[洛必达法则<br/>适用条件]\n  C --> D\n```', focusTarget: { selector: '.mermaid-block', effect: 'glow-border', scroll: 'smooth' }, autoAdvanceMs: 0, agentCommentary: '看这张关系图——注意"去心邻域"那条线，这是很多同学踩坑的地方。' },
        { id: `${id}-c5`, type: 'quiz', markdown: '', quiz: { id: 'inline-q1', prompt: '洛必达法则的适用前提之一是极限必须为哪种类型？', answerType: 'single_select', options: [{ label: '0/0 或 ∞/∞ 型不定式', value: 'a' }, { label: '只要是分数形式就行', value: 'b' }, { label: '只要分子或分母趋于 0', value: 'c' }], correctAnswer: 'a', explanation: '**正确！** 洛必达法则要求极限为 **0/0 或 ∞/∞** 不定式。其他类型需要先变形为这两种之一。\n\n这是洛必达法则最核心的前提条件。' }, autoAdvanceMs: 0, agentCommentary: '来个课前小测，看你记不记得洛必达的前提条件。' },
        { id: `${id}-c6`, type: 'text', markdown: '> Agent 判断：你在基本极限定义上掌握稳定，但对**"去心邻域"**的理解有偏差。\n>\n> 洛必达不要求函数在 a 点有定义——只需要在 a 的去心邻域内可导即可。本次后续步骤会重点澄清这一点。', autoAdvanceMs: 0, agentCommentary: '这一步回顾完成了。准备好了点击"继续"进入动态例子。' },
      ])
    case 'example':
      return makeFlow([
        { id: `${id}-e1`, type: 'text', markdown: '## 观察一个 0/0 型的诞生\n\n给定 $f(x)=\\sin x$，$g(x)=x$，来看看当 $x \\to 0$ 时会发生什么。', autoAdvanceMs: 4000, agentCommentary: '我们先看一个最经典的 0/0 型例子。' },
        { id: `${id}-e2`, type: 'text', markdown: '### 第 1 步：代入 x=0\n\n分子 $\\sin 0 = 0$，分母 $0 = 0$\n\n得到 $\\frac{0}{0}$，这是**不定式**——不能直接得出极限值。', autoAdvanceMs: 4500, agentCommentary: '代入之后得到 0/0，这就是所谓的不定式。' },
        { id: `${id}-e3`, type: 'text', markdown: '### 第 2 步：观察趋势\n\n| $x$ | $\\sin x$ | $\\frac{\\sin x}{x}$ |\n|-----|---------|----|\n| 0.1 | 0.0998 | 0.9983 |\n| 0.01 | 0.0099998 | 0.99998 |\n| 0.001 | ~0.001 | ~1 |\n\n**比值趋向 1！**', autoAdvanceMs: 5000, agentCommentary: '看这个表格——随着 x 越来越小，比值越来越接近 1。' },
        { id: `${id}-e4`, type: 'formula', markdown: '### 第 3 步：洛必达验证\n\n$$\\lim_{x \\to 0} \\frac{\\sin x}{x} = \\lim_{x \\to 0} \\frac{(\\sin x)\'}{(x)\'} = \\lim_{x \\to 0} \\frac{\\cos x}{1} = 1$$\n\n洛必达法则给出了完全一致的结果 ✓', autoAdvanceMs: 0, agentCommentary: '用洛必达法则验证，结果一致。这个例子记住——它是整个 0/0 型处理的基础模板。' },
      ])
    case 'practice':
      return makeFlow([
        { id: `${id}-p1`, type: 'text', markdown: '## 跟做练习\n\nAgent 给你出一道基础题，**请跟着一起算**。\n\n现在看题面：\n\n求 $\\lim_{x \\to 0} \\dfrac{e^x - 1}{x}$', autoAdvanceMs: 4000, agentCommentary: '来，跟着我做一道题。先自己想想能不能判断出是什么类型。' },
        { id: `${id}-p2`, type: 'quiz', markdown: '', quiz: { id: 'inline-q2', prompt: '这道题 x→0 时，分子分母分别趋于多少？（判断类型）', answerType: 'single_select', options: [{ label: '都是 0，属于 0/0 型', value: 'a' }, { label: '都是 ∞，属于 ∞/∞ 型', value: 'b' }, { label: '一个趋于 0，一个趋于 ∞', value: 'c' }], correctAnswer: 'a', explanation: '**正确！** $e^0 - 1 = 0$，$0 = 0$，属于 **0/0 型**，满足洛必达法则前提。\n\n下一步就是用洛必达：对分子分母分别求导。' }, autoAdvanceMs: 0, agentCommentary: '先不急求导——先判断类型，这是使用洛必达法则的第一步。' },
        { id: `${id}-p3`, type: 'formula', markdown: '## 用洛必达法则\n\n判型：0/0 ✓\n\n对分子分母分别求导：\n\n$$\\lim_{x \\to 0} \\frac{(e^x - 1)\'}{(x)\'} = \\lim_{x \\to 0} \\frac{e^x}{1} = e^0 = 1$$\n\n**答案为 1。**', autoAdvanceMs: 0, agentCommentary: '答案就是 1。记住 $e^x$ 的导数还是 $e^x$，这是高频考点。' },
      ])
    case 'assessment':
      return makeFlow([
        { id: `${id}-a1`, type: 'text', markdown: '## 掌握判断：一道陷阱题\n\n下面这道题，有人用洛必达法则做了——但**做得对吗**？\n\n> 求 $\\lim_{x \\to 0} \\dfrac{x^2 \\sin \\frac{1}{x}}{x}$', autoAdvanceMs: 4500, agentCommentary: '这道题很多人会做错，注意它的陷阱在哪里。' },
        { id: `${id}-a2`, type: 'formula', markdown: '有人这样写：\n\n$$\\lim_{x \\to 0} \\frac{x^2 \\sin \\frac{1}{x}}{x} = \\lim_{x \\to 0} \\frac{2x\\sin\\frac{1}{x} - \\cos\\frac{1}{x}}{1}$$\n\n你觉得——**这一步洛必达用得对吗**？', autoAdvanceMs: 2500, agentCommentary: '看看这个求导过程，你觉得有问题吗？' },
        { id: `${id}-a3`, type: 'quiz', markdown: '', quiz: { id: 'inline-q3', prompt: '上一步的洛必达法则用得对吗？', answerType: 'single_select', options: [{ label: '对，可以用洛必达', value: 'a' }, { label: '不对，洛必达不适用于这道题', value: 'b' }], correctAnswer: 'b', explanation: '**答对了！这里不能用洛必达。**\n\n洛必达法则要求 $\\lim \\frac{f\'(x)}{g\'(x)}$ **存在或为 ∞**。\n\n但 $\\cos\\frac{1}{x}$ 在 $x \\to 0$ 时**疯狂振荡**，导数极限不存在。\n\n**正确做法**：直接约分 → $\\lim_{x \\to 0} x \\sin\\frac{1}{x} = 0$（无穷小 × 有界量）\n\n> Agent 已记录：你在洛必达适用条件判定上仍需巩固。' }, autoAdvanceMs: 0, agentCommentary: '这道题的关键是：洛必达不仅要求是 0/0 型，还要求导数极限必须存在。' },
      ])
    case 'derivation':
      return makeFlow([
        { id: `${id}-d1`, type: 'text', markdown: '## 洛必达 vs 泰勒展开\n\n当洛必达法则需要多次使用时，**泰勒展开往往更高效**。\n\n我们来对比一道需要 3 次洛必达的题：\n\n求 $\\lim_{x \\to 0} \\dfrac{x - \\sin x}{x^3}$', autoAdvanceMs: 5000, agentCommentary: '多次洛必达容易出错，泰勒展开是更好的替代。' },
        { id: `${id}-d2`, type: 'formula', markdown: '### 方法一：洛必达（3 次）\n\n$$\\frac{1-\\cos x}{3x^2} \\xrightarrow{L} \\frac{\\sin x}{6x} \\xrightarrow{L} \\frac{\\cos x}{6} = \\frac{1}{6}$$\n\n三连洛必达，步骤多、容易漏条件。', autoAdvanceMs: 5000, agentCommentary: '洛必达三次，每一步都要重新验证条件——繁琐且容易出错。' },
        { id: `${id}-d3`, type: 'formula', markdown: '### 方法二：泰勒展开\n\n$\\sin x = x - \\dfrac{x^3}{6} + o(x^3)$\n\n代入：\n\n$$\\frac{x - (x - \\frac{x^3}{6} + o(x^3))}{x^3} = \\frac{\\frac{x^3}{6} + o(x^3)}{x^3} \\to \\frac{1}{6}$$\n\n**一步到位！**', autoAdvanceMs: 0, agentCommentary: '泰勒展开一步到位。我的建议是：能用泰勒就不用连用洛必达。' },
      ])
    case 'summary':
      return makeFlow([
        { id: `${id}-su1`, type: 'text', markdown: '## 本次学习总结\n\nAgent 整理了你在本次学习中的表现。', autoAdvanceMs: 3500, agentCommentary: '本次学习结束了，我来做个小结。' },
        { id: `${id}-su2`, type: 'text', markdown: '### 你完成了什么\n- ✅ 回顾了极限与可导性两个前置概念\n- ✅ 通过动态例子理解了 0/0 型的来源\n- ✅ 跟做 1 道基础题 + 1 道易错判断题\n- ✅ 学习了洛必达与泰勒展开的协作思路', autoAdvanceMs: 4000, agentCommentary: '看起来你今天效率很高，四个知识模块都覆盖到了。' },
        { id: `${id}-su3`, type: 'text', markdown: '### Agent 画像更新\n- ✅ **掌握稳定**：0/0 型基础应用\n- ⚠️ **仍需巩固**：洛必达适用条件（振荡型导数极限）\n- 🎯 **下一步建议**：练习 3 道泰勒展开题，巩固替代方法\n\n本次学习已保存到学习记录，将影响下次会话的难度与节奏。', autoAdvanceMs: 0, agentCommentary: '画像已更新。你最大的薄弱点是"洛必达适用条件判定"——下次学习会重点练这块。' },
      ])
  }
}

function makeFlow(segments: TeachingSegment[]): { segments: TeachingSegment[]; currentSegmentIndex: number; isActive: boolean; isPaused: boolean } {
  return { segments, currentSegmentIndex: 0, isActive: false, isPaused: false }
}

export function getMockMasteryJudge(mode: StudyMode): MasteryJudge {
  if (mode === 'assessment') {
    return {
      level: 'progressing',
      levelLabel: '初步掌握',
      hint: 'Agent 判断：0/0 型基础应用稳定，但洛必达适用条件判定仍易错。',
      nextSuggestion: '建议进入"专项突破"模式，针对适用条件做 3 道判断题。',
    }
  }
  if (mode === 'review') {
    return {
      level: 'progressing',
      levelLabel: '仍需巩固',
      hint: 'Agent 判断：你回忆起了主要步骤，但洛必达的适用条件记得不牢。',
      nextSuggestion: '推荐重做第 4 步的易错判断题。',
    }
  }
  if (mode === 'breakthrough') {
    return {
      level: 'weak',
      levelLabel: '需补基础',
      hint: 'Agent 判断：连续 3 次在适用条件上出错，需要回到极限定义本身。',
      nextSuggestion: '建议回到"回顾前置概念"步骤，重看 mermaid 图。',
    }
  }
  return {
    level: 'progressing',
    levelLabel: '初步掌握',
    hint: 'Agent 判断：你已掌握基本概念，但在洛必达适用条件上连续出错。',
    nextSuggestion: '完成本次总结后，进入提高题或预约一次专项测评。',
  }
}

export function getInitialChatMessages(): StudyChatMessage[] {
  return [
    {
      id: 'sys-1',
      role: 'agent',
      text: '你好，我是本次学习的 Agent 伙伴。我会带你从**回顾前置概念**开始，一步一步走到本次总结。\n\n随时点击右侧按钮告诉我你的感受，我会调整讲解节奏。',
      markdown: true,
      createTime: Date.now(),
    },
  ]
}

/** 反馈类型对应的 mock Agent 回复 */
export function getMockFeedbackReply(type: string): string {
  const map: Record<string, string> = {
    dont_understand: '我换个更直白的说法：洛必达的本质是"用导数比代替函数比"，前提是这个代替后的极限得**真的存在**。如果导数比极限振荡，"代替"就失败了。',
    slower: '好的，我把节奏放慢。我们停在当前这一步，你可以先消化一下，准备好了再点"下一步"。',
    another_example: '换个例子：求 $\\lim_{x \\to 0} \\frac{1-\\cos x}{x^2}$，这是 0/0 型，用一次洛必达得到 $\\frac{\\sin x}{2x} \\to \\frac{1}{2}$。',
    draw_diagram: '我画一张图：\n\n```mermaid\nflowchart TD\n  A[代入得 0/0 或 ∞/∞?] -->|否| B[不能用洛必达]\n  A -->|是| C[导数极限存在?]\n  C -->|否| D[不能用洛必达]\n  C -->|是| E[可用洛必达]\n```',
    similar_question: '再来一道类似题：求 $\\lim_{x \\to 0} \\frac{\\ln(1+x)}{x}$，答案也是 1。提示：0/0 型，一次洛必达即可。',
    already_mastered: '收到，Agent 已标记本知识点为"初步掌握"，本次脚本会跳过提高题，直接进入总结。',
    add_review: '已加入复习计划：本知识点将在 3 天后通过"今日学习启动"再次出现，巩固长期记忆。',
    skip: '已跳过当前知识点。Agent 已记录，会在下次会话开头补一次快速检验。',
  }
  return map[type] || '收到你的反馈，Agent 正在调整讲解…'
}
