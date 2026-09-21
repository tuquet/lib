import { computed, ref, type ComputedRef, type Ref } from 'vue';
import {
  OPERATOR_METADATA,
  generateRuleId,
  filterDataset as executeFilterDataset,
  getDefaultOperatorForType,
  isValueEmpty,
  type CustomRuleEvaluator,
} from '../helpers/filterEngine.js';
import type { FilterOperator } from '../types/core.js';
import type {
  ColumnFilterDefinition,
  DynamicFilterGroup,
  DynamicFilterRule,
  FilterConjunction,
  FilterPreset,
} from '../types/filter.js';

export interface UseDynamicFiltersOptions {
  columnDefs: ColumnFilterDefinition[];
  initialRules?: DynamicFilterRule[];
  initialConjunction?: FilterConjunction;
  presets?: FilterPreset[];
  onFilterChange?: (group: DynamicFilterGroup) => void;
  /**
   * Optional custom rule evaluator for Open-Closed Principle (OCP) extensibility
   */
  customEvaluator?: CustomRuleEvaluator;
}

export interface UseDynamicFiltersReturn {
  rules: Ref<DynamicFilterRule[]>;
  conjunction: Ref<FilterConjunction>;
  columnDefs: ColumnFilterDefinition[];
  presets: FilterPreset[];
  activeRuleCount: ComputedRef<number>;
  validRules: ComputedRef<DynamicFilterRule[]>;
  addRule: (
    field?: string,
    operator?: FilterOperator,
    value?: unknown,
    valueTo?: unknown
  ) => DynamicFilterRule;
  updateRule: (id: string, updates: Partial<DynamicFilterRule>) => void;
  removeRule: (id: string) => void;
  clearRules: () => void;
  applyPreset: (preset: FilterPreset) => void;
  filterDataset: <T extends Record<string, unknown>>(items: T[]) => T[];
  serializedParams: ComputedRef<Record<string, unknown>>;
  getColumnDef: (field: string) => ColumnFilterDefinition | undefined;
}

export function useDynamicFilters(options: UseDynamicFiltersOptions): UseDynamicFiltersReturn {
  const {
    columnDefs = [],
    initialRules = [],
    initialConjunction = 'and',
    presets = [],
    onFilterChange,
    customEvaluator,
  } = options;

  const rules = ref<DynamicFilterRule[]>([...initialRules]);
  const conjunction = ref<FilterConjunction>(initialConjunction);

  const getColumnDef = (field: string): ColumnFilterDefinition | undefined => {
    return columnDefs.find((col) => col.id === field);
  };

  /**
   * Filter rules that are syntactically complete
   */
  const validRules = computed<DynamicFilterRule[]>(() => {
    return rules.value.filter((rule) => {
      if (!rule.field) return false;
      const meta = OPERATOR_METADATA[rule.operator];
      if (!meta) return false;
      if (!meta.requiresValue) return true;
      if (meta.requiresSecondValue) {
        return !isValueEmpty(rule.value) || !isValueEmpty(rule.valueTo);
      }
      return !isValueEmpty(rule.value);
    });
  });

  const activeRuleCount = computed(() => validRules.value.length);

  const addRule = (
    field?: string,
    operator?: FilterOperator,
    value?: unknown,
    valueTo?: unknown
  ): DynamicFilterRule => {
    const targetField = field || columnDefs[0]?.id || '';
    const colDef = getColumnDef(targetField);
    const targetOperator = operator || (colDef ? getDefaultOperatorForType(colDef.dataType) : 'eq');

    const newRule: DynamicFilterRule = {
      id: generateRuleId(),
      field: targetField,
      operator: targetOperator,
      value: value !== undefined ? value : undefined,
      valueTo: valueTo !== undefined ? valueTo : undefined,
    };

    rules.value = [...rules.value, newRule];
    notifyChange();
    return newRule;
  };

  const updateRule = (id: string, updates: Partial<DynamicFilterRule>): void => {
    const idx = rules.value.findIndex((r) => r.id === id);
    if (idx === -1) return;

    const current = rules.value[idx];
    const updated = { ...current, ...updates };

    // If field changed, update operator to appropriate default if not explicitly provided
    if (updates.field && updates.field !== current.field && !updates.operator) {
      const colDef = getColumnDef(updates.field);
      if (colDef) {
        updated.operator = colDef.defaultOperator || getDefaultOperatorForType(colDef.dataType);
        updated.value = undefined;
        updated.valueTo = undefined;
      }
    }

    const nextRules = [...rules.value];
    nextRules[idx] = updated;
    rules.value = nextRules;
    notifyChange();
  };

  const removeRule = (id: string): void => {
    rules.value = rules.value.filter((r) => r.id !== id);
    notifyChange();
  };

  const clearRules = (): void => {
    rules.value = [];
    notifyChange();
  };

  const applyPreset = (preset: FilterPreset): void => {
    conjunction.value = preset.conjunction;
    rules.value = preset.rules.map((r) => ({
      ...r,
      id: generateRuleId(),
    }));
    notifyChange();
  };

  const notifyChange = (): void => {
    if (onFilterChange) {
      onFilterChange({
        id: 'group_root',
        conjunction: conjunction.value,
        rules: validRules.value,
      });
    }
  };

  const filterDataset = <T extends Record<string, unknown>>(items: T[]): T[] => {
    return executeFilterDataset(items, validRules.value, conjunction.value, customEvaluator);
  };

  const serializedParams = computed<Record<string, unknown>>(() => {
    const active = validRules.value;
    if (active.length === 0) return {};

    const params: Record<string, unknown> = {
      filters: JSON.stringify(active),
      conjunction: conjunction.value,
    };

    // Also populate flat query params for simple single-rule queries to maintain backward compatibility
    for (const rule of active) {
      if (rule.operator === 'eq' || rule.operator === 'is') {
        params[rule.field] = rule.value;
      } else if (rule.operator === 'between') {
        if (!isValueEmpty(rule.value)) params[`${rule.field}_start`] = rule.value;
        if (!isValueEmpty(rule.valueTo)) params[`${rule.field}_end`] = rule.valueTo;
      }
    }

    return params;
  });

  return {
    rules,
    conjunction,
    columnDefs,
    presets,
    activeRuleCount,
    validRules,
    addRule,
    updateRule,
    removeRule,
    clearRules,
    applyPreset,
    filterDataset,
    serializedParams,
    getColumnDef,
  };
}
