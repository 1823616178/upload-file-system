# 构建阶段
FROM node:22-alpine AS builder

WORKDIR /app

# 复制包管理文件并安装依赖
COPY package.json package-lock.json ./
RUN npm ci

# 复制源代码并构建
COPY . .
RUN npm run build

# 生产阶段
FROM node:22-alpine AS production

# 安装运行时需要的基础工具（wget 用于 healthcheck）
RUN apk add --no-cache \
    wget \
    curl \
    openssh-client \
    openssl

WORKDIR /app

# 安装生产依赖
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 从构建阶段复制构建产物
COPY --from=builder /app/.output ./.output

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

RUN chown -R nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", ".output/server/index.mjs"]
