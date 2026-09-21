import type { Meta, StoryObj } from '@storybook/vue3';
import { within, userEvent, expect } from '@storybook/test';
import { Card, CardContent, CardHeader, CardTitle } from '@tuquet/vue-ui';
import { ref } from 'vue';
import { filterDataset } from '../helpers/filterEngine.js';
import type {
  ColumnFilterDefinition,
  DynamicFilterRule,
  FilterConjunction,
  FilterPreset,
} from '../types/filter.js';
import DataTableFilterBuilder from './DataTableFilterBuilder.vue';

const meta: Meta<typeof DataTableFilterBuilder> = {
  title: 'Table/Advanced Filter Builder',
  component: DataTableFilterBuilder,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Bộ lọc linh hoạt chuẩn Enterprise Database (tương tự Notion, Airtable, Supabase, Metabase). Hỗ trợ lọc đa điều kiện, chuyển đổi toán tử tự động theo kiểu dữ liệu (text, number, select, date, boolean), liên kết logic AND/OR, và lưu các mẫu lọc sẵn (presets).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataTableFilterBuilder>;

const SAMPLE_COLUMNS: ColumnFilterDefinition[] = [
  { id: 'customer', label: 'Khách hàng', dataType: 'text', placeholder: 'Tìm kiếm tên...' },
  { id: 'role', label: 'Vai trò', dataType: 'text', placeholder: 'Ví dụ: Procurement...' },
  { id: 'total', label: 'Tổng tiền ($)', dataType: 'number' },
  { id: 'progress', label: 'Tiến độ (%)', dataType: 'number' },
  {
    id: 'status',
    label: 'Trạng thái',
    dataType: 'select',
    options: [
      { label: 'Hoàn thành (completed)', value: 'completed' },
      { label: 'Đang xử lý (pending)', value: 'pending' },
      { label: 'Đã hủy (cancelled)', value: 'cancelled' },
    ],
  },
  { id: 'createdAt', label: 'Ngày tạo', dataType: 'date' },
  { id: 'isVip', label: 'Khách hàng VIP', dataType: 'boolean' },
];

const SAMPLE_PRESETS: FilterPreset[] = [
  {
    id: 'preset_high_value',
    name: '💰 Đơn hàng giá trị cao (> $3,000)',
    conjunction: 'and',
    rules: [{ id: 'p1', field: 'total', operator: 'gt', value: 3000 }],
  },
  {
    id: 'preset_pending_urgent',
    name: '⏳ Đang chờ xử lý & Tiến độ < 50%',
    conjunction: 'and',
    rules: [
      { id: 'p2', field: 'status', operator: 'is', value: 'pending' },
      { id: 'p3', field: 'progress', operator: 'lt', value: 50 },
    ],
  },
  {
    id: 'preset_vingroup',
    name: '🏢 Đơn hàng Vingroup',
    conjunction: 'and',
    rules: [{ id: 'p4', field: 'customer', operator: 'contains', value: 'Vingroup' }],
  },
];

const MOCK_ITEMS = [
  {
    id: 'ord_1',
    customer: 'Tập đoàn Vingroup JSC',
    role: 'Procurement Specialist',
    status: 'completed',
    total: 4200,
    progress: 100,
    isVip: true,
  },
  {
    id: 'ord_2',
    customer: 'Công ty FPT Software',
    role: 'IT Operations Manager',
    status: 'pending',
    total: 1800,
    progress: 35,
    isVip: false,
  },
  {
    id: 'ord_3',
    customer: 'Tổng Công ty Vietnam Airlines',
    role: 'Finance Director',
    status: 'cancelled',
    total: 5500,
    progress: 15,
    isVip: true,
  },
  {
    id: 'ord_4',
    customer: 'Tập đoàn Viettel Telecom',
    role: 'Supply Chain Lead',
    status: 'completed',
    total: 3100,
    progress: 100,
    isVip: true,
  },
  {
    id: 'ord_5',
    customer: 'Công ty CP Sữa Vinamilk',
    role: 'Regional Operations',
    status: 'pending',
    total: 850,
    progress: 20,
    isVip: false,
  },
];

export const Default: Story = {
  render: () => ({
    components: { DataTableFilterBuilder, Card, CardHeader, CardTitle, CardContent },
    setup() {
      const rules = ref<DynamicFilterRule[]>([
        { id: 'r1', field: 'total', operator: 'gt', value: 2000 },
      ]);
      const conjunction = ref<FilterConjunction>('and');

      return {
        columns: SAMPLE_COLUMNS,
        presets: SAMPLE_PRESETS,
        rules,
        conjunction,
        mockItems: MOCK_ITEMS,
        filteredItems: () => filterDataset(MOCK_ITEMS, rules.value, conjunction.value),
      };
    },
    template: `
      <div class="space-y-6 max-w-4xl p-4">
        <div>
          <h2 class="text-lg font-bold">Enterprise Database Filter Builder Playground</h2>
          <p class="text-sm text-muted-foreground">Thử nghiệm xây dựng bộ lọc linh hoạt với các toán tử đa dạng và áp dụng trực tiếp lên dữ liệu.</p>
        </div>

        <div class="p-4 border rounded-lg bg-card shadow-xs">
          <DataTableFilterBuilder
            :column-defs="columns"
            :rules="rules"
            :conjunction="conjunction"
            :presets="presets"
            @update:rules="(r) => rules = r"
            @update:conjunction="(c) => conjunction = c"
            @apply-preset="(p) => {
              conjunction = p.conjunction;
              rules = p.rules.map(r => ({ ...r, id: 'rule_' + Math.random() }));
            }"
            @clear-rules="rules = []"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Live Rules AST Output -->
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-semibold flex items-center justify-between">
                <span>Filter Query AST (JSON)</span>
                <span class="text-xs font-mono font-normal text-muted-foreground">{{ rules.length }} điều kiện</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre class="bg-muted p-3 rounded text-xs font-mono overflow-auto max-h-48">{{ JSON.stringify({ conjunction, rules }, null, 2) }}</pre>
            </CardContent>
          </Card>

          <!-- Filtered Results Preview -->
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-semibold flex items-center justify-between">
                <span>Kết quả lọc dữ liệu</span>
                <span class="text-xs font-mono font-normal text-muted-foreground">{{ filteredItems().length }} / {{ mockItems.length }} kết quả</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-2 max-h-48 overflow-auto">
                <div
                  v-for="item in filteredItems()"
                  :key="item.id"
                  class="flex items-center justify-between p-2 rounded bg-muted/50 text-xs border"
                >
                  <div class="font-medium">{{ item.customer }}</div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-emerald-600 font-semibold">\${{ item.total.toLocaleString() }}</span>
                    <span class="px-1.5 py-0.5 rounded text-[10px]" :class="item.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : item.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'">
                      {{ item.status }}
                    </span>
                  </div>
                </div>
                <div v-if="filteredItems().length === 0" class="text-center py-4 text-xs text-muted-foreground">
                  Không có dòng nào thỏa mãn bộ lọc hiện tại.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }: { canvasElement: HTMLElement; step: any }) => {
    const canvas = within(canvasElement);

    await step('1. Mở Popover bộ lọc linh hoạt', async () => {
      const triggerBtn = canvas.getByRole('button', { name: /(bộ lọc linh hoạt|filter)/i });
      expect(triggerBtn).toBeInTheDocument();
      await userEvent.click(triggerBtn);
    });

    const body = within(document.body);

    await step('2. Xác minh điều kiện có sẵn và ô nhập giá trị', async () => {
      expect(await body.findByText(/(bộ lọc linh hoạt|filter)/i)).toBeInTheDocument();
      const existingInput = body.getByDisplayValue('2000');
      expect(existingInput).toBeInTheDocument();
    });

    await step('3. Bấm Thêm điều kiện và xác minh dòng value xuất hiện đầy đủ', async () => {
      const addRuleBtn = body.getByRole('button', { name: /(thêm điều kiện|add rule)/i });
      await userEvent.click(addRuleBtn);

      // Tìm tất cả các ô input nhập giá trị trong popover
      const inputs = body.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);

      // Nhập giá trị vào ô input mới thêm
      const lastInput = inputs[inputs.length - 1];
      await userEvent.type(lastInput, 'Vingroup');
      expect(lastInput).toHaveValue('Vingroup');
    });
  },
};
