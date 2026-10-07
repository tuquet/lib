import type {
  DynamicFilterGroup,
  DynamicFilterRule,
  FilterConjunction,
  FilterDataType,
} from '../types/filter.js';
import type { FilterOperator } from '../types/core.js';

export interface OperatorInfo {
  operator: FilterOperator;
  label: string;
  symbol?: string;
  requiresValue: boolean;
  requiresSecondValue?: boolean;
}

export const OPERATOR_METADATA: Record<FilterOperator, OperatorInfo> = {
  // Text
  contains: { operator: 'contains', label: 'Chứa', symbol: '∋', requiresValue: true },
  notContains: { operator: 'notContains', label: 'Không chứa', symbol: '∌', requiresValue: true },
  startsWith: { operator: 'startsWith', label: 'Bắt đầu bằng', symbol: '^=', requiresValue: true },
  endsWith: { operator: 'endsWith', label: 'Kết thúc bằng', symbol: '$=', requiresValue: true },

  // Generic equality
  eq: { operator: 'eq', label: 'Bằng (=)', symbol: '=', requiresValue: true },
  ne: { operator: 'ne', label: 'Khác (!=)', symbol: '≠', requiresValue: true },

  // Number bounds
  gt: { operator: 'gt', label: 'Lớn hơn (>)', symbol: '>', requiresValue: true },
  gte: { operator: 'gte', label: 'Lớn hơn hoặc bằng (>=)', symbol: '≥', requiresValue: true },
  lt: { operator: 'lt', label: 'Nhỏ hơn (<)', symbol: '<', requiresValue: true },
  lte: { operator: 'lte', label: 'Nhỏ hơn hoặc bằng (<=)', symbol: '≤', requiresValue: true },
  between: {
    operator: 'between',
    label: 'Trong khoảng',
    symbol: '< >',
    requiresValue: true,
    requiresSecondValue: true,
  },

  // Select / Enum
  is: { operator: 'is', label: 'Là', symbol: 'is', requiresValue: true },
  isNot: { operator: 'isNot', label: 'Không phải là', symbol: 'is not', requiresValue: true },
  in: { operator: 'in', label: 'Thuộc một trong các', symbol: '∈', requiresValue: true },
  notIn: { operator: 'notIn', label: 'Không thuộc các', symbol: '∉', requiresValue: true },

  // Date
  before: { operator: 'before', label: 'Trước ngày', symbol: '<', requiresValue: true },
  after: { operator: 'after', label: 'Sau ngày', symbol: '>', requiresValue: true },

  // Empty checks
  isEmpty: { operator: 'isEmpty', label: 'Rỗng / Chưa điền', symbol: '∅', requiresValue: false },
  isNotEmpty: { operator: 'isNotEmpty', label: 'Có dữ liệu', symbol: '!∅', requiresValue: false },

  // Boolean
  isTrue: { operator: 'isTrue', label: 'Đúng (True / Bật)', symbol: '✓', requiresValue: false },
  isFalse: { operator: 'isFalse', label: 'Sai (False / Tắt)', symbol: '✗', requiresValue: false },
};

export const ENGLISH_OPERATOR_METADATA: Record<FilterOperator, OperatorInfo> = {
  // Text
  contains: { operator: 'contains', label: 'Contains', symbol: '∋', requiresValue: true },
  notContains: {
    operator: 'notContains',
    label: 'Does not contain',
    symbol: '∌',
    requiresValue: true,
  },
  startsWith: { operator: 'startsWith', label: 'Starts with', symbol: '^=', requiresValue: true },
  endsWith: { operator: 'endsWith', label: 'Ends with', symbol: '$=', requiresValue: true },

  // Generic equality
  eq: { operator: 'eq', label: 'Equals (=)', symbol: '=', requiresValue: true },
  ne: { operator: 'ne', label: 'Not equals (!=)', symbol: '≠', requiresValue: true },

  // Number bounds
  gt: { operator: 'gt', label: 'Greater than (>)', symbol: '>', requiresValue: true },
  gte: { operator: 'gte', label: 'Greater than or equal (>=)', symbol: '≥', requiresValue: true },
  lt: { operator: 'lt', label: 'Less than (<)', symbol: '<', requiresValue: true },
  lte: { operator: 'lte', label: 'Less than or equal (<=)', symbol: '≤', requiresValue: true },
  between: {
    operator: 'between',
    label: 'Between',
    symbol: '< >',
    requiresValue: true,
    requiresSecondValue: true,
  },

  // Select / Enum
  is: { operator: 'is', label: 'Is', symbol: 'is', requiresValue: true },
  isNot: { operator: 'isNot', label: 'Is not', symbol: 'is not', requiresValue: true },
  in: { operator: 'in', label: 'In list', symbol: '∈', requiresValue: true },
  notIn: { operator: 'notIn', label: 'Not in list', symbol: '∉', requiresValue: true },

  // Date
  before: { operator: 'before', label: 'Before date', symbol: '<', requiresValue: true },
  after: { operator: 'after', label: 'After date', symbol: '>', requiresValue: true },

  // Empty checks
  isEmpty: { operator: 'isEmpty', label: 'Is empty', symbol: '∅', requiresValue: false },
  isNotEmpty: { operator: 'isNotEmpty', label: 'Is not empty', symbol: '!∅', requiresValue: false },

  // Boolean
  isTrue: { operator: 'isTrue', label: 'True / On', symbol: '✓', requiresValue: false },
  isFalse: { operator: 'isFalse', label: 'False / Off', symbol: '✗', requiresValue: false },
};

