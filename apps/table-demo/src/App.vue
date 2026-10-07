<script setup lang="ts">
import {
  DataTable,
  DataTableDateRangeFilter,
  RemoteCombobox,
  createActionsColumn,
  createAvatarColumn,
  createBadgeColumn,
  createCopyableColumn,
  createCurrencyColumn,
  createDateColumn,
  createSelectionColumn,
  exportToCsv,
  exportToExcel,
  copyToClipboardAsTsv,
  useRemoteTable,
  type ColumnDef,
  type TableDensity,
  type DateRangeValue,
} from '@tuquet/vue-table';
import { Button, Toaster, toast } from '@tuquet/vue-ui';
import { Download, FileSpreadsheet, Plus, Trash2, CheckCircle, Copy, Zap } from 'lucide-vue-next';
import { ref } from 'vue';

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  status: 'completed' | 'pending' | 'cancelled';
  total: number;
  createdAt: string;
}

// Mock database
const mockDatabase: Order[] = Array.from({ length: 65 }, (_, i) => {
  const statuses: Order['status'][] = ['completed', 'pending', 'cancelled'];
  const names = [
    'Sarah Connor',
    'John Wick',
    'Tony Stark',
    'Bruce Wayne',
    'Peter Parker',
    'Natasha Romanoff',
    'Clark Kent',
    'Diana Prince',
    'Wanda Maximoff',
    'Steve Rogers',
  ];
  const name = names[i % names.length];
  const daysAgo = (i * 2) % 30;
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  return {
    id: `ord_${1000 + i}`,
    orderNumber: `ORD-${202600 + i}`,
    customer: `${name} ${i > 9 ? `(${i + 1})` : ''}`,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    status: statuses[i % statuses.length],
    total: Math.round((45.5 + i * 18.25) * 100) / 100,
    createdAt: date.toISOString(),
  };
});

const copiedFeedback = ref(false);
const density = ref<TableDensity>('normal');
const isVirtual = ref(false);

// Showcase: RemoteCombobox mock customer data
interface CustomerOption {
  id: string;
  name: string;
  email: string;
}

const mockCustomers = ref<CustomerOption[]>(
  Array.from({ length: 45 }, (_, i) => ({
    id: `cus_${i + 1}`,
    name: `Customer ${i + 1}`,
    email: `customer${i + 1}@enterprise.io`,
  }))
);

const selectedCustomerId = ref<string>('cus_1');

async function fetchRemoteCustomers({
  page,
  pageSize,
  search,
}: {
  page: number;
  pageSize: number;
  search: string;
}) {
  await new Promise((r) => setTimeout(r, 150));
  let filtered = [...mockCustomers.value];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }
  const start = (page - 1) * pageSize;
  const pageData = filtered.slice(start, start + pageSize);
  return {
    data: pageData,
    total: filtered.length,
    hasMore: start + pageSize < filtered.length,
  };
}

