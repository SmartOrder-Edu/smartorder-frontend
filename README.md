# 知序智学 - 前端

基于 Vue 3 + TypeScript + Vite 构建的 **Agent 驱动学习 OS** 前端应用。

## 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | Vue 3.4 (Composition API) |
| 语言 | TypeScript 5.3 |
| 构建 | Vite 6 |
| UI 库 | Element Plus 2.5 |
| 状态管理 | Pinia 2.1 |
| 路由 | Vue Router 4.2 |
| 样式 | SCSS |
| HTTP | Axios |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器 (端口 5172)
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

## 目录结构

```
src/
├── api/              # API 请求层
│   ├── request.ts    # 请求封装 (JWT 自动注入, 401 自动刷新)
│   └── user.ts       # 用户相关接口
├── assets/           # 静态资源
├── components/       # 公共组件
│   └── layout/       # 布局组件 (AppLayout)
├── composables/      # 组合式函数
├── directives/       # 自定义指令
├── hooks/            # 工具 hooks
├── router/           # 路由配置 (lazy-load)
├── stores/           # Pinia 状态 (app, user)
├── types/            # TypeScript 类型
├── utils/            # 工具函数
├── views/            # 页面视图 (15 个页面)
├── App.vue           # 根组件
└── main.ts           # 入口文件
```

## 路径别名

| 别名 | 路径 |
|---|---|
| `@` | `src/` |
| `@/api` | `src/api/` |
| `@/views` | `src/views/` |
| `@/components` | `src/components/` |
| `@/stores` | `src/stores/` |
| `@/router` | `src/router/` |
| `@/utils` | `src/utils/` |

## 开发代理

开发服务器 (`:5172`) 将 `/api` 请求代理到后端 `http://localhost:9015`。

## 页面路由

| 路由 | 页面 | 说明 |
|---|---|---|
| `/login` | Login | 登录 |
| `/register` | Register | 注册 |
| `/dashboard` | Dashboard | 总学习指挥台 |
| `/daily-plan` | DailyPlan | 今日总计划 |
| `/ai-tutor` | AITutor | AI 总学习伙伴 |
| `/space/:spaceId` | LearningSpace | 学习空间 |
| `/tasks` | Tasks | 任务中心 |
| `/resources` | Resources | 资源广场 |
| `/knowledge-graph` | KnowledgeGraph | 知识图谱 |
| `/exam` | Exam | 练习测评 |
| `/profile` | Profile | 成长画像 |
| `/cloud-drive` | CloudDrive | 个人云盘 |
| `/study/:taskId` | StudyExecution | 学习执行 |

## 代码规范

```bash
npm run lint        # ESLint 检查
npm run lint:fix    # ESLint 自动修复
npm run format      # Prettier 格式化
npm run type-check  # TypeScript 类型检查
```

## 环境变量

开发环境变量文件：`.env.development`

```env
VITE_API_BASE_URL=/api
```

## 构建部署

```bash
npm run build
```

构建产物输出到 `dist/`，直接部署到 Nginx 或 CDN。
