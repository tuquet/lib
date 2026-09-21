import { describe, expect, it } from 'vitest';
import {
  evaluateFilterGroup,
  evaluateFilterRule,
  filterDataset,
  isValueEmpty,
} from '../src/helpers/filterEngine.js';
import type { DynamicFilterRule } from '../src/types/filter.js';

const MOCK_DATA = [
  {
    id: 'ord_1',
    customer: 'Tập đoàn Vingroup JSC',
    role: 'Procurement Specialist',
    status: 'completed',
    total: 1500000,
    progress: 100,
    createdAt: '2026-01-15T08:00:00.000Z',
    active: true,
  },
  {
    id: 'ord_2',
    customer: 'Công ty CP Vinamilk',
    role: 'Supply Chain Lead',
    status: 'pending',
    total: 350000,
    progress: 45,
    createdAt: '2026-02-10T10:30:00.000Z',
    active: false,
  },
  {
    id: 'ord_3',
    customer: 'Tổng Công ty Vietnam Airlines',
    role: 'Finance Director',
    status: 'cancelled',
    total: 8900000,
    progress: 10,
    createdAt: '2026-03-01T14:15:00.000Z',
    active: true,
  },
  {
    id: 'ord_4',
    customer: 'Nguyễn Văn An',
    role: 'Procurement Specialist',
    status: 'completed',
    total: 0,
    progress: 100,
    createdAt: '2026-03-12T09:00:00.000Z',
    active: false,
  },
  {
    id: 'ord_5',
    customer: 'Công ty CP Tuquet Tech Solutions',
    role: 'IT Operations Manager',
    status: 'pending',
    total: 5000000,
    progress: 60,
    createdAt: '2026-03-18T16:45:00.000Z',
    active: true,
  },
];

