# Hướng dẫn Khai báo Controls & ArgTypes Chuyên nghiệp

Storybook Controls cho phép người dùng (Developer, QA, Designer, PM) tương tác và thay đổi props trực tiếp trên UI mà không cần sửa code.

---

## 1. Cấu trúc Khai báo một ArgType chuẩn

```typescript
argTypes: {
  propertyName: {
    control: { type: 'control-type' },
    options: ['optionA', 'optionB'], // Dành cho select, radio
    description: 'Giải thích bằng tiếng Việt về tác dụng của prop này',
    table: {
      type: { summary: 'kiểu dữ liệu' },
      defaultValue: { summary: 'giá trị mặc định' },
      category: 'Tên nhóm phân loại',
    },
  },
}
```

---

## 2. Các Kiểu Controls Thông dụng

### 1. Boolean Toggle (Bật / Tắt)

```typescript
virtual: {
  control: { type: 'boolean' },
  description: 'Chuyển đổi giữa chế độ Cuộn ảo (Virtual Scrolling) và Phân trang truyền thống',
  table: {
    type: { summary: 'boolean' },
    defaultValue: { summary: 'true' },
    category: 'Virtual Scrolling',
  },
},
```

### 2. Inline Radio (Lựa chọn nhanh ít option)

```typescript
density: {
  control: { type: 'inline-radio' },
  options: ['compact', 'normal', 'comfortable'],
  description: 'Mật độ hiển thị khoảng cách hàng trong bảng',
  table: {
    type: { summary: "'compact' | 'normal' | 'comfortable'" },
    defaultValue: { summary: "'compact'" },
    category: 'Appearance',
  },
},
```

### 3. Select Dropdown (Nhiều options)

```typescript
datasetSize: {
  control: { type: 'select' },
  options: [1000, 5000, 10000, 25000],
  description: 'Số lượng bản ghi mẫu sinh ngẫu nhiên trong bộ nhớ RAM',
  table: {
    type: { summary: 'number' },
    defaultValue: { summary: '10000' },
    category: 'Data & Performance',
  },
},
```

### 4. Range Slider (Thanh trượt số)

```typescript
overscan: {
  control: { type: 'range', min: 0, max: 30, step: 1 },
  description: 'Số lượng hàng DOM render dự phòng phía trên và dưới viewport',
  table: {
    type: { summary: 'number' },
    defaultValue: { summary: '5' },
    category: 'Virtual Scrolling',
  },
},
```

### 5. Text Input (Nhập chuỗi)

```typescript
emptyMessage: {
  control: { type: 'text' },
  description: 'Nội dung thông báo hiển thị khi không có bản ghi phù hợp',
  table: {
    type: { summary: 'string' },
    defaultValue: { summary: "'Không có dữ liệu phù hợp.'" },
    category: 'Appearance',
  },
},
```

### 6. Ẩn Control không cần thiết (`control: false`)

Đối với các props nhận object phức tạp (như instance composable `remote` hay custom render functions):

```typescript
remote: { control: false },
```

---

## 3. Phân nhóm Controls bằng `category`

Nên nhóm các controls lại để tab Controls trong Storybook hiển thị ngăn nắp:

- `Appearance`: Màu sắc, density, theme, skeletonRows.
- `Virtual Scrolling`: virtual, virtualHeight, overscan.
- `Layout & Features`: showToolbar, showPagination, showFloatingBar.
- `Data & Performance`: datasetSize, debounceMs, cacheTime.
