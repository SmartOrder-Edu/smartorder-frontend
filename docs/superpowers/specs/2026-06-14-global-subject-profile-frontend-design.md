# 全局与单科画像前端适配设计

## 目标

将前端从旧的单画像接口迁移到后端最新的全局画像与单科画像接口，并重构成长画像页面，使接口调用、初始化状态、画像展示和 Agent 科目上下文保持一致。

本次完整联调范围包括：

- `/profile` 成长画像页面。
- Onboarding 全局画像初始化。
- 用户 Store 中的画像初始化状态。
- AI Tutor 中可信学习空间 `subjectId` 的传递。

## 接口契约

前端只使用以下接口：

- `GET /student-profile/global`
- `PUT /student-profile/global`
- `POST /student-profile/global/init`
- `GET /student-profile/subjects`
- `GET /student-profile/subjects/{subjectId}`
- `PUT /student-profile/subjects/{subjectId}`

旧的 `GET/PUT /student-profile` 与 `POST /student-profile/init` 不再调用。

`profileInitialized` 根据全局画像判断：存在非空 `learningBackground`、`learningGoals`，或 `profileConfidenceScore > 0` 时视为已初始化。空画像不会误判为已完成引导。

## 页面结构

画像页采用“全局概览 + 单科档案”两层信息架构：

1. 顶部 Hero 展示用户身份、当前目标和全局画像置信度。
2. 指标区展示画像完整度、活跃科目、每日学习时间和最近更新时间。
3. 全局画像展示学习背景、学习目标、综合能力、学习偏好和跨科易错模式。
4. 单科画像通过真实学习空间切换，展示知识点掌握、学习行为、当前状态和具体易错模式。
5. `subjectId` 暂按学习空间 ID 关联名称；无法匹配时显示 `科目 #ID`，不阻塞页面。
6. 页面提供加载、错误、空画像和空单科画像状态，不使用硬编码伪数据填充真实画像区域。

视觉采用温暖纸张感的浅色工作台：深蓝文字、青绿色成长强调、琥珀色风险提示，保留现有全局设计变量并避免紫色渐变模板感。

## 数据映射

新增纯函数映射层，负责：

- 0-1 与 0-100 分值统一为百分比。
- 枚举值转中文标签。
- 全局能力条目与单科知识点条目提取。
- 学习目标、偏好、易错模式和行为指标容错读取。
- 学习空间名称与 `subjectId` 关联。
- 时间与空值格式化。

页面只消费映射后的展示模型，避免在模板中散落 JSON 结构判断。

## 数据流

画像页加载时并行发起以下读取：

- 获取当前用户信息。
- 获取全局画像。
- 获取全部单科画像。
- 获取活跃学习空间。

全局画像和单科画像独立处理失败状态。全局画像失败时显示整页重试状态；单科画像或学习空间失败时仍展示可用的全局画像，并在单科区域提示暂不可用。

Onboarding 调用 `POST /student-profile/global/init` 后重新获取用户信息和全局画像，由真实画像字段更新 `profileInitialized`，不依赖本地伪状态作为成功结果。

## Agent 上下文

`AgentChatRequest` 增加可选 `subjectId`。AI 学习伙伴的上下文选项改为真实学习空间列表：

- 全局学习：不发送 `subjectId`。
- 指定学习空间：发送该空间 ID 作为 `subjectId`。
- 从 `/space/{spaceId}` 跳转到 `/ai-tutor?spaceId=...` 时自动选择对应上下文。

## 错误处理

- 全局画像请求失败时显示错误卡片和重试按钮。
- 单科画像请求失败时保留全局画像，并单独提示单科数据暂不可用。
- 单个 JSON 维度缺失时显示“待积累”，不抛出运行时异常。
- 无全局画像时引导用户进入 Onboarding；无单科画像时说明画像将在学习空间活动后逐步生成。
- API 返回空数组、空对象、`null` 或未知枚举值时均提供稳定回退文本。
- 更新接口保留乐观锁所需的 `profileVersion` 字段。

## 验证

- Node 测试覆盖接口路径、初始化判断、分值归一化、能力/知识点映射和 Agent `subjectId` 请求体。
- Vue SFC 编译验证画像页模板和脚本。
- 运行 `vue-tsc --noEmit` 与 Vite 构建；若存在历史噪声，单独记录并保留本次聚焦测试结果。

## 验收标准

- 前端不再调用旧的 `/student-profile` 与 `/student-profile/init`。
- 全局画像和单科画像字段与后端实体保持一致。
- Onboarding 完成后，路由守卫依据真实全局画像判断初始化状态。
- AI Tutor 在选择学习空间时发送正数 `subjectId`，选择全局上下文时不发送。
- `/profile` 在有数据、空数据、部分失败、完全失败和移动端宽度下均可正常使用。
- 聚焦测试、画像页 SFC 编译、类型检查和生产构建完成验证；历史问题与本次回归分开报告。
