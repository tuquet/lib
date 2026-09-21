# @tuquet/mock-server

Enterprise Mock REST CRUD API Server for `@tuquet/vue-table` and `@tuquet/vue-ui`.

Provides high-performance, real HTTP REST endpoints conforming to the **OpenAPI 3.0+** specification, specifically designed for testing and practicing with **All-In-One Enterprise Data Grid**, **Inline Cell Editing**, and **Mobile Dynamic Form Bottom Sheet Drawer**.

---

## 🚀 Tính năng Nổi bật

- **Đầy đủ chuẩn RESTful CRUD**:
  - `GET /api/orders`: Phân trang (`page`, `limit`), sắp xếp đa cột (`sort`), tìm kiếm debounce (`q` / `search`), lọc trạng thái (`status`), lọc ngày (`createdAt_start`, `createdAt_end`).
  - `GET /api/orders/:id`: Tra cứu chi tiết theo ID hệ thống (`ord_1000`) hoặc mã đơn (`ORD-202600`).
  - `POST /api/orders`: Tạo mới đơn hàng với validation OpenAPI.
  - `PATCH /api/orders/:id`: Cập nhật từng trường riêng lẻ (tối ưu cho Inline Cell Editing).
  - `PUT /api/orders/:id`: Cập nhật toàn bộ đơn hàng (dành cho Mobile Bottom Sheet Drawer).
  - `DELETE /api/orders/:id`: Xóa đơn hàng đơn lẻ.
  - `POST /api/orders/bulk-delete`: Xóa hàng loạt bản ghi (Floating Action Bar).
  - `POST /api/orders/bulk-update`: Đổi trạng thái hàng loạt đơn hàng.
  - `POST /api/orders/reset`: Khôi phục và sinh lại 1.000 - 10.000 bản ghi mẫu bất kỳ lúc nào.
- **Tích hợp OpenAPI 3.0 Specs**:
  - `GET /api/openapi.json`: Tải toàn bộ đặc tả OpenAPI 3.0.
  - `GET /api/orders/schema`: Lấy schema JSON của model Order với các vendor extensions `x-ui-*`.
- **Giao diện Trực quan Interactive Docs**:
  - `GET /api/docs`: Web UI trực quan có nút test live mọi endpoint và sinh lệnh cURL tức thì.
- **Mô phỏng Độ trễ Mạng**:
  - Hỗ trợ tham số `?delay=200` hoặc header `x-mock-delay: 200` để kiểm thử skeleton loading và race conditions.

---

## 🛠️ Cài đặt & Khởi chạy

```bash
# Khởi chạy server ở chế độ thường (port 3001)
pnpm --filter=@tuquet/mock-server start

# Khởi chạy ở chế độ dev (tự động reload khi sửa code)
pnpm --filter=@tuquet/mock-server dev

# Chạy test suite
pnpm --filter=@tuquet/mock-server test
```

---

## 📖 Hướng dẫn Gọi API qua cURL

### 1. Truy vấn danh sách có phân trang và sắp xếp

```bash
curl -s "http://157.66.24.171:6006/api/orders?page=1&limit=5&sort=-createdAt&status=completed"
```

### 2. Inline Edit (PATCH một cell)

```bash
curl -X PATCH "http://157.66.24.171:6006/api/orders/ord_1000" \
  -H "Content-Type: application/json" \
  -d '{"customer": "Tập đoàn Vingroup VIP", "progress": 90}'
```

### 3. Mobile Form Drawer Edit (PUT toàn bộ)

```bash
curl -X PUT "http://157.66.24.171:6006/api/orders/ord_1000" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": "Công ty TNHH Phần mềm Tuquet",
    "role": "Procurement Lead",
    "status": "completed",
    "progress": 100,
    "total": 4500.00
  }'
```

### 4. Bulk Update (Đổi trạng thái nhiều đơn cùng lúc)

```bash
curl -X POST "http://157.66.24.171:6006/api/orders/bulk-update" \
  -H "Content-Type: application/json" \
  -d '{"ids": ["ord_1001", "ord_1002"], "updates": {"status": "completed"}}'
```

### 5. Reset Dữ liệu về trạng thái ban đầu

```bash
curl -X POST "http://157.66.24.171:6006/api/orders/reset" \
  -H "Content-Type: application/json" \
  -d '{"count": 1000}'
```
