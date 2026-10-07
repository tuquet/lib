import { describe, expect, it } from 'vitest';
import { generateCsv, generateExcelBlob } from '../src/helpers/export.js';

describe('CSV & TSV & Excel Export Utilities', () => {
  const sampleUsers = [
    { id: 1, name: 'John Doe', role: 'admin', bio: 'Likes "coding", coffee', salary: 1500.5 },
    { id: 2, name: 'Jane Smith', role: 'user', bio: 'Simple bio', salary: 2000 },
  ];

  it('generates valid CSV with headers and escaped commas/quotes', () => {
    const csv = generateCsv({
      data: sampleUsers,
    });

    expect(csv.startsWith('\uFEFF')).toBe(true); // UTF-8 BOM
    const content = csv.slice(1);
    const lines = content.split('\r\n');

    expect(lines[0]).toBe('id,name,role,bio,salary');
    expect(lines[1]).toBe('1,John Doe,admin,"Likes ""coding"", coffee",1500.5');
    expect(lines[2]).toBe('2,Jane Smith,user,Simple bio,2000');
  });

  it('filters out select and actions columns', () => {
    const csv = generateCsv({
      data: sampleUsers,
      columns: [
        { id: 'select', header: 'Select' },
        { accessorKey: 'name', header: 'Full Name' },
        { accessorKey: 'role', header: 'Role' },
        { id: 'actions', header: 'Actions' },
      ] as any,
    });

    const content = csv.slice(1);
    const lines = content.split('\r\n');
    expect(lines[0]).toBe('Full Name,Role');
    expect(lines[1]).toBe('John Doe,admin');
    expect(lines[2]).toBe('Jane Smith,user');
  });

  it('extracts original data from TanStack Row instances', () => {
    const mockRows = sampleUsers.map((u, idx) => ({
      index: idx,
      original: u,
    }));

    const csv = generateCsv({
      data: mockRows as any,
    });

    const content = csv.slice(1);
    const lines = content.split('\r\n');
    expect(lines[0]).toBe('id,name,role,bio,salary');
    expect(lines[1]).toContain('John Doe');
  });

  it('allows disabling UTF-8 BOM', () => {
    const csv = generateCsv({
      data: [{ id: 1 }],
      includeBOM: false,
    });

    expect(csv.startsWith('\uFEFF')).toBe(false);
  });

  it('generates valid Excel (.xlsx) Blob with typed columns and styling', async () => {
    const blob = await generateExcelBlob({
      data: sampleUsers,
      columns: [
        { accessorKey: 'name', header: 'Customer Name' },
        { accessorKey: 'salary', header: 'Monthly Salary' },
      ] as any,
      headerStyle: {
        fontWeight: 'bold',
        backgroundColor: '#e2e8f0',
      },
    });

    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(1000);
    expect(blob.type).toContain('spreadsheetml');
  });
});
