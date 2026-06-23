import type {
  CanvasContent,
  MasteryJudge,
  ScriptStep,
  StudyChatMessage,
  StudyMode,
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
