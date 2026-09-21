import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
  CommandDialog,
  Button,
} from '@tuquet/vue-ui';
import { Calculator, Calendar, CreditCard, Settings, Smile, User } from 'lucide-vue-next';

const meta: Meta<any> = {
  title: 'Vue UI/Command',
  component: Command,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Command là hộp thoại tìm kiếm và điều hướng nhanh chuẩn Spotlight / Command Palette (cmdk), hỗ trợ phân nhóm, phím tắt (shortcuts), bộ lọc mờ (fuzzy filter) và hỗ trợ mở dạng Dialog modal.',
      },
    },
  },
  argTypes: {
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder hiển thị trong ô nhập tìm kiếm của Command Palette',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "'Gõ lệnh hoặc tìm kiếm...'" },
        category: 'Text',
      },
    },
    emptyText: {
      control: { type: 'text' },
      description: 'Nội dung thông báo khi không tìm thấy kết quả phù hợp',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "'Không tìm thấy kết quả nào.'" },
        category: 'Text',
      },
    },
  },
  args: {
    placeholder: 'Gõ lệnh hoặc tìm kiếm...',
    emptyText: 'Không tìm thấy kết quả nào.',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const InlinePalette: Story = {
  args: {
    placeholder: 'Gõ lệnh hoặc tìm kiếm...',
    emptyText: 'Không tìm thấy kết quả nào.',
  },
  render: (args: any) => ({
    components: {
      Command,
      CommandInput,
      CommandList,
      CommandEmpty,
      CommandGroup,
      CommandItem,
      CommandSeparator,
      CommandShortcut,
      Calendar,
      Smile,
      Calculator,
      User,
      CreditCard,
      Settings,
    },
    setup() {
      const selected = ref('');
      function handleSelect(val: string) {
        selected.value = val;
      }
      return { args, selected, handleSelect };
    },
    template: `
      <div class="p-6 max-w-md space-y-4">
        <label class="text-sm font-semibold">Command Palette (Điều khiển placeholder qua tab Controls):</label>
        <Command class="rounded-lg border shadow-md">
          <CommandInput :placeholder="args.placeholder" />
          <CommandList>
            <CommandEmpty>{{ args.emptyText }}</CommandEmpty>
            <CommandGroup heading="Gợi ý">
              <CommandItem value="calendar" @select="handleSelect('Lịch')">
                <Calendar class="mr-2 h-4 w-4" />
                <span>Lịch</span>
              </CommandItem>
              <CommandItem value="search-emoji" @select="handleSelect('Tìm emoji')">
                <Smile class="mr-2 h-4 w-4" />
                <span>Tìm kiếm biểu tượng</span>
              </CommandItem>
              <CommandItem value="calculator" @select="handleSelect('Máy tính')">
                <Calculator class="mr-2 h-4 w-4" />
                <span>Máy tính</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Cài đặt hệ thống">
              <CommandItem value="profile" @select="handleSelect('Hồ sơ')">
                <User class="mr-2 h-4 w-4" />
                <span>Hồ sơ người dùng</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem value="billing" @select="handleSelect('Thanh toán')">
                <CreditCard class="mr-2 h-4 w-4" />
                <span>Hóa đơn & Thanh toán</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem value="settings" @select="handleSelect('Cài đặt')">
                <Settings class="mr-2 h-4 w-4" />
                <span>Thiết lập</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
        <div v-if="selected" class="text-xs text-muted-foreground p-2 rounded bg-muted/40">
          Vừa chọn: <span class="font-semibold text-foreground">{{ selected }}</span>
        </div>
      </div>
    `,
  }),
};

export const DialogModalMode: Story = {
  args: {
    placeholder: 'Nhập để tìm kiếm lệnh...',
    emptyText: 'Không có kết quả phù hợp.',
  },
  render: (args: any) => ({
    components: {
      Button,
      CommandDialog,
      CommandInput,
      CommandList,
      CommandEmpty,
      CommandGroup,
      CommandItem,
      CommandSeparator,
      CommandShortcut,
      Calendar,
      Smile,
      Calculator,
      User,
      CreditCard,
      Settings,
    },
    setup() {
      const open = ref(false);
      return { args, open };
    },
    template: `
      <div class="p-6 space-y-3">
        <label class="text-sm font-semibold">Command Dialog (Modal Spotlight):</label>
        <div>
          <Button variant="outline" @click="open = true">
            Mở Command Dialog (⌘K)
          </Button>
        </div>
        <CommandDialog v-model:open="open">
          <CommandInput :placeholder="args.placeholder" />
          <CommandList>
            <CommandEmpty>{{ args.emptyText }}</CommandEmpty>
            <CommandGroup heading="Điều hướng nhanh">
              <CommandItem value="calendar" @select="open = false">
                <Calendar class="mr-2 h-4 w-4" />
                <span>Xem lịch</span>
              </CommandItem>
              <CommandItem value="profile" @select="open = false">
                <User class="mr-2 h-4 w-4" />
                <span>Hồ sơ cá nhân</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    `,
  }),
};
