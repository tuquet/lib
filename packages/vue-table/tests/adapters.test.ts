import { describe, expect, it } from 'vitest';
import { createCustomAdapter } from '../src/adapters/custom.js';
import { LhsBracketsAdapter } from '../src/adapters/lhs-brackets.js';
import { SpringPageableAdapter } from '../src/adapters/spring-pageable.js';
import { StandardRestAdapter } from '../src/adapters/standard-rest.js';
import type { TableState } from '../src/types/index.js';

describe('StandardRestAdapter', () => {
  const adapter = new StandardRestAdapter();

  const mockState: TableState = {
    pagination: { pageIndex: 2, pageSize: 25 },
    sorting: [
      { id: 'createdAt', desc: true },
      { id: 'name', desc: false },
    ],
    filters: {
      status: ['active', 'pending'],
      role: 'admin',
    },
    search: 'john doe',
  };

  it('serializes table state into standard REST query params', () => {
    const query = adapter.serialize(mockState);
    expect(query).toEqual({
      page: 3, // 1-indexed (pageIndex 2 -> page 3)
      limit: 25,
      sort: '-createdAt,name',
      q: 'john doe',
      status: 'active,pending',
      role: 'admin',
    });
  });

  it('deserializes standard REST query params back into table state', () => {
    const rawQuery = {
      page: '3',
      limit: '25',
      sort: '-createdAt,name',
      q: 'john doe',
      status: 'active,pending',
      role: 'admin',
    };

    const deserialized = adapter.deserialize(rawQuery);
    expect(deserialized.pagination).toEqual({ pageIndex: 2, pageSize: 25 });
    expect(deserialized.sorting).toEqual([
      { id: 'createdAt', desc: true },
      { id: 'name', desc: false },
    ]);
    expect(deserialized.search).toBe('john doe');
    expect(deserialized.filters).toEqual({
      status: ['active', 'pending'],
      role: 'admin',
    });
  });
});

describe('LhsBracketsAdapter', () => {
  const adapter = new LhsBracketsAdapter();

  const mockState: TableState = {
    pagination: { pageIndex: 0, pageSize: 15 },
    sorting: [{ id: 'priority', desc: true }],
    filters: {
      status: ['open', 'in_progress'],
      department: 'engineering',
    },
    search: 'bug',
  };

  it('serializes table state into LHS brackets query params', () => {
    const query = adapter.serialize(mockState);
    expect(query).toEqual({
      page: 1,
      limit: 15,
      'sort[priority]': 'desc',
      'filter[q]': 'bug',
      'filter[status][in]': 'open,in_progress',
      'filter[department]': 'engineering',
    });
  });

  it('deserializes LHS brackets query params back into table state', () => {
    const rawQuery = {
      page: '2',
      limit: '20',
      'sort[priority]': 'desc',
      'filter[q]': 'bug',
      'filter[status][in]': 'open,in_progress',
      'filter[department]': 'engineering',
    };

    const deserialized = adapter.deserialize(rawQuery);
    expect(deserialized.pagination).toEqual({ pageIndex: 1, pageSize: 20 });
    expect(deserialized.sorting).toEqual([{ id: 'priority', desc: true }]);
    expect(deserialized.search).toBe('bug');
    expect(deserialized.filters).toEqual({
      status: ['open', 'in_progress'],
      department: 'engineering',
    });
  });
});

describe('SpringPageableAdapter', () => {
  const adapter = new SpringPageableAdapter();

  const mockState: TableState = {
    pagination: { pageIndex: 1, pageSize: 20 },
    sorting: [
      { id: 'createdAt', desc: true },
      { id: 'name', desc: false },
    ],
    filters: { status: 'active' },
    search: 'spring',
  };

  it('serializes table state into Spring Pageable format', () => {
    const query = adapter.serialize(mockState);
    expect(query).toEqual({
      page: 1, // 0-indexed in Spring
      size: 20,
      sort: ['createdAt,desc', 'name,asc'],
      q: 'spring',
      status: 'active',
    });
  });

  it('deserializes Spring Pageable query params back into table state', () => {
    const rawQuery = {
      page: '2',
      size: '50',
      sort: ['createdAt,desc', 'name,asc'],
      q: 'spring',
      status: 'active',
    };

    const deserialized = adapter.deserialize(rawQuery);
    expect(deserialized.pagination).toEqual({ pageIndex: 2, pageSize: 50 });
    expect(deserialized.sorting).toEqual([
      { id: 'createdAt', desc: true },
      { id: 'name', desc: false },
    ]);
    expect(deserialized.search).toBe('spring');
  });
});

describe('createCustomAdapter', () => {
  it('creates custom adapter with serialize and deserialize methods', () => {
    const custom = createCustomAdapter({
      name: 'my-adapter',
      serialize: (s) => ({ p: s.pagination.pageIndex }),
      deserialize: (q) => ({ pagination: { pageIndex: Number(q.p), pageSize: 10 } }),
    });

    expect(custom.name).toBe('my-adapter');
    expect(custom.serialize({ pagination: { pageIndex: 5, pageSize: 10 } } as any)).toEqual({
      p: 5,
    });
    expect(custom.deserialize({ p: '3' })).toEqual({ pagination: { pageIndex: 3, pageSize: 10 } });
  });
});
