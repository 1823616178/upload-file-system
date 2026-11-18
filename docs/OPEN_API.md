# 对外开放接口文档（Open API v1）

本系统提供了一套面向外部业务系统调用的 RESTful 接口，路由前缀为 `/api/v1`。

---

## 1. 认证与限流

### 1.1 配置访问密钥

在服务端的 `.env` 环境变量中配置 `NUXT_API_KEYS`（支持单个密钥或逗号分隔多个，推荐使用 `客户端名称:密钥` 格式以便在历史记录中识别来源）：

```env
NUXT_API_KEYS=erp:sk_live_erp_9f8e7d6c,ocr:sk_live_ocr_1a2b3c4d
```

> 若未配置 `NUXT_API_KEYS`，所有 `/api/v1/*` 接口将返回 `503 Service Unavailable`（默认关闭）。

### 1.2 请求头鉴权

调用时需通过以下任意一种请求头传入密钥：

- `X-API-Key: <your-api-key>`
- `Authorization: Bearer <your-api-key>`

### 1.3 速率限制

- 每个 API 客户端 + 来源 IP 默认限制 **120 次请求 / 分钟**。
- 响应头会返回 `X-RateLimit-Limit`、`X-RateLimit-Remaining`、`X-RateLimit-Reset`；超出后返回 `429 Too Many Requests` 及 `Retry-After`。

---

## 2. 统一响应规范

所有 JSON 接口均返回统一信封结构：

```json
{
  "code": 0,
  "success": true,
  "message": "ok",
  "data": {},
  "timestamp": "2026-11-16T10:00:00.000Z"
}
```

常见状态码：`200` 成功、`201` 创建成功、`400` 参数或路径非法、`401` 密钥缺失或无效、`404` 文件/目录不存在、`409` 目标名称已存在、`413` 文件大小超限（100MB）、`415` 文件格式不支持、`429` 请求限流、`503` 服务未启用或 FTP 池繁忙。

> 所有路径参数均自动限制在服务端配置的 `NUXT_FTP_BASE_PATH` 基准目录内，禁止使用 `..` 或基准目录外绝对路径。

---

## 3. 接口列表

### 3.1 健康检查

- **GET** `/api/v1/health`
- 查询参数：`deep=true`（可选，开启后会实时检测 MySQL 与 FTP 连通性）

```bash
curl "http://localhost:3000/api/v1/health?deep=true" \
  -H "X-API-Key: sk_live_erp_9f8e7d6c"
```

---

### 3.2 上传文件

- **POST** `/api/v1/files/upload`
- `Content-Type: multipart/form-data`
- 表单字段：
  - `file`（必填）：文件二进制内容（最大 100MB）
  - `dir`（选填）：目标相对目录（如 `docs/2026`，不存在会自动创建，默认 `.`）
  - `filename`（选填）：自定义目标文件名
  - `keepOriginalName`（选填）：`true` 保留原名；`false`（默认）追加 `_yyyyMMdd_HHmmss` 时间戳
  - `overwrite`（选填）：`true` 同名覆盖；`false`（默认）冲突时自动追加 `(1)`、`(2)`
  - `recordHistory`（选填）：是否写入 `upload_history` 表（默认 `true`）

```bash
curl -X POST "http://localhost:3000/api/v1/files/upload" \
  -H "X-API-Key: sk_live_erp_9f8e7d6c" \
  -F "file=@./report.pdf" \
  -F "dir=reports/2026" \
  -F "keepOriginalName=true"
```

成功响应（`201`）：

```json
{
  "code": 0,
  "success": true,
  "message": "文件上传成功",
  "data": {
    "fileName": "report.pdf",
    "path": "reports/2026/report.pdf",
    "remotePath": "/static/zhonghuaguji/wenjinyangji/reports/2026/report.pdf",
    "fileSize": 204800,
    "fileSizeFormatted": "200 KB",
    "mimeType": "application/pdf",
    "recordId": "42",
    "uploadTime": "2026-11-16T10:00:00.000Z",
    "links": {
      "download": "/api/v1/files/download?path=reports%2F2026%2Freport.pdf",
      "preview": "/api/v1/files/download?path=reports%2F2026%2Freport.pdf&inline=true",
      "info": "/api/v1/files/info?path=reports%2F2026%2Freport.pdf"
    }
  },
  "timestamp": "2026-11-16T10:00:00.000Z"
}
```

---

### 3.3 列出目录内容

- **GET** `/api/v1/files`
- 查询参数：`dir=.`、`type=all|file|dir`、`search=`、`page=1`、`pageSize=50`

```bash
curl "http://localhost:3000/api/v1/files?dir=reports/2026&page=1&pageSize=20" \
  -H "Authorization: Bearer sk_live_erp_9f8e7d6c"
```

---

### 3.4 获取文件/目录元信息

- **GET** `/api/v1/files/info?path=reports/2026/report.pdf`

---

### 3.5 流式下载 / 在线预览

- **GET** `/api/v1/files/download?path=reports/2026/report.pdf`
- 查询参数：`inline=true` 时设置 `Content-Disposition: inline`（并对 SVG 启用沙箱 CSP）。

---

### 3.6 获取图片缩略图

- **GET** `/api/v1/files/thumbnail?path=cover.jpg&size=240`
- `size` 自动限制在 `16 ~ 512` 像素，带服务端 LRU 缓存。

---

### 3.7 创建目录

- **POST** `/api/v1/files/mkdir`
- JSON Body：`{ "path": "assets/2026/11" }` 或 `{ "dir": "assets", "name": "2026" }`

---

### 3.8 重命名文件或目录

- **POST** 或 **PATCH** `/api/v1/files/rename`
- JSON Body：

```json
{
  "path": "reports/2026/report.pdf",
  "newName": "report_final.pdf",
  "preserveExtension": false,
  "autoDeduplicate": false
}
```

---

### 3.9 删除文件或目录

- **DELETE** `/api/v1/files?path=reports/2026/report_final.pdf&isDirectory=false`
- 也支持 **POST** `/api/v1/files/delete` 传入 `{ "path": "...", "isDirectory": false }`。

---

### 3.10 查询上传历史

- **GET** `/api/v1/history`
- 查询参数：`page=1`、`pageSize=20`、`search=`、`category=all|image|document|archive|font|other`、`source=all|database|ftp`、`startDate=YYYY-MM-DD`、`endDate=YYYY-MM-DD`

---

### 3.11 OpenAPI 3.0 规范文件

- **GET** `/api/v1/openapi.json`（支持 API Key 或已登录后台 Cookie 访问）
