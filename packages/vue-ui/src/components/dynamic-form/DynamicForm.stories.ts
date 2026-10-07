import type { Meta, StoryObj } from '@storybook/vue3';
import { within, userEvent, expect } from '@storybook/test';
import { ref } from 'vue';
import DynamicForm from './DynamicForm.vue';
import DynamicRowEditSheet from './DynamicRowEditSheet.vue';
import { Button } from '../ui/button/index.js';
import { Badge } from '../ui/badge/index.js';
import type { OpenAPISchema } from '../../schema/types.js';
import {
  FileCode2,
  Smartphone,
  Sparkles,
  Layers,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-vue-next';

const meta: Meta<typeof DynamicForm> = {
  title: 'Vue UI/DynamicForm',
  component: DynamicForm,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Hệ thống Schema-Driven UI & Dynamic Form tuân thủ chuẩn OpenAPI 3.0+. Hỗ trợ kế thừa qua `allOf`, suy luận Touch-friendly Widgets 44px, tự động validate constraints (required, min, max, pattern, enum), Mobile Bottom Sheet Drawer và Scoped Slot overrides (Tier 5).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// --- Schema Định nghĩa ---
const orderOpenAPISchema: OpenAPISchema = {
  type: 'object',
  title: 'Thông tin đơn hàng',
  description:
    'Schema OpenAPI 3.0 tự động sinh form tương tác với đầy đủ validation và touch controls',
  required: ['orderNumber', 'customer', 'status', 'total'],
  properties: {
    orderNumber: {
      type: 'string',
      title: 'Mã đơn hàng',
      description: 'Định dạng chuẩn ORD-XXXXXX',
      pattern: '^ORD-[0-9]{6}$',
      'x-ui-placeholder': 'ORD-202601',
      'x-ui-priority': 'high',
    },
    customer: {
      type: 'string',
      title: 'Tên khách hàng',
      minLength: 3,
      'x-ui-placeholder': 'Nhập họ tên khách hàng...',
      'x-ui-priority': 'high',
    },
    status: {
      type: 'string',
      title: 'Trạng thái đơn',
      enum: ['completed', 'pending', 'cancelled'],
      'x-ui-widget': 'pill-badges',
      'x-ui-priority': 'high',
      'x-ui-variants': {
        completed: 'default',
        pending: 'secondary',
        cancelled: 'destructive',
      },
    },
    progress: {
      type: 'number',
      title: 'Tiến độ hoàn thiện',
      minimum: 0,
      maximum: 100,
      'x-ui-step': 5,
      'x-ui-widget': 'slider',
      'x-ui-suffix': '%',
      'x-ui-priority': 'medium',
    },
    total: {
      type: 'number',
      title: 'Tổng giá trị đơn',
      minimum: 0,
      'x-ui-widget': 'currency',
      'x-ui-prefix': '$',
      'x-ui-priority': 'high',
    },
    deliveryDate: {
      type: 'string',
      title: 'Ngày giao dự kiến',
      format: 'date',
      'x-ui-widget': 'date',
      'x-ui-priority': 'medium',
    },
    isExpedited: {
      type: 'boolean',
      title: 'Giao hàng hỏa tốc',
      description: 'Ưu tiên vận chuyển trong 24 giờ',
      'x-ui-widget': 'switch',
      'x-ui-priority': 'medium',
    },
    notes: {
      type: 'string',
      title: 'Ghi chú đơn hàng',
      'x-ui-placeholder': 'Nhập ghi chú giao nhận hàng nếu có...',
      'x-ui-priority': 'low',
    },
  },
};

/**
 * Story 1: Form sinh tự động từ OpenAPI 3.0 schema với live data & live JSON inspector
 */
export const OpenApiOrderForm: Story = {
  render: () => ({
    components: { DynamicForm, Button, Badge, Sparkles, FileCode2, CheckCircle2 },
    setup() {
      const formData = ref({
        orderNumber: 'ORD-202601',
        customer: 'Công ty Alpha Tech',
        status: 'pending',
        progress: 45,
        total: 1250,
        deliveryDate: '2026-10-15',
        isExpedited: true,
        notes: 'Giao giờ hành chính tại quầy lễ tân',
      });

      const lastSubmitResult = ref<string>('');

      function handleSubmit(payload: { data: Record<string, any>; isValid: boolean }) {
        if (payload.isValid) {
          lastSubmitResult.value = `Đã lưu thành công đơn ${payload.data.orderNumber} lúc ${new Date().toLocaleTimeString()}`;
        } else {
          lastSubmitResult.value = 'Vui lòng sửa các lỗi hợp lệ trước khi lưu!';
        }
      }

      return {
        schema: orderOpenAPISchema,
        formData,
        lastSubmitResult,
        handleSubmit,
      };
    },
    template: `
      <div class="max-w-4xl mx-auto p-4 space-y-6">
        <div class="border-b pb-4">
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-bold tracking-tight text-foreground">OpenAPI 3.0 Dynamic Form Engine</h2>
            <Badge variant="secondary" class="font-mono text-xs">OpenAPI 3.0+</Badge>
            <Badge variant="outline" class="text-emerald-600 border-emerald-500/30 text-xs">Touch 44px</Badge>
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            Form tự động biên dịch trực tiếp từ JSON Schema đặc tả chuẩn Backend, tích hợp validation và dirty tracking.
          </p>
        </div>

        <div v-if="lastSubmitResult" class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 class="h-4 w-4 shrink-0" />
          <span>{{ lastSubmitResult }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <!-- Form Panel -->
          <div class="md:col-span-7 bg-card border rounded-xl p-5 shadow-xs">
            <DynamicForm
              v-model="formData"
              :schema="schema"
              @submit="handleSubmit"
            />
          </div>

          <!-- Live JSON State Inspector -->
          <div class="md:col-span-5 space-y-3">
            <div class="bg-muted/40 border rounded-xl p-4 space-y-2">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <FileCode2 class="h-4 w-4 text-primary" />
                <span>Live Reactive State (v-model)</span>
              </div>
              <pre class="bg-background/80 border p-3 rounded-lg text-[11px] font-mono overflow-auto max-h-[380px] text-foreground">{{ JSON.stringify(formData, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('1. Kiểm tra render các trường từ OpenAPI schema', async () => {
      expect(await canvas.findByText('Mã đơn hàng')).toBeInTheDocument();
      expect(await canvas.findByText('Tên khách hàng')).toBeInTheDocument();
      expect(await canvas.findByText('Trạng thái đơn')).toBeInTheDocument();
      expect(await canvas.findByText('Tổng giá trị đơn')).toBeInTheDocument();
    });

    await step('2. Tương tác nhập tên khách hàng', async () => {
      const customerInput = canvas.getByPlaceholderText(/nhập họ tên khách hàng/i);
      await userEvent.clear(customerInput);
      await userEvent.type(customerInput, 'Tập đoàn Vingroup VIP');
      expect(customerInput).toHaveValue('Tập đoàn Vingroup VIP');
    });

    await step('3. Kiểm tra validation khi vi phạm pattern mã đơn hàng', async () => {
      const orderInput = canvas.getByPlaceholderText(/ORD-202601/i);
      await userEvent.clear(orderInput);
      await userEvent.type(orderInput, 'INVALID-CODE');
      const submitBtn = canvas.getByRole('button', { name: /lưu thay đổi/i });
      await userEvent.click(submitBtn);
      expect(await canvas.findByText(/định dạng không hợp lệ/i)).toBeInTheDocument();
    });

    await step('4. Khôi phục mã đơn hàng hợp lệ và chọn trạng thái', async () => {
      const orderInput = canvas.getByPlaceholderText(/ORD-202601/i);
      await userEvent.clear(orderInput);
      await userEvent.type(orderInput, 'ORD-999888');

      const completedBadge = canvas.getByRole('button', { name: /completed/i });
      await userEvent.click(completedBadge);

      const submitBtn = canvas.getByRole('button', { name: /lưu thay đổi/i });
      await userEvent.click(submitBtn);
      expect(await canvas.findByText(/đã lưu thành công đơn ORD-999888/i)).toBeInTheDocument();
    });
  },
};

/**
 * Story 2: Kế thừa đa tầng qua allOf (BaseEntity + ContactInfo + CorporateProfile)
 */
export const SchemaInheritanceAllOf: Story = {
  render: () => ({
    components: { DynamicForm, Badge, Layers },
    setup() {
      const baseEntitySchema: OpenAPISchema = {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            title: 'Mã định danh hệ thống (ID)',
            readOnly: true,
            'x-ui-priority': 'high',
          },
          createdAt: {
            type: 'string',
            format: 'date',
            title: 'Ngày tạo hệ thống',
            readOnly: true,
            'x-ui-priority': 'low',
          },
        },
      };

      const contactSchema: OpenAPISchema = {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            title: 'Email liên hệ chính',
            pattern: '^[^@]+@[^@]+\\.[^@]+$',
            'x-ui-placeholder': 'contact@enterprise.com',
            'x-ui-priority': 'high',
          },
          phone: {
            type: 'string',
            title: 'Số hotline hỗ trợ',
            'x-ui-placeholder': '0901234567',
            'x-ui-priority': 'medium',
          },
        },
      };

      const corporateCustomerSchema: OpenAPISchema = {
        type: 'object',
        title: 'Hồ sơ Pháp nhân Doanh nghiệp',
        description: 'Mô hình kế thừa qua allOf: BaseEntity + ContactInfo + CorporateProfile',
        allOf: [
          baseEntitySchema,
          contactSchema,
          {
            type: 'object',
            required: ['companyName', 'taxId', 'creditTier'],
            properties: {
              companyName: {
                type: 'string',
                title: 'Tên pháp nhân công ty',
                minLength: 3,
                'x-ui-placeholder': 'Công ty TNHH Giải pháp Phần mềm...',
                'x-ui-priority': 'high',
              },
              taxId: {
                type: 'string',
                title: 'Mã số thuế doanh nghiệp (MST)',
                pattern: '^[0-9]{10}(-[0-9]{3})?$',
                'x-ui-placeholder': '0102030405',
                'x-ui-priority': 'high',
              },
              creditTier: {
                type: 'string',
                title: 'Hạng tín dụng',
                enum: ['Diamond', 'Gold', 'Silver'],
                'x-ui-widget': 'pill-badges',
                'x-ui-priority': 'high',
                'x-ui-variants': {
                  Diamond: 'default',
                  Gold: 'secondary',
                  Silver: 'outline',
                },
              },
              creditLimit: {
                type: 'number',
                title: 'Hạn mức tín dụng tối đa',
                minimum: 0,
                'x-ui-widget': 'currency',
                'x-ui-prefix': '₫',
                'x-ui-priority': 'medium',
              },
            },
          },
        ],
      };

      const corporateData = ref({
        id: 'ENT-99201',
        createdAt: '2026-01-01',
        email: 'info@tuquet.io',
        phone: '0988776655',
        companyName: 'Tuquet Enterprise Solutions Inc.',
        taxId: '0108928374',
        creditTier: 'Diamond',
        creditLimit: 500000000,
      });

      return {
        schema: corporateCustomerSchema,
        corporateData,
      };
    },
    template: `
      <div class="max-w-2xl mx-auto p-4 space-y-5">
        <div class="border-b pb-4">
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-bold tracking-tight text-foreground">Kế thừa Schema qua allOf</h2>
            <Badge variant="secondary" class="font-mono text-xs">allOf Composition</Badge>
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            Normalizer tự động thực hiện deep merge các schema cha con: BaseEntity + ContactInfo + CorporateProfile thành một giao diện đồng nhất.
          </p>
        </div>

        <div class="bg-card border rounded-xl p-5 shadow-xs">
          <DynamicForm
            v-model="corporateData"
            :schema="schema"
          />
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('1. Kiểm tra các trường kế thừa từ BaseEntity', async () => {
      expect(await canvas.findByText(/mã định danh hệ thống/i)).toBeInTheDocument();
      expect(await canvas.findByText(/ngày tạo hệ thống/i)).toBeInTheDocument();
    });

    await step('2. Kiểm tra các trường kế thừa từ ContactInfo', async () => {
      expect(await canvas.findByText(/email liên hệ chính/i)).toBeInTheDocument();
      expect(await canvas.findByText(/số hotline/i)).toBeInTheDocument();
    });

    await step('3. Kiểm tra các trường từ CorporateProfile', async () => {
      expect(await canvas.findByText(/tên pháp nhân/i)).toBeInTheDocument();
      expect(await canvas.findByText(/mã số thuế/i)).toBeInTheDocument();
      expect(await canvas.findByText(/hạng tín dụng/i)).toBeInTheDocument();
    });
  },
};

/**
 * Story 3: Mobile Bottom Sheet Drawer (DynamicRowEditSheet)
 * Tối ưu hoàn hảo cho màn hình di động, không làm vỡ layout bảng
 */
export const MobileRowEditSheetStory: Story = {
  name: 'Mobile Bottom Sheet Drawer',
  render: () => ({
    components: { DynamicRowEditSheet, Button, Badge, Smartphone, Sparkles },
    setup() {
      const isSheetOpen = ref(false);
      const rowData = ref({
        orderNumber: 'ORD-202688',
        customer: 'Nguyễn Thị Minh Khai',
        status: 'pending',
        progress: 70,
        total: 3450,
        deliveryDate: '2026-11-20',
        isExpedited: false,
        notes: 'Khách yêu cầu gọi trước 30 phút khi giao hàng',
      });

      const lastSavedToast = ref('');

      function handleSave(updated: Record<string, any>) {
        rowData.value = { ...rowData.value, ...updated };
        isSheetOpen.value = false;
        lastSavedToast.value = `Đã lưu đơn hàng ${updated.orderNumber} thành công! Khách hàng: "${updated.customer}"`;
      }

      return {
        isSheetOpen,
        rowData,
        schema: orderOpenAPISchema,
        lastSavedToast,
        handleSave,
      };
    },
    template: `
      <div class="max-w-md mx-auto p-4 space-y-4">
        <div class="border-b pb-3">
          <div class="flex items-center gap-2">
            <Smartphone class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-bold tracking-tight text-foreground">Mobile Row Edit Sheet</h2>
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            Mở form chỉnh sửa dạng Bottom Sheet Drawer từ đáy màn hình, thiết kế touch-first 44px, safe-area keyboard.
          </p>
        </div>

        <div v-if="lastSavedToast" class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
          {{ lastSavedToast }}
        </div>

        <!-- Preview Card -->
        <div class="p-4 rounded-xl border bg-card space-y-2 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="font-mono font-bold text-sm text-primary">{{ rowData.orderNumber }}</span>
            <Badge :variant="rowData.status === 'completed' ? 'default' : 'secondary'">{{ rowData.status }}</Badge>
          </div>
          <div class="text-sm font-medium text-foreground">{{ rowData.customer }}</div>
          <div class="text-xs text-muted-foreground flex items-center justify-between">
            <span>Tiến độ: {{ rowData.progress }}%</span>
            <span class="font-mono font-semibold text-foreground">\${{ rowData.total }}</span>
          </div>

          <div class="pt-2">
            <Button class="w-full h-11 text-xs gap-2" @click="isSheetOpen = true">
              <Smartphone class="h-4 w-4" />
              <span>Chỉnh sửa đơn hàng (Mobile Drawer)</span>
            </Button>
          </div>
        </div>

        <!-- The Mobile Bottom Sheet Drawer -->
        <DynamicRowEditSheet
          v-model:open="isSheetOpen"
          :schema="schema"
          :initial-data="rowData"
          :title="'Chỉnh sửa: ' + rowData.orderNumber"
          description="Chỉnh sửa thông tin đơn hàng nhanh chóng với thao tác chạm"
          @save="handleSave"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('1. Mở Mobile Bottom Sheet Drawer', async () => {
      const openBtn = canvas.getByRole('button', { name: /chỉnh sửa đơn hàng/i });
      await userEvent.click(openBtn);
    });

    await step('2. Kiểm tra Drawer hiển thị các trường nhập liệu 44px', async () => {
      // Radix sheet renders in teleport to body or inside container
      const body = within(document.body);
      expect(await body.findByText(/chỉnh sửa: ord-202688/i)).toBeInTheDocument();
      expect(await body.findByText(/chỉnh sửa thông tin đơn hàng/i)).toBeInTheDocument();
    });

    await step('3. Chỉnh sửa tên khách hàng trong Drawer', async () => {
      const body = within(document.body);
      const customerInput = body.getByPlaceholderText(/nhập họ tên khách hàng/i);
      await userEvent.clear(customerInput);
      await userEvent.type(customerInput, 'Nguyễn Thị Minh Khai VIP');
      expect(customerInput).toHaveValue('Nguyễn Thị Minh Khai VIP');
    });

    await step('4. Nhấn nút Lưu thay đổi', async () => {
      const body = within(document.body);
      const saveBtn = body.getByRole('button', { name: /lưu thay đổi/i });
      await userEvent.click(saveBtn);
    });

    await step('5. Kiểm tra dữ liệu đã cập nhật lên thẻ preview', async () => {
      expect(await canvas.findByText('Nguyễn Thị Minh Khai VIP')).toBeInTheDocument();
    });
  },
};

/**
 * Story 4: Scoped Slot Overrides (Tier 5)
 * Cho phép developer can thiệp bất kỳ trường UI nào qua Vue 3 scoped slots
 */
export const CustomSlotOverrides: Story = {
  name: 'Tier 5: Scoped Slot Overrides',
  render: () => ({
    components: { DynamicForm, Button, Badge, SlidersHorizontal },
    setup() {
      const data = ref({
        orderNumber: 'ORD-202677',
        customer: 'Tập đoàn Công nghệ Beta',
        status: 'pending',
        progress: 60,
        total: 2800,
      });

      const presets = [0, 25, 50, 75, 100];

      return {
        schema: orderOpenAPISchema,
        data,
        presets,
      };
    },
    template: `
      <div class="max-w-xl mx-auto p-4 space-y-4">
        <div class="border-b pb-3">
          <div class="flex items-center gap-2">
            <SlidersHorizontal class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-bold tracking-tight text-foreground">Tier 5 Scoped Slot Customization</h2>
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            Ghi đè trường <code>progress</code> bằng template Scoped Slot <code>#field-progress</code> để cung cấp các nút preset nhanh thay vì widget mặc định.
          </p>
        </div>

        <div class="bg-card border rounded-xl p-5 shadow-xs">
          <DynamicForm
            v-model="data"
            :schema="schema"
          >
            <!-- Custom Field Slot for 'progress' -->
            <template #field-progress="{ field, value, onChange }">
              <div class="space-y-2 p-3 rounded-lg border bg-muted/20">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-semibold text-foreground flex items-center gap-1.5">
                    <SlidersHorizontal class="h-3.5 w-3.5 text-primary" />
                    <span>{{ field.label }} (Custom Scoped Slot UI)</span>
                  </span>
                  <Badge variant="outline" class="font-mono text-primary font-bold">
                    {{ value || 0 }}%
                  </Badge>
                </div>

                <!-- Custom Quick Preset Buttons -->
                <div class="flex items-center gap-1.5 pt-1">
                  <button
                    v-for="p in presets"
                    :key="p"
                    type="button"
                    class="flex-1 py-1 text-xs rounded border transition-colors font-mono"
                    :class="value === p ? 'bg-primary text-primary-foreground font-bold shadow-2xs' : 'bg-background hover:bg-muted text-muted-foreground'"
                    @click="onChange(p)"
                  >
                    {{ p }}%
                  </button>
                </div>
              </div>
            </template>
          </DynamicForm>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('1. Kiểm tra custom slot render thay thế widget thông thường', async () => {
      expect(await canvas.findByText(/custom scoped slot ui/i)).toBeInTheDocument();
      expect(canvas.getByRole('button', { name: '100%' })).toBeInTheDocument();
    });

    await step('2. Click chọn preset 100% qua custom slot', async () => {
      const btn100 = canvas.getByRole('button', { name: '100%' });
      await userEvent.click(btn100);
      expect(await canvas.findByText('100%')).toBeInTheDocument();
    });
  },
};
