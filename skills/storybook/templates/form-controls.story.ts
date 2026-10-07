import type { Meta, StoryObj } from '@storybook/vue3';
import { within, userEvent, expect } from '@storybook/test';
import { ref } from 'vue';
import { RemoteCombobox } from '@tuquet/vue-table';

interface CustomerOption {
  value: string;
  label: string;
  email: string;
}

const mockCustomers: CustomerOption[] = Array.from({ length: 150 }, (_, i) => ({
  value: `cust_${i + 1}`,
  label: `Khách hàng #${i + 1}`,
  email: `customer${i + 1}@tuquet.io`,
}));

const meta: Meta<typeof RemoteCombobox> = {
  title: 'Vue Table/RemoteComboboxTemplate',
  component: RemoteCombobox,
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: { type: 'text' },
      description: 'Chữ gợi ý trong ô tìm kiếm',
    },
    pageSize: {
      control: { type: 'select' },
      options: [10, 20, 50],
      description: 'Số lượng item tải mỗi lần cuộn vô tận',
    },
  },
  args: {
    placeholder: 'Tìm kiếm khách hàng...',
    pageSize: 15,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Infinite Scroll Combobox',
  render: (args: any) => ({
    components: { RemoteCombobox },
    setup() {
      const selectedCustomer = ref<string | null>(null);

      async function fetchCustomers({ search, page, pageSize }: any) {
        await new Promise((r) => setTimeout(r, 120));
        let list = [...mockCustomers];
        if (search) {
          list = list.filter(
            (c) =>
              c.label.toLowerCase().includes(search.toLowerCase()) ||
              c.email.toLowerCase().includes(search.toLowerCase())
          );
        }
        const start = (page - 1) * pageSize;
        return {
          items: list.slice(start, start + pageSize),
          hasMore: start + pageSize < list.length,
          total: list.length,
        };
      }

      return { args, selectedCustomer, fetchCustomers };
    },
    template: `
      <div class="p-6 max-w-sm mx-auto space-y-2">
        <label class="text-xs font-semibold text-foreground">Chọn khách hàng:</label>
        <RemoteCombobox
          v-model="selectedCustomer"
          v-bind="args"
          :fetcher="fetchCustomers"
        />
        <p class="text-xs text-muted-foreground">ID đã chọn: {{ selectedCustomer || 'chưa chọn' }}</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('1. Kiểm tra placeholder combobox', async () => {
      expect(await canvas.findByText(/tìm kiếm khách hàng/i)).toBeInTheDocument();
    });
  },
};
