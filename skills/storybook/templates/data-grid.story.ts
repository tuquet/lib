import type { Meta, StoryObj } from '@storybook/vue3';
import { within, userEvent, expect } from '@storybook/test';
import { ref, watch, h } from 'vue';
import { DataTable, EditableCell } from '@tuquet/vue-table';
import { useRemoteTable } from '@tuquet/vue-table';
import {
  createSelectionColumn,
  createCopyableColumn,
  createDateColumn,
  createActionsColumn,
  exportToCsv,
} from '@tuquet/vue-table';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@tuquet/vue-ui';
import { Download, Sparkles, Pencil } from 'lucide-vue-next';

interface SampleItem {
  id: string;
  code: string;
  name: string;
  status: 'active' | 'inactive';
  amount: number;
  createdAt: string;
}

const generateMockData = (count: number): SampleItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `item_${i + 1}`,
    code: `CODE-${String(1000 + i)}`,
    name: `Khách hàng mẫu #${i + 1}`,
    status: i % 2 === 0 ? 'active' : 'inactive',
    amount: Math.round((50 + (i % 20) * 12.5) * 100) / 100,
    createdAt: new Date().toISOString(),
  }));
};

const meta: Meta<typeof DataTable> = {
  title: 'Vue Table/EnterpriseGridTemplate',
  component: DataTable,
  tags: ['autodocs'],
  argTypes: {
    virtual: {
      control: { type: 'boolean' },
      description: 'Chế độ cuộn ảo TanStack Virtual 60 FPS',
      table: { category: 'Virtual Scrolling' },
    },
    density: {
      control: { type: 'inline-radio' },
      options: ['compact', 'normal', 'comfortable'],
      description: 'Khoảng cách hàng',
      table: { category: 'Appearance' },
    },
  },
  args: {
    virtual: true,
    density: 'compact',
    showToolbar: true,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const MasterGrid: Story = {
  name: 'Master Data Grid',
  render: (args: any) => ({
    components: { DataTable, EditableCell, Button, Download, Sparkles, Pencil },
    setup() {
      const dataset = ref<SampleItem[]>(generateMockData(1000));
      const toastMessage = ref('');

      function showToast(msg: string) {
        toastMessage.value = msg;
        setTimeout(() => {
          if (toastMessage.value === msg) toastMessage.value = '';
        }, 3000);
      }

      function updateItem(id: string, updates: Partial<SampleItem>) {
        const found = dataset.value.find((x) => x.id === id);
        if (found) Object.assign(found, updates);
        remote.mutateRow(id, updates);
      }

      const columns: ColumnDef<SampleItem>[] = [
        createSelectionColumn<SampleItem>({ size: 48 }),
        createCopyableColumn<SampleItem>({
          accessorKey: 'code',
          header: 'Mã',
          size: 130,
        } as any),
        {
          id: 'name',
          accessorKey: 'name',
          header: 'Họ và tên',
          size: 200,
          cell: ({ row }) => {
            return h(EditableCell, {
              modelValue: row.original.name,
              type: 'text',
              validate: (val: string) => (!val || !val.trim() ? 'Tên không được để trống' : null),
              'onUpdate:modelValue': (newVal: string) => {
                updateItem(row.original.id, { name: newVal });
                showToast(`Đã cập nhật tên: ${newVal}`);
              },
            });
          },
        },
        createDateColumn<SampleItem>({
          accessorKey: 'createdAt',
          header: 'Ngày tạo',
          relative: true,
          size: 140,
        } as any),
      ];

      const remote = useRemoteTable<SampleItem>({
        columns,
        defaultPageSize: 1000,
        columnPinning: {
          left: ['select'],
        },
        fetcher: async () => ({
          data: dataset.value,
          total: dataset.value.length,
        }),
      });

      return { args, remote, toastMessage };
    },
    template: `
      <div class="p-4 space-y-3 max-w-[1100px] mx-auto">
        <div v-if="toastMessage" class="p-2 rounded border bg-card text-xs flex items-center gap-2">
          <Sparkles class="h-4 w-4 text-emerald-500" />
          <span>{{ toastMessage }}</span>
        </div>
        <DataTable v-bind="args" :remote="remote" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('1. Khởi tạo bảng thành công', async () => {
      expect(await canvas.findByText('CODE-1000')).toBeInTheDocument();
    });
  },
};
