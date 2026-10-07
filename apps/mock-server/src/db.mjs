/**
 * In-Memory Enterprise Orders Database
 * Provides fast, thread-safe (single-process event loop) CRUD operations
 * with realistic seed generation, filtering, sorting, and pagination.
 */

const VIETNAMESE_COMPANIES = [
  'Tập đoàn Vingroup JSC',
  'Tập đoàn Viettel Telecom',
  'Ngân hàng TMCP Vietcombank',
  'Công ty FPT Software',
  'Tổng Công ty Hàng không Vietnam Airlines',
  'Công ty CP Sữa Vinamilk',
  'Công ty CP Bán lẻ Kỹ thuật số FPT',
  'Tập đoàn Masan Group',
  'Công ty CP Thế Giới Di Động',
  'Tập đoàn Hòa Phát',
  'Công ty CP Tuquet Tech Solutions',
  'Ngân hàng TMCP Techcombank',
  'Công ty CP Giao Hàng Tiết Kiệm',
  'Tập đoàn VNPT Vinaphone',
  'Công ty TNHH Shopee Express',
];

const VIETNAMESE_NAMES = [
  'Nguyễn Văn An',
  'Trần Thị Bích Ngọc',
  'Lê Hoàng Nam',
  'Phạm Minh Tuấn',
  'Hoàng Thị Lan Anh',
  'Vũ Đức Thắng',
  'Đặng Thu Hà',
  'Bùi Quốc Anh',
  'Đỗ Thanh Tùng',
  'Hồ Ngọc Mai',
  'Ngô Gia Bảo',
  'Dương Minh Trí',
  'Phan Quỳnh Như',
  'Đinh Văn Hùng',
  'Mai Anh Dũng',
];

const ROLES = [
  'Procurement Specialist',
  'Finance Director',
  'Supply Chain Lead',
  'IT Operations Manager',
  'Senior Account Exec',
  'Logistics Coordinator',
  'Legal & Compliance',
  'Regional Operations',
];

const STATUSES = ['completed', 'pending', 'cancelled'];

const NOTES = [
  'Giao giờ hành chính, liên hệ quầy lễ tân tầng 12',
  'Hàng dễ vỡ, yêu cầu đóng thùng gỗ cẩn thận',
  'Đã xuất hóa đơn điện tử VAT qua cổng thuế',
  'Khách yêu cầu gọi điện trước 30 phút khi vận chuyển',
  'Hàng chuyển phát hỏa tốc 24h, kèm biên bản bàn giao',
  'Thanh toán qua chuyển khoản ngân hàng sau khi nghiệm thu',
];

export class OrdersDatabase {
  constructor(initialCount = 1000) {
    this.orders = [];
    this.seed(initialCount);
  }

  seed(count = 1000) {
    const list = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const isCompany = i % 2 === 0;
      const customerName = isCompany
        ? VIETNAMESE_COMPANIES[i % VIETNAMESE_COMPANIES.length]
        : VIETNAMESE_NAMES[i % VIETNAMESE_NAMES.length];

      const daysAgo = (i * 3) % 45;
      const createdDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000 - (i % 86400) * 1000);
      const status = STATUSES[i % STATUSES.length];
      const progress = status === 'completed' ? 100 : status === 'cancelled' ? Math.min(30, (i * 7) % 35) : ((i * 13) % 90) + 5;
      const total = Math.round((75 + (i * 27.5) % 4900) * 100) / 100;

