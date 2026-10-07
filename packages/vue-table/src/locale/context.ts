import { hasInjectionContext, inject, isRef, provide, ref, type InjectionKey, type Ref } from 'vue';
import { enUS } from './en-US.js';
import type { TableLocale } from './types.js';

export const TABLE_LOCALE_INJECTION_KEY: InjectionKey<Ref<TableLocale>> =
  Symbol('TuquetTableLocale');

/**
 * Provide reactive TableLocale to the component tree
 */
export function provideTableLocale(locale: TableLocale | Ref<TableLocale>): Ref<TableLocale> {
  const localeRef = isRef(locale) ? locale : ref(locale);
  provide(TABLE_LOCALE_INJECTION_KEY, localeRef);
  return localeRef;
}

/**
 * Consume TableLocale from context, falling back to enUS if not provided
 */
export function useTableLocale(): Ref<TableLocale> {
  if (hasInjectionContext()) {
    const injected = inject(TABLE_LOCALE_INJECTION_KEY, null);
    if (injected) {
      return injected;
    }
  }
  return ref(enUS);
}

/**
 * Helper to build custom locale by deeply merging overrides into a base locale
 */
export function createTableLocale(
  overrides: {
    code?: string;
    direction?: 'ltr' | 'rtl';
    messages?: {
      general?: Partial<TableLocale['messages']['general']>;
      pagination?: Partial<TableLocale['messages']['pagination']>;
      toolbar?: Partial<TableLocale['messages']['toolbar']>;
      floatingBar?: Partial<TableLocale['messages']['floatingBar']>;
      filterBuilder?: Partial<TableLocale['messages']['filterBuilder']>;
      cell?: Partial<TableLocale['messages']['cell']>;
      headerMenu?: Partial<TableLocale['messages']['headerMenu']>;
      savedViews?: Partial<TableLocale['messages']['savedViews']>;
    };
    formatters?: Partial<TableLocale['formatters']>;
  },
  baseLocale: TableLocale = enUS
): TableLocale {
  return {
    code: overrides.code || baseLocale.code,
    direction: overrides.direction || baseLocale.direction,
    messages: {
      general: { ...baseLocale.messages.general, ...overrides.messages?.general },
      pagination: { ...baseLocale.messages.pagination, ...overrides.messages?.pagination },
      toolbar: { ...baseLocale.messages.toolbar, ...overrides.messages?.toolbar },
      floatingBar: { ...baseLocale.messages.floatingBar, ...overrides.messages?.floatingBar },
      filterBuilder: { ...baseLocale.messages.filterBuilder, ...overrides.messages?.filterBuilder },
      cell: { ...baseLocale.messages.cell, ...overrides.messages?.cell },
      headerMenu: { ...baseLocale.messages.headerMenu, ...overrides.messages?.headerMenu },
      savedViews: { ...baseLocale.messages.savedViews, ...overrides.messages?.savedViews },
    },
    formatters: {
      ...baseLocale.formatters,
      ...overrides.formatters,
    },
  };
}
