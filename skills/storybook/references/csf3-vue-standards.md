# Chuẩn mực CSF3 (Component Story Format v3) cho Vue 3 & TypeScript

Tài liệu này định nghĩa cấu trúc chuẩn và các quy tắc kỹ thuật khi viết Storybook stories cho Vue 3 trong monorepo `@tuquet`.

---

## 1. Cấu trúc Khung Cơ bản của một Story File

```typescript
import type { Meta, StoryObj } from '@storybook/vue3';
import { ref, watch } from 'vue';
import MyComponent from './MyComponent.vue';

const meta: Meta<typeof MyComponent> = {
  title: 'Category/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Mô tả ngắn gọn mục đích và chức năng của component.',
      },
    },
  },
  argTypes: {
    // Khai báo controls tại đây
  },
  args: {
    // Giá trị mặc định ban đầu
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Mặc định',
  args: {},
  render: (args) => ({
    components: { MyComponent },
    setup() {
      // Logic reactivity, computed, watchers
      return { args };
    },
    template: `<MyComponent v-bind="args" />`,
  }),
};
```

---

## 2. Các Quy tắc Reactivity & Đồng bộ Args

Khi người dùng thay đổi giá trị trong tab **Controls** của Storybook, đối tượng `args` được truyền vào `render` sẽ cập nhật reactive:

### Cách 1: Sử dụng `v-bind="args"` trực tiếp

Nếu props của component nhận trực tiếp từ `args`, hãy dùng `v-bind="args"`:

```typescript
template: `<MyComponent v-bind="args" />`;
```

### Cách 2: Sử dụng `watch` khi component có internal state

Nếu Story tự quản lý state phụ thuộc vào `args` (ví dụ: `density`, `datasetSize`):

```typescript
setup() {
  const density = ref(args.density || 'compact');

  // Lắng nghe khi args thay đổi từ Controls panel
  watch(
    () => args.density,
    (newVal) => {
      if (newVal) density.value = newVal;
    }
  );

  return { args, density };
}
```

---

## 3. Quy tắc Render Component Phức hợp (Composite Stories)

Đối với các component lớn cần tích hợp nhiều component con (như `DataTable` kết hợp `Button`, `DropdownMenu`, `EditableCell`):

1. **Đăng ký đầy đủ trong `components`**:
   ```typescript
   components: {
     DataTable,
     EditableCell,
     Button,
     DropdownMenu,
     DropdownMenuTrigger,
     DropdownMenuContent,
     DropdownMenuItem,
     Sparkles,
     Pencil,
   }
   ```
2. **Khai báo types an toàn trong `setup()`**:
   - Khởi tạo mock data bằng hàm helper bên ngoài (ví dụ: `generateEnterpriseOrders(count)`).
   - Tuyệt đối không để chuỗi HTML template chứa biểu thức TypeScript phức tạp.