/**
 * Retrieve operator metadata with locale support (defaults to Vietnamese, supports English)
 */
export function getOperatorMetadata(
  operator: FilterOperator,
  locale: 'vi' | 'en' = 'vi'
): OperatorInfo {
  const dictionary = locale === 'en' ? ENGLISH_OPERATOR_METADATA : OPERATOR_METADATA;
  return dictionary[operator] ?? OPERATOR_METADATA[operator];
}

export const DATA_TYPE_OPERATORS: Record<FilterDataType, FilterOperator[]> = {
  text: ['contains', 'notContains', 'eq', 'ne', 'startsWith', 'endsWith', 'isEmpty', 'isNotEmpty'],
  number: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'isEmpty', 'isNotEmpty'],
  select: ['is', 'isNot', 'in', 'notIn', 'isEmpty', 'isNotEmpty'],
  date: ['is', 'isNot', 'before', 'after', 'between', 'isEmpty', 'isNotEmpty'],
  boolean: ['isTrue', 'isFalse'],
};

export function getDefaultOperatorForType(dataType: FilterDataType): FilterOperator {
  switch (dataType) {
    case 'text':
      return 'contains';
    case 'number':
      return 'gte';
    case 'select':
      return 'is';
    case 'date':
      return 'between';
    case 'boolean':
      return 'isTrue';
    default:
      return 'eq';
  }
}

/**
 * Safely evaluates whether a target value is empty
 */
export function isValueEmpty(val: unknown): boolean {
  if (val === undefined || val === null) return true;
  if (typeof val === 'string') return val.trim().length === 0;
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === 'object') return Object.keys(val).length === 0;
  return false;
}

/**
 * Parses any date-like input into millisecond timestamp
 */
