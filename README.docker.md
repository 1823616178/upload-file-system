# Docker 部署指南

## 环境要求

- Docker 20.10+
- Docker Compose v2+
- Node.js 22+

## 快速开始

### 1. 准备环境变量

复制 `.env.example` 为 `.env` 并填写实际的 FTP、MySQL 与对外接口密钥：

```bash
cp .env.example .env
```

环境变量说明：

```env
# FTP 配置
NUXT_FTP_HOST=<your-ftp-host>
NUXT_FTP_USER=<your-ftp-user>
NUXT_FTP_PASSWORD=<your-ftp-password>
NUXT_FTP_PORT=21
NUXT_FTP_SECURE=false
NUXT_FTP_BASE_PATH=/static/zhonghuaguji/wenjinyangji

# 数据库配置
NUXT_DB_HOST=<your-db-host>
NUXT_DB_PORT=3306
NUXT_DB_USER=<your-db-user>
NUXT_DB_PASSWORD=<your-db-password>
NUXT_DB_NAME=hanvon_tools_database

# 对外开放接口密钥（可选，多个使用逗号分隔）
NUXT_API_KEYS=client1:<your-api-key>
```

### 2. 构建并启动服务

```bash
# 构建镜像并启动应用服务
docker compose up -d --build

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f hanvonfile
```

应用将在 `http://localhost:3000` 上运行，并内置 `/api/health` 健康检查。

### 3. 停止服务

```bash
docker compose down
```

## 初始化数据库与用户

若目标数据库尚未建立表结构或管理员账号：

```bash
# 进入应用容器
docker compose exec hanvonfile sh

# 运行数据库迁移（按需）
npm run typeorm:migration:run

# 创建/更新管理员账号（需传入 SEED_PASSWORD）
SEED_USERNAME=hccloud SEED_PASSWORD='<strong-password>' npm run typeorm:seed
```

## 生产环境建议

1. 使用反向代理（如 Nginx / Caddy）开启 HTTPS 终止与请求体大小限制（`client_max_body_size 110m;`）
2. 妥善保管 `.env` 与 `NUXT_API_KEYS`，不要将 `.env` 提交到版本控制
3. 配置资源限制与定期数据库备份
