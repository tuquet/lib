import type { Ref } from 'vue';
import { generateRuleId, isValueEmpty } from '../helpers/filterEngine.js';
import type { DynamicFilterRule, FilterConjunction, FilterPreset } from '../types/filter.js';
import type { FilterApi } from './types.js';

export interface CreateFilterApiOptions {
  searchQuery: Ref<string>;
  filters: Ref<Record<string, unknown>>;
  setFilter: (id: string, value: unknown) => void;
  resetFilters: () => void;
  activeFilterCount: Ref<number>;
  dynamicRules?: Ref<DynamicFilterRule[]>;
  dynamicConjunction?: Ref<FilterConjunction>;
}

export function createFilterApi(options: CreateFilterApiOptions): FilterApi {
  const {
    searchQuery,
    filters,
    setFilter,
    resetFilters,
    activeFilterCount,
    dynamicRules,
    dynamicConjunction,
  } = options;

  return {
    setSearch(query: string): void {
      searchQuery.value = query;
    },

    getSearch(): string {
      return searchQuery.value;
    },

    clearSearch(): void {
      searchQuery.value = '';
    },

    setFilter(id: string, value: unknown): void {
      setFilter(id, value);
    },

    getFilter(id: string): unknown {
      return filters.value[id];
    },

    resetFilters(): void {
      resetFilters();
    },

    addRule(rule: Partial<DynamicFilterRule>): void {
      if (!dynamicRules) return;
      const newRule: DynamicFilterRule = {
        id: rule.id || generateRuleId(),
        field: rule.field || '',
        operator: rule.operator || 'eq',
        value: rule.value,
        valueTo: rule.valueTo,
      };
      dynamicRules.value = [...dynamicRules.value, newRule];
    },

    removeRule(ruleId: string): void {
      if (!dynamicRules) return;
      dynamicRules.value = dynamicRules.value.filter((r) => r.id !== ruleId);
    },

    clearRules(): void {
      if (!dynamicRules) return;
      dynamicRules.value = [];
    },

    getRules(): DynamicFilterRule[] {
      return dynamicRules ? dynamicRules.value : [];
    },

    applyPreset(preset: FilterPreset): void {
      if (dynamicRules) {
        dynamicRules.value = preset.rules.map((r) => ({
          ...r,
          id: generateRuleId(),
        }));
      }
      if (dynamicConjunction) {
        dynamicConjunction.value = preset.conjunction;
      }
    },

    getActiveCount(): number {
      const standardCount = activeFilterCount.value;
      const dynamicCount = dynamicRules
        ? dynamicRules.value.filter((r) => r.field && !isValueEmpty(r.value)).length
        : 0;
      return standardCount + dynamicCount;
    },
  };
}
