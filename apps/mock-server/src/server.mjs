import http from 'node:http';
import { OrdersDatabase } from './db.mjs';
import { fullOpenApiSpec, orderOpenApiSchema } from './openapi.mjs';
import { renderDocsHtml } from './docsHtml.mjs';

const PORT = Number(process.env.PORT) || 3001;
const db = new OrdersDatabase(1000);

let currentReq = null;

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-mock-delay',
  });
  if (currentReq && currentReq.method === 'HEAD') {
    return res.end();
  }
  res.end(JSON.stringify(data, null, 2));
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
  });
  if (currentReq && currentReq.method === 'HEAD') {
    return res.end();
  }
  res.end(html);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        // 5MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  currentReq = req;
  const isGet = req.method === 'GET' || req.method === 'HEAD';

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-mock-delay',
      'Access-Control-Max-Age': '86400',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = url.pathname;

  // Handle simulated latency if requested
  const delayParam = url.searchParams.get('delay') || req.headers['x-mock-delay'];
  if (delayParam) {
    const delayMs = Math.min(5000, Math.max(0, Number(delayParam) || 0));
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  try {
    // 1. Health check: /api/health
    if (pathname === '/api/health' && isGet) {
      return sendJson(res, 200, {
        status: 'ok',
        service: 'Tuquet Enterprise CRUD Mock Server',
        version: '1.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        recordCount: db.orders.length,
      });
    }

    // 2. Interactive Documentation UI: /api/docs or /api
    if ((pathname === '/api/docs' || pathname === '/api' || pathname === '/api/') && isGet) {
      return sendHtml(res, 200, renderDocsHtml());
    }

    // 3. OpenAPI 3.0 Specifications: /api/openapi.json
    if (pathname === '/api/openapi.json' && isGet) {
      return sendJson(res, 200, fullOpenApiSpec);
    }

    // 4. OpenAPI Entity Schema: /api/orders/schema
    if (pathname === '/api/orders/schema' && isGet) {
      return sendJson(res, 200, orderOpenApiSchema);
    }

    // 5. Orders Aggregated Stats: /api/orders/stats
    if (pathname === '/api/orders/stats' && isGet) {
      return sendJson(res, 200, {
        success: true,
        ...db.getStats(),
      });
    }

    // 6. Reset Database: POST /api/orders/reset
    if (pathname === '/api/orders/reset' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const count = Math.min(10000, Math.max(10, Number(body.count) || 1000));
      const total = db.seed(count);
      return sendJson(res, 200, {
        success: true,
        message: `Đã thiết lập lại dữ liệu mẫu thành công với ${total.toLocaleString()} đơn hàng.`,
        total,
      });
    }

    // 7. Bulk Delete: POST /api/orders/bulk-delete
    if (pathname === '/api/orders/bulk-delete' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      if (!Array.isArray(body.ids) || body.ids.length === 0) {
        return sendJson(res, 400, {
          success: false,
          message: 'Vui lòng cung cấp danh sách ID cần xóa (mảng ids)',
        });
      }
      const deletedCount = db.bulkDelete(body.ids);
      return sendJson(res, 200, {
        success: true,
        message: `Đã xóa thành công ${deletedCount} đơn hàng`,
        deletedCount,
      });
    }

    // 8. Bulk Update: POST /api/orders/bulk-update
    if (pathname === '/api/orders/bulk-update' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      if (!Array.isArray(body.ids) || body.ids.length === 0 || !body.updates) {
        return sendJson(res, 400, {
          success: false,
          message: 'Vui lòng cung cấp danh sách ids và đối tượng updates',
        });
      }
      const updatedCount = db.bulkUpdate(body.ids, body.updates);
      return sendJson(res, 200, {
        success: true,
        message: `Đã cập nhật thành công ${updatedCount} đơn hàng`,
        updatedCount,
      });
    }

    // 9. Query Orders List: GET /api/orders
    if (pathname === '/api/orders' && isGet) {
      const page = url.searchParams.get('page') || 1;
      const limit = url.searchParams.get('limit') || url.searchParams.get('pageSize') || 20;
      const sort = url.searchParams.get('sort') || null;
      const search = url.searchParams.get('q') || url.searchParams.get('search') || '';
      const status = url.searchParams.get('status') || null;
      const role = url.searchParams.get('role') || null;
      const createdAt_start = url.searchParams.get('createdAt_start') || null;
      const createdAt_end = url.searchParams.get('createdAt_end') || null;
      const minTotal = url.searchParams.get('minTotal') || null;
      const maxTotal = url.searchParams.get('maxTotal') || null;
      const filters = url.searchParams.get('filters') || null;
      const conjunction = url.searchParams.get('conjunction') || 'and';

      const result = db.query({
        page,
        limit,
        sort,
        search,
        status,
        role,
        createdAt_start,
        createdAt_end,
        minTotal,
        maxTotal,
        filters,
        conjunction,
      });

      return sendJson(res, 200, {
        success: true,
        ...result,
      });
    }

    // 10. Create Order: POST /api/orders
    if (pathname === '/api/orders' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.customer || !String(body.customer).trim()) {
        return sendJson(res, 400, {
          success: false,
          message: 'Tên khách hàng (customer) là trường bắt buộc',
        });
      }
      const newOrder = db.create(body);
      return sendJson(res, 201, {
        success: true,
        message: `Tạo mới đơn hàng ${newOrder.orderNumber} thành công`,
        data: newOrder,
      });
    }

    // 11. Single Order Operations: /api/orders/:id
    const orderIdMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
    if (orderIdMatch) {
      const id = decodeURIComponent(orderIdMatch[1]);

      // GET /api/orders/:id
      if (isGet) {
        const order = db.getById(id);
        if (!order) {
          return sendJson(res, 404, {
            success: false,
            message: `Không tìm thấy đơn hàng với mã "${id}"`,
          });
        }
        return sendJson(res, 200, { success: true, data: order });
      }

      // PATCH /api/orders/:id (Inline Edit single or partial fields)
      if (req.method === 'PATCH') {
        const body = await parseJsonBody(req);
        const updated = db.update(id, body);
        if (!updated) {
          return sendJson(res, 404, {
            success: false,
            message: `Không tìm thấy đơn hàng "${id}" để cập nhật`,
          });
        }
        return sendJson(res, 200, {
          success: true,
          message: `Đã cập nhật đơn hàng ${updated.orderNumber}`,
          data: updated,
        });
      }

      // PUT /api/orders/:id (Full Update from Dynamic Form / Mobile Sheet)
      if (req.method === 'PUT') {
        const body = await parseJsonBody(req);
        const updated = db.update(id, body);
        if (!updated) {
          return sendJson(res, 404, {
            success: false,
            message: `Không tìm thấy đơn hàng "${id}" để thay thế`,
          });
        }
        return sendJson(res, 200, {
          success: true,
          message: `Đã lưu toàn bộ thông tin đơn ${updated.orderNumber}`,
          data: updated,
        });
      }

      // DELETE /api/orders/:id
      if (req.method === 'DELETE') {
        const success = db.delete(id);
        if (!success) {
          return sendJson(res, 404, {
            success: false,
            message: `Không tìm thấy đơn hàng "${id}" để xóa`,
          });
        }
        return sendJson(res, 200, {
          success: true,
          message: `Đã xóa thành công đơn hàng "${id}"`,
          deletedId: id,
        });
      }
    }

    // Default 404
    return sendJson(res, 404, {
      success: false,
      message: `Endpoint không tồn tại: ${req.method} ${pathname}`,
      docs: '/api/docs',
    });
  } catch (err) {
    console.error('API Error:', err);
    return sendJson(res, 500, {
      success: false,
      message: 'Lỗi máy chủ nội bộ',
      error: err.message,
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 [Tuquet CRUD API Server] is running!`);
  console.log(`   - Local:    http://127.0.0.1:${PORT}/api/orders`);
  console.log(`   - Docs UI:  http://127.0.0.1:${PORT}/api/docs`);
  console.log(`   - OpenAPI:  http://127.0.0.1:${PORT}/api/openapi.json`);
  console.log(`   - Seed:     ${db.orders.length.toLocaleString()} enterprise records initialized.\n`);
});
