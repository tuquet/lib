import { describe, expect, it } from 'vitest';
import {
  mergeAllOfSchemas,
  normalizeOpenAPISchema,
  validateRecord,
  type OpenAPISchema,
} from '../src/schema/index.js';

describe('OpenAPI 3.0+ Schema Normalizer & Inheritance', () => {
  it('normalizes simple object properties with defaults', () => {
    const schema: OpenAPISchema = {
      type: 'object',
      required: ['name', 'status'],
      properties: {
        id: { type: 'string', readOnly: true },
        name: { type: 'string', title: 'Họ và tên', minLength: 2 },
        status: {
          type: 'string',
          enum: ['completed', 'pending', 'cancelled'],
          'x-ui-variants': {
            completed: 'default',
            pending: 'secondary',
            cancelled: 'destructive',
          },
        },
        progress: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
          'x-ui-suffix': '%',
        },
      },
    };

    const fields = normalizeOpenAPISchema(schema);

    expect(fields).toHaveLength(4);

    // ID field: readOnly
    const idField = fields.find((f) => f.key === 'id')!;
    expect(idField.readOnly).toBe(true);
    expect(idField.disabled).toBe(true);

    // Name field: required and minLength
    const nameField = fields.find((f) => f.key === 'name')!;
    expect(nameField.label).toBe('Họ và tên');
    expect(nameField.required).toBe(true);
    expect(nameField.widget).toBe('text');

    // Status field: small enum defaults to pill-badges
    const statusField = fields.find((f) => f.key === 'status')!;
    expect(statusField.widget).toBe('pill-badges');
    expect(statusField.enumOptions).toHaveLength(3);
    expect(statusField.enumOptions?.[0].variant).toBe('default');

    // Progress field: bounded 0-100 with % suffix defaults to slider
    const progressField = fields.find((f) => f.key === 'progress')!;
    expect(progressField.widget).toBe('slider');
    expect(progressField.min).toBe(0);
    expect(progressField.max).toBe(100);
  });

  it('handles allOf inheritance (deep merging schemas)', () => {
    const baseEntitySchema: OpenAPISchema = {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', readOnly: true },
        createdAt: { type: 'string', format: 'date-time', readOnly: true },
      },
    };

    const orderSchema: OpenAPISchema = {
      type: 'object',
      allOf: [
        baseEntitySchema,
        {
          type: 'object',
          required: ['customer', 'total'],
          properties: {
            customer: { type: 'string', title: 'Tên Khách Hàng' },
            total: { type: 'number', format: 'currency', 'x-ui-prefix': '$' },
          },
        },
      ],
    };

    const fields = normalizeOpenAPISchema(orderSchema);

    // Should contain both base entity properties and derived order properties
    const keys = fields.map((f) => f.key);
    expect(keys).toContain('id');
    expect(keys).toContain('createdAt');
    expect(keys).toContain('customer');
    expect(keys).toContain('total');

    const totalField = fields.find((f) => f.key === 'total')!;
    expect(totalField.widget).toBe('currency');
    expect(totalField.prefix).toBe('$');
  });

  it('supports developer code overrides (Tier 4)', () => {
    const schema: OpenAPISchema = {
      type: 'object',
      properties: {
        notes: { type: 'string' },
      },
    };

    const fields = normalizeOpenAPISchema(schema, {
      overrides: {
        notes: {
          label: 'Ghi chú đặc biệt',
          widget: 'textarea',
          placeholder: 'Nhập ghi chú...',
        },
      },
    });

    const notesField = fields[0];
    expect(notesField.label).toBe('Ghi chú đặc biệt');
    expect(notesField.widget).toBe('textarea');
    expect(notesField.placeholder).toBe('Nhập ghi chú...');
  });
});

describe('OpenAPI 3.0+ Validator Engine', () => {
  const schema: OpenAPISchema = {
    type: 'object',
    required: ['email', 'age', 'role'],
    properties: {
      email: { type: 'string', pattern: '^\\S+@\\S+\\.\\S+$' },
      age: { type: 'integer', minimum: 18, maximum: 65 },
      role: { type: 'string', enum: ['admin', 'editor', 'viewer'] },
      website: { type: 'string', minLength: 5 },
    },
  };

  const fields = normalizeOpenAPISchema(schema);

  it('detects missing required fields', () => {
    const res = validateRecord({}, fields);
    expect(res.isValid).toBe(false);
    expect(res.errors.email).toBeDefined();
    expect(res.errors.age).toBeDefined();
    expect(res.errors.role).toBeDefined();
  });

  it('enforces regex patterns and number bounds', () => {
    const res = validateRecord(
      {
        email: 'invalid-email',
        age: 12,
        role: 'admin',
      },
      fields
    );

    expect(res.isValid).toBe(false);
    expect(res.errors.email).toContain('định dạng');
    expect(res.errors.age).toContain('18');
  });

  it('passes when all constraints are satisfied', () => {
    const res = validateRecord(
      {
        email: 'dev@tuquet.io',
        age: 28,
        role: 'admin',
        website: 'https://tuquet.io',
      },
      fields
    );

    expect(res.isValid).toBe(true);
    expect(Object.keys(res.errors)).toHaveLength(0);
  });

  it('supports custom ValidationMessageTemplates and englishValidationMessages (OCP & i18n)', () => {
    const englishRes = validateRecord(
      {
        email: 'bad-email',
        age: 15,
      },
      fields,
      {
        required: (f) => `${f.label} is required!`,
        pattern: (f) => `${f.label} must be a valid email address!`,
        min: (f, min) => `${f.label} must be at least ${min} years old!`,
      }
    );

    expect(englishRes.isValid).toBe(false);
    expect(englishRes.errors.email).toBe('Email must be a valid email address!');
    expect(englishRes.errors.age).toBe('Age must be at least 18 years old!');
    expect(englishRes.errors.role).toBe('Role is required!');
  });
});
