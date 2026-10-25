import type { TaskStepVO } from '@/types/learningSpace'

// ============================================================
// 洛必达法则专项练习 — 学习步骤 Mock 数据
// ============================================================

export function getMockTaskSteps(taskId: string): TaskStepVO[] {
  return [
    {
      id: `${taskId}-step-1`,
      taskId,
      title: '概念回顾',
      description: '回顾洛必达法则的基本概念和适用条件',
      stepType: 'learn',
      content: `# 洛必达法则概念回顾

## 定义

洛必达法则（L'Hôpital's Rule）是求不定式极限的重要方法。

## 适用条件

洛必达法则适用于 **0/0** 或 **∞/∞** 型的不定式极限：

1. **函数条件**：$f(x)$ 和 $g(x)$ 在点 $a$ 的某去心邻域内可导，且 $g'(x) \\neq 0$
2. **极限条件**：$\\lim_{x \\to a} f(x) = 0$ 且 $\\lim_{x \\to a} g(x) = 0$（0/0型），或两者都趋于 ∞（∞/∞型）
3. **导数极限存在**：$\\lim_{x \\to a} \\frac{f'(x)}{g'(x)}$ 存在或为 ∞

## 核心公式

$$\\lim_{x \\to a} \\frac{f(x)}{g(x)} = \\lim_{x \\to a} \\frac{f'(x)}{g'(x)}$$

## 常见误区

- **不是所有 0/0 型都能用洛必达**：必须确保导数极限存在
- **洛必达法则可以连续使用**：但每次使用前都要验证条件
- **洛必达法则可能失效**：当导数极限不存在（也不为∞）时，不能使用`,
      estimatedMinutes: 10,
      actualMinutes: null,
      status: 'pending',
      sortOrder: 1,
      resourceId: null,
    },
    {
      id: `${taskId}-step-2`,
      taskId,
      title: '例题讲解',
      description: '通过典型例题掌握洛必达法则的应用方法',
      stepType: 'learn',
      content: `# 洛必达法则典型例题

## 例1：基本 0/0 型

求 $\\lim_{x \\to 0} \\frac{\\sin x}{x}$

**解题过程：**

1. 判定类型：$\\sin 0 = 0$，$0 = 0$，属于 0/0 型 ✓
2. 应用洛必达法则：
   $$\\lim_{x \\to 0} \\frac{\\sin x}{x} = \\lim_{x \\to 0} \\frac{(\\sin x)'}{(x)'} = \\lim_{x \\to 0} \\frac{\\cos x}{1} = 1$$

---

## 例2：需要连续使用洛必达

求 $\\lim_{x \\to 0} \\frac{x - \\sin x}{x^3}$

**解题过程：**

1. 0/0 型 ✓
2. 第一次洛必达：
   $$\\lim_{x \\to 0} \\frac{1 - \\cos x}{3x^2}$$
3. 仍是 0/0 型 ✓，第二次洛必达：
   $$\\lim_{x \\to 0} \\frac{\\sin x}{6x} = \\frac{1}{6}$$

---

## 例3：∞/∞ 型

求 $\\lim_{x \\to +\\infty} \\frac{\\ln x}{x}$

**解题过程：**

1. ∞/∞ 型 ✓
2. 应用洛必达：
   $$\\lim_{x \\to +\\infty} \\frac{1/x}{1} = 0$$

> **结论**：对数函数的增长速度远慢于幂函数`,
      estimatedMinutes: 15,
      actualMinutes: null,
      status: 'pending',
      sortOrder: 2,
      resourceId: null,
    },
    {
      id: `${taskId}-step-3`,
      taskId,
      title: '专项练习',
      description: '通过练习巩固洛必达法则的应用',
      stepType: 'practice',
      content: `# 洛必达法则专项练习

## 第1题（基础）

求 $\\lim_{x \\to 0} \\frac{e^x - 1}{x}$

<details>
<summary>查看提示</summary>
属于 0/0 型，直接对分子分母分别求导。
</details>

---

## 第2题（基础）

求 $\\lim_{x \\to 0} \\frac{\\tan x}{x}$

<details>
<summary>查看提示</summary>
0/0 型，$(\\tan x)' = \\sec^2 x$。
</details>

---

## 第3题（进阶）

求 $\\lim_{x \\to 0} \\frac{x - \\arctan x}{x^3}$

<details>
<summary>查看提示</summary>
0/0 型，可能需要使用两次洛必达法则。
</details>

---

## 第4题（易错）

以下做法是否正确？

$\\lim_{x \\to 0} \\frac{x^2 \\sin \\frac{1}{x}}{x} = \\lim_{x \\to 0} \\frac{2x\\sin\\frac{1}{x} - \\cos\\frac{1}{x}}{1}$

<details>
<summary>查看分析</summary>
**不正确！** 洛必达法则要求导数极限必须存在。这里 $\\cos\\frac{1}{x}$ 在 $x \\to 0$ 时振荡无极限，因此洛必达法则不适用。应直接约分：$\\lim_{x \\to 0} x \\sin\\frac{1}{x} = 0$。
</details>

---

## 第5题（综合）

求 $\\lim_{x \\to +\\infty} \\frac{x^n}{e^x}$（$n$ 为正整数）

<details>
<summary>查看提示</summary>
∞/∞ 型，连续使用 $n$ 次洛必达法则，分子每次降一次幂，分母始终为 $e^x$。
</details>`,
      estimatedMinutes: 15,
      actualMinutes: null,
      status: 'pending',
      sortOrder: 3,
      resourceId: '3',
    },
    {
      id: `${taskId}-step-4`,
      taskId,
      title: '总结复习',
      description: '回顾本任务学习要点，查漏补缺',
      stepType: 'review',
      content: `# 洛必达法则学习总结

## 核心要点

1. **适用条件三要素**：不定式类型(0/0或∞/∞) + 可导条件 + 导数极限存在
2. **可连续使用**：每次使用前重新验证条件
3. **可能失效**：导数极限不存在时不能使用，需换其他方法

## 常见错误

| 错误类型 | 示例 | 正确做法 |
|---------|------|---------|
| 未验证条件就直接使用 | 振荡函数极限 | 先检查导数极限是否存在 |
| 忘记检查是否为不定式 | 非0/0或∞/∞型 | 先化简或用其他方法 |
| 忽略等价无穷小替代 | 简单极限用洛必达 | 能用等价无穷小替代的优先用 |

## 洛必达法则 vs 其他方法

- **等价无穷小**：简单极限优先使用
- **泰勒展开**：更精确的展开，适合求高阶项
- **夹逼定理**：洛必达不适用时的替代方案

## 下一步建议

- ✅ 完成本次练习后，Agent 将根据正确率调整后续计划
- 📝 错误较多的题目类型会被加入错题本
- 🎯 下一个学习目标：连续与间断`,
      estimatedMinutes: 5,
      actualMinutes: null,
      status: 'pending',
      sortOrder: 4,
      resourceId: null,
    },
  ]
}
