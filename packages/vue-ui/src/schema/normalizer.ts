import type {
  FieldOverridesMap,
  NormalizedFieldDefinition,
  OpenAPIPropertySchema,
  OpenAPISchema,
  OpenAPISchemaType,
  UIPriority,
  UIWidgetType,
} from './types.js';

/**
 * Deep merge multiple OpenAPI schemas (handles allOf inheritance)
 */
export function mergeAllOfSchemas(schemas: OpenAPIPropertySchema[]): OpenAPIPropertySchema {
  const merged: OpenAPIPropertySchema = {
    type: 'object',
    properties: {},
    required: [],
  };

  for (const schema of schemas) {
    if (schema.type && !merged.type) {
      merged.type = schema.type;
    }
    if (schema.title) merged.title = schema.title;
    if (schema.description) merged.description = schema.description;

    if (schema.required && Array.isArray(schema.required)) {
      merged.required = Array.from(new Set([...(merged.required || []), ...schema.required]));
    }

    if (schema.properties) {
      merged.properties = {
        ...merged.properties,
        ...schema.properties,
      };
    }

    // Merge vendor extensions
    for (const key of Object.keys(schema)) {
      if (key.startsWith('x-')) {
        (merged as Record<string, unknown>)[key] = (schema as Record<string, unknown>)[key];
      }
    }
  }

  return merged;
}

/**
 * Infer the best UI Widget from OpenAPI types, formats, constraints and vendor extensions
 */
export function inferWidgetType(prop: OpenAPIPropertySchema): UIWidgetType {
  // Tier 3: Vendor extension takes highest priority
  if (prop['x-ui-widget']) {
    return prop['x-ui-widget'];
  }

  if (prop.writeOnly || prop.format === 'password') {
    return 'password';
  }

  if (prop.enum && prop.enum.length > 0) {
    // For mobile touch usability, small enums (<= 4 options) default to touch Pill Badges
    return prop.enum.length <= 4 ? 'pill-badges' : 'select';
  }

  const type = Array.isArray(prop.type) ? prop.type[0] : prop.type;

  if (type === 'boolean') {
    return 'switch';
  }

  if (type === 'integer' || type === 'number') {
    if (prop.format === 'currency') return 'currency';
    // If bounded 0 to 100 with percentage suffix, use touch slider
    if (prop.minimum === 0 && prop.maximum === 100 && prop['x-ui-suffix'] === '%') {
      return 'slider';
    }
    return 'number';
  }

  if (prop.format === 'date' || prop.format === 'date-time') {
    return 'date';
  }

  if (prop.maxLength && prop.maxLength > 255) {
    return 'textarea';
  }

  return 'text';
}

/**
 * Format raw property key into human-friendly Label (e.g. 'orderNumber' -> 'Order Number')
 */
export function formatFallbackLabel(key: string): string {
  const result = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Normalize an OpenAPI 3.0/3.1 Schema into an array of NormalizedFieldDefinition
 */
export function normalizeOpenAPISchema(
  rawSchema: OpenAPISchema,
  options?: {
    overrides?: FieldOverridesMap;
    exclude?: string[];
    includeOnly?: string[];
  }
): NormalizedFieldDefinition[] {
  const { overrides = {}, exclude = [], includeOnly } = options || {};

  // 1. Resolve allOf inheritance if present
  let resolvedSchema = rawSchema;
  if (rawSchema.allOf && Array.isArray(rawSchema.allOf)) {
    resolvedSchema = mergeAllOfSchemas([rawSchema, ...rawSchema.allOf]) as OpenAPISchema;
  }

  const properties = resolvedSchema.properties || {};
  const requiredFields = new Set(resolvedSchema.required || []);
  const excludeSet = new Set(exclude);
  const includeSet = includeOnly ? new Set(includeOnly) : null;

  const fields: NormalizedFieldDefinition[] = [];

  for (const [key, prop] of Object.entries(properties)) {
    if (excludeSet.has(key)) continue;
    if (includeSet && !includeSet.has(key)) continue;

    const type: OpenAPISchemaType = Array.isArray(prop.type)
      ? prop.type[0] || 'string'
      : prop.type || 'string';

    const widget = inferWidgetType(prop);
    const label = prop.title || formatFallbackLabel(key);
    const isRequired = requiredFields.has(key);
    const isReadOnly = Boolean(prop.readOnly);
    const isWriteOnly = Boolean(prop.writeOnly);
    const priority: UIPriority = prop['x-ui-priority'] || 'medium';

    // Parse Enum Options
    let enumOptions: NormalizedFieldDefinition['enumOptions'];
    if (prop.enum && Array.isArray(prop.enum)) {
      const variants = prop['x-ui-variants'] || {};
      enumOptions = prop.enum.map((val) => ({
        label: String(val).charAt(0).toUpperCase() + String(val).slice(1),
        value: val,
        variant: variants[String(val)] || 'default',
      }));
    }

    const baseField: NormalizedFieldDefinition = {
      key,
      label,
      description: prop.description,
      help: prop['x-ui-help'],
      type,
      format: prop.format,
      widget,
      required: isRequired,
      readOnly: isReadOnly,
      writeOnly: isWriteOnly,
      disabled: Boolean(prop['x-ui-disabled'] || isReadOnly),
      hidden: Boolean(prop['x-ui-hidden']),
      priority,
      enumOptions,
      min: prop.minimum,
      max: prop.maximum,
      step: prop['x-ui-step'] || (type === 'integer' ? 1 : undefined),
      minLength: prop.minLength,
      maxLength: prop.maxLength,
      pattern: prop.pattern,
      prefix: prop['x-ui-prefix'],
      suffix: prop['x-ui-suffix'],
      placeholder: prop['x-ui-placeholder'],
      defaultValue: prop.default,
      colSpan: prop['x-ui-col-span'] || 12,
      pinned: prop['x-ui-pinned'],
      copyable: prop['x-ui-copyable'],
      rawSchema: prop,
    };

    // Apply Tier 4: Developer Code Overrides
    const override = overrides[key];
    if (override) {
      Object.assign(baseField, override);
    }

    fields.push(baseField);
  }

  return fields;
}