describe('Enterprise Filter Engine - Rules Evaluation', () => {
  it('correctly evaluates text contains and notContains (case-insensitive)', () => {
    const ruleContains: DynamicFilterRule = {
      id: 'r1',
      field: 'customer',
      operator: 'contains',
      value: 'vingroup',
    };
    expect(evaluateFilterRule(MOCK_DATA[0], ruleContains)).toBe(true);
    expect(evaluateFilterRule(MOCK_DATA[1], ruleContains)).toBe(false);

    const ruleNotContains: DynamicFilterRule = {
      id: 'r2',
      field: 'customer',
      operator: 'notContains',
      value: 'Vingroup',
    };
    expect(evaluateFilterRule(MOCK_DATA[0], ruleNotContains)).toBe(false);
    expect(evaluateFilterRule(MOCK_DATA[1], ruleNotContains)).toBe(true);
  });

  it('correctly evaluates startsWith and endsWith', () => {
    const ruleStarts: DynamicFilterRule = {
      id: 'r3',
      field: 'customer',
      operator: 'startsWith',
      value: 'Công ty',
    };
    expect(evaluateFilterRule(MOCK_DATA[1], ruleStarts)).toBe(true);
    expect(evaluateFilterRule(MOCK_DATA[0], ruleStarts)).toBe(false);

    const ruleEnds: DynamicFilterRule = {
      id: 'r4',
      field: 'customer',
      operator: 'endsWith',
      value: 'Airlines',
    };
    expect(evaluateFilterRule(MOCK_DATA[2], ruleEnds)).toBe(true);
    expect(evaluateFilterRule(MOCK_DATA[0], ruleEnds)).toBe(false);
  });

  it('correctly evaluates numbers with bounds: gt, gte, lt, lte, between', () => {
    const ruleGt: DynamicFilterRule = {
      id: 'r5',
      field: 'total',
      operator: 'gt',
      value: 1000000,
    };
    expect(evaluateFilterRule(MOCK_DATA[0], ruleGt)).toBe(true); // 1.5M > 1M
    expect(evaluateFilterRule(MOCK_DATA[1], ruleGt)).toBe(false); // 350K < 1M

    const ruleBetween: DynamicFilterRule = {
      id: 'r6',
      field: 'total',
      operator: 'between',
      value: 1000000,
      valueTo: 6000000,
    };
    expect(evaluateFilterRule(MOCK_DATA[0], ruleBetween)).toBe(true); // 1.5M
    expect(evaluateFilterRule(MOCK_DATA[4], ruleBetween)).toBe(true); // 5M
    expect(evaluateFilterRule(MOCK_DATA[1], ruleBetween)).toBe(false); // 350K
    expect(evaluateFilterRule(MOCK_DATA[2], ruleBetween)).toBe(false); // 8.9M
  });

  it('correctly evaluates select / enum with is, isNot, in, notIn', () => {
    const ruleIs: DynamicFilterRule = {
      id: 'r7',
      field: 'status',
      operator: 'is',
      value: 'completed',
    };
    expect(evaluateFilterRule(MOCK_DATA[0], ruleIs)).toBe(true);
    expect(evaluateFilterRule(MOCK_DATA[1], ruleIs)).toBe(false);

    const ruleIn: DynamicFilterRule = {
      id: 'r8',
      field: 'status',
      operator: 'in',
      value: ['completed', 'pending'],
    };
    expect(evaluateFilterRule(MOCK_DATA[0], ruleIn)).toBe(true);
    expect(evaluateFilterRule(MOCK_DATA[1], ruleIn)).toBe(true);
    expect(evaluateFilterRule(MOCK_DATA[2], ruleIn)).toBe(false); // cancelled
  });

  it('correctly evaluates date before, after, and between', () => {
    const ruleBefore: DynamicFilterRule = {
      id: 'r9',
      field: 'createdAt',
      operator: 'before',
      value: '2026-02-01T00:00:00.000Z',
    };
    expect(evaluateFilterRule(MOCK_DATA[0], ruleBefore)).toBe(true); // Jan 15
    expect(evaluateFilterRule(MOCK_DATA[1], ruleBefore)).toBe(false); // Feb 10

    const ruleDateBetween: DynamicFilterRule = {
      id: 'r10',
      field: 'createdAt',
      operator: 'between',
      value: '2026-02-01T00:00:00.000Z',
      valueTo: '2026-03-05T00:00:00.000Z',
    };
    expect(evaluateFilterRule(MOCK_DATA[1], ruleDateBetween)).toBe(true); // Feb 10
    expect(evaluateFilterRule(MOCK_DATA[2], ruleDateBetween)).toBe(true); // Mar 1
    expect(evaluateFilterRule(MOCK_DATA[0], ruleDateBetween)).toBe(false); // Jan 15
    expect(evaluateFilterRule(MOCK_DATA[4], ruleDateBetween)).toBe(false); // Mar 18
  });

  it('correctly evaluates isEmpty and isNotEmpty', () => {
    expect(isValueEmpty('')).toBe(true);
    expect(isValueEmpty(null)).toBe(true);
    expect(isValueEmpty(undefined)).toBe(true);
    expect(isValueEmpty([])).toBe(true);
    expect(isValueEmpty('Hello')).toBe(false);
    expect(isValueEmpty(0)).toBe(false);

    const ruleEmpty: DynamicFilterRule = {
      id: 'r11',
      field: 'notes',
      operator: 'isEmpty',
    };
    expect(evaluateFilterRule(MOCK_DATA[0], ruleEmpty)).toBe(true); // no notes field

    const ruleNotEmpty: DynamicFilterRule = {
      id: 'r12',
      field: 'customer',
      operator: 'isNotEmpty',
    };
    expect(evaluateFilterRule(MOCK_DATA[0], ruleNotEmpty)).toBe(true);
  });

  it('correctly evaluates boolean isTrue and isFalse', () => {
    const ruleTrue: DynamicFilterRule = {
      id: 'r13',
      field: 'active',
      operator: 'isTrue',
    };
    expect(evaluateFilterRule(MOCK_DATA[0], ruleTrue)).toBe(true);
    expect(evaluateFilterRule(MOCK_DATA[1], ruleTrue)).toBe(false);

    const ruleFalse: DynamicFilterRule = {
      id: 'r14',
      field: 'active',
      operator: 'isFalse',
    };
    expect(evaluateFilterRule(MOCK_DATA[0], ruleFalse)).toBe(false);
    expect(evaluateFilterRule(MOCK_DATA[1], ruleFalse)).toBe(true);
  });
});