      list.push({
        index: i,
        id: `ord_${1000 + i}`,
        orderNumber: `ORD-${String(202600 + i).padStart(6, '0')}`,
        customer: `${customerName}${i >= 30 ? ` #${Math.floor(i / 15)}` : ''}`,
        role: ROLES[i % ROLES.length],
        status,
        progress,
        total,
        createdAt: createdDate.toISOString(),
        notes: NOTES[i % NOTES.length],
      });
    }

    this.orders = list;
    return this.orders.length;
  }

  query({
    page = 1,
    limit = 20,
    sort = null,
    search = '',
    status = null,
    role = null,
    createdAt_start = null,
    createdAt_end = null,
    minTotal = null,
    maxTotal = null,
    filters = null,
    conjunction = 'and',
  }) {
    let result = [...this.orders];

    // Dynamic Filter Rules (Supports operators: contains, notContains, startsWith, endsWith, eq, ne, is, isNot, in, notIn, gt, gte, lt, lte, between, isEmpty, isNotEmpty, isTrue, isFalse)
    let parsedRules = [];
    if (typeof filters === 'string') {
      try {
        parsedRules = JSON.parse(filters);
      } catch {}
    } else if (Array.isArray(filters)) {
      parsedRules = filters;
    }

    if (Array.isArray(parsedRules) && parsedRules.length > 0) {
      const isRuleActive = (rule) => {
        if (!rule || !rule.field) return false;
        const noValueOps = ['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'];
        if (noValueOps.includes(rule.operator)) return true;
        if (rule.operator === 'between') {
          return (
            rule.value !== undefined &&
            rule.value !== null &&
            rule.value !== '' &&
            rule.valueTo !== undefined &&
            rule.valueTo !== null &&
            rule.valueTo !== ''
          );
        }
        return rule.value !== undefined && rule.value !== null && rule.value !== '';
      };

      const validRules = parsedRules.filter(isRuleActive);
      if (validRules.length > 0) {
        const isOr = String(conjunction).toLowerCase() === 'or';
        result = result.filter((item) => {
          const checkRule = (rule) => {
            if (!rule || !rule.field) return true;
            const rawVal = item[rule.field];
            const op = rule.operator;
            const val = rule.value;
            const valTo = rule.valueTo;

          if (op === 'isEmpty') {
            return (
              rawVal === undefined ||
              rawVal === null ||
              rawVal === '' ||
              (Array.isArray(rawVal) && rawVal.length === 0)
            );
          }
          if (op === 'isNotEmpty') {
            return (
              rawVal !== undefined &&
              rawVal !== null &&
              rawVal !== '' &&
              (!Array.isArray(rawVal) || rawVal.length > 0)
            );
          }
          if (op === 'isTrue') return Boolean(rawVal) === true;
          if (op === 'isFalse') return Boolean(rawVal) === false;

          const strVal =
            rawVal !== undefined && rawVal !== null ? String(rawVal).toLowerCase().trim() : '';
          const strFilter =
            val !== undefined && val !== null ? String(val).toLowerCase().trim() : '';

          switch (op) {
            case 'contains':
              return strVal.includes(strFilter);
            case 'notContains':
              return !strVal.includes(strFilter);
            case 'startsWith':
              return strVal.startsWith(strFilter);
            case 'endsWith':
              return strVal.endsWith(strFilter);
            case 'eq':
            case 'is':
              if (typeof rawVal === 'number' && typeof val === 'number') return rawVal === val;
              return strVal === strFilter;
            case 'ne':
            case 'isNot':
              if (typeof rawVal === 'number' && typeof val === 'number') return rawVal !== val;
              return strVal !== strFilter;
            case 'in': {
              const list = Array.isArray(val)
                ? val.map((v) => String(v).toLowerCase().trim())
                : [strFilter];
              return list.includes(strVal);
            }
            case 'notIn': {
              const list = Array.isArray(val)
                ? val.map((v) => String(v).toLowerCase().trim())
                : [strFilter];
              return !list.includes(strVal);
            }
            case 'gt':
              return Number(rawVal) > Number(val);
            case 'gte':
              return Number(rawVal) >= Number(val);
            case 'lt':
              return Number(rawVal) < Number(val);
            case 'lte':
              return Number(rawVal) <= Number(val);
            case 'between': {
              if (rule.field === 'createdAt' || Date.parse(rawVal)) {
                const t = new Date(rawVal).getTime();
                const tStart = val ? new Date(val).getTime() : -Infinity;
                const tEnd = valTo ? new Date(valTo).getTime() : Infinity;
                return t >= tStart && t <= tEnd;
              }
              const num = Number(rawVal);
              const min =
                val !== undefined && val !== null && val !== '' ? Number(val) : -Infinity;
              const max =
                valTo !== undefined && valTo !== null && valTo !== '' ? Number(valTo) : Infinity;
              return num >= min && num <= max;
            }
            case 'before':
              return new Date(rawVal).getTime() < new Date(val).getTime();
            case 'after':
              return new Date(rawVal).getTime() > new Date(val).getTime();
            default:
              return true;
          }
        };

        return isOr ? validRules.some(checkRule) : validRules.every(checkRule);
      });
    }
  }

    // 1. Text Search (Full-text query across key fields)
    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.role.toLowerCase().includes(q) ||
          (o.notes && o.notes.toLowerCase().includes(q))
      );
    }

    // 2. Status Filter (Supports array or comma-separated string)
    if (status) {
      const statusList = Array.isArray(status)
        ? status
        : String(status)
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
      if (statusList.length > 0) {
        const set = new Set(statusList);
        result = result.filter((o) => set.has(o.status));
      }
    }

    // 3. Role Filter
    if (role) {
      const r = String(role).trim().toLowerCase();
      result = result.filter((o) => o.role.toLowerCase().includes(r));
    }

    // 4. Date Range Filters
    if (createdAt_start) {
      const startTime = new Date(createdAt_start).getTime();
      if (!Number.isNaN(startTime)) {
        result = result.filter((o) => new Date(o.createdAt).getTime() >= startTime);
      }
    }
    if (createdAt_end) {
      const endTime = new Date(createdAt_end).getTime();
      if (!Number.isNaN(endTime)) {
        result = result.filter((o) => new Date(o.createdAt).getTime() <= endTime);
      }
    }

    // 5. Total Bounds
    if (minTotal !== null && minTotal !== undefined && !Number.isNaN(Number(minTotal))) {
      result = result.filter((o) => o.total >= Number(minTotal));
    }
    if (maxTotal !== null && maxTotal !== undefined && !Number.isNaN(Number(maxTotal))) {
      result = result.filter((o) => o.total <= Number(maxTotal));
    }

    // 6. Sorting
    if (sort && typeof sort === 'string' && sort.trim().length > 0) {
      const sortParts = sort.split(',').map((s) => s.trim()).filter(Boolean);
      result.sort((a, b) => {
        for (const part of sortParts) {
          const isDesc = part.startsWith('-');
          const field = isDesc ? part.substring(1) : part;

          const valA = a[field];
          const valB = b[field];

          if (valA === undefined || valB === undefined) continue;

          let diff = 0;
          if (typeof valA === 'number' && typeof valB === 'number') {
            diff = valA - valB;
          } else if (field === 'createdAt') {
            diff = new Date(valA).getTime() - new Date(valB).getTime();
          } else {
            diff = String(valA).localeCompare(String(valB), 'vi', { sensitivity: 'base' });
          }

          if (diff !== 0) {
            return isDesc ? -diff : diff;
          }
        }
        return 0;
      });
    }

    const total = result.length;
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(10000, Math.max(1, Number(limit) || 20));
    const totalPages = Math.ceil(total / pageSize) || 1;
    const offset = (pageNum - 1) * pageSize;
    const paginatedData = result.slice(offset, offset + pageSize);

    return {
      data: paginatedData,
      total,
      page: pageNum,
      limit: pageSize,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    };
  }

  getById(idOrNumber) {
    if (!idOrNumber) return null;
    const target = String(idOrNumber).trim().toLowerCase();
    return (
      this.orders.find(
        (o) => o.id.toLowerCase() === target || o.orderNumber.toLowerCase() === target
      ) || null
    );
  }

  create(data) {
    const nextIdx = this.orders.length + 1000;
    const newId = `ord_${nextIdx}`;
    const newOrderNumber =
      data.orderNumber && data.orderNumber.trim()
        ? data.orderNumber.trim()
        : `ORD-${String(202600 + nextIdx).padStart(6, '0')}`;

    const newOrder = {
      id: newId,
      orderNumber: newOrderNumber,
      customer: data.customer ? String(data.customer).trim() : 'Khách hàng mới',
      role: data.role ? String(data.role).trim() : 'Procurement Specialist',
      status: data.status && STATUSES.includes(data.status) ? data.status : 'pending',
      progress: typeof data.progress === 'number' ? Math.max(0, Math.min(100, data.progress)) : 0,
      total: typeof data.total === 'number' ? Math.max(0, data.total) : 100,
      createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
      notes: data.notes ? String(data.notes).trim() : '',
    };

    // Prepend to top of list
    this.orders.unshift(newOrder);
    return newOrder;
  }

  update(idOrNumber, updates) {
    const order = this.getById(idOrNumber);
    if (!order) return null;

    if (updates.customer !== undefined) order.customer = String(updates.customer).trim();
    if (updates.role !== undefined) order.role = String(updates.role).trim();
    if (updates.status !== undefined && STATUSES.includes(updates.status)) {
      order.status = updates.status;
      if (order.status === 'completed' && order.progress < 100) order.progress = 100;
    }
    if (updates.progress !== undefined) {
      order.progress = Math.max(0, Math.min(100, Number(updates.progress) || 0));
    }
    if (updates.total !== undefined) {
      order.total = Math.max(0, Number(updates.total) || 0);
    }
    if (updates.notes !== undefined) {
      order.notes = String(updates.notes).trim();
    }
    order.updatedAt = new Date().toISOString();

    return order;
  }

  delete(idOrNumber) {
    const idx = this.orders.findIndex(
      (o) =>
        o.id.toLowerCase() === String(idOrNumber).toLowerCase() ||
        o.orderNumber.toLowerCase() === String(idOrNumber).toLowerCase()
    );
    if (idx === -1) return false;
    this.orders.splice(idx, 1);
    return true;
  }

  bulkDelete(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const set = new Set(ids.map((id) => String(id).toLowerCase()));
    const initialLen = this.orders.length;
    this.orders = this.orders.filter(
      (o) => !set.has(o.id.toLowerCase()) && !set.has(o.orderNumber.toLowerCase())
    );
    return initialLen - this.orders.length;
  }

  bulkUpdate(ids, updates) {
    if (!Array.isArray(ids) || ids.length === 0 || !updates) return 0;
    const set = new Set(ids.map((id) => String(id).toLowerCase()));
    let updatedCount = 0;

    for (const order of this.orders) {
      if (set.has(order.id.toLowerCase()) || set.has(order.orderNumber.toLowerCase())) {
        if (updates.status && STATUSES.includes(updates.status)) {
          order.status = updates.status;
          if (order.status === 'completed') order.progress = 100;
        }
        if (updates.role) order.role = updates.role;
        if (updates.progress !== undefined) order.progress = Number(updates.progress);
        order.updatedAt = new Date().toISOString();
        updatedCount++;
      }
    }
    return updatedCount;
  }

  getStats() {
    const totalOrders = this.orders.length;
    let totalRevenue = 0;
    let totalProgress = 0;
    const statusCounts = { completed: 0, pending: 0, cancelled: 0 };

    for (const o of this.orders) {
      totalRevenue += o.total;
      totalProgress += o.progress;
      if (statusCounts[o.status] !== undefined) {
        statusCounts[o.status]++;
      }
    }

    return {
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageProgress: totalOrders > 0 ? Math.round((totalProgress / totalOrders) * 10) / 10 : 0,
      statusCounts,
    };
  }
}
