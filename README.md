# Vue 3 + TypeScript + Webpack 项目模板

一个基于 Vue 3、TypeScript 和 Webpack 的前端项目模板，集成 Element Plus UI 组件库和 Pinia 状态管理。

## 技术栈

- **Vue 3.4+** - 渐进式 JavaScript 框架
- **TypeScript 5.3+** - JavaScript 的超集
- **Webpack 5.89+** - 模块打包工具
- **Vue Router 4.2+** - Vue.js 官方路由
- **Pinia 2.1+** - Vue 3 状态管理库
- **Element Plus 2.5+** - Vue 3 UI 组件库
- **Axios 1.6+** - HTTP 客户端
- **Sass** - CSS 预处理器
- **ESLint + Prettier** - 代码规范

## 项目结构

```
vue3-ts-webpack/
├── public/                    # 静态资源
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── api/                   # API 接口
│   │   ├── request.ts         # Axios 封装
│   │   └── user.ts            # 用户相关接口
│   ├── assets/                # 资源文件
│   │   ├── images/
│   │   ├── styles/
│   │   │   ├── index.scss     # 全局样式
│   │   │   └── variables.scss # SCSS 变量
│   │   └── fonts/
│   ├── components/            # 公共组件
│   ├── composables/           # 组合式函数
│   │   └── useWindowSize.ts
│   ├── directives/            # 自定义指令
│   │   ├── index.ts
│   │   ├── loading.ts
│   │   ├── permission.ts
│   │   └── debounce.ts
│   ├── layouts/               # 布局组件
│   ├── router/                # 路由配置
│   │   ├── index.ts
│   │   └── types.ts
│   ├── stores/                # 状态管理
│   │   ├── app.ts
│   │   └── user.ts
│   ├── types/                 # TypeScript 类型定义
│   │   ├── global.d.ts
│   │   └── env.d.ts
│   ├── utils/                 # 工具函数
│   │   ├── index.ts
│   │   ├── format.ts
│   │   ├── validate.ts
│   │   ├── common.ts
│   │   └── dom.ts
│   ├── views/                 # 页面组件
│   │   ├── Home/
│   │   ├── About/
│   │   └── NotFound/
│   ├── App.vue                # 根组件
│   ├── main.ts                # 入口文件
│   └── env.d.ts               # 环境变量类型
├── tests/                     # 测试文件
├── .eslintrc.js              # ESLint 配置
├── .prettierrc               # Prettier 配置
├── .gitignore
├── .env.development          # 开发环境变量
├── .env.production           # 生产环境变量
├── package.json
├── tsconfig.json             # TypeScript 配置
├── webpack.config.js         # Webpack 配置
└── README.md
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

### 代码格式化

```bash
npm run format
```

### 类型检查

```bash
npm run type-check
```

## 特性

### TypeScript 支持

- 完整的 TypeScript 类型定义
- 路由类型扩展
- 组件类型推导

### 路径别名

已配置以下路径别名，可在项目中直接使用：

```typescript
import Component from '@/components/Component.vue'
import { useUserStore } from '@/stores/user'
import { formatDate } from '@/utils/format'
```

### API 封装

基于 Axios 的请求封装，支持：

- 请求/响应拦截器
- 统一错误处理
- Token 自动注入
- 请求取消

### 状态管理

使用 Pinia 进行状态管理，支持：

- TypeScript 完整支持
- 组合式 API 风格
- 模块化状态管理

### 自定义指令

- `v-loading` - 加载状态
- `v-permission` - 权限控制
- `v-debounce` - 防抖指令

### 工具函数

提供常用工具函数：

- `formatDate` - 日期格式化
- `formatNumber` - 数字格式化
- `formatFileSize` - 文件大小格式化
- `isEmail` - 邮箱验证
- `isPhoneNumber` - 手机号验证
- `debounce` / `throttle` - 防抖节流
- `deepClone` - 深拷贝
- 更多...

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## License

MIT
