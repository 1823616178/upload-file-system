# 构建阶段
FROM node:24-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package.json yarn.lock ./

# 安装依赖
RUN yarn install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN yarn build

# 生产阶段
FROM node:24-alpine AS production

# 安装 FTP 客户端依赖
RUN apk add --no-cache \
    curl \
    openssh-client \
    openssl

# 安装生产依赖
WORKDIR /app

# 复制 package 文件
COPY package.json yarn.lock ./

# 只安装生产依赖
RUN yarn install --frozen-lockfile --production

# 从构建阶段复制构建产物
COPY --from=builder /app/.output ./.output

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 更改文件所有者
RUN chown -R nextjs:nodejs /app/.output
USER nextjs

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", ".output/server/index.mjs"]