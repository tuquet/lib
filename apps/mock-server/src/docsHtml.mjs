/**
 * Interactive REST API Playground & Documentation Web Interface
 */
export function renderDocsHtml() {
  return `<!DOCTYPE html>
<html lang="vi" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tuquet Enterprise CRUD REST API Explorer</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: '#0ea5e9',
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    pre code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <div class="max-w-6xl mx-auto px-4 py-8 space-y-8">
    <!-- Header -->
    <header class="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
            <i class="fa-solid fa-database"></i>
          </div>
          <div>
            <h1 class="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Tuquet Enterprise CRUD REST API
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">v1.0.0</span>
            </h1>
            <p class="text-xs text-slate-400 mt-0.5">
              Live Mock Endpoints phục vụ thực hành cho All-In-One Enterprise Data Grid, Mobile Dynamic Form & Inline Editing.
            </p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2.5">
        <a href="/api/openapi.json" target="_blank" class="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-slate-300">
          <i class="fa-solid fa-file-code text-sky-400"></i> OpenAPI 3.0 JSON
        </a>
        <button onclick="resetData()" class="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5">
          <i class="fa-solid fa-rotate-right"></i> Reset Dữ liệu mẫu (1.000 đơn)
        </button>
      </div>
    </header>

    <!-- Stats Banner -->
    <div id="statsBanner" class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div class="text-xs text-slate-400">Tổng số đơn hàng</div>
        <div id="statTotal" class="text-2xl font-black text-sky-400 mt-1 font-mono">Loading...</div>
      </div>
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div class="text-xs text-slate-400">Tổng doanh thu</div>
        <div id="statRevenue" class="text-2xl font-black text-emerald-400 mt-1 font-mono">...</div>
      </div>
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div class="text-xs text-slate-400">Tiến độ trung bình</div>
        <div id="statProgress" class="text-2xl font-black text-indigo-400 mt-1 font-mono">...</div>
      </div>
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div class="text-xs text-slate-400">Trạng thái hoàn thành</div>
        <div id="statCompleted" class="text-2xl font-black text-emerald-500 mt-1 font-mono">...</div>
      </div>
    </div>

    <!-- Playground & Endpoints List -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Left: Endpoints Menu & Tester -->
      <div class="lg:col-span-7 space-y-4">
        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <i class="fa-solid fa-bolt text-sky-400"></i> Danh sách REST Endpoints
        </h2>

        <!-- Endpoint 1: GET /api/orders -->
        <div class="border border-slate-800 rounded-xl bg-slate-900/90 overflow-hidden shadow-sm">
          <div class="p-3.5 flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/60">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">GET</span>
              <span class="font-mono text-sm font-semibold text-white">/api/orders</span>
            </div>
            <button onclick="testOrdersQuery()" class="px-3 py-1 rounded bg-sky-500 text-white text-xs font-semibold hover:bg-sky-400 transition-colors flex items-center gap-1">
              <i class="fa-solid fa-play text-[10px]"></i> Thử ngay
            </button>
          </div>
          <div class="p-4 space-y-3 text-xs text-slate-300">
            <p>Phân trang, tìm kiếm debounce, sắp xếp đa cột và lọc trạng thái cho All-In-One Enterprise Table.</p>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              <div>
                <label class="text-slate-400 block mb-1">page:</label>
                <input id="paramPage" type="number" value="1" min="1" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200">
              </div>
              <div>
                <label class="text-slate-400 block mb-1">limit:</label>
                <input id="paramLimit" type="number" value="5" min="1" max="1000" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200">
              </div>
              <div>
                <label class="text-slate-400 block mb-1">sort:</label>
                <input id="paramSort" type="text" value="-createdAt" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200" placeholder="-createdAt, total">
              </div>
              <div class="col-span-2">
                <label class="text-slate-400 block mb-1">search (q):</label>
                <input id="paramSearch" type="text" value="" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200" placeholder="VD: Vingroup, Viettel, ORD-2026...">
              </div>
              <div>
                <label class="text-slate-400 block mb-1">status:</label>
                <select id="paramStatus" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200">
                  <option value="">Tất cả trạng thái</option>
                  <option value="completed">completed</option>
                  <option value="pending">pending</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Endpoint 2: GET /api/orders/:id -->
        <div class="border border-slate-800 rounded-xl bg-slate-900/90 overflow-hidden shadow-sm">
          <div class="p-3.5 flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/60">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">GET</span>
              <span class="font-mono text-sm font-semibold text-white">/api/orders/:id</span>
            </div>
            <button onclick="testGetById()" class="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-1">
              <i class="fa-solid fa-play text-[10px]"></i> Thử ngay
            </button>
          </div>
          <div class="p-4 space-y-2 text-xs text-slate-300">
            <p>Tra cứu chi tiết đơn theo ID (<code>ord_1000</code>) hoặc theo mã đơn (<code>ORD-202600</code>).</p>
            <div class="flex items-center gap-2">
              <input id="paramGetId" type="text" value="ord_1000" class="w-48 bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-slate-200">
            </div>
          </div>
        </div>

        <!-- Endpoint 3: PATCH /api/orders/:id (Inline Edit) -->
        <div class="border border-slate-800 rounded-xl bg-slate-900/90 overflow-hidden shadow-sm">
          <div class="p-3.5 flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/60">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">PATCH</span>
              <span class="font-mono text-sm font-semibold text-white">/api/orders/:id (Inline Edit)</span>
            </div>
            <button onclick="testPatchCell()" class="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors flex items-center gap-1">
              <i class="fa-solid fa-pencil text-[10px]"></i> Thử Inline Edit
            </button>
          </div>
          <div class="p-4 space-y-2 text-xs text-slate-300">
            <p>Cập nhật tức thì từng cell khi người dùng gõ phím Enter trên bảng (Inline Editing).</p>
            <div class="grid grid-cols-2 gap-2 font-mono text-xs">
              <input id="paramPatchId" type="text" value="ord_1000" class="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200" placeholder="ID đơn">
              <input id="paramPatchCustomer" type="text" value="Khách hàng VIP Đã Cập Nhật" class="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200" placeholder="Tên khách hàng mới">
            </div>
          </div>
        </div>

        <!-- Endpoint 4: PUT /api/orders/:id (Mobile Sheet Drawer) -->
        <div class="border border-slate-800 rounded-xl bg-slate-900/90 overflow-hidden shadow-sm">
          <div class="p-3.5 flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/60">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">PUT</span>
              <span class="font-mono text-sm font-semibold text-white">/api/orders/:id (Mobile Form)</span>
            </div>
            <button onclick="testPutOrder()" class="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors flex items-center gap-1">
              <i class="fa-solid fa-mobile-screen text-[10px]"></i> Thử Lưu Mobile
            </button>
          </div>
          <div class="p-4 space-y-2 text-xs text-slate-300">
            <p>Lưu toàn bộ form khi người dùng nhấn "Lưu thay đổi" từ Mobile Bottom Sheet Drawer.</p>
          </div>
        </div>

        <!-- Endpoint 5: POST /api/orders (Create Order) -->
        <div class="border border-slate-800 rounded-xl bg-slate-900/90 overflow-hidden shadow-sm">
          <div class="p-3.5 flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/60">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">POST</span>
              <span class="font-mono text-sm font-semibold text-white">/api/orders</span>
            </div>
            <button onclick="testCreateOrder()" class="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1">
              <i class="fa-solid fa-plus text-[10px]"></i> Tạo đơn mới
            </button>
          </div>
          <div class="p-4 space-y-2 text-xs text-slate-300">
            <p>Tạo đơn hàng mới theo chuẩn đặc tả OpenAPI 3.0.</p>
          </div>
        </div>

        <!-- Endpoint 6: Bulk Actions & Delete -->
        <div class="border border-slate-800 rounded-xl bg-slate-900/90 overflow-hidden shadow-sm">
          <div class="p-3.5 flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/60">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">POST / DELETE</span>
              <span class="font-mono text-sm font-semibold text-white">Bulk Actions & Delete</span>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="testBulkComplete()" class="px-2.5 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors">
                Hoàn thành bulk
              </button>
              <button onclick="testBulkDelete()" class="px-2.5 py-1 rounded bg-rose-800 hover:bg-rose-700 text-white text-xs font-semibold transition-colors">
                Xóa bulk
              </button>
            </div>
          </div>
          <div class="p-4 space-y-2 text-xs text-slate-300">
            <p>Hỗ trợ thao tác thanh nổi (Floating Bar) khi chọn nhiều checkbox: Xóa hàng loạt hoặc đổi trạng thái hoàn tất hàng loạt.</p>
          </div>
        </div>
      </div>

      <!-- Right: Live Response & cURL Preview -->
      <div class="lg:col-span-5 space-y-4 sticky top-6">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <i class="fa-solid fa-terminal text-emerald-400"></i> Phản hồi Thực tế (Live Response)
          </h2>
          <span id="responseStatus" class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-slate-400">Ready</span>
        </div>

        <!-- Live Response Box -->
        <div class="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
          <div class="p-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span id="requestMethodUrl" class="font-mono text-[11px] truncate text-slate-300">GET /api/orders?page=1&limit=5</span>
            <span id="responseTime" class="font-mono text-[11px] text-sky-400">- ms</span>
          </div>
          <pre id="responseJson" class="p-4 text-[11px] font-mono overflow-auto max-h-[420px] text-slate-200">Nhấn một nút "Thử ngay" bên trái để xem kết quả HTTP...</pre>
        </div>

        <!-- Copyable cURL Box -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span>Lệnh cURL tương ứng:</span>
            <button onclick="copyCurl()" class="text-sky-400 hover:underline flex items-center gap-1 text-[11px]">
              <i class="fa-regular fa-copy"></i> Sao chép cURL
            </button>
          </div>
          <div class="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-300 overflow-x-auto select-all" id="curlBox">
            curl -s "http://157.66.24.171:6006/api/orders?page=1&limit=5"
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    async function loadStats() {
      try {
        const res = await fetch('/api/orders/stats');
        const data = await res.json();
        document.getElementById('statTotal').innerText = data.totalOrders.toLocaleString();
        document.getElementById('statRevenue').innerText = '$' + data.totalRevenue.toLocaleString();
        document.getElementById('statProgress').innerText = data.averageProgress + '%';
        document.getElementById('statCompleted').innerText = data.statusCounts.completed.toLocaleString();
      } catch (e) {
        console.error(e);
      }
    }

    async function executeApi(method, url, body = null) {
      const startTime = performance.now();
      const statusBadge = document.getElementById('responseStatus');
      const responseTime = document.getElementById('responseTime');
      const methodUrlSpan = document.getElementById('requestMethodUrl');
      const jsonPre = document.getElementById('responseJson');
      const curlBox = document.getElementById('curlBox');

      methodUrlSpan.innerText = method + ' ' + url;
      statusBadge.innerText = 'Calling...';
      statusBadge.className = 'px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse';

      let curlCommand = 'curl -X ' + method + ' "' + window.location.origin + url + '"';
      if (body) {
        curlCommand += " -H 'Content-Type: application/json' -d '" + JSON.stringify(body) + "'";
      }
      curlBox.innerText = curlCommand;

      try {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(url, options);
        const duration = Math.round(performance.now() - startTime);
        responseTime.innerText = duration + ' ms';

        const json = await res.json();
        jsonPre.innerText = JSON.stringify(json, null, 2);

        if (res.ok) {
          statusBadge.innerText = res.status + ' OK';
          statusBadge.className = 'px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
        } else {
          statusBadge.innerText = res.status + ' Error';
          statusBadge.className = 'px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30';
        }

        loadStats();
      } catch (err) {
        jsonPre.innerText = 'Network error: ' + err.message;
        statusBadge.innerText = 'Failed';
        statusBadge.className = 'px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30';
      }
    }

    function testOrdersQuery() {
      const page = document.getElementById('paramPage').value || 1;
      const limit = document.getElementById('paramLimit').value || 5;
      const sort = document.getElementById('paramSort').value;
      const search = document.getElementById('paramSearch').value;
      const status = document.getElementById('paramStatus').value;

      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', limit);
      if (sort) params.set('sort', sort);
      if (search) params.set('search', search);
      if (status) params.set('status', status);

      executeApi('GET', '/api/orders?' + params.toString());
    }

    function testGetById() {
      const id = document.getElementById('paramGetId').value || 'ord_1000';
      executeApi('GET', '/api/orders/' + encodeURIComponent(id));
    }

    function testPatchCell() {
      const id = document.getElementById('paramPatchId').value || 'ord_1000';
      const customer = document.getElementById('paramPatchCustomer').value || 'Khách VIP ' + new Date().toLocaleTimeString();
      executeApi('PATCH', '/api/orders/' + encodeURIComponent(id), { customer });
    }

    function testPutOrder() {
      const id = 'ord_1000';
      executeApi('PUT', '/api/orders/' + id, {
        customer: 'Tập đoàn Công nghệ Mới Đổi Tên',
        role: 'Chief Procurement Officer',
        status: 'completed',
        progress: 100,
        total: 9999.99,
        notes: 'Chỉnh sửa toàn bộ qua Mobile Bottom Sheet Drawer'
      });
    }

    function testCreateOrder() {
      executeApi('POST', '/api/orders', {
        customer: 'Khách hàng Thử Nghiệm API',
        role: 'Enterprise Partner',
        status: 'pending',
        progress: 25,
        total: 2450.00,
        notes: 'Đơn hàng mới tạo trực tiếp qua REST endpoint'
      });
    }

    function testBulkComplete() {
      executeApi('POST', '/api/orders/bulk-update', {
        ids: ['ord_1000', 'ord_1001', 'ord_1002'],
        updates: { status: 'completed' }
      });
    }

    function testBulkDelete() {
      executeApi('POST', '/api/orders/bulk-delete', {
        ids: ['ord_1003', 'ord_1004']
      });
    }

    function resetData() {
      executeApi('POST', '/api/orders/reset', { count: 1000 });
    }

    function copyCurl() {
      const text = document.getElementById('curlBox').innerText;
      navigator.clipboard.writeText(text);
      alert('Đã sao chép lệnh cURL vào Clipboard!');
    }

    // Initialize
    loadStats();
    testOrdersQuery();
  </script>
</body>
</html>
`;
}
