import test from 'node:test';
import assert from 'node:assert/strict';
import { OrdersDatabase } from '../src/db.mjs';

test('OrdersDatabase - Seed and Query Pagination', () => {
  const db = new OrdersDatabase(50);
  assert.equal(db.orders.length, 50);

  const res = db.query({ page: 1, limit: 10 });
  assert.equal(res.data.length, 10);
  assert.equal(res.total, 50);
  assert.equal(res.totalPages, 5);
  assert.equal(res.hasNext, true);
  assert.equal(res.hasPrev, false);

  const page2 = db.query({ page: 2, limit: 10 });
  assert.equal(page2.data.length, 10);
  assert.notEqual(page2.data[0].id, res.data[0].id);
});

test('OrdersDatabase - Text Search & Status Filtering', () => {
  const db = new OrdersDatabase(100);

  // Search by exact order number
  const targetOrder = db.orders[5];
  const searchRes = db.query({ search: targetOrder.orderNumber });
  assert.ok(searchRes.data.length >= 1);
  assert.equal(searchRes.data[0].orderNumber, targetOrder.orderNumber);

  // Filter by status
  const completedRes = db.query({ status: 'completed' });
  assert.ok(completedRes.data.length > 0);
  for (const item of completedRes.data) {
    assert.equal(item.status, 'completed');
  }
});

test('OrdersDatabase - Multi-column Sorting', () => {
  const db = new OrdersDatabase(100);

  // Sort ascending by total
  const ascRes = db.query({ sort: 'total', limit: 50 });
  for (let i = 1; i < ascRes.data.length; i++) {
    assert.ok(ascRes.data[i].total >= ascRes.data[i - 1].total);
  }

  // Sort descending by total
  const descRes = db.query({ sort: '-total', limit: 50 });
  for (let i = 1; i < descRes.data.length; i++) {
    assert.ok(descRes.data[i].total <= descRes.data[i - 1].total);
  }
});

test('OrdersDatabase - CRUD Operations', () => {
  const db = new OrdersDatabase(10);

  // 1. Create
  const created = db.create({
    customer: 'Công ty Cổ phần Alpha Test',
    role: 'IT Director',
    status: 'pending',
    total: 3500.5,
    progress: 40,
    notes: 'Test đơn mới',
  });
  assert.ok(created.id);
  assert.equal(created.customer, 'Công ty Cổ phần Alpha Test');
  assert.equal(db.orders.length, 11);

  // 2. Read by ID
  const found = db.getById(created.id);
  assert.ok(found);
  assert.equal(found.id, created.id);

  // 3. Patch (Inline edit)
  const patched = db.update(created.id, { customer: 'Tên Đã Sửa', progress: 85 });
  assert.ok(patched);
  assert.equal(patched.customer, 'Tên Đã Sửa');
  assert.equal(patched.progress, 85);

  // 4. Delete
  const deleted = db.delete(created.id);
  assert.equal(deleted, true);
  assert.equal(db.getById(created.id), null);
  assert.equal(db.orders.length, 10);
});

test('OrdersDatabase - Bulk Actions', () => {
  const db = new OrdersDatabase(20);
  const targetIds = [db.orders[0].id, db.orders[1].id, db.orders[2].id];

  // Bulk update
  const updatedCount = db.bulkUpdate(targetIds, { status: 'completed' });
  assert.equal(updatedCount, 3);
  for (const id of targetIds) {
    const item = db.getById(id);
    assert.equal(item.status, 'completed');
  }

  // Bulk delete
  const deletedCount = db.bulkDelete(targetIds);
  assert.equal(deletedCount, 3);
  assert.equal(db.orders.length, 17);
});

test('OrdersDatabase - Dynamic Filter Rules with Operators and Conjunction', () => {
  const db = new OrdersDatabase(100);

  // 1. Operator: gt (total > 2000)
  const gtRes = db.query({
    filters: JSON.stringify([{ field: 'total', operator: 'gt', value: 2000 }]),
    limit: 100,
  });
  assert.ok(gtRes.data.length > 0);
  for (const item of gtRes.data) {
    assert.ok(item.total > 2000);
  }

  // 2. Multiple rules with AND
  const andRes = db.query({
    filters: JSON.stringify([
      { field: 'status', operator: 'is', value: 'completed' },
      { field: 'total', operator: 'gt', value: 1000 },
    ]),
    conjunction: 'and',
    limit: 100,
  });
  for (const item of andRes.data) {
    assert.equal(item.status, 'completed');
    assert.ok(item.total > 1000);
  }

  // 3. Multiple rules with OR
  const orRes = db.query({
    filters: JSON.stringify([
      { field: 'status', operator: 'is', value: 'cancelled' },
      { field: 'progress', operator: 'eq', value: 100 },
    ]),
    conjunction: 'or',
    limit: 100,
  });
  for (const item of orRes.data) {
    assert.ok(item.status === 'cancelled' || item.progress === 100);
  }
});

