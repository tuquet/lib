/**
 * OpenAPI 3.0 & 3.1 JSON Schema Specification Types
 * Includes official schema properties and enterprise x-ui-* vendor extensions.
 */

export type OpenAPISchemaType =
  'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';

export type UIWidgetType =
  | 'text'
  | 'number'
  | 'slider'
  | 'stepper'
  | 'pill-badges'
  | 'select'
  | 'currency'
  | 'switch'
  | 'date'
  | 'textarea'
  | 'password';

export type UIPriority = 'high' | 'medium' | 'low';

export interface OpenAPIVendorExtensions {
  /** Specify custom widget representation */
  'x-ui-widget'?: UIWidgetType;
  /** Responsive display priority for mobile column collapsing */
  'x-ui-priority'?: UIPriority;
  /** Badge variants mapping for enum keys */
  'x-ui-variants'?: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'>;
  /** Pin column in data tables */
  'x-ui-pinned'?: 'left' | 'right' | false;
  /** Enable 1-click copy for this field */
  'x-ui-copyable'?: boolean;
  /** Prefix adornment (e.g. '$') */
  'x-ui-prefix'?: string;
  /** Suffix adornment (e.g. '%') */
  'x-ui-suffix'?: string;
  /** Stepper/slider step value */
  'x-ui-step'?: number;
  /** Input placeholder */
  'x-ui-placeholder'?: string;
  /** Disabled in form */
  'x-ui-disabled'?: boolean;
  /** Hidden from form */
  'x-ui-hidden'?: boolean;
  /** Responsive column span in 12-col grid (1 to 12) */
  'x-ui-col-span'?: number;
  /** Custom table column width in pixels */
  'x-ui-width'?: number;
  /** Custom help text */
  'x-ui-help'?: string;
}

export interface OpenAPIPropertySchema extends OpenAPIVendorExtensions {
  type?: OpenAPISchemaType | OpenAPISchemaType[];
  title?: string;
  description?: string;
  format?: string;
  enum?: (string | number | boolean)[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  multipleOf?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
  nullable?: boolean;
  items?: OpenAPIPropertySchema;
  properties?: Record<string, OpenAPIPropertySchema>;
  required?: string[];
  allOf?: OpenAPIPropertySchema[];
  oneOf?: OpenAPIPropertySchema[];
  anyOf?: OpenAPIPropertySchema[];
  not?: OpenAPIPropertySchema;
  $ref?: string;
}

export interface OpenAPISchema extends OpenAPIPropertySchema {
  type?: 'object';
  properties?: Record<string, OpenAPIPropertySchema>;
  required?: string[];
}

/**
 * Normalized UI Field Definition
 * Unified interface used by DynamicForm and Data Grid
 */
export interface NormalizedFieldDefinition {
  key: string;
  label: string;
  description?: string;
  help?: string;
  type: OpenAPISchemaType;
  format?: string;
  widget: UIWidgetType;
  required: boolean;
  readOnly: boolean;
  writeOnly: boolean;
  disabled: boolean;
  hidden: boolean;
  priority: UIPriority;
  enumOptions?: Array<{
    label: string;
    value: string | number | boolean;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  }>;
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  defaultValue?: unknown;
  colSpan?: number;
  pinned?: 'left' | 'right' | false;
  copyable?: boolean;
  rawSchema: OpenAPIPropertySchema;
}

/**
 * Custom field overrides provided by developer in code
 */
export type FieldOverrideConfig = Partial<Omit<NormalizedFieldDefinition, 'key' | 'rawSchema'>> & {
  validate?: (value: unknown, record: Record<string, unknown>) => string | null | undefined;
};

export type FieldOverridesMap = Record<string, FieldOverrideConfig>;
