# 构建阶段
FROM node:24-alpine AS builder

# 声明构建参数
ARG FTP_HOST
ARG FTP_USER
ARG FTP_PASSWORD
ARG FTP_PORT=21
ARG FTP_SECURE=false
ARG FTP_BASE_PATH=/static/zhonghuaguji/wenjinyangji
ARG SSH_HOST
ARG SSH_USER
ARG SSH_PASSWORD
ARG SSH_PORT=22
ARG SSH_POWER_PASSWORD
ARG DB_HOST
ARG DB_PORT
ARG DB_USER
ARG DB_PASSWORD
ARG DB_NAME

# 设置为环境变量供构建使用
ENV FTP_HOST=$FTP_HOST \
    FTP_USER=$FTP_USER \
    FTP_PASSWORD=$FTP_PASSWORD \
    FTP_PORT=$FTP_PORT \
    FTP_SECURE=$FTP_SECURE \
    FTP_BASE_PATH=$FTP_BASE_PATH \
    SSH_HOST=$SSH_HOST \
    SSH_USER=$SSH_USER \
    SSH_PASSWORD=$SSH_PASSWORD \
    SSH_PORT=$SSH_PORT \
    SSH_POWER_PASSWORD=$SSH_POWER_PASSWORD \
    DB_HOST=$DB_HOST \
    DB_PORT=$DB_PORT \
    DB_USER=$DB_USER \
    DB_PASSWORD=$DB_PASSWORD \
    DB_NAME=$DB_NAME

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