function parseTimestamp(val: unknown): number | null {
  if (val === undefined || val === null || val === '') return null;
  if (val instanceof Date) {
    const t = val.getTime();
    return Number.isNaN(t) ? null : t;
  }
  if (typeof val === 'number') {
    return Number.isNaN(val) ? null : val;
  }
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Custom rule evaluator function type for Open-Closed Principle (OCP) extensibility
 */
export type CustomRuleEvaluator = (
  item: Record<string, unknown>,
  rule: DynamicFilterRule
) => boolean | undefined;

/**
 * Evaluates a single DynamicFilterRule against an object record
 */
export function evaluateFilterRule(
  item: Record<string, unknown>,
  rule: DynamicFilterRule,
  customEvaluator?: CustomRuleEvaluator
): boolean {
  if (!rule || !rule.field) return true;

  if (customEvaluator) {
    const customResult = customEvaluator(item, rule);
    if (typeof customResult === 'boolean') {
      return customResult;
    }
  }

  const rawVal = item[rule.field];

  const { operator, value, valueTo } = rule;

  // Empty operators
  if (operator === 'isEmpty') {
    return isValueEmpty(rawVal);
  }
  if (operator === 'isNotEmpty') {
    return !isValueEmpty(rawVal);
  }

  // Boolean operators
  if (operator === 'isTrue') {
    return Boolean(rawVal) === true;
  }
  if (operator === 'isFalse') {
    return Boolean(rawVal) === false;
  }

  // If the target field value is empty and operator requires a value, condition fails
  if (isValueEmpty(rawVal) && value !== undefined && value !== null) {
    return false;
  }

  // String / Text comparisons
  const strVal = rawVal !== undefined && rawVal !== null ? String(rawVal).toLowerCase().trim() : '';
  const strFilter = value !== undefined && value !== null ? String(value).toLowerCase().trim() : '';

  switch (operator) {
    case 'contains':
      return strVal.includes(strFilter);

    case 'notContains':
      return !strVal.includes(strFilter);

    case 'startsWith':
      return strVal.startsWith(strFilter);

    case 'endsWith':
      return strVal.endsWith(strFilter);

    case 'eq':
    case 'is': {
      if (typeof rawVal === 'number' && typeof value === 'number') {
        return rawVal === value;
      }
      return strVal === strFilter;
    }

    case 'ne':
    case 'isNot': {
      if (typeof rawVal === 'number' && typeof value === 'number') {
        return rawVal !== value;
      }
      return strVal !== strFilter;
    }

    case 'in': {
      const allowed = Array.isArray(value)
        ? value.map((v) => String(v).toLowerCase().trim())
        : [String(value).toLowerCase().trim()];
      return allowed.includes(strVal);
    }

    case 'notIn': {
      const denied = Array.isArray(value)
        ? value.map((v) => String(v).toLowerCase().trim())
        : [String(value).toLowerCase().trim()];
      return !denied.includes(strVal);
    }

    // Numbers & Bounds
    case 'gt': {
      const num = Number(rawVal);
      const target = Number(value);
      if (Number.isNaN(num) || Number.isNaN(target)) return false;
      return num > target;
    }

    case 'gte': {
      const num = Number(rawVal);
      const target = Number(value);
      if (Number.isNaN(num) || Number.isNaN(target)) return false;
      return num >= target;
    }

    case 'lt': {
      const num = Number(rawVal);
      const target = Number(value);
      if (Number.isNaN(num) || Number.isNaN(target)) return false;
      return num < target;
    }

    case 'lte': {
      const num = Number(rawVal);
      const target = Number(value);
      if (Number.isNaN(num) || Number.isNaN(target)) return false;
      return num <= target;
    }

    case 'between': {
      // Check if this is a date between or a number between
      const timeVal = parseTimestamp(rawVal);
      const startTime = parseTimestamp(value);
      const endTime = parseTimestamp(valueTo);

      if (timeVal !== null && (startTime !== null || endTime !== null)) {
        if (startTime !== null && timeVal < startTime) return false;
        if (endTime !== null && timeVal > endTime) return false;
        return true;
      }

      // Numeric between
      const num = Number(rawVal);
      const parsedMin =
        value !== undefined && value !== null && value !== '' ? Number(value) : -Infinity;
      const parsedMax =
        valueTo !== undefined && valueTo !== null && valueTo !== '' ? Number(valueTo) : Infinity;
      const min = Number.isNaN(parsedMin) ? -Infinity : parsedMin;
      const max = Number.isNaN(parsedMax) ? Infinity : parsedMax;

      if (Number.isNaN(num)) return false;
      return num >= min && num <= max;
    }

    // Dates
    case 'before': {
      const timeVal = parseTimestamp(rawVal);
      const targetTime = parseTimestamp(value);
      if (timeVal === null || targetTime === null) return false;
      return timeVal < targetTime;
    }

    case 'after': {
      const timeVal = parseTimestamp(rawVal);
      const targetTime = parseTimestamp(value);
      if (timeVal === null || targetTime === null) return false;
      return timeVal > targetTime;
    }

    default:
      return true;
  }
}

/**
 * Checks if a dynamic filter rule is complete and ready to be evaluated.
 * Incomplete rules (e.g. newly added rules awaiting user input) are considered inactive.
 */
export function isRuleComplete(rule: DynamicFilterRule): boolean {
  if (!rule || !rule.field) return false;
  const meta = OPERATOR_METADATA[rule.operator];
  if (!meta) return false;
  if (!meta.requiresValue) return true;
  if (meta.requiresSecondValue) {
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
}

/**
 * Evaluates a DynamicFilterGroup against an item
 */
export function evaluateFilterGroup(
  item: Record<string, unknown>,
  group: DynamicFilterGroup,
  customEvaluator?: CustomRuleEvaluator
): boolean {
  if (!group || !group.rules || group.rules.length === 0) return true;

  const validRules = group.rules.filter(isRuleComplete);
  if (validRules.length === 0) return true;

  if (group.conjunction === 'or') {
    return validRules.some((rule) => evaluateFilterRule(item, rule, customEvaluator));
  }

  // 'and' conjunction by default
  return validRules.every((rule) => evaluateFilterRule(item, rule, customEvaluator));
}

/**
 * Filters an in-memory dataset of items using dynamic filter rules or a group
 */
export function filterDataset<T extends Record<string, unknown>>(
  items: T[],
  rulesOrGroup: DynamicFilterRule[] | DynamicFilterGroup,
  conjunction: FilterConjunction = 'and',
  customEvaluator?: CustomRuleEvaluator
): T[] {
  if (!items || items.length === 0) return [];

  const group: DynamicFilterGroup = Array.isArray(rulesOrGroup)
    ? { id: 'group_root', conjunction, rules: rulesOrGroup }
    : rulesOrGroup;

  if (!group.rules || group.rules.length === 0) return items;

  return items.filter((item) => evaluateFilterGroup(item, group, customEvaluator));
}

let nextRuleId = 1;

/**
 * Generate a unique filter rule ID
 */
export function generateRuleId(): string {
  return `rule_${Date.now()}_${nextRuleId++}`;
}
