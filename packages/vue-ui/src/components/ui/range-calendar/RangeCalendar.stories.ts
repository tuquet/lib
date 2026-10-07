import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import RangeCalendar from './RangeCalendar.vue';
import { today, getLocalTimeZone, type DateRange } from '@tuquet/vue-ui';

const meta: Meta<typeof RangeCalendar> = {
  title: 'Vue UI/RangeCalendar',
  component: RangeCalendar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'RangeCalendar là component chọn dải ngày chuyên dụng (Date Range Calendar), hỗ trợ hiển thị đồng thời nhiều tháng, bản địa hóa và bàn phím tương tác chuẩn tiếp cận A11y (Radix / Reka UI).',
      },
    },
  },
  argTypes: {
    numberOfMonths: {
      control: { type: 'range', min: 1, max: 4, step: 1 },
      description: 'Số lượng tháng hiển thị song song đồng thời',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '1' },
        category: 'Layout',
      },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Vô hiệu hóa toàn bộ tương tác chọn ngày',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    readonly: {
      control: { type: 'boolean' },
      description: 'Chế độ chỉ đọc (cho phép điều hướng nhưng không đổi giá trị)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    pagedNavigation: {
      control: { type: 'boolean' },
      description: 'Chuyển tháng theo số lượng tháng hiển thị (jump theo numberOfMonths)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Navigation',
      },
    },
    fixedWeeks: {
      control: { type: 'boolean' },
      description:
        'Cố định luôn hiển thị 6 hàng tuần mỗi tháng để giao diện không bị giật kích thước',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Layout',
      },
    },
  },
  args: {
    numberOfMonths: 1,
    disabled: false,
    readonly: false,
    pagedNavigation: false,
    fixedWeeks: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleMonthRange: Story = {
  args: {
    numberOfMonths: 1,
    disabled: false,
    readonly: false,
    pagedNavigation: false,
    fixedWeeks: false,
  },
  render: (args) => ({
    components: { RangeCalendar },
    setup() {
      const now = today(getLocalTimeZone());
      const value = ref<DateRange>({
        start: now,
        end: now.add({ days: 7 }),
      });
      return { args, value };
    },
    template: `
      <div class="p-6 max-w-sm space-y-3">
        <label class="text-sm font-semibold">Chọn dải ngày (Điều khiển qua tab Controls):</label>
        <div class="border rounded-md inline-block bg-card">
          <RangeCalendar v-bind="args" v-model="value" />
        </div>
        <div class="text-xs text-muted-foreground">
          Từ: {{ value.start?.toString() }} - Đến: {{ value.end?.toString() }}
        </div>
      </div>
    `,
  }),
};

export const TwoMonthsSideBySide: Story = {
  args: {
    numberOfMonths: 2,
    pagedNavigation: true,
    disabled: false,
    readonly: false,
    fixedWeeks: false,
  },
  render: (args) => ({
    components: { RangeCalendar },
    setup() {
      const now = today(getLocalTimeZone());
      const value = ref<DateRange>({
        start: now,
        end: now.add({ days: 14 }),
      });
      return { args, value };
    },
    template: `
      <div class="p-6 space-y-3">
        <label class="text-sm font-semibold">Chọn dải ngày song song 2 tháng (:number-of-months="2"):</label>
        <div class="border rounded-md inline-block bg-card">
          <RangeCalendar v-bind="args" v-model="value" />
        </div>
        <div class="text-xs text-muted-foreground">
          Dải ngày đã chọn: {{ value.start?.toString() }} đến {{ value.end?.toString() }}
        </div>
      </div>
    `,
  }),
};
