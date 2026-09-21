# Danh sách Lỗi Thường gặp (Common Pitfalls) & Cách Phòng tránh

Tài liệu này liệt kê các lỗi runtime phổ biến nhất khi phát triển Storybook cho Vue 3 và giải pháp triệt để.

---

## 1. ❌ Lỗi Cú pháp: `Unexpected identifier 'as'`

### Mô tả lỗi:

Giao diện Storybook báo lỗi đỏ:

```text
Unexpected identifier 'as'
The component failed to render properly, likely due to a configuration issue in Storybook.
```

### Nguyên nhân:

Trình biên dịch template của Vue 3 (đặc biệt trong chuỗi template string của Storybook) là runtime template compiler (JavaScript thuần), **KHÔNG** hỗ trợ cú pháp TypeScript.
Nếu bạn viết từ khóa `as` trong chuỗi template HTML:

```html
<!-- ❌ SAI: Gây lỗi crash Storybook -->
<button @click="setDensity(d as TableDensity)">{{ d }}</button>
<div v-for="(item, idx) in (data as MyType[])">...</div>
```

### Cách khắc phục:

**TUYỆT ĐỐI KHÔNG** dùng từ khóa `as` trong template string. Mọi logic ép kiểu hoặc validation kiểu phải thực hiện bên trong hàm xử lý của `setup()`:

```typescript
// ✅ ĐÚNG: Xử lý type casting trong setup()
setup() {
  function setDensity(d: string) {
    density.value = d as TableDensity;
  }
  return { setDensity };
}
```

Và trong template chỉ gọi hàm thông thường:

```html
<button @click="setDensity(d)">{{ d }}</button>
```

---

## 2. ❌ Lỗi Cú pháp: `missing ) after argument list`

### Nguyên nhân:

Thường xảy ra khi truyền closure hoặc object lồng nhau chưa đóng ngoặc đơn/ngoặc nhọn chuẩn trong template string, hoặc sử dụng regex không escape đúng.

### Cách khắc phục:

Đưa toàn bộ biểu thức phức tạp thành `computed` hoặc `methods` trong `setup()`, giữ template HTML thuần túy chỉ gồm component tags và data binding cơ bản.

---

## 3. ❌ Lỗi Checkbox Header Không hoạt động / Không đồng bộ

### Nguyên nhân:

Hàm render của cột checkbox tạo thêm thẻ `<div>` bọc ngoài component `Checkbox`:

```typescript
// ❌ SAI: Khó cho test và có thể cản trở event propagation
cell: ({ row }) => h('div', { class: 'text-center' }, [h(Checkbox, ...)])
```

### Cách khắc phục:

Trả về VNode `Checkbox` trực tiếp từ hàm render, căn giữa bằng utility classes của Tailwind:

```typescript
// ✅ ĐÚNG: Checkbox là VNode gốc, props.checked và onUpdate được kiểm tra trực tiếp
cell: ({ row }) =>
  h(Checkbox, {
    checked: row.getIsSelected(),
    'onUpdate:checked': (val: boolean) => row.toggleSelected(!!val),
    class: 'translate-y-[2px] mx-auto block',
  });
```

---

## 4. ❌ Lỗi Cột Bảng bị Đè Chồng lên Nhau khi Đổi Density

### Nguyên nhân:

Sử dụng `table-layout: auto` khiến trình duyệt tự ý tính toán lại chiều rộng cột khi padding thay đổi, làm sai lệch tọa độ pixel cố định của TanStack Table Pinning.

### Cách khắc phục:

- Xem chi tiết tại: [Hướng dẫn Layout & Styling](./layout-and-styling.md).
- Luôn đặt `table-fixed` và gán đồng thời `width`, `minWidth`, `maxWidth` cho từng ô thông qua `getColumnStyle()`.
