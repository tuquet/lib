# @tuquet/mock-server

Enterprise Mock REST CRUD API Server for `@tuquet/vue-table` and `@tuquet/vue-ui`.

Provides high-performance HTTP REST endpoints conforming to the **OpenAPI 3.0+** specification, specifically designed for testing and developing with **All-In-One Enterprise Data Grids**, **Inline Cell Editing**, and **Mobile Dynamic Form Bottom Sheet Drawers**.

---

## 🚀 Key Features

- **Full RESTful CRUD Standards**:
  - `GET /api/orders`: Pagination (`page`, `limit`), multi-column sorting (`sort`), debounced search (`q` / `search`), status filtering (`status`), date range filtering (`createdAt_start`, `createdAt_end`).
  - `GET /api/orders/:id`: Lookup record details by internal ID (`ord_1000`) or code (`ORD-202600`).
  - `POST /api/orders`: Create new order record with OpenAPI validation.
  - `PATCH /api/orders/:id`: Partial record updates (optimized for Inline Cell Editing).
  - `PUT /api/orders/:id`: Complete record replacement (designed for Mobile Bottom Sheet Drawer forms).
  - `DELETE /api/orders/:id`: Single record removal.
  - `POST /api/orders/bulk-delete`: Multi-record bulk deletion (Floating Action Bar integration).
  - `POST /api/orders/bulk-update`: Multi-record status transition.
  - `POST /api/orders/reset`: Reset and reseed 1,000 to 10,000 mock records on demand.
- **OpenAPI 3.0 Integration**:
  - `GET /api/openapi.json`: Full OpenAPI 3.0 specification download.
  - `GET /api/orders/schema`: Order model JSON schema with `x-ui-*` metadata annotations.
- **Interactive Documentation**:
  - `GET /api/docs`: Interactive web interface to test endpoints and generate cURL commands live.
- **Network Latency Simulation**:
  - Supports query parameter `?delay=200` or header `x-mock-delay: 200` to stress-test skeleton loaders and race condition handling.

---

## 🛠️ Installation & Execution

```bash
# Start server in production mode (port 3001)
pnpm --filter=@tuquet/mock-server start

# Start in development mode (hot-reloading on file change)
pnpm --filter=@tuquet/mock-server dev

# Run unit tests
pnpm --filter=@tuquet/mock-server test
```

---

## 📖 cURL API Examples

### 1. Paginated & Sorted Query

```bash
curl -s "http://127.0.0.1:3001/api/orders?page=1&limit=5&sort=-createdAt&status=completed"
```

### 2. Inline Edit (PATCH single cell)

```bash
curl -X PATCH "http://127.0.0.1:3001/api/orders/ord_1000" \
  -H "Content-Type: application/json" \
  -d '{"customer": "Acme Global VIP", "progress": 90}'
```

### 3. Mobile Form Drawer Edit (PUT full entity)

```bash
curl -X PUT "http://127.0.0.1:3001/api/orders/ord_1000" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": "Acme Enterprise Inc.",
    "role": "Procurement Lead",
    "status": "completed",
    "progress": 100,
    "total": 4500.00
  }'
```

### 4. Bulk Update (Batch status update)

```bash
curl -X POST "http://127.0.0.1:3001/api/orders/bulk-update" \
  -H "Content-Type: application/json" \
  -d '{"ids": ["ord_1001", "ord_1002"], "updates": {"status": "completed"}}'
```

### 5. Reset Data to Seed State

```bash
curl -X POST "http://127.0.0.1:3001/api/orders/reset" \
  -H "Content-Type: application/json" \
  -d '{"count": 1000}'
```
