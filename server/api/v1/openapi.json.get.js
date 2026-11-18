import { ALLOWED_EXTENSIONS } from '~/server/utils/file-info.js'

export default defineEventHandler(() => {
  return {
    openapi: '3.0.3',
    info: {
      title: '汉王数字文件上传系统 Open API',
      version: '1.0.0',
      description: '提供给外部业务系统的文件上传、FTP 目录管理、流式下载、缩略图与历史记录查询接口。所有操作均限制在服务端配置的 FTP 基准目录之内。'
    },
    servers: [{ url: '/api/v1', description: 'Open API v1' }],
    security: [{ ApiKeyHeader: [] }, { BearerAuth: [] }],
    components: {
      securitySchemes: {
        ApiKeyHeader: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        BearerAuth: { type: 'http', scheme: 'bearer' }
      }
    },
    paths: {
      '/health': {
        get: {
          summary: '服务状态检查',
          parameters: [{ name: 'deep', in: 'query', schema: { type: 'boolean' }, description: '为 true 时检测 MySQL 与 FTP 连通性' }],
          responses: { '200': { description: '健康状态' } }
        }
      },
      '/files/upload': {
        post: {
          summary: '上传文件到 FTP 并可选写入历史记录',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: { type: 'string', format: 'binary', description: `支持格式: ${ALLOWED_EXTENSIONS.join(', ')}（最大 100MB）` },
                    dir: { type: 'string', description: '目标相对目录（如 docs/2026，不存在时自动创建，默认根目录）' },
                    filename: { type: 'string', description: '自定义目标文件名（可选）' },
                    keepOriginalName: { type: 'string', enum: ['true', 'false'], description: '是否保留原文件名而不追加时间戳（默认 false）' },
                    overwrite: { type: 'string', enum: ['true', 'false'], description: '同名时是否覆盖（默认 false，自动追加序号）' },
                    recordHistory: { type: 'string', enum: ['true', 'false'], description: '是否写入上传历史表（默认 true）' }
                  }
                }
              }
            }
          },
          responses: { '201': { description: '上传成功' } }
        }
      },
      '/files': {
        get: {
          summary: '列出目录内容',
          parameters: [
            { name: 'dir', in: 'query', schema: { type: 'string', default: '.' } },
            { name: 'type', in: 'query', schema: { type: 'string', enum: ['all', 'file', 'dir'], default: 'all' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 50 } }
          ],
          responses: { '200': { description: '目录列表' } }
        },
        delete: {
          summary: '删除文件或目录',
          parameters: [
            { name: 'path', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'isDirectory', in: 'query', schema: { type: 'boolean', default: false } }
          ],
          responses: { '200': { description: '删除成功' } }
        }
      },
      '/files/info': {
        get: {
          summary: '获取文件或目录元信息',
          parameters: [{ name: 'path', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: '文件元信息' } }
        }
      },
      '/files/download': {
        get: {
          summary: '流式下载或在线预览文件',
          parameters: [
            { name: 'path', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'inline', in: 'query', schema: { type: 'boolean', default: false } }
          ],
          responses: { '200': { description: '文件二进制流' } }
        }
      },
      '/files/thumbnail': {
        get: {
          summary: '获取图片缩略图',
          parameters: [
            { name: 'path', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'size', in: 'query', schema: { type: 'integer', default: 120, minimum: 16, maximum: 512 } }
          ],
          responses: { '200': { description: '缩略图二进制流' } }
        }
      },
      '/files/mkdir': {
        post: {
          summary: '创建目录（支持多级）',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    path: { type: 'string', description: '完整相对目录路径（如 assets/2026）' },
                    dir: { type: 'string', description: '父目录（与 name 配合使用）' },
                    name: { type: 'string', description: '新文件夹名称' }
                  }
                }
              }
            }
          },
          responses: { '201': { description: '创建成功' } }
        }
      },
      '/files/rename': {
        post: {
          summary: '重命名文件或目录',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['path', 'newName'],
                  properties: {
                    path: { type: 'string' },
                    newName: { type: 'string' },
                    preserveExtension: { type: 'boolean', default: false },
                    autoDeduplicate: { type: 'boolean', default: false }
                  }
                }
              }
            }
          },
          responses: { '200': { description: '重命名成功' } }
        },
        patch: {
          summary: '重命名文件或目录（PATCH 别名）',
          responses: { '200': { description: '重命名成功' } }
        }
      },
      '/files/delete': {
        post: {
          summary: '删除文件或目录（POST 别名）',
          responses: { '200': { description: '删除成功' } }
        }
      },
      '/history': {
        get: {
          summary: '分页查询上传历史记录',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'category', in: 'query', schema: { type: 'string', enum: ['all', 'image', 'document', 'archive', 'font', 'other'] } },
            { name: 'source', in: 'query', schema: { type: 'string', enum: ['all', 'database', 'ftp'] } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
          ],
          responses: { '200': { description: '历史记录列表' } }
        }
      }
    }
  }
})
