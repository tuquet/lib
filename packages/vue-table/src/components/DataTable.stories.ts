import type { Meta, StoryObj } from '@storybook/vue3';
import { within, userEvent, expect } from '@storybook/test';
import { ref, computed, watch, onMounted, h } from 'vue';
import DataTable from './DataTable.vue';
import EditableCell from './EditableCell.vue';
import { useRemoteTable } from '../composables/useRemoteTable.js';
import {
  createSelectionColumn,
  createBadgeColumn,
  createCurrencyColumn,
  createDateColumn,
  createActionsColumn,
  createCopyableColumn,
  exportToCsv,
  exportToExcel,
  copyToClipboardAsTsv,
  filterDataset,
} from '../helpers/index.js';
import type { ColumnDef } from '@tanstack/vue-table';
import type {
  ColumnFilterDefinition,
  DynamicFilterRule,
  FilterConjunction,
  FilterPreset,
  TableDensity,
  ExportConfig,
  BulkActionsConfig,
  RowEditConfig,
} from '../types/index.js';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DynamicRowEditSheet,
  type OpenAPISchema,
} from '@tuquet/vue-ui';
import {
  Download,
  FileSpreadsheet,
  Copy,
  CheckCircle,
  Trash2,
  Zap,
  Gauge,
  Layers,
  LocateFixed,
  ArrowDown,
  ArrowUp,
  Eye,
  Edit2,
  Sparkles,
  ChevronDown,
  Pencil,
  Smartphone,
  RotateCcw,
  Globe,
  Activity,
  Languages,
  History,
} from 'lucide-vue-next';
import { viVN, enUS, createAuditLogPlugin, type TableLocale } from '../index.js';

interface EnterpriseOrder {
  index: number;
  id: string;
  orderNumber: string;
  customer: string;
  role: string;
  status: 'completed' | 'pending' | 'cancelled';
  progress: number;
  total: number;
  createdAt: string;
}

const generateEnterpriseOrders = (count: number): EnterpriseOrder[] => {
  const statuses: EnterpriseOrder['status'][] = ['completed', 'pending', 'cancelled'];
  const names = [
    'Nguyễn Văn An',
    'Trần Thị Bình',
    'Lê Hoàng Cường',
    'Phạm Minh Đức',
    'Hoàng Thùy Linh',
    'Đỗ Hải Đăng',
    'Vũ Mai Phương',
  ];
  const roles = [
    'Enterprise Lead',
    'Product Manager',
    'Tech Architect',
    'Senior Developer',
    'Security Auditor',
  ];
  return Array.from({ length: count }, (_, i) => {
    const daysAgo = (i * 3) % 90;
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    return {
      index: i,
      id: `ord_${100000 + i}`,
      orderNumber: `ORD-${String(202600 + i).padStart(6, '0')}`,
      customer: `${names[i % names.length]} #${i + 1}`,
      role: roles[i % roles.length],
      status: statuses[i % statuses.length],
      progress: Math.min(100, Math.round(((i * 17) % 100) + 15)),
      total: Math.round((75 + (i % 50) * 19.8) * 100) / 100,
      createdAt: date.toISOString(),
    };
  });
};

