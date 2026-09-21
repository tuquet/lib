/**
 * OpenAPI 3.0 Specification for Tuquet Enterprise CRUD API
 */
export const orderOpenApiSchema = {
  type: 'object',
  title: 'Enterprise Order Model',
  description: 'Schema OpenAPI 3.0 cho bản ghi đơn hàng doanh nghiệp với Vendor Extensions x-ui-*',
  required: ['orderNumber', 'customer', 'status', 'total'],
  properties: {
    id: {
      type: 'string',
      title: 'Mã ID hệ thống',
      readOnly: true,
      example: 'ord_1001',
      'x-ui-priority': 3,
    },
    orderNumber: {
      type: 'string',
      title: 'Mã đơn hàng',
      pattern: '^ORD-[0-9]{6}$',
      readOnly: true,
      example: 'ORD-202601',
      'x-ui-priority': 1,
    },
    customer: {
      type: 'string',
      title: 'Tên khách hàng',
      minLength: 3,
      placeholder: 'Nhập họ tên hoặc tên doanh nghiệp...',
      example: 'Tập đoàn Vingroup JSC',
      'x-ui-priority': 1,
    },
    role: {
      type: 'string',
      title: 'Bộ phận / Chức danh',
      placeholder: 'VD: Procurement Specialist, Finance...',
      example: 'Procurement Specialist',
      'x-ui-priority': 2,
    },
    status: {
      type: 'string',
      title: 'Trạng thái đơn',
      enum: ['completed', 'pending', 'cancelled'],
      'x-ui-widget': 'pill-badges',
      'x-ui-priority': 1,
      'x-ui-variants': {
        completed: 'default',
        pending: 'secondary',
        cancelled: 'destructive',
      },
      example: 'pending',
    },
    progress: {
      type: 'number',
      title: 'Tiến độ thực hiện',
      minimum: 0,
      maximum: 100,
      step: 5,
      'x-ui-widget': 'slider',
      'x-ui-suffix': '%',
      'x-ui-priority': 2,
      example: 45,
    },
    total: {
      type: 'number',
      title: 'Tổng tiền',
      minimum: 0,
      'x-ui-widget': 'currency',
      'x-ui-prefix': '$',
      'x-ui-priority': 1,
      example: 1250.5,
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      title: 'Ngày tạo đơn',
      readOnly: true,
      'x-ui-priority': 3,
      example: '2026-09-19T06:00:00.000Z',
    },
    notes: {
      type: 'string',
      title: 'Ghi chú đơn hàng',
      placeholder: 'Nhập ghi chú giao nhận hàng...',
      'x-ui-priority': 3,
      example: 'Giao giờ hành chính, liên hệ quầy lễ tân',
    },
  },
};

export const fullOpenApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Tuquet Enterprise Table CRUD REST API',
    version: '1.0.0',
    description:
      'REST API CRUD hoàn chỉnh phục vụ thực hành cho All-In-One Enterprise Data Grid & Mobile Dynamic Form. Hỗ trợ phân trang, sắp xếp, tìm kiếm debounce, lọc đa điều kiện, sửa inline (PATCH), sửa mobile form (PUT), xóa đơn (DELETE), thao tác hàng loạt (Bulk Actions), và khôi phục dữ liệu mẫu (Reset).',
    contact: {
      name: 'Tuquet Core Team',
      url: 'https://storybook.flowup.io.vn',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Nginx Proxy & Local API Root',
    },
    {
      url: 'http://157.66.24.171:6006/api',
      description: 'Production Public Server (Port 6006)',
    },
  ],
  paths: {
    '/orders': {
      get: {
        summary: 'Truy vấn danh sách đơn hàng (Pagination, Search, Sort, Filters)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Số trang (1-indexed)' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Số bản ghi trên mỗi trang' },
          { name: 'sort', in: 'query', schema: { type: 'string' }, description: 'Trường sắp xếp (VD: -createdAt, total, -orderNumber)' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Từ khóa tìm kiếm (hỗ trợ q hoặc search)' },
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Bộ lọc trạng thái (completed, pending, cancelled)' },
          { name: 'role', in: 'query', schema: { type: 'string' }, description: 'Bộ lọc phòng ban / vai trò' },
          { name: 'createdAt_start', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Ngày bắt đầu' },
          { name: 'createdAt_end', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Ngày kết thúc' },
          { name: 'minTotal', in: 'query', schema: { type: 'number' }, description: 'Giá trị đơn tối thiểu' },
          { name: 'maxTotal', in: 'query', schema: { type: 'number' }, description: 'Giá trị đơn tối đa' },
          { name: 'delay', in: 'query', schema: { type: 'integer' }, description: 'Mô phỏng độ trễ mạng (ms)' },
        ],
        responses: {
          200: {
            description: 'Danh sách đơn hàng thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: orderOpenApiSchema },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    totalPages: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Tạo mới một đơn hàng',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customer', 'status', 'total'],
                properties: {
                  customer: { type: 'string', minLength: 3 },
                  role: { type: 'string' },
                  status: { type: 'string', enum: ['completed', 'pending', 'cancelled'] },
                  progress: { type: 'number', minimum: 0, maximum: 100 },
                  total: { type: 'number', minimum: 0 },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Tạo thành công' },
        },
      },
    },
    '/orders/{id}': {
      get: {
        summary: 'Xem chi tiết đơn hàng theo ID hoặc Mã đơn',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Chi tiết đơn hàng' },
          404: { description: 'Không tìm thấy đơn hàng' },
        },
      },
      patch: {
        summary: 'Cập nhật từng trường đơn hàng (Dành cho Inline Cell Edit)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  customer: { type: 'string' },
                  role: { type: 'string' },
                  status: { type: 'string', enum: ['completed', 'pending', 'cancelled'] },
                  progress: { type: 'number' },
                  total: { type: 'number' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Cập nhật thành công' },
        },
      },
      put: {
        summary: 'Cập nhật toàn bộ đơn hàng (Dành cho Mobile Bottom Sheet Drawer)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: orderOpenApiSchema,
            },
          },
        },
        responses: {
          200: { description: 'Cập nhật thành công' },
        },
      },
      delete: {
        summary: 'Xóa một đơn hàng',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Đã xóa đơn hàng' },
        },
      },
    },
    '/orders/bulk-delete': {
      post: {
        summary: 'Xóa nhiều đơn hàng được chọn (Floating Bulk Actions)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ids'],
                properties: {
                  ids: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Đã xóa các đơn hàng' },
        },
      },
    },
    '/orders/bulk-update': {
      post: {
        summary: 'Cập nhật trạng thái nhiều đơn hàng cùng lúc',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ids', 'updates'],
                properties: {
                  ids: { type: 'array', items: { type: 'string' } },
                  updates: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['completed', 'pending', 'cancelled'] },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Đã cập nhật các đơn hàng' },
        },
      },
    },
    '/orders/reset': {
      post: {
        summary: 'Khôi phục và sinh lại bộ dữ liệu mẫu ban đầu',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  count: { type: 'integer', default: 1000 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Đã reset dữ liệu' },
        },
      },
    },
    '/orders/stats': {
      get: {
        summary: 'Lấy các chỉ số thống kê tổng hợp (Revenue, Progress, Status)',
        responses: {
          200: { description: 'Thống kê tổng hợp' },
        },
      },
    },
    '/orders/schema': {
      get: {
        summary: 'Lấy schema OpenAPI 3.0 của Model Order',
        responses: {
          200: { description: 'OpenAPI 3.0 schema' },
        },
      },
    },
  },
  components: {
    schemas: {
      Order: orderOpenApiSchema,
    },
  },
};
