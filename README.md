# Core Flow UI

基于 Vue 3 + TypeScript + Vite 构建的边缘服务配置管理面板。

## 功能模块

- **节点组 (Endpoints)**：管理边缘节点组配置，支持节点批量编辑与格式解析。
- **策略组 (Policies)**：管理流量调度策略，支持手动选择 (manual)、测速优选 (probe) 与故障转移 (fallback) 模式。
- **分流规则 (Filters)**：管理域名与 IP 分流规则集，支持远程规则集与行内规则配置。
- **回退策略 (Fallback)**：配置服务健康检测超时与回退备用主机池。
- **配置预览 (Profile)**：实时预览云端渲染的完整配置文件，支持行号检索与导出下载。

## 目录结构

```text
src/
├── api/                  # 后端 API 交互客户端 (client.ts)
├── assets/               # 全局样式配置
├── components/           # 业务组件
│   ├── endpoints/        # 节点组卡片与列表
│   ├── fallback/         # 回退设置面板
│   ├── filters/          # 分流规则卡片与列表
│   ├── layout/           # 侧边栏、通用卡片与连接配置弹窗
│   ├── policies/         # 策略组卡片与候选池排序
│   └── preview/          # 配置文件预览与导出
├── pages/                # 主工作区页面 (Dashboard.vue)
├── router/               # 路由定义 (Hash 模式)
├── store/                # 全局状态管理 (Pinia)
├── types/                # 数据类型契约 (config.ts)
└── utils/                # 凭据派生、数据校验与序列化工具
```

## 开发与构建

```bash
# 启动本地开发服务
pnpm dev

# 类型检查与生产打包
pnpm build

# 预览打包产物
pnpm preview
```
