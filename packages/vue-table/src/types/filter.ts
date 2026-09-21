import type { Component } from 'vue';

export interface FacetedFilterOption<T = string | number> {
  label: string;
  value: T;
  icon?: Component;
  count?: number;
}

export interface BaseFilterDef {
  id: string;
  title: string;
}

export interface FacetedFilterDef<T = string | number> extends BaseFilterDef {
  type: 'faceted';
  options: FacetedFilterOption<T>[] | (() => Promise<FacetedFilterOption<T>[]>);
}

export interface SelectFilterDef<T = string | number> extends BaseFilterDef {
  type: 'select';
  options: FacetedFilterOption<T>[];
}

export interface DateRangeFilterDef extends BaseFilterDef {
  type: 'date-range';
}

export interface NumberRangeFilterDef extends BaseFilterDef {
  type: 'number-range';
  min?: number;
  max?: number;
}

export interface TextFilterDef extends BaseFilterDef {
  type: 'text';
  placeholder?: string;
}

export type FilterDef =
  FacetedFilterDef | SelectFilterDef | DateRangeFilterDef | NumberRangeFilterDef | TextFilterDef;

/**
 * Enterprise Database Filter Data Types
 */
export type FilterDataType = 'text' | 'number' | 'select' | 'date' | 'boolean';

/**
 * Filter conjunction: 'and' requires all rules to match, 'or' requires any rule to match
 */
export type FilterConjunction = 'and' | 'or';

/**
 * Concrete Filter Rule representing a condition in an Enterprise Database Table
 */
export interface DynamicFilterRule {
  id: string;
  field: string;
  operator: import('./core.js').FilterOperator;
  value?: unknown;
  valueTo?: unknown; // Used for 'between' ranges
}

/**
 * Group of dynamic filter rules evaluated with a conjunction
 */
export interface DynamicFilterGroup {
  id: string;
  conjunction: FilterConjunction;
  rules: DynamicFilterRule[];
}

/**
 * Column definition used by the Database Filter Builder UI
 */
export interface ColumnFilterDefinition {
  id: string;
  label: string;
  dataType: FilterDataType;
  options?: { label: string; value: string | number }[];
  placeholder?: string;
  defaultOperator?: import('./core.js').FilterOperator;
}

/**
 * Preset configuration for saved enterprise filter views
 */
export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  conjunction: FilterConjunction;
  rules: DynamicFilterRule[];
}

/**
 * Flexible Database Filter Builder Configuration (Segregated Interface)
 */
export interface DataTableFilterBuilderConfig {
  columnFilterDefs?: ColumnFilterDefinition[];
  dynamicRules?: DynamicFilterRule[];
  conjunction?: FilterConjunction;
  filterPresets?: FilterPreset[];
  showFilterBuilder?: boolean;
}
