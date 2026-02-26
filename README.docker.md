# Docker 部署指南

## 环境要求

- Docker 20.10+
- Docker Compose 1.29+
- Node.js 24+

## 快速开始

### 1. 构建并启动服务

```bash
# 构建镜像并启动应用服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f hanvonfile
```

> **注意**：容器名称为 `hanvonfile`，所有环境变量都通过 `.env` 文件配置。

### 2. 访问应用

应用将在 `http://localhost:3000` 上运行

### 3. 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v
```

## 环境变量配置

所有配置通过 `.env` 文件管理：

```env
# FTP 配置
FTP_HOST=192.168.1.166
FTP_USER=userftp
FTP_PASSWORD=550312171
FTP_PORT=21
FTP_SECURE=false
FTP_BASE_PATH=/static/zhonghuaguji/wenjinyangji

# SSH 配置
SSH_POWER_PASSWORD=Henkaku@1
SSH_HOST=192.168.1.166
SSH_USER=userftp
SSH_PASSWORD=550312171
SSH_PORT=22

# 数据库配置
DB_HOST=mysql
DB_PORT=3306
DB_USER=hanvon
DB_PASSWORD=hanvon123
DB_NAME=hanvon_tools_database
```

## 目录结构

```
.
├── docker-compose.yml    # Docker Compose 配置
├── Dockerfile           # 应用 Docker 镜像构建文件
├── .dockerignore        # Docker 构建忽略文件
└── .env                 # 环境变量配置
```

## 数据持久化

- 文件通过 FTP 存储在远程服务器上
- 数据库使用现有的 MySQL 服务（192.168.1.111:53306）

## 数据库迁移

由于使用现有数据库，首次运行前请确保：

1. 数据库服务（192.168.1.111:53306）可访问
2. 数据库用户 hanvon 有相应权限
3. hanvon_tools_database 数据库已存在

如果需要初始化表结构：

```bash
# 进入应用容器
docker-compose exec hanvonfile sh

# 运行数据库迁移
yarn typeorm:migration:run

# 运行种子数据（如果需要）
yarn typeorm:seed
```

## 故障排除

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs app
docker-compose logs mysql
```

### 重建服务

```bash
# 重新构建并启动
docker-compose up -d --build --force-recreate
```

### 数据库连接问题

如果遇到数据库连接问题，检查：
1. MySQL 服务是否正常运行
2. 数据库配置是否正确
3. 网络连接是否正常

### 权限问题

如果遇到权限问题：
```bash
# 在容器中修复权限
docker-compose exec app chown -R nextjs:nodejs /app/.output
```

## 生产环境部署

对于生产环境，建议：

1. 使用反向代理（如 Nginx）
2. 配置 SSL 证书
3. 设置适当的资源限制
4. 启用日志轮转
5. 定期备份数据库

### 生产环境 docker-compose.override.yml

```yaml
version: '3.8'

services:
  app:
    restart: always
    environment:
      - NODE_ENV=production
    
  mysql:
    restart: always
    volumes:
      - /host/path/mysql_data:/var/lib/mysql
```