# 汉王数字文件上传系统

## 📋 项目简介

基于 Nuxt 4 + TypeORM 的文件上传与远程资产管理系统，支持通过 FTP 协议安全上传与管理多类数字资产，并将上传记录持久化到 MySQL 数据库，同时提供面向外部系统集成的 `/api/v1` 开放接口。

## ✨ 功能特性

- **多格式文件上传**：支持图片（JPG/PNG/GIF/WebP/BMP/SVG）、文档（PDF/Office/TXT/XML/JSON）、压缩包（ZIP/RAR/7z）、字体（TTF/OTF/WOFF/WOFF2），单文件最大 100MB，支持实时字节级上传进度与队列管理
- **高性能 FTP 连接池**：复用长连接、排队超时保护、列表短期缓存及自动失效，流式文件下载/预览避免内存溢出
- **缩略图 LRU 缓存**：基于 `sharp` 自动生成缩略图并缓存，支持 WebP/PNG/JPEG 自适应编码与格式兜底
- **上传历史管理**：融合数据库记录与 FTP 目录状态，支持关键字检索、分类/来源/日期过滤、多格式在线预览、重命名与联动删除
- **FTP 可视化文件管理**：目录浏览、递归搜索、拖拽上传、新建目录、批量删除，桌面与移动端均完整适配
- **安全加固**：路径沙箱防目录穿越、HttpOnly 会话鉴权、登录防爆破限流、SVG 沙箱防 XSS、Cookie 过期死循环防护
- **对外开放接口（Open API v1）**：提供 `/api/v1/*` 标准化 REST 接口（API Key 鉴权 + 速率限制 + OpenAPI 3.0 规范），详见 [对外接口文档](docs/OPEN_API.md)

## 🗄️ 环境变量配置

复制 `.env.example` 为 `.env` 并填写配置：

| 环境变量 | 说明 |
|------|------|
| `NUXT_FTP_HOST` / `NUXT_FTP_PORT` | FTP 服务器地址与端口（默认 `21`） |
| `NUXT_FTP_USER` / `NUXT_FTP_PASSWORD` | FTP 登录账号与密码 |
| `NUXT_FTP_SECURE` | 是否启用 FTPS（`true` / `false`） |
| `NUXT_FTP_BASE_PATH` | FTP 基准目录（默认 `/static/zhonghuaguji/wenjinyangji`） |
| `NUXT_DB_HOST` / `NUXT_DB_PORT` | MySQL 地址与端口 |
| `NUXT_DB_USER` / `NUXT_DB_PASSWORD` | MySQL 账号与密码 |
| `NUXT_DB_NAME` | 数据库名称 |
| `NUXT_API_KEYS` | 对外接口访问密钥（逗号分隔，支持 `名称:密钥` 格式） |
| `SEED_USERNAME` / `SEED_PASSWORD` | 初始化管理员账号与密码（执行 `typeorm:seed` 时必填） |

## 🚀 快速开始

### 本地开发模式

```bash
# 1. 安装依赖
npm ci

# 2. 配置环境变量
cp .env.example .env

# 3. 运行数据库迁移与种子用户（按需）
npm run typeorm:migration:run
npm run typeorm:seed

# 4. 启动开发服务器
npm run dev
```

访问：http://localhost:3000

### Docker 部署模式

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f hanvonfile
```

更多 Docker 部署细节请查看 [README.docker.md](README.docker.md)。

## 📁 项目结构

```
upload-file-system/
├── app.vue                      # 应用根组件
├── assets/styles/               # 页面与全局 SCSS 样式
├── components/                  # 粒子背景、加载器等公共组件
├── docs/OPEN_API.md             # 对外开放接口（/api/v1）文档
├── layouts/                     # default / auth 布局
├── middleware/auth.global.ts    # 前端路由登录守卫
├── pages/                       # 首页、登录、上传、历史记录、FTP 管理
├── server/
│   ├── api/                     # 内部 Web 接口及 /api/v1 对外接口
│   ├── entities/                # TypeORM 实体（User / UploadHistory）
│   ├── middleware/auth.js       # 服务端 Cookie 与 API Key 鉴权中间件
│   ├── utils/                   # FTP 连接池、文件工具、缓存、限流、鉴权
│   ├── data-source.ts           # TypeORM 数据源配置
│   └── seed.ts                  # 初始化用户脚本
├── utils/                       # 前端文件校验、格式化、剪贴板、HTTP 与 Toast 工具
├── Dockerfile
├── docker-compose.yml
└── nuxt.config.ts
```

## 📄 许可证

MIT
