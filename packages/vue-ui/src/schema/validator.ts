import type { NormalizedFieldDefinition } from './types.js';

export interface ValidationErrorMap {
  [key: string]: string;
}

export interface ValidationMessageTemplates {
  required?: (field: NormalizedFieldDefinition) => string;
  minLength?: (field: NormalizedFieldDefinition, min: number) => string;
  maxLength?: (field: NormalizedFieldDefinition, max: number) => string;
  pattern?: (field: NormalizedFieldDefinition) => string;
  min?: (field: NormalizedFieldDefinition, min: number) => string;
  max?: (field: NormalizedFieldDefinition, max: number) => string;
  invalidEnum?: (field: NormalizedFieldDefinition) => string;
}

export const defaultValidationMessages: Required<ValidationMessageTemplates> = {
  required: (field) => `${field.label} là trường bắt buộc.`,
  minLength: (field, min) => `${field.label} phải có tối thiểu ${min} ký tự.`,
  maxLength: (field, max) => `${field.label} không được vượt quá ${max} ký tự.`,
  pattern: (field) => `${field.label} không đúng định dạng yêu cầu.`,
  min: (field, min) => `${field.label} không được nhỏ hơn ${min}.`,
  max: (field, max) => `${field.label} không được lớn hơn ${max}.`,
  invalidEnum: (field) => `${field.label} chứa giá trị không hợp lệ.`,
};

export const englishValidationMessages: Required<ValidationMessageTemplates> = {
  required: (field) => `${field.label} is required.`,
  minLength: (field, min) => `${field.label} must be at least ${min} characters.`,
  maxLength: (field, max) => `${field.label} must not exceed ${max} characters.`,
  pattern: (field) => `${field.label} format is invalid.`,
  min: (field, min) => `${field.label} must be greater than or equal to ${min}.`,
  max: (field, max) => `${field.label} must be less than or equal to ${max}.`,
  invalidEnum: (field) => `${field.label} contains an invalid option.`,
};

/**
 * Validate a single field value against its NormalizedFieldDefinition
 * Returns error message string or null if valid.
 */
export function validateFieldValue(
  value: unknown,
  field: NormalizedFieldDefinition,
  allValues: Record<string, unknown> = {},
  customMessages?: Partial<ValidationMessageTemplates>
): string | null {
  const isPresent = value !== undefined && value !== null && value !== '';
  const messages = { ...defaultValidationMessages, ...customMessages };

  // 1. Required Validation
  if (field.required && !isPresent) {
    return messages.required(field);
  }

  // If value is empty and not required, skip remaining constraint checks
  if (!isPresent) {
    return null;
  }

  // 2. String Length Validations
  if (typeof value === 'string') {
    if (field.minLength !== undefined && value.length < field.minLength) {
      return messages.minLength(field, field.minLength);
    }
    if (field.maxLength !== undefined && value.length > field.maxLength) {
      return messages.maxLength(field, field.maxLength);
    }
    if (field.pattern) {
      try {
        const regex = new RegExp(field.pattern);
        if (!regex.test(value)) {
          return messages.pattern(field);
        }
      } catch {
        // Ignore invalid regex patterns
      }
    }
  }

  // 3. Number Range Validations
  if (typeof value === 'number' || (typeof value === 'string' && !Number.isNaN(Number(value)))) {
    const num = Number(value);
    if (field.min !== undefined && num < field.min) {
      return messages.min(field, field.min);
    }
    if (field.max !== undefined && num > field.max) {
      return messages.max(field, field.max);
    }
  }

  // 4. Enum Options Validation
  if (field.enumOptions && field.enumOptions.length > 0) {
    const validValues = new Set(field.enumOptions.map((opt) => opt.value));
    if (!validValues.has(value as string | number | boolean)) {
      return messages.invalidEnum(field);
    }
  }

  // 5. Developer Custom Override Validator
  const customValidate = (field as any).validate;
  if (typeof customValidate === 'function') {
    const customErr = customValidate(value, allValues);
    if (customErr) return customErr;
  }

  return null;
}

/**
 * Validate full record object against normalized fields
 */
export function validateRecord(
  values: Record<string, unknown>,
  fields: NormalizedFieldDefinition[],
  customMessages?: Partial<ValidationMessageTemplates>
): {
  isValid: boolean;
  errors: ValidationErrorMap;
} {
  const errors: ValidationErrorMap = {};
  let isValid = true;

  for (const field of fields) {
    if (field.hidden || field.readOnly) continue;

    const val = values[field.key];
    const err = validateFieldValue(val, field, values, customMessages);
    if (err) {
      errors[field.key] = err;
      isValid = false;
    }
  }

  return { isValid, errors };
}
