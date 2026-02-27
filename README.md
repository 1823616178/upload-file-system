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

### 本地开发模式

#### 1. 安装依赖

```bash
yarn install
```

#### 2. 配置环境变量

已在 `.env` 文件中配置好数据库连接信息：

```env
# 数据库配置在 server/data-source.ts 中通过环境变量配置
```

#### 3. 运行数据库迁移

```bash
yarn typeorm:migration:run
```

#### 4. 运行种子数据（如果需要）

```bash
yarn typeorm:seed
```

#### 5. 启动开发服务器

```bash
yarn dev
```

访问：http://localhost:3000

### Docker 部署模式

#### 1. 使用 Docker Compose 启动

```bash
# 构建并启动应用服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f hanvonfile
```

> **注意**：容器名称为 `hanvonfile`，使用主机网络模式，没有端口映射，所有配置都通过 `.env` 文件管理，包括数据库连接和 FTP 配置。

#### 2. 初始化数据库（如果需要）

由于使用现有数据库，请确保数据库服务（192.168.1.111:53306）可访问：

```bash
# 进入应用容器
docker-compose exec hanvonfile sh

# 运行数据库迁移（如果表结构需要更新）
yarn typeorm:migration:run

# 运行种子数据（如果需要）
yarn typeorm:seed
```

#### 3. 访问应用

应用将在 `http://localhost:3000` 上运行

#### 4. 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v
```

更多 Docker 部署详情请查看 [README.docker.md](README.docker.md)

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
├── server/
│   ├── api/                   # API 接口
│   ├── entities/             # 数据库实体
│   ├── middleware/           # 中间件
│   ├── plugins/              # 插件
│   ├── utils/                # 工具函数
│   ├── data-source.ts        # 数据库配置
│   └── seed.ts               # 种子数据
├── Dockerfile               # Docker 镜像构建文件
├── docker-compose.yml      # Docker Compose 配置
├── .dockerignore           # Docker 构建忽略文件
├── README.docker.md        # Docker 部署详细说明
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
- **运行环境**: Node.js 24
- **路由**: Nuxt Pages
- **样式**: SCSS
- **数据库**: MySQL
- **ORM**: TypeORM
- **文件传输**: basic-ftp

## 📝 TypeORM 常用命令

```bash
# 生成实体和迁移
yarn typeorm:migration:generate MigrationName

# 运行迁移
yarn typeorm:migration:run

# 运行种子数据
yarn typeorm:seed
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