describe('Enterprise Filter Engine - Groups & filterDataset', () => {
  it('filters dataset using AND conjunction (all conditions must match)', () => {
    const rules: DynamicFilterRule[] = [
      { id: 'r1', field: 'status', operator: 'is', value: 'completed' },
      { id: 'r2', field: 'total', operator: 'gt', value: 100000 },
    ];

    const result = filterDataset(MOCK_DATA, rules, 'and');
    // ord_1: status=completed, total=1.5M -> MATCH
    // ord_4: status=completed, total=0 -> total NOT > 100K -> NO MATCH
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ord_1');
  });

  it('filters dataset using OR conjunction (any condition matches)', () => {
    const rules: DynamicFilterRule[] = [
      { id: 'r1', field: 'customer', operator: 'contains', value: 'Vingroup' },
      { id: 'r2', field: 'status', operator: 'is', value: 'cancelled' },
    ];

    const result = filterDataset(MOCK_DATA, rules, 'or');
    // ord_1: Vingroup
    // ord_3: cancelled
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['ord_1', 'ord_3']);
  });

  it('returns all items when rules list is empty', () => {
    const result = filterDataset(MOCK_DATA, []);
    expect(result).toHaveLength(5);
  });

  it('supports CustomRuleEvaluator for custom operators without modifying engine (OCP)', () => {
    // Custom operator 'regex' evaluated via custom evaluator
    const customRule: DynamicFilterRule = {
      id: 'custom_1',
      field: 'customer',
      operator: 'contains', // fallback or custom operator
      value: 'Vinamilk|Vietnam',
    };

    const customEvaluator = (item: Record<string, unknown>, rule: DynamicFilterRule) => {
      if (rule.id === 'custom_1') {
        const regex = new RegExp(String(rule.value), 'i');
        return regex.test(String(item[rule.field]));
      }
      return undefined; // fallback to standard evaluation
    };

    const matched = filterDataset(MOCK_DATA, [customRule], 'and', customEvaluator);
    // Matches Vinamilk (ord_2) and Vietnam Airlines (ord_3)
    expect(matched.map((m) => m.id)).toEqual(['ord_2', 'ord_3']);
  });

  it('evaluates entire DynamicFilterGroup correctly', () => {
    const group = {
      id: 'g_1',
      conjunction: 'and' as const,
      rules: [
        { id: '1', field: 'status', operator: 'eq' as const, value: 'completed' },
        { id: '2', field: 'total', operator: 'gt' as const, value: 1000000 },
      ],
    };
    expect(evaluateFilterGroup(MOCK_DATA[0], group)).toBe(true);
    expect(evaluateFilterGroup(MOCK_DATA[1], group)).toBe(false);
  });

  it('ignores incomplete rules when evaluating filter groups without wiping out data', () => {
    // When a user adds a new condition, value is undefined
    const groupWithIncomplete = {
      id: 'g_pending',
      conjunction: 'and' as const,
      rules: [{ id: 'r1', field: 'customer', operator: 'contains' as const, value: undefined }],
    };
    // Should NOT reject all items
    expect(evaluateFilterGroup(MOCK_DATA[0], groupWithIncomplete)).toBe(true);
    const result = filterDataset(MOCK_DATA, groupWithIncomplete.rules);
    expect(result).toHaveLength(5);
  });

  it('correctly handles isRuleComplete contract across all operator types', async () => {
    const { isRuleComplete } = await import('../src/helpers/filterEngine.js');

    // Missing field
    expect(isRuleComplete({ id: '1', field: '', operator: 'eq', value: 'a' })).toBe(false);

    // Requires no value
    expect(isRuleComplete({ id: '2', field: 'status', operator: 'isEmpty' })).toBe(true);
    expect(isRuleComplete({ id: '3', field: 'status', operator: 'isNotEmpty' })).toBe(true);
    expect(isRuleComplete({ id: '4', field: 'active', operator: 'isTrue' })).toBe(true);
    expect(isRuleComplete({ id: '5', field: 'active', operator: 'isFalse' })).toBe(true);

    // Between requires both values
    expect(isRuleComplete({ id: '6', field: 'total', operator: 'between', value: 100 })).toBe(
      false
    );
    expect(
      isRuleComplete({ id: '7', field: 'total', operator: 'between', value: 100, valueTo: '' })
    ).toBe(false);
    expect(
      isRuleComplete({ id: '8', field: 'total', operator: 'between', value: 100, valueTo: 500 })
    ).toBe(true);

    // Standard operator requires non-empty value
    expect(isRuleComplete({ id: '9', field: 'customer', operator: 'contains', value: '' })).toBe(
      false
    );
    expect(isRuleComplete({ id: '10', field: 'customer', operator: 'contains', value: null })).toBe(
      false
    );
    expect(
      isRuleComplete({ id: '11', field: 'customer', operator: 'contains', value: undefined })
    ).toBe(false);
    expect(
      isRuleComplete({ id: '12', field: 'customer', operator: 'contains', value: 'Vingroup' })
    ).toBe(true);
    expect(isRuleComplete({ id: '13', field: 'total', operator: 'eq', value: 0 })).toBe(true);
  });
});
