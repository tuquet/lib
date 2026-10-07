import { describe, expect, it, vi } from 'vitest';
import { useRemoteTable } from '../src/composables/useRemoteTable.js';

interface User {
  id: number;
  name: string;
  role: string;
}

describe('useRemoteTable mutations', () => {
  const initialUsers: User[] = [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' },
    { id: 3, name: 'Charlie', role: 'guest' },
  ];

  const createTable = () => {
    return useRemoteTable<User>({
      columns: [{ accessorKey: 'name', header: 'Name' }],
      fetcher: vi.fn(async () => ({
        data: [...initialUsers],
        total: initialUsers.length,
      })),
      syncWithUrl: false,
    });
  };

  it('mutates row by id', async () => {
    const remote = createTable();
    await remote.refetch();

    remote.mutateRow(2, { name: 'Bobby' });
    expect(remote.data.value.find((u) => u.id === 2)?.name).toBe('Bobby');
    expect(remote.data.value.find((u) => u.id === 1)?.name).toBe('Alice');
  });

  it('mutates row by predicate with functional updater', async () => {
    const remote = createTable();
    await remote.refetch();

    remote.mutateRow(
      (u) => u.role === 'guest',
      (u) => ({ ...u, role: 'member' })
    );
    expect(remote.data.value.find((u) => u.id === 3)?.role).toBe('member');
  });

  it('deletes single row by id and updates total count', async () => {
    const remote = createTable();
    await remote.refetch();

    expect(remote.total.value).toBe(3);
    remote.deleteRow(2);

    expect(remote.data.value.length).toBe(2);
    expect(remote.data.value.find((u) => u.id === 2)).toBeUndefined();
    expect(remote.total.value).toBe(2);
  });

  it('deletes multiple rows by array of ids', async () => {
    const remote = createTable();
    await remote.refetch();

    remote.deleteRow([1, 3]);

    expect(remote.data.value.length).toBe(1);
    expect(remote.data.value[0].id).toBe(2);
    expect(remote.total.value).toBe(1);
  });

  it('prepends row to top and increments total', async () => {
    const remote = createTable();
    await remote.refetch();

    const newUser: User = { id: 99, name: 'Zara', role: 'superadmin' };
    remote.prependRow(newUser);

    expect(remote.data.value.length).toBe(4);
    expect(remote.data.value[0]).toEqual(newUser);
    expect(remote.total.value).toBe(4);
  });

  it('appends row to bottom and increments total', async () => {
    const remote = createTable();
    await remote.refetch();

    const newUser: User = { id: 100, name: 'Dan', role: 'tester' };
    remote.appendRow(newUser);

    expect(remote.data.value.length).toBe(4);
    expect(remote.data.value[3]).toEqual(newUser);
    expect(remote.total.value).toBe(4);
  });

  it('sets data and custom total', async () => {
    const remote = createTable();
    await remote.refetch();

    remote.setData([{ id: 10, name: 'Solo', role: 'admin' }], 50);

    expect(remote.data.value.length).toBe(1);
    expect(remote.total.value).toBe(50);
  });
});
