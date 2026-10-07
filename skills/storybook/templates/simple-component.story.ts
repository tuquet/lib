import type { Meta, StoryObj } from '@storybook/vue3';
import { within, userEvent, expect } from '@storybook/test';
import { ref } from 'vue';
import { Button } from '@tuquet/vue-ui';

/**
 * Template mẫu cho component đơn (Button, Badge, Input, Card, v.v.)
 */
const meta: Meta<typeof Button> = {
  title: 'Vue UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Nút bấm tương tác chuẩn Shadcn-Vue với đầy đủ variants, kích cỡ và trạng thái loading.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Kiểu biến thể giao diện của nút',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "'default'" },
        category: 'Appearance',
      },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Kích thước hiển thị',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "'default'" },
        category: 'Appearance',
      },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Trạng thái vô hiệu hóa',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
  },
  args: {
    variant: 'default',
    size: 'default',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Mặc định có tương tác',
  args: {
    variant: 'default',
    size: 'default',
    disabled: false,
  },
  render: (args) => ({
    components: { Button },
    setup() {
      const clickCount = ref(0);
      function handleClick() {
        clickCount.value++;
      }
      return { args, clickCount, handleClick };
    },
    template: `
      <div class="p-6 flex flex-col items-center gap-4">
        <Button v-bind="args" @click="handleClick">
          Click me ({{ clickCount }})
        </Button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('1. Kiểm tra hiển thị nút ban đầu', async () => {
      const btn = canvas.getByRole('button', { name: /click me/i });
      expect(btn).toBeInTheDocument();
    });

    await step('2. Click nút và kiểm tra số đếm tăng lên', async () => {
      const btn = canvas.getByRole('button', { name: /click me/i });
      await userEvent.click(btn);
      expect(canvas.getByText(/click me \(1\)/i)).toBeInTheDocument();
    });
  },
};
