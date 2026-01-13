# 文件上传中心 - 使用 Prisma

## 📋 项目简介

基于 Nuxt 4 + Prisma 的文件上传系统，支持通过 FTP 协议上传图片文件到服务器，并将上传历史记录存储到 MySQL 数据库。

## ✨ 功能特性

- ✅ 图片文件上传（支持 jpg, png, gif, webp, bmp, svg）
- ✅ 文件大小限制（最大 100MB）
- ✅ FTP 传输到远程服务器
- ✅ 上传历史记录（使用 Prisma + MySQL）
- ✅ 历史记录搜索和分页
- ✅ 科技感 UI 设计
- ✅ 响应式布局

## 🗄️ 数据库配置

使用 Prisma ORM 管理 MySQL 数据库：

### 数据库连接信息

```
Host: 192.168.1.111
Port: 53306
User: hanvon
Password: hanvon123
Database: hanvon_tools_database
```

### Prisma Schema

表结构定义在 `prisma/schema.prisma` 文件中。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

已在 `.env` 文件中配置好数据库连接信息：

```env
DATABASE_URL="mysql://hanvon:hanvon123@192.168.1.111:53306/hanvon_tools_database?schema=public"
```

### 3. 同步数据库结构

使用 Prisma 同步数据库表结构：

```bash
npm run prisma:push
```

或者使用迁移：

```bash
npm run prisma:migrate
```

### 4. 生成 Prisma Client

```bash
npm run prisma:generate
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问：http://localhost:3000

## 📁 项目结构

```
uploadFileToServer/
├── app.vue                      # 应用根组件
├── assets/
│   └── styles/                 # 样式文件
│       ├── app.scss             # 全局样式
│       ├── home.scss            # 首页样式
│       ├── upload.scss          # 上传页样式
│       └── history.scss        # 历史记录样式
├── layouts/
│   └── default.vue             # 默认布局
├── pages/
│   ├── index.vue              # 首页
│   ├── uploadFile.vue         # 文件上传页
│   └── history.vue           # 历史记录页
├── prisma/
│   └── schema.prisma         # Prisma 数据模型
├── server/
│   ├── api/
│   │   ├── upload.post.js     # 上传接口
│   │   ├── history.get.js     # 获取历史接口
│   │   └── history.delete.js # 删除历史接口
│   └── utils/
│       └── db.js             # Prisma 客户端
├── database/
│   └── schema.sql           # 原始 SQL 建表语句
└── package.json
```

## 🔌 API 接口

### 1. 上传文件

- **接口**: `POST /api/upload`
- **Content-Type**: `multipart/form-data`
- **参数**:
  - `file`: 文件（必填）
  - `remotePath`: 远程路径（选填，默认 `/static/wenjinyangyi`）
- **响应**:
```json
{
  "success": true,
  "message": "文件上传成功",
  "fileName": "example.jpg",
  "remotePath": "/static/wenjinyangyi/example.jpg",
  "fileSize": 1024000,
  "fileSizeFormatted": "1.00 MB",
  "recordId": "1",
  "uploadTime": "2026-01-13T10:00:00.000Z"
}
```

### 2. 获取历史记录

- **接口**: `GET /api/history`
- **参数**:
  - `page`: 页码（默认 1）
  - `pageSize`: 每页条数（默认 10）
  - `search`: 搜索关键词（选填）
- **响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "fileName": "example.jpg",
      "fileSize": 1024000,
      "fileSizeFormatted": "1.00 MB",
      "fileType": "image/jpeg",
      "remotePath": "/static/wenjinyangyi/example.jpg",
      "uploadTime": "2026-01-13T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 3. 删除历史记录

- **接口**: `DELETE /api/history`
- **参数**:
  - `id`: 记录 ID
- **响应**:
```json
{
  "success": true,
  "message": "记录删除成功"
}
```

## 🗄️ 数据库表

### upload_history

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| fileName | VARCHAR(255) | 文件名 |
| fileSize | BIGINT | 文件大小（字节） |
| fileType | VARCHAR(50) | MIME 类型 |
| remotePath | VARCHAR(500) | FTP 远程路径 |
| uploadTime | DATETIME | 上传时间 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

## 🛠️ 技术栈

- **前端框架**: Nuxt 4 + Vue 3
- **路由**: Nuxt Pages
- **样式**: SCSS
- **数据库**: MySQL
- **ORM**: Prisma
- **文件传输**: basic-ftp

## 📝 Prisma 常用命令

```bash
# 生成 Prisma Client
npm run prisma:generate

# 推送 schema 到数据库（开发环境）
npm run prisma:push

# 创建并应用迁移
npm run prisma:migrate

# 查看数据库（可视化）
npx prisma studio

# 重置数据库
npx prisma migrate reset
```

## 🎨 页面说明

### 首页 (/)
- 项目介绍
- 功能特性展示
- 快速导航

### 上传页 (/uploadFile)
- 拖拽上传
- 多文件支持
- 文件验证
- 上传进度
- 查看上传结果

### 历史记录页 (/history)
- 上传历史列表
- 搜索功能
- 分页浏览
- 复制路径
- 删除记录

## ⚠️ 注意事项

1. 确保数据库连接信息正确
2. FTP 服务器需要可访问
3. 上传文件仅支持图片格式
4. 单文件最大 100MB
5. `.env` 文件包含敏感信息，不要提交到版本控制

## 📄 许可证

MIT