const meta: Meta<any> = {
  title: 'Table/DataTable',
  component: DataTable as any,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Bảng dữ liệu doanh nghiệp đa năng (All-in-One Enterprise Data Grid) tích hợp đầy đủ: Virtual Scrolling (10,000+ bản ghi), Column Pinning (cố định trái/phải), Remote Pagination & Sorting, Lọc Faceted, Copyable cell, Thanh Bulk Actions nổi và Xuất đa định dạng (CSV, Excel, TSV). Tất cả có thể tinh chỉnh trực tiếp qua tab Controls.',
      },
    },
  },
  argTypes: {
    virtual: {
      control: { type: 'boolean' },
      description: 'Chuyển đổi giữa chế độ Cuộn ảo (Virtual Scrolling) và Phân trang truyền thống',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Virtual Scrolling',
      },
    },
    virtualHeight: {
      control: { type: 'text' },
      description:
        'Chiều cao khung chứa bảng khi bật virtual scrolling (vd: "480px", "600px", "70vh")',
      table: {
        type: { summary: 'string | number' },
        defaultValue: { summary: "'480px'" },
        category: 'Virtual Scrolling',
      },
    },
    density: {
      control: { type: 'inline-radio' },
      options: ['compact', 'normal', 'comfortable'],
      description:
        'Mật độ hiển thị khoảng cách hàng: compact (36px), normal (44px), comfortable (56px)',
      table: {
        type: { summary: "'compact' | 'normal' | 'comfortable'" },
        defaultValue: { summary: "'compact'" },
        category: 'Appearance',
      },
    },
    bordered: {
      control: { type: 'boolean' },
      description:
        'Bật viền cột và tính năng kéo dãn kích thước cột (Column Resizing). Khi tắt viền, bảng không cho resize cột.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Appearance',
      },
    },
    showToolbar: {
      control: { type: 'boolean' },
      description: 'Bật / tắt thanh công cụ tìm kiếm debounce, lọc faceted và ẩn/hiện cột',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Layout & Features',
      },
    },
    showPagination: {
      control: { type: 'boolean' },
      description: 'Bật / tắt thanh phân trang ở chân bảng (tự động ẩn khi ở chế độ cuộn ảo)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Layout & Features',
      },
    },
    showFloatingBar: {
      control: { type: 'boolean' },
      description: 'Bật / tắt thanh bulk actions nổi khi tick chọn hàng',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Layout & Features',
      },
    },
    showMobileScrollHint: {
      control: { type: 'boolean' },
      description: 'Hiển thị banner gợi ý vuốt ngang khi bảng bị tràn trên màn hình di động',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Mobile Ergonomics',
      },
    },
    overscan: {
      control: { type: 'range', min: 0, max: 30, step: 1 },
      description: 'Số lượng hàng DOM render dự phòng phía trên và dưới viewport',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '5' },
        category: 'Virtual Scrolling',
      },
    },
    skeletonRows: {
      control: { type: 'range', min: 1, max: 15, step: 1 },
      description: 'Số dòng skeleton placeholder khi đang tải',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '5' },
        category: 'Appearance',
      },
    },
    emptyMessage: {
      control: { type: 'text' },
      description: 'Nội dung thông báo hiển thị khi không có bản ghi phù hợp',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "'Không có dữ liệu phù hợp.'" },
        category: 'Appearance',
      },
    },
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
    remote: { control: false },
  },
  args: {
    virtual: true,
    virtualHeight: '480px',
    density: 'compact',
    showToolbar: true,
    showPagination: false,
    showFloatingBar: true,
    showMobileScrollHint: false,
    overscan: 5,
    skeletonRows: 5,
    emptyMessage: 'Không tìm thấy đơn hàng nào phù hợp với bộ lọc.',
    datasetSize: 10000,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const orderOpenApiSchema: OpenAPISchema = {
  type: 'object',
  title: 'Chỉnh sửa đơn hàng (OpenAPI 3.0)',
  description:
    'Schema OpenAPI 3.0 với Vendor Extensions x-ui-*, validation constraints và Mobile Form Drawer',
  required: ['orderNumber', 'customer', 'status', 'total'],
  properties: {
    orderNumber: {
      type: 'string',
      title: 'Mã đơn hàng',
      readOnly: true,
      'x-ui-priority': 'high',
    },
    customer: {
      type: 'string',
      title: 'Khách hàng',
      minLength: 3,
      'x-ui-placeholder': 'Nhập tên khách hàng...',
      'x-ui-priority': 'high',
    },
    role: {
      type: 'string',
      title: 'Bộ phận / Chức vụ',
      'x-ui-placeholder': 'VD: Procurement, Finance...',
      'x-ui-priority': 'medium',
    },
    status: {
      type: 'string',
      title: 'Trạng thái',
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
      title: 'Tiến độ',
      minimum: 0,
      maximum: 100,
      'x-ui-step': 5,
      'x-ui-widget': 'slider',
      'x-ui-suffix': '%',
      'x-ui-priority': 'medium',
    },
    total: {
      type: 'number',
      title: 'Tổng tiền',
      minimum: 0,
      'x-ui-widget': 'currency',
      'x-ui-prefix': '$',
      'x-ui-priority': 'high',
    },
    createdAt: {
      type: 'string',
      format: 'date',
      title: 'Ngày tạo',
      readOnly: true,
      'x-ui-priority': 'low',
    },
  },
};

/**
 * Story tổng hợp toàn bộ tính năng cao cấp của Enterprise DataTable trên 1 màn hình duy nhất:
 * - 10.000 dòng dữ liệu RAM với cơ chế TanStack Virtual mượt mà 60 FPS
 * - Column Pinning: Ghim cố định Checkbox & STT bên trái, Ghim Actions bên phải
 * - Tìm kiếm Debounce, Sắp xếp đa cột, Lọc trạng thái Faceted
 * - Sao chép mã đơn 1-click (CopyableCell)
 * - Thanh Bulk Actions nổi khi chọn nhiều dòng
 * - Xuất dữ liệu đa định dạng (CSV, Excel, TSV)
 * - Mobile Priority Column Collapsing & Bottom Sheet Form Editing (OpenAPI 3.0)
 * - Tinh chỉnh tất cả các tham số tức thì qua tab Controls
 */
export const AllInOneEnterpriseTable: Story = {
  name: 'All-In-One Enterprise Data Grid',
  args: {
    virtual: true,
    virtualHeight: '480px',
    density: 'compact',
    showToolbar: true,
    showPagination: false,
    showFloatingBar: true,
    overscan: 5,
    skeletonRows: 5,
    emptyMessage: 'Không tìm thấy đơn hàng nào phù hợp.',
    datasetSize: 10000,
    bordered: true,
  },
  render: (args: any) => ({
    components: {
      DataTable,
      EditableCell,
      DynamicRowEditSheet,
      Button,
      DropdownMenu,
      DropdownMenuTrigger,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuSeparator,
      ChevronDown,
      Download,
      FileSpreadsheet,
      Copy,
      CheckCircle,
      Trash2,
      Zap,
      Gauge,
      Layers,
      LocateFixed,
      ArrowDown,
      ArrowUp,
      Sparkles,
      Pencil,
      Smartphone,
      RotateCcw,
      Globe,
      Activity,
      Languages,
      History,
    },
    setup() {
      const logNetwork = (_method: string, _url: string, _status: number, _latency: number) => {};
      const currentLocale = ref<TableLocale>(viVN);
      function toggleLanguage() {
        currentLocale.value = currentLocale.value.code === 'vi-VN' ? enUS : viVN;
        showToast(
          currentLocale.value.code === 'vi-VN'
            ? 'Đã đổi ngôn ngữ: Tiếng Việt (vi-VN)'
            : 'Switched language: English (en-US)'
        );
      }

      const datasetSize = ref<number>(Number(args.datasetSize) || 10000);
      const dataset = ref<EnterpriseOrder[]>(generateEnterpriseOrders(datasetSize.value));
      const density = ref<TableDensity>((args.density as TableDensity) || 'compact');
      const tableRef = ref<any>(null);
      const lastToastMessage = ref<string>('');
      const viewMode = ref<'table' | 'cards'>('table');
      const isEditSheetOpen = ref(false);
      const editingOrder = ref<EnterpriseOrder | null>(null);

      // Enterprise Flexible Database Filter State
      const databaseColumnFilterDefs: ColumnFilterDefinition[] = [
        { id: 'customer', label: 'Khách hàng', dataType: 'text', placeholder: 'Tên khách hàng...' },
        {
          id: 'role',
          label: 'Vai trò',
          dataType: 'text',
          placeholder: 'Procurement Specialist...',
        },
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
      ];

      const databaseFilterPresets: FilterPreset[] = [
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

      const dynamicFilterRules = ref<DynamicFilterRule[]>([]);
      const dynamicFilterConjunction = ref<FilterConjunction>('and');

      // Live REST CRUD API State
      const useRealApi = ref(true);

      async function handleResetApiDb() {
        try {
          await fetch('/api/orders/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: 1000 }),
          });
          showToast('Đã reset lại 1.000 đơn hàng mẫu trên Mock Server!');
          remote.refetch();
        } catch (e) {
          showToast('Lỗi khi gọi API reset');
        }
      }

      function openEditSheet(order: EnterpriseOrder) {
        editingOrder.value = { ...order };
        tableRef.value?.openRowEdit(order);
      }

      async function handleSaveSheet(updated: Record<string, any>, row?: Record<string, any>) {
        const target = row || editingOrder.value;
        if (target) {
          const id = target.id;
          updateOrder(id, updated as Partial<EnterpriseOrder>);
          showToast(`Đã lưu đơn qua Mobile Sheet: ${target.orderNumber}`);

          if (useRealApi.value) {
            const t0 = performance.now();
            try {
              const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
              });
              logNetwork(
                'PUT',
                `/api/orders/${id}`,
                res.status,
                Math.round(performance.now() - t0)
              );
            } catch (e) {
              // Ignore
            }
          }
        }
        isEditSheetOpen.value = false;
      }

      function setViewMode(mode: 'table' | 'cards') {
        viewMode.value = mode;
        showToast(
          mode === 'cards'
            ? 'Đã chuyển sang: Chế độ Thẻ di động (Cards View)'
            : 'Đã chuyển sang: Chế độ Bảng dữ liệu (Grid View)'
        );
      }

      function showToast(msg: string) {
        lastToastMessage.value = msg;
        setTimeout(() => {
          if (lastToastMessage.value === msg) lastToastMessage.value = '';
        }, 3000);
      }

      async function updateOrder(id: string, updates: Partial<EnterpriseOrder>) {
        const item = dataset.value.find((o) => o.id === id);
        const oldVals = item ? { ...item } : undefined;
        if (item) {
          Object.assign(item, updates);
        }
        remote.mutateRow(id, updates);

        for (const [key, newVal] of Object.entries(updates)) {
          remote.notifyCellEdit({
            rowId: id,
            row: (item || updates) as EnterpriseOrder,
            field: key,
            oldValue: (oldVals as any)?.[key],
            newValue: newVal,
          });
        }

        if (useRealApi.value) {
          const t0 = performance.now();
          try {
            const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });
            logNetwork(
              'PATCH',
              `/api/orders/${id}`,
              res.status,
              Math.round(performance.now() - t0)
            );
          } catch (e) {
            // Ignore
          }
        }
      }

      watch(
        () => args.density,
        (d) => {
          if (d) density.value = d as TableDensity;
        }
      );

      watch(
        () => args.datasetSize,
        (newSize) => {
          if (newSize && Number(newSize) !== datasetSize.value) {
            datasetSize.value = Number(newSize);
            dataset.value = generateEnterpriseOrders(Number(newSize));
            remote.refetch();
          }
        }
      );

      watch(
        () => args.virtual,
        () => {
          remote.refetch();
        }
      );

      const columns: ColumnDef<EnterpriseOrder>[] = [
        createSelectionColumn<EnterpriseOrder>({ size: 48 }),
        {
          id: 'index',
          accessorKey: 'index',
          header: '# STT',
          size: 75,
          cell: ({ row }) => {
            const rawIndex = row.original?.index;
            const sttNumber =
              typeof rawIndex === 'number' && !Number.isNaN(rawIndex)
                ? rawIndex + 1
                : typeof row.index === 'number'
                  ? row.index + 1
                  : 1;
            return h(
              'span',
              {
                class:
                  'font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted/70 group-hover:bg-background group-hover:shadow-2xs text-primary border border-border/50 transition-colors',
              },
              `#${sttNumber.toLocaleString()}`
            );
          },
        },
        createCopyableColumn<EnterpriseOrder>({
          accessorKey: 'orderNumber',
          header: 'Mã đơn',
          truncateLength: 14,
          size: 140,
        } as any),
        {
          id: 'customer',
          accessorKey: 'customer',
          header: 'Khách hàng',
          size: 210,
          cell: ({ row }) => {
            return h(
              EditableCell,
              {
                modelValue: row.original.customer,
                type: 'text',
                validate: (val: string | number) =>
                  !String(val || '').trim() ? 'Tên khách hàng không được để trống' : null,
                'onUpdate:modelValue': (newVal: any) => {
                  updateOrder(row.original.id, { customer: newVal });
                  showToast(`Đã cập nhật khách hàng: "${newVal}"`);
                },
              },
              {
                display: ({ value }: { value: string }) =>
                  h('div', { class: 'flex flex-col min-w-0 pr-1' }, [
                    h('span', { class: 'font-medium text-xs text-foreground truncate' }, value),
                    h(
                      'span',
                      { class: 'text-[11px] text-muted-foreground truncate' },
                      row.original.role
                    ),
                  ]),
              }
            );
          },
        },
        {
          id: 'status',
          accessorKey: 'status',
          header: 'Trạng thái',
          size: 130,
          cell: ({ row }) => {
            return h(EditableCell, {
              modelValue: row.original.status,
              type: 'select',
              options: [
                { label: 'Completed', value: 'completed', variant: 'default' },
                { label: 'Pending', value: 'pending', variant: 'secondary' },
                { label: 'Cancelled', value: 'cancelled', variant: 'destructive' },
              ],
              'onUpdate:modelValue': (newVal: any) => {
                updateOrder(row.original.id, { status: newVal });
                showToast(
                  `Đã đổi trạng thái đơn ${row.original.orderNumber} ➔ ${String(newVal).toUpperCase()}`
                );
              },
            });
          },
        },
        {
          id: 'progress',
          accessorKey: 'progress',
          header: 'Tiến độ',
          size: 140,
          cell: ({ row }) => {
            return h(
              EditableCell,
              {
                modelValue: row.original.progress,
                type: 'number',
                min: 0,
                max: 100,
                step: 5,
                suffix: '%',
                'onUpdate:modelValue': (newVal: any) => {
                  updateOrder(row.original.id, { progress: newVal });
                  showToast(`Đã cập nhật tiến độ ${row.original.orderNumber}: ${newVal}%`);
                },
              },
              {
                display: ({ value }: { value: number }) => {
                  const pct = Number(value);
                  const barColor =
                    pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-blue-500' : 'bg-amber-500';
                  return h('div', { class: 'flex items-center gap-2 flex-1 min-w-0' }, [
                    h(
                      'div',
                      {
                        class:
                          'w-14 h-2 rounded-full bg-muted/60 overflow-hidden border border-border/40 shrink-0',
                      },
                      [
                        h('div', {
                          class: `h-full ${barColor} transition-all`,
                          style: { width: `${pct}%` },
                        }),
                      ]
                    ),
                    h('span', { class: 'text-xs font-mono text-muted-foreground w-8' }, `${pct}%`),
                  ]);
                },
              }
            );
          },
        },
        {
          id: 'total',
          accessorKey: 'total',
          header: 'Tổng tiền',
          size: 130,
          cell: ({ row }) => {
            return h(
              EditableCell,
              {
                modelValue: row.original.total,
                type: 'number',
                min: 0,
                step: 50,
                prefix: '$',
                'onUpdate:modelValue': (newVal: any) => {
                  updateOrder(row.original.id, { total: newVal });
                  showToast(
                    `Đã cập nhật tổng tiền ${row.original.orderNumber}: $${Number(newVal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  );
                },
              },
              {
                display: ({ value }: { value: number }) =>
                  h(
                    'span',
                    { class: 'font-mono text-xs font-semibold text-foreground' },
                    `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  ),
              }
            );
          },
        },
        createDateColumn<EnterpriseOrder>({
          accessorKey: 'createdAt',
          header: 'Ngày tạo',
          relative: true,
          size: 140,
        } as any),
        {
          ...createActionsColumn<EnterpriseOrder>({
            size: 64,
            actions: [
              {
                id: 'view',
                label: 'Xem chi tiết',
                icon: Eye,
                onSelect: (row) => {
                  showToast(`Đang xem chi tiết đơn: ${row.original.orderNumber}`);
                },
              },
              {
                id: 'edit',
                label: 'Chỉnh sửa (Mobile Sheet)',
                icon: Edit2,
                onSelect: (row) => {
                  openEditSheet(row.original);
                },
              },
              {
                id: 'delete',
                label: 'Xóa đơn hàng',
                icon: Trash2,
                variant: 'destructive',
                onSelect: async (row) => {
                  const id = row.original.id;
                  remote.deleteRow(id);
                  showToast(`Đã xóa đơn: ${row.original.orderNumber}`);

                  if (useRealApi.value) {
                    const t0 = performance.now();
                    try {
                      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
                        method: 'DELETE',
                      });
                      logNetwork(
                        'DELETE',
                        `/api/orders/${id}`,
                        res.status,
                        Math.round(performance.now() - t0)
                      );
                    } catch (e) {
                      // Ignore offline fallback
                    }
                  }
                },
              },
            ],
          }),
          enableHiding: false,
        },
      ];

      const remote = useRemoteTable<EnterpriseOrder>({
        columns,
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
        defaultPageSize: args.virtual ? 50000 : 10,
        syncWithUrl: false,
        columnPinning: {
          left: ['select', 'index'],
          right: ['actions'],
        },
        filters: [
          {
            id: 'status',
            title: 'Trạng thái',
            type: 'faceted',
            options: [
              { label: 'Completed', value: 'completed' },
              { label: 'Pending', value: 'pending' },
              { label: 'Cancelled', value: 'cancelled' },
            ],
          },
        ],
        fetcher: async ({ page, limit, search, filters, sort }) => {
          if (useRealApi.value) {
            const t0 = performance.now();
            try {
              const params = new URLSearchParams();
              params.set('page', String(page));
              params.set('limit', String(limit));
              if (search) params.set('search', search);
              if (sort) params.set('sort', sort);
              if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
                params.set('status', filters.status.join(','));
              }
              if (dynamicFilterRules.value.length > 0) {
                params.set('filters', JSON.stringify(dynamicFilterRules.value));
                params.set('conjunction', dynamicFilterConjunction.value);
              }

              const res = await fetch(`/api/orders?${params.toString()}`);
              if (res.ok) {
                const json = await res.json();
                logNetwork(
                  'GET',
                  `/api/orders?${params.toString()}`,
                  res.status,
                  Math.round(performance.now() - t0)
                );
                if (typeof json.total === 'number') {
                  datasetSize.value = json.total;
                }
                const offset = (page - 1) * limit;
                const items = (json.data || []).map((item: any, idx: number) => ({
                  ...item,
                  index: typeof item.index === 'number' ? item.index : offset + idx,
                }));
                return { data: items, total: json.total };
              }
            } catch (e) {
              console.warn('Real API failed, fallback to local dataset:', e);
            }
          }

          // Fallback in-memory
          await new Promise((r) => setTimeout(r, 60));
          let list = [...dataset.value];

          if (search) {
            const q = search.toLowerCase();
            list = list.filter(
              (o) =>
                o.orderNumber.toLowerCase().includes(q) ||
                o.customer.toLowerCase().includes(q) ||
                o.role.toLowerCase().includes(q)
            );
          }

          if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
            const set = new Set(filters.status);
            list = list.filter((o) => set.has(o.status));
          }

          if (dynamicFilterRules.value.length > 0) {
            list = filterDataset(
              list as unknown as Record<string, unknown>[],
              dynamicFilterRules.value,
              dynamicFilterConjunction.value
            ) as unknown as EnterpriseOrder[];
          }

          if (sort) {
            const isDesc = sort.startsWith('-');
            const field = isDesc ? sort.substring(1) : sort;
            list.sort((a, b) => {
              const valA = (a as unknown as Record<string, unknown>)[field];
              const valB = (b as unknown as Record<string, unknown>)[field];
              if (typeof valA === 'number' && typeof valB === 'number') {
                return isDesc ? valB - valA : valA - valB;
              }
              return isDesc
                ? String(valB).localeCompare(String(valA))
                : String(valA).localeCompare(String(valB));
            });
          }

          const total = list.length;
          if (args.virtual) {
            return { data: list, total };
          }
          const start = (page - 1) * limit;
          return { data: list.slice(start, start + limit), total };
        },
      });

      const exportConfig: ExportConfig<EnterpriseOrder> = {
        enabled: true,
        formats: ['excel', 'csv', 'tsv'],
        filename: 'enterprise-orders',
        onExport: (format, count) => {
          showToast(
            format === 'excel'
              ? 'Đã xuất thành công file Excel!'
              : format === 'csv'
                ? 'Đã xuất thành công file CSV!'
                : 'Đã sao chép dữ liệu TSV vào Clipboard!'
          );
        },
      };

      const bulkActionsConfig: BulkActionsConfig<EnterpriseOrder> = {
        enabled: true,
        maxVisibleOnMobile: 2,
        actions: [
          {
            key: 'complete',
            label: (count) => `Hoàn thành (${count})`,
            shortLabel: 'Xong',
            icon: CheckCircle,
            variant: 'outline',
            handler: async (selected) => {
              const ids = selected.map((r) => r.id);
              for (const id of ids) {
                remote.mutateRow(id, { status: 'completed' });
              }
              showToast(`Đã hoàn thành ${ids.length} đơn hàng!`);
              remote.clearSelection();

              if (useRealApi.value && ids.length > 0) {
                const t0 = performance.now();
                try {
                  const res = await fetch('/api/orders/bulk-update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids, updates: { status: 'completed' } }),
                  });
                  logNetwork(
                    'POST',
                    '/api/orders/bulk-update',
                    res.status,
                    Math.round(performance.now() - t0)
                  );
                } catch (e) {
                  // Ignore
                }
              }
            },
          },
          {
            key: 'copy-tsv',
            label: (count) => `Copy TSV (${count})`,
            shortLabel: 'TSV',
            icon: Copy,
            variant: 'outline',
            handler: async (selected) => {
              await copyToClipboardAsTsv({
                data: selected,
                columns,
              });
              showToast('Đã sao chép dữ liệu TSV vào Clipboard!');
            },
          },
          {
            key: 'delete',
            label: (count) => `Xóa (${count})`,
            shortLabel: 'Xóa',
            icon: Trash2,
            variant: 'destructive',
            handler: async (selected) => {
              const ids = selected.map((r) => r.id);
              remote.deleteRow(ids);
              showToast(`Đã xóa ${ids.length} đơn hàng!`);
              remote.clearSelection();

              if (useRealApi.value && ids.length > 0) {
                const t0 = performance.now();
                try {
                  const res = await fetch('/api/orders/bulk-delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids }),
                  });
                  logNetwork(
                    'POST',
                    '/api/orders/bulk-delete',
                    res.status,
                    Math.round(performance.now() - t0)
                  );
                } catch (e) {
                  // Ignore
                }
              }
            },
          },
        ],
      };

      const rowEditConfig: RowEditConfig<EnterpriseOrder> = {
        enabled: true,
        schema: orderOpenApiSchema,
        title: (row) => `Chỉnh sửa: ${row ? row.orderNumber : ''}`,
        description: 'Chỉnh sửa thông tin đơn hàng với bàn phím an toàn và nút bấm 44px',
        swipeBack: true,
        enableHistoryBack: true,
        onSave: async (updatedValues, originalRow) => {
          await handleSaveSheet(updatedValues, originalRow);
        },
      };

      let filterDebounceTimer: ReturnType<typeof setTimeout> | null = null;
      function handleUpdateDynamicRules(rules: DynamicFilterRule[]) {
        dynamicFilterRules.value = rules;
        if (filterDebounceTimer) clearTimeout(filterDebounceTimer);
        filterDebounceTimer = setTimeout(() => {
          remote.refetch();
        }, 300);
      }

      return {
        args,
        remote,
        density,
        datasetSize,
        tableRef,
        lastToastMessage,
        useRealApi,
        handleResetApiDb,
        exportConfig,
        bulkActionsConfig,
        rowEditConfig,
        handleUpdateDynamicRules,
        orderOpenApiSchema,
        viewMode,
        isEditSheetOpen,
        editingOrder,
        openEditSheet,
        handleSaveSheet,
        setViewMode,
        databaseColumnFilterDefs,
        databaseFilterPresets,
        dynamicFilterRules,
        dynamicFilterConjunction,
        currentLocale,
        toggleLanguage,
      };
    },
    template: `
      <div class="p-2 sm:p-4 space-y-3.5 max-w-[1240px] mx-auto overflow-x-hidden">
        <!-- Toast Feedback Notification -->
        <div
          v-if="lastToastMessage"
          class="p-2.5 rounded-lg border bg-card text-xs text-foreground shadow-sm flex items-center gap-2 transition-all animate-in fade-in slide-in-from-top-1"
        >
          <Sparkles class="h-4 w-4 text-emerald-500 shrink-0" />
          <span>{{ lastToastMessage }}</span>
        </div>

        <!-- Page Header & Demo Controls -->
        <div class="flex items-center justify-between gap-3 border-b pb-3">
          <h2 class="text-lg font-bold tracking-tight text-foreground">Quản lý Đơn hàng</h2>

          <!-- Quick Config Selector (View Mode & Language) -->
          <div class="flex items-center gap-2 shrink-0">
            <!-- View Mode Switcher (Demo switcher: Grid vs Mobile Cards) -->
            <div class="flex items-center rounded-md border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                class="px-2.5 py-1 rounded-[4px] font-medium transition-colors flex items-center gap-1 text-xs"
                :class="viewMode === 'table' ? 'bg-background text-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'"
                @click="setViewMode('table')"
              >
                <span>📊 Bảng</span>
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-[4px] font-medium transition-colors flex items-center gap-1 text-xs"
                :class="viewMode === 'cards' ? 'bg-background text-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'"
                @click="setViewMode('cards')"
              >
                <Smartphone class="h-3 w-3" />
                <span>Thẻ di động</span>
              </button>
            </div>

            <!-- Language Switcher (Demo switcher: VI vs EN) -->
            <Button
              variant="outline"
              size="sm"
              class="h-7 text-xs gap-1 font-mono font-medium px-2"
              @click="toggleLanguage"
              :title="currentLocale.code === 'vi-VN' ? 'Đổi sang English' : 'Chuyển sang Tiếng Việt'"
            >
              <Languages class="h-3 w-3 text-primary" />
              <span>{{ currentLocale.code === 'vi-VN' ? 'VI' : 'EN' }}</span>
            </Button>
          </div>
        </div>

        <!-- The Enterprise Data Table -->
        <DataTable
          ref="tableRef"
          v-bind="args"
          :remote="remote"
          :density="density"
          :locale="currentLocale"
          :enable-column-resizing="true"
          :mobile-layout="viewMode"
          :adaptive-pinning="true"
          :show-mobile-scroll-hint="false"
          :show-filter-builder="true"
          :column-filter-defs="databaseColumnFilterDefs"
          :dynamic-rules="dynamicFilterRules"
          :conjunction="dynamicFilterConjunction"
          :filter-presets="databaseFilterPresets"
          :export="exportConfig"
          :bulk-actions="bulkActionsConfig"
          :row-edit="rowEditConfig"
          @row-click="(row) => openEditSheet(row.original)"
          @update:dynamic-rules="handleUpdateDynamicRules"
          @update:conjunction="(conj) => { dynamicFilterConjunction = conj; remote.refetch(); }"
          @apply-preset="(p) => {
            dynamicFilterConjunction = p.conjunction;
            dynamicFilterRules = p.rules.map(r => ({ ...r, id: 'rule_' + Math.random().toString(36).slice(2, 7) }));
            remote.refetch();
          }"
        >
          <!-- Toolbar Actions: Reset API tool (Built-in Export Menu auto-rendered via :export) -->
          <template #actions>
            <!-- Reset Mock Server DB Button -->
            <Button
              v-if="useRealApi"
              variant="outline"
              size="sm"
              class="h-8 text-xs gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 px-2.5"
              @click="handleResetApiDb"
            >
              <RotateCcw class="h-3 w-3" />
              <span class="hidden sm:inline">Reset API</span>
            </Button>
          </template>

          <!-- Custom Mobile Card View Template -->
          <template #card="{ row, isSelected, toggleSelected }">
            <div class="flex items-start justify-between gap-2 border-b pb-2 mb-2">
              <div class="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-input text-primary focus:ring-primary shrink-0"
                  :checked="isSelected"
                  @click.stop="toggleSelected"
                />
                <div class="flex flex-col min-w-0">
                  <span class="font-mono text-xs font-bold text-primary truncate">{{ row.original.orderNumber }}</span>
                  <span class="font-medium text-xs text-foreground truncate">{{ row.original.customer }}</span>
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0" data-prevent-row-click>
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                  :class="row.original.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : row.original.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'"
                >
                  {{ row.original.status }}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-7 w-7 p-0"
                  @click.stop="openEditSheet(row.original)"
                >
                  <Pencil class="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                </Button>
              </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div class="space-y-0.5">
                <span class="text-[10px] text-muted-foreground uppercase font-medium">Tổng tiền</span>
                <p class="font-mono font-bold text-foreground">{{ '$' + Number(row.original.total).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</p>
              </div>
              <div class="space-y-0.5">
                <span class="text-[10px] text-muted-foreground uppercase font-medium">Tiến độ</span>
                <div class="flex items-center gap-1.5">
                  <div class="w-12 h-1.5 rounded-full bg-muted overflow-hidden border border-border/40">
                    <div class="h-full bg-emerald-500" :style="{ width: row.original.progress + '%' }" />
                  </div>
                  <span class="font-mono text-[11px] text-muted-foreground">{{ row.original.progress }}%</span>
                </div>
              </div>
              <div class="space-y-0.5 col-span-2 sm:col-span-1">
                <span class="text-[10px] text-muted-foreground uppercase font-medium">Chức vụ</span>
                <p class="text-xs text-muted-foreground truncate">{{ row.original.role }}</p>
              </div>
            </div>
          </template>
        </DataTable>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }: { canvasElement: HTMLElement; step: any }) => {
    const canvas = within(canvasElement);

    await step('1. Khởi tạo bảng dữ liệu doanh nghiệp và kiểm tra bản ghi đầu tiên', async () => {
      const firstRecord = await canvas.findByText('ORD-202600');
      expect(firstRecord).toBeInTheDocument();
    });

    await step('2. Tương tác tìm kiếm debounce: Gõ từ khóa tìm đơn hàng', async () => {
      const searchInput = canvas.getByPlaceholderText(/(filter records|tìm kiếm)/i);
      await userEvent.type(searchInput, 'ORD-202603', { delay: 40 });
      expect(searchInput).toHaveValue('ORD-202603');
    });

    await step('3. Tương tác xóa tìm kiếm', async () => {
      const searchInput = canvas.getByPlaceholderText(/(filter records|tìm kiếm)/i);
      await userEvent.clear(searchInput);
    });

    await step('4. Tương tác Select All ở checkbox header', async () => {
      const checkboxes = await canvas.findAllByRole('checkbox');
      const headerCheckbox = checkboxes[0];
      await userEvent.click(headerCheckbox);
      const bulkCompleteBtn = await canvas.findByText(/hoàn thành \(/i);
      expect(bulkCompleteBtn).toBeInTheDocument();
      // Click lại để bỏ chọn tất cả
      await userEvent.click(headerCheckbox);
    });

    await step('5. Kiểm tra nút Cột hiển thị (View Options) mở dropdown', async () => {
      const viewColumnsBtn = canvas.getByRole('button', { name: /(cột hiển thị|view)/i });
      expect(viewColumnsBtn).toBeInTheDocument();
      await userEvent.click(viewColumnsBtn);
    });

    await step('6. Kiểm tra nút Xuất dữ liệu trên toolbar ngay cạnh bảng', async () => {
      const exportBtn = canvas.getByRole('button', { name: /xuất dữ liệu/i });
      expect(exportBtn).toBeInTheDocument();
      await userEvent.click(exportBtn);
    });

    await step(
      '7. Tương tác Inline Edit: Chỉnh sửa trực tiếp tên khách hàng và cập nhật tức thì',
      async () => {
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
      }
    );

    await step(
      '8. Tương tác chuyển đổi chế độ xem Thẻ di động (Mobile Cards View) và chọn tất cả qua icon checkbox',
      async () => {
        const cardsBtn = canvas.getByRole('button', { name: /thẻ di động/i });
        expect(cardsBtn).toBeInTheDocument();
        await userEvent.click(cardsBtn);
        expect(await canvas.findByText(/chế độ thẻ di động/i)).toBeInTheDocument();

        // Tương tác click trực tiếp vào icon checkbox Chọn tất cả ở chế độ thẻ di động
        const selectAllCheckbox = await canvas.findByRole('checkbox', {
          name: /(chọn tất cả|select all)/i,
        });
        expect(selectAllCheckbox).toBeInTheDocument();
        await userEvent.click(selectAllCheckbox);
        const bulkAction = await canvas.findByText(/hoàn thành \(/i);
        expect(bulkAction).toBeInTheDocument();

        // Click lại vào icon checkbox để bỏ chọn tất cả
        await userEvent.click(selectAllCheckbox);

        // Quay lại chế độ bảng
        const tableBtn = canvas.getByRole('button', { name: /bảng/i });
        await userEvent.click(tableBtn);
      }
    );

    await step('9. Tương tác mở DynamicRowEditSheet từ menu hành động', async () => {
      const actionButtons = canvasElement.querySelectorAll('button[aria-haspopup="menu"]');
      if (actionButtons.length > 0) {
        await userEvent.click(actionButtons[0] as HTMLElement);
        const editOption = await within(document.body).findByText(/chỉnh sửa \(mobile sheet\)/i);
        await userEvent.click(editOption);
        expect(await within(document.body).findByText(/bàn phím an toàn/i)).toBeInTheDocument();
      }
    });

    await step('10. Chỉnh sửa dữ liệu trong Mobile Bottom Sheet và lưu lại', async () => {
      const body = within(document.body);
      const customerInput = body.getByPlaceholderText(/khách hàng/i);
      await userEvent.clear(customerInput);
      await userEvent.type(customerInput, 'Công ty Cổ phần Tuquet Mobile VIP');

      const saveBtn = body.getByRole('button', { name: /lưu thay đổi/i });
      await userEvent.click(saveBtn);
      expect(await canvas.findByText(/đã lưu đơn qua mobile sheet/i)).toBeInTheDocument();
    });

    await step('11. Tương tác chuyển đổi đa ngôn ngữ (vi-VN <-> en-US)', async () => {
      const langBtn = canvas.getByRole('button', { name: /vi/i });
      expect(langBtn).toBeInTheDocument();
      await userEvent.click(langBtn);
      expect(await canvas.findByText('EN')).toBeInTheDocument();
      // Chuyển lại về tiếng Việt
      await userEvent.click(canvas.getByRole('button', { name: /en/i }));
      expect(await canvas.findByText('VI')).toBeInTheDocument();
    });
  },
};
