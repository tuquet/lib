# Hướng dẫn Kiểm thử Tương tác Tự động với `play` function

Hàm `play` trong Storybook cho phép mô phỏng các hành động thực tế của người dùng (click, gõ phím, chọn checkbox, cuộn trang) và assert kết quả ngay trên trình duyệt bằng `@storybook/test`.

---

## 1. Cấu trúc Chuẩn của `play` function

```typescript
import { within, userEvent, expect } from '@storybook/test';

export const MyStory: Story = {
  // ... args, render ...
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('1. Khởi tạo và kiểm tra nội dung ban đầu', async () => {
      const heading = await canvas.findByText(/Tiêu đề/i);
      expect(heading).toBeInTheDocument();
    });

    await step('2. Tương tác gõ phím vào input tìm kiếm', async () => {
      const searchInput = canvas.getByPlaceholderText(/tìm kiếm/i);
      await userEvent.type(searchInput, 'Từ khóa', { delay: 40 });
      expect(searchInput).toHaveValue('Từ khóa');
    });

    await step('3. Click nút hành động và kiểm tra kết quả', async () => {
      const submitBtn = canvas.getByRole('button', { name: /xác nhận/i });
      await userEvent.click(submitBtn);
      expect(await canvas.findByText(/thành công/i)).toBeInTheDocument();
    });
  },
};
```

---

## 2. Các Kịch bản Kiểm thử Thường gặp

### 1. Kiểm tra Tìm kiếm Debounce

```typescript
await step('Tương tác tìm kiếm debounce', async () => {
  const searchInput = canvas.getByPlaceholderText(/filter records/i);
  await userEvent.type(searchInput, 'ORD-202603', { delay: 40 });
  expect(searchInput).toHaveValue('ORD-202603');

  // Xóa input
  await userEvent.clear(searchInput);
});
```

### 2. Kiểm tra Checkbox Select-All

```typescript
await step('Tương tác Select All ở checkbox header', async () => {
  const checkboxes = await canvas.findAllByRole('checkbox');
  const headerCheckbox = checkboxes[0];
  await userEvent.click(headerCheckbox);

  // Kiểm tra thanh bulk action nổi xuất hiện
  const bulkBtn = await canvas.findByText(/hoàn thành \(/i);
  expect(bulkBtn).toBeInTheDocument();

  // Click lại để bỏ chọn tất cả
  await userEvent.click(headerCheckbox);
});
```

### 3. Kiểm tra Mở Dropdown Menu

```typescript
await step('Kiểm tra nút Xuất dữ liệu mở menu', async () => {
  const exportBtn = canvas.getByRole('button', { name: /xuất dữ liệu/i });
  expect(exportBtn).toBeInTheDocument();
  await userEvent.click(exportBtn);
});
```

### 4. Kiểm tra Inline Cell Editing

```typescript
await step('Tương tác Inline Edit: Sửa tên khách hàng', async () => {
  const customerCell = await canvas.findByText('Nguyễn Văn An #1');
  expect(customerCell).toBeInTheDocument();
  await userEvent.click(customerCell);

  const cellInput = canvasElement.querySelector('input.font-mono') as HTMLInputElement | null;
  if (cellInput) {
    await userEvent.clear(cellInput);
    await userEvent.type(cellInput, 'Nguyễn Văn An VIP{enter}');
    expect(await canvas.findByText('Nguyễn Văn An VIP')).toBeInTheDocument();
    expect(await canvas.findByText(/Đã cập nhật khách hàng/i)).toBeInTheDocument();
  }
});
```

---

## 3. Lưu ý quan trọng

- Luôn bọc các khối tương tác trong `await step('Tên bước', async () => { ... })` để Storybook hiển thị chi tiết tiến trình trực quan trên bảng điều khiển Interactions.
- Thêm `{ delay: 40 }` khi gọi `userEvent.type()` để mô phỏng chính xác tốc độ gõ phím của con người và kích hoạt debounce timer một cách tự nhiên.
