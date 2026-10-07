import { describe, expect, it } from 'vitest';
import { createApp, ref } from 'vue';
import {
  enUS,
  viVN,
  createTableLocale,
  useTableLocale,
  TABLE_LOCALE_INJECTION_KEY,
} from '../src/locale/index.js';

describe('Table Locale System', () => {
  describe('Built-in Locales', () => {
    it('provides enUS locale messages and formatters', () => {
      expect(enUS.code).toBe('en-US');
      expect(enUS.messages.general.emptyMessage).toBe('No results found.');
      expect(enUS.messages.pagination.rowsPerPage).toBe('Rows per page');
      expect(enUS.messages.toolbar.searchPlaceholder).toBe('Filter records...');
      expect(enUS.messages.filterBuilder.title).toBe('Filter Builder');
      expect(enUS.messages.cell.clickToEdit).toBe('Click to edit inline');

      // Test formatters
      expect(enUS.formatters.currency(1250000, 'USD')).toContain('1,250,000');
      expect(enUS.formatters.number(1250.5)).toBe('1,250.5');
      const formattedDate = enUS.formatters.date('2026-05-15T00:00:00Z');
      expect(formattedDate).toBeDefined();
    });

    it('provides viVN locale messages and formatters', () => {
      expect(viVN.code).toBe('vi-VN');
      expect(viVN.messages.general.emptyMessage).toBe('Không tìm thấy kết quả nào.');
      expect(viVN.messages.pagination.rowsPerPage).toBe('Số dòng mỗi trang');
      expect(viVN.messages.toolbar.searchPlaceholder).toBe('Tìm kiếm dữ liệu...');
      expect(viVN.messages.filterBuilder.title).toBe('Bộ lọc linh hoạt');
      expect(viVN.messages.cell.clickToEdit).toBe('Click để chỉnh sửa trực tiếp');

      // Test formatters
      const formattedVnd = viVN.formatters.currency(1500000);
      expect(formattedVnd).toContain('1.500.000');
      expect(formattedVnd).toContain('₫');
      expect(viVN.formatters.number(1250.5)).toBe('1.250,5');
    });
  });

  describe('createTableLocale (Deep Merge Custom Overrides)', () => {
    it('creates custom locale merged with enUS by default', () => {
      const custom = createTableLocale({
        code: 'en-GB',
        messages: {
          general: {
            emptyMessage: 'Nothing to see here mate.',
          },
          toolbar: {
            searchPlaceholder: 'Quick find...',
          },
        },
      });

      expect(custom.code).toBe('en-GB');
      expect(custom.messages.general.emptyMessage).toBe('Nothing to see here mate.');
      // Fallback to base (enUS)
      expect(custom.messages.general.tryAgain).toBe('Try Again');
      expect(custom.messages.toolbar.searchPlaceholder).toBe('Quick find...');
      expect(custom.messages.pagination.rowsPerPage).toBe('Rows per page');
      expect(custom.formatters.number(100)).toBe('100');
    });

    it('creates custom locale extending viVN base', () => {
      const custom = createTableLocale(
        {
          code: 'vi-CUSTOM',
          messages: {
            general: {
              emptyMessage: 'Không có bản ghi nào!',
            },
          },
        },
        viVN
      );

      expect(custom.code).toBe('vi-CUSTOM');
      expect(custom.messages.general.emptyMessage).toBe('Không có bản ghi nào!');
      expect(custom.messages.filterBuilder.title).toBe('Bộ lọc linh hoạt');
    });
  });

  describe('Vue Context Injection', () => {
    it('falls back to enUS when no locale is provided', () => {
      const locale = useTableLocale();
      expect(locale.value.code).toBe('en-US');
    });

    it('consumes provided TableLocale when running with app context', () => {
      const app = createApp({});
      app.provide(TABLE_LOCALE_INJECTION_KEY, ref(viVN));

      const consumedLocale = app.runWithContext(() => {
        return useTableLocale();
      });

      expect(consumedLocale.value.code).toBe('vi-VN');
      expect(consumedLocale.value.messages.general.emptyMessage).toBe(
        'Không tìm thấy kết quả nào.'
      );
    });

    it('supports dynamic reactive changes in provided locale', () => {
      const app = createApp({});
      const activeLocaleRef = ref(enUS);
      app.provide(TABLE_LOCALE_INJECTION_KEY, activeLocaleRef);

      const consumed = app.runWithContext(() => useTableLocale());
      expect(consumed.value.code).toBe('en-US');

      activeLocaleRef.value = viVN;
      expect(consumed.value.code).toBe('vi-VN');
    });
  });
});