async function handleCreateCustomer(name: string): Promise<CustomerOption> {
  await new Promise((r) => setTimeout(r, 200));
  const newCus: CustomerOption = {
    id: `cus_${Date.now().toString().slice(-4)}`,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@new.io`,
  };
  mockCustomers.value = [newCus, ...mockCustomers.value];
  toast.success(`Created customer "${name}"`);
  return newCus;
}

async function handleDeleteCustomer(cus: CustomerOption): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 200));
  mockCustomers.value = mockCustomers.value.filter((c) => c.id !== cus.id);
  toast.error(`Deleted customer "${cus.name}"`);
  return true;
}

const columns: ColumnDef<Order>[] = [
  createSelectionColumn<Order>(),
  createCopyableColumn<Order>({
    accessorKey: 'orderNumber',
    header: 'Order #',
  }),
  createAvatarColumn<Order>({
    nameKey: 'customer',
    descriptionKey: 'email',
    header: 'Customer',
  }),
  createBadgeColumn<Order, Order['status']>({
    accessorKey: 'status',
    header: 'Status',
    variants: {
      completed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
    },
  }),
  createCurrencyColumn<Order>({
    accessorKey: 'total',
    header: 'Total',
    currency: 'USD',
  }),
  createDateColumn<Order>({
    accessorKey: 'createdAt',
    header: 'Created',
    relative: true,
  }),
  createActionsColumn<Order>({
    actions: [
      {
        id: 'complete',
        label: 'Mark Completed',
        onSelect: (row) => {
          remote.mutateRow(row.original.id, { status: 'completed' });
          toast.success(`Order ${row.original.orderNumber} marked completed`);
        },
      },
      {
        id: 'delete',
        label: 'Delete',
        variant: 'destructive',
        separator: true,
        onSelect: (row) => {
          remote.deleteRow(row.original.id);
          toast.error(`Order ${row.original.orderNumber} deleted`);
        },
      },
    ],
  }),
];

const remote = useRemoteTable<Order>({
  columns,
  defaultPageSize: 10,
  syncWithUrl: false,
  columnPinning: {
    left: ['select'],
    right: ['actions'],
  },
  filters: [
    {
      id: 'status',
      title: 'Status',
      type: 'faceted',
      options: [
        { label: 'Completed', value: 'completed' },
        { label: 'Pending', value: 'pending' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      id: 'total',
      title: 'Total',
      type: 'number-range',
      min: 0,
      max: 2000,
    },
    {
      id: 'orderNumber',
      title: 'Order #',
      type: 'text',
      placeholder: 'Filter order number...',
    },
  ],
  fetcher: async ({ page, limit, sort, search, filters }) => {
    // Simulate server response delay
    await new Promise((r) => setTimeout(r, 200));

    let filtered = [...mockDatabase];

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.customer.toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
      const statusSet = new Set(filters.status);
      filtered = filtered.filter((o) => statusSet.has(o.status));
    }

    // Filter by total number-range
    if (filters.total && typeof filters.total === 'object') {
      const { min, max } = filters.total as { min?: number | null; max?: number | null };
      if (min !== undefined && min !== null) {
        filtered = filtered.filter((o) => o.total >= min);
      }
      if (max !== undefined && max !== null) {
        filtered = filtered.filter((o) => o.total <= max);
      }
    }

    // Filter by orderNumber text filter
    if (filters.orderNumber && typeof filters.orderNumber === 'object') {
      const { operator, value } = filters.orderNumber as { operator?: string; value?: string };
      if (value) {
        const q = value.toLowerCase();
        filtered = filtered.filter((o) => {
          const num = o.orderNumber.toLowerCase();
          if (operator === 'exact') return num === q;
          if (operator === 'startsWith') return num.startsWith(q);
          return num.includes(q);
        });
      }
    }

    // Filter by createdAt date range
    if (filters.createdAt && typeof filters.createdAt === 'object') {
      const range = filters.createdAt as DateRangeValue;
      if (range.start) {
        filtered = filtered.filter((o) => o.createdAt.split('T')[0] >= range.start!);
      }
      if (range.end) {
        filtered = filtered.filter((o) => o.createdAt.split('T')[0] <= range.end!);
      }
    }

    // Sort
    if (sort) {
      const isDesc = sort.startsWith('-');
      const field = isDesc ? sort.substring(1) : sort;
      filtered.sort((a, b) => {
        const valA = (a as unknown as Record<string, unknown>)[field];
        const valB = (b as unknown as Record<string, unknown>)[field];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return isDesc ? valB - valA : valA - valB;
        }
        const strA = String(valA ?? '');
        const strB = String(valB ?? '');
        return isDesc ? strB.localeCompare(strA) : strA.localeCompare(strB);
      });
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return { data, total };
  },
});

function handleAddNewOrder() {
  const newId = `ord_${Date.now().toString().slice(-4)}`;
  const newOrder: Order = {
    id: newId,
    orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
    customer: 'New VIP Customer',
    email: 'vip@example.com',
    status: 'pending',
    total: 299.99,
    createdAt: new Date().toISOString(),
  };

  // Optimistic local prepend
  remote.prependRow(newOrder);
  toast.success(`Created new order ${newOrder.orderNumber}`);
}

function handleExportCsv() {
  exportToCsv({
    data: remote.data.value,
    columns,
    filename: 'showcase-orders.csv',
  });
  toast.success('Exported CSV file successfully');
}

async function handleExportExcel() {
  await exportToExcel({
    data: remote.data.value,
    columns,
    filename: 'showcase-orders.xlsx',
    headerStyle: {
      fontWeight: 'bold',
      backgroundColor: '#e2e8f0',
    },
  });
  toast.success('Exported Excel (.xlsx) file successfully');
}

async function handleCopyTsv() {
  const success = await copyToClipboardAsTsv({
    data: remote.selectedRows.value.length > 0 ? remote.selectedRows.value : remote.data.value,
    columns,
  });

  if (success) {
    copiedFeedback.value = true;
    toast.success('Copied records to clipboard as TSV');
    setTimeout(() => {
      copiedFeedback.value = false;
    }, 2000);
  } else {
    toast.error('Failed to copy to clipboard');
  }
}

function handleBulkComplete() {
  const ids = remote.selectedRows.value.map((r) => r.original.id);
  for (const id of ids) {
    remote.mutateRow(id, { status: 'completed' });
  }
  remote.clearSelection();
  toast.success(`Marked ${ids.length} orders as completed`);
}

function handleBulkDelete() {
  const ids = remote.selectedRows.value.map((r) => r.original.id);
  remote.deleteRow(ids);
  remote.clearSelection();
  toast.error(`Deleted ${ids.length} orders`);
}
</script>

<template>
  <main class="min-h-screen bg-background p-6 md:p-10 max-w-7xl mx-auto space-y-6">
    <Toaster rich-colors position="top-right" />

    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Orders Management</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Demonstrating remote pagination, filtering, date range, column pinning, density, virtual scrolling, and multi-format exports.
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Virtual scroll toggle -->
        <Button
          variant="outline"
          size="sm"
          :class="isVirtual ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''"
          @click="isVirtual = !isVirtual"
        >
          <Zap class="mr-1.5 h-3.5 w-3.5" />
          {{ isVirtual ? 'Virtual Scroll: On' : 'Virtual Scroll: Off' }}
        </Button>

        <!-- Density switch -->
        <div class="flex items-center rounded-lg border bg-muted/30 p-0.5 text-xs">
          <button
            type="button"
            class="px-2.5 py-1 rounded-md transition-colors"
            :class="density === 'compact' ? 'bg-background shadow-xs font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="density = 'compact'"
          >
            Compact
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-md transition-colors"
            :class="density === 'normal' ? 'bg-background shadow-xs font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="density = 'normal'"
          >
            Normal
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-md transition-colors"
            :class="density === 'comfortable' ? 'bg-background shadow-xs font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="density = 'comfortable'"
          >
            Comfortable
          </button>
        </div>

        <Button variant="outline" size="sm" @click="handleExportCsv">
          <Download class="mr-2 h-4 w-4" />
          CSV
        </Button>
        <Button variant="outline" size="sm" @click="handleExportExcel">
          <FileSpreadsheet class="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Excel
        </Button>
        <Button variant="outline" size="sm" @click="handleCopyTsv">
          <Copy class="mr-2 h-4 w-4" />
          {{ copiedFeedback ? 'Copied!' : 'TSV' }}
        </Button>
        <Button size="sm" @click="handleAddNewOrder">
          <Plus class="mr-2 h-4 w-4" />
          Add Order
        </Button>
      </div>
    </header>

    <!-- Showcase: Remote Combobox with Infinite Scroll & Inline CRUD -->
    <section class="rounded-xl border bg-card p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <h2 class="text-sm font-semibold text-foreground">Remote Combobox</h2>
          <span class="text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
            Infinite Scroll + Inline CRUD Hooks
          </span>
        </div>
        <p class="text-xs text-muted-foreground">
          Cuộn vô tận, tìm kiếm remote debounced, gõ để tạo mới tại chỗ (+ Create), và hover icon thùng rác để xóa option với xác nhận inline an toàn.
        </p>
      </div>

      <div class="w-full md:w-80 shrink-0">
        <RemoteCombobox
          v-model="selectedCustomerId"
          :fetcher="fetchRemoteCustomers"
          :on-create="handleCreateCustomer"
          :on-delete="handleDeleteCustomer"
          value-key="id"
          label-key="name"
          placeholder="Chọn khách hàng..."
          search-placeholder="Tìm kiếm hoặc tạo mới..."
        >
          <template #option="{ option }">
            <div class="flex flex-col py-0.5">
              <span class="font-medium text-xs">{{ option.name }}</span>
              <span class="text-[10px] text-muted-foreground">{{ option.email }}</span>
            </div>
          </template>
        </RemoteCombobox>
      </div>
    </section>

    <!-- Data Table -->
    <DataTable
      :remote="remote"
      :density="density"
      :virtual="isVirtual"
      virtual-height="520px"
    >
      <!-- Date Range Filter in Filters Slot -->
      <template #filters>
        <DataTableDateRangeFilter
          title="Date Range"
          :model-value="remote.filters.value.createdAt as DateRangeValue"
          @update:model-value="(val) => remote.setFilter('createdAt', val)"
        />
      </template>

      <!-- Bulk Actions in Floating Bar -->
      <template #bulk-actions="{ selectedCount }">
        <Button variant="outline" size="sm" class="h-7 text-xs" @click="handleBulkComplete">
          <CheckCircle class="mr-1.5 h-3.5 w-3.5 text-green-500" />
          Mark Completed ({{ selectedCount }})
        </Button>
        <Button variant="destructive" size="sm" class="h-7 text-xs" @click="handleBulkDelete">
          <Trash2 class="mr-1.5 h-3.5 w-3.5" />
          Delete ({{ selectedCount }})
        </Button>
      </template>
    </DataTable>
  </main>
</template>
