<script setup lang="ts">
import {
  Badge,
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tuquet/vue-ui';
import { ListFilter, Plus, Sparkles, Trash2, X } from 'lucide-vue-next';
import { computed } from 'vue';
import {
  DATA_TYPE_OPERATORS,
  OPERATOR_METADATA,
  getOperatorMetadata,
  isRuleComplete,
} from '../helpers/filterEngine.js';
import type { FilterOperator } from '../types/core.js';
import type {
  ColumnFilterDefinition,
  DynamicFilterRule,
  FilterConjunction,
  FilterPreset,
} from '../types/filter.js';
import { useTableLocale } from '../locale/index.js';

export interface DataTableFilterBuilderProps {
  columnDefs: ColumnFilterDefinition[];
  rules: DynamicFilterRule[];
  conjunction?: FilterConjunction;
  presets?: FilterPreset[];
  showChips?: boolean;
  emptyMessage?: string;
  whereLabel?: string;
}

const props = withDefaults(defineProps<DataTableFilterBuilderProps>(), {
  conjunction: 'and',
  presets: () => [],
  showChips: true,
  emptyMessage: '',
  whereLabel: '',
});

const locale = useTableLocale();

const resolvedWhereLabel = computed(
  () => props.whereLabel || locale.value.messages.filterBuilder.where
);
const resolvedEmptyMessage = computed(
  () => props.emptyMessage || locale.value.messages.filterBuilder.emptyMessage
);


const emit = defineEmits<{
  (e: 'update:rules', rules: DynamicFilterRule[]): void;
  (e: 'update:conjunction', conjunction: FilterConjunction): void;
  (e: 'add-rule', field?: string): void;
  (e: 'remove-rule', id: string): void;
  (e: 'clear-rules'): void;
  (e: 'apply-preset', preset: FilterPreset): void;
}>();

const activeRulesCount = computed(() => {
  return props.rules.filter(isRuleComplete).length;
});

function getColumnDef(fieldId: string): ColumnFilterDefinition | undefined {
  return props.columnDefs.find((c) => c.id === fieldId);
}

function getOperatorsForField(fieldId: string): FilterOperator[] {
  const col = getColumnDef(fieldId);
  if (!col) return ['eq', 'ne'];
  return DATA_TYPE_OPERATORS[col.dataType] || ['eq', 'ne'];
}

function handleFieldChange(ruleId: string, newField: string) {
  const col = getColumnDef(newField);
  const nextRules = props.rules.map((r) => {
    if (r.id !== ruleId) return r;
    const allowedOps = col ? DATA_TYPE_OPERATORS[col.dataType] : (['eq'] as FilterOperator[]);
    const defaultOp: FilterOperator = col?.defaultOperator || allowedOps[0] || 'eq';
    return {
      ...r,
      field: newField,
      operator: defaultOp,
      value: undefined,
      valueTo: undefined,
    };
  });
  emit('update:rules', nextRules);
}

function handleOperatorChange(ruleId: string, newOp: FilterOperator) {
  const nextRules = props.rules.map((r) => {
    if (r.id !== ruleId) return r;
    return {
      ...r,
      operator: newOp,
    };
  });
  emit('update:rules', nextRules);
}

function handleValueChange(ruleId: string, val: unknown) {
  const col = getColumnDef(props.rules.find((r) => r.id === ruleId)?.field ?? '');
  let parsedVal = val;
  if (col?.dataType === 'number') {
    if (val === '' || val === null || val === undefined) {
      parsedVal = undefined;
    } else {
      const n = Number(val);
      parsedVal = Number.isNaN(n) ? val : n;
    }
  }
  const nextRules = props.rules.map((r) => {
    if (r.id !== ruleId) return r;
    return { ...r, value: parsedVal };
  });
  emit('update:rules', nextRules);
}

function handleValueToChange(ruleId: string, val: unknown) {
  const col = getColumnDef(props.rules.find((r) => r.id === ruleId)?.field ?? '');
  let parsedVal = val;
  if (col?.dataType === 'number') {
    if (val === '' || val === null || val === undefined) {
      parsedVal = undefined;
    } else {
      const n = Number(val);
      parsedVal = Number.isNaN(n) ? val : n;
    }
  }
  const nextRules = props.rules.map((r) => {
    if (r.id !== ruleId) return r;
    return { ...r, valueTo: parsedVal };
  });
  emit('update:rules', nextRules);
}

function removeRule(ruleId: string) {
  const nextRules = props.rules.filter((r) => r.id !== ruleId);
  emit('update:rules', nextRules);
  emit('remove-rule', ruleId);
}

function addRule() {
  const firstField = props.columnDefs[0]?.id || '';
  const col = getColumnDef(firstField);
  const allowedOps = (col && col.dataType && DATA_TYPE_OPERATORS[col.dataType]) ? DATA_TYPE_OPERATORS[col.dataType] : (['eq'] as FilterOperator[]);
  const defaultOp: FilterOperator = col?.defaultOperator || allowedOps[0] || 'eq';
  const newRule: DynamicFilterRule = {
    id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    field: firstField,
    operator: defaultOp,
    value: undefined,
  };
  emit('update:rules', [...props.rules, newRule]);
  emit('add-rule', firstField);
}

function clearAll() {
  emit('update:rules', []);
  emit('clear-rules');
}

const isVi = computed(() => locale.value.code.startsWith('vi'));
const removeRuleLabel = computed(() => (isVi.value ? 'Gỡ bỏ điều kiện' : 'Remove rule'));

function getOperatorInfo(op: FilterOperator) {
  return getOperatorMetadata(op, isVi.value ? 'vi' : 'en');
}

function getRuleChipLabel(rule: DynamicFilterRule): string {
  const col = getColumnDef(rule.field);
  const colName = col?.label || rule.field;
  const opMeta = getOperatorInfo(rule.operator);
  const opLabel = opMeta?.label || rule.operator;

  if (opMeta && !opMeta.requiresValue) {
    return `${colName}: ${opLabel}`;
  }
  if (rule.operator === 'between') {
    const fromWord = locale.value.messages.filterBuilder.betweenFrom.toLowerCase();
    const toWord = locale.value.messages.filterBuilder.betweenTo.toLowerCase();
    return `${colName} ${fromWord} ${rule.value ?? '...'} ${toWord} ${rule.valueTo ?? '...'}`;
  }
  let displayVal = rule.value;
  if (col?.options) {
    const matchedOpt = col.options.find((o) => String(o.value) === String(rule.value));
    if (matchedOpt) {
      displayVal = matchedOpt.label;
    }
  }
  return `${colName} ${opMeta?.symbol || opLabel} "${displayVal}"`;
}

function getOptionLabel(fieldId: string, val: unknown): string {
  const col = getColumnDef(fieldId);
  if (!col?.options) return String(val ?? '');
  const opt = col.options.find((o) => String(o.value) === String(val));
  return opt ? opt.label : String(val ?? '');
}

function onInteractOutside(e: any) {
  const original = e?.detail?.originalEvent || e;
  const target = (original?.target || e?.target) as HTMLElement | null;
  if (
    target?.closest?.(
      '[data-reka-popper-content-wrapper], [role="listbox"], [data-radix-popper-content-wrapper], [role="option"], [data-reka-select-content], [data-radix-select-content], [data-reka-collection-item]'
    )
  ) {
    e?.preventDefault?.();
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <!-- Popover Filter Builder Trigger -->
    <Popover>
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          size="sm"
          class="h-8 border-dashed gap-1.5"
          :class="{ 'border-primary bg-primary/5 text-primary font-medium': activeRulesCount > 0 }"
        >
          <ListFilter class="h-3.5 w-3.5" />
          <span>{{ locale.messages.filterBuilder.title }}</span>
          <Badge
            v-if="activeRulesCount > 0"
            variant="secondary"
            class="ml-1 h-5 px-1.5 text-[10px] font-mono rounded-full"
          >
            {{ activeRulesCount }}
          </Badge>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        class="w-[calc(100vw-1.5rem)] sm:w-[580px] max-w-[620px] p-3 sm:p-4 shadow-xl"
        @pointer-down-outside="onInteractOutside"
        @focus-outside="onInteractOutside"
        @interact-outside="onInteractOutside"
      >
        <!-- Panel Header -->
        <div class="flex items-center justify-between border-b pb-3 mb-3">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-foreground">{{ locale.messages.filterBuilder.title }}</span>
            <!-- Conjunction Toggle (AND / OR) -->
            <div class="flex items-center bg-muted p-0.5 rounded text-xs">
              <button
                type="button"
                class="px-2 py-0.5 rounded font-medium transition-colors"
                :class="conjunction === 'and' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'"
                @click="emit('update:conjunction', 'and')"
              >
                {{ locale.messages.filterBuilder.and }}
              </button>
              <button
                type="button"
                class="px-2 py-0.5 rounded font-medium transition-colors"
                :class="conjunction === 'or' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'"
                @click="emit('update:conjunction', 'or')"
              >
                {{ locale.messages.filterBuilder.or }}
              </button>
            </div>
          </div>

          <!-- Presets Selector -->
          <div v-if="presets && presets.length > 0" class="flex items-center gap-1">
            <Select @update:model-value="(val) => {
              const p = presets.find(pr => pr.id === val);
              if (p) emit('apply-preset', p);
            }">
              <SelectTrigger class="h-7 text-xs border-dashed gap-1">
                <Sparkles class="h-3 w-3 text-amber-500" />
                <SelectValue :placeholder="locale.messages.filterBuilder.presetsTitle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="preset in presets"
                  :key="preset.id"
                  :value="preset.id"
                  class="text-xs"
                >
                  {{ preset.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Rules List -->
        <div class="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
          <div
            v-if="rules.length === 0"
            class="text-center py-6 text-xs text-muted-foreground"
          >
            {{ resolvedEmptyMessage }}
          </div>

          <div
            v-for="(rule, index) in rules"
            :key="rule.id"
            class="flex flex-col sm:flex-row sm:items-center gap-2 group/row rounded-md bg-muted/40 p-2 sm:p-2.5 border border-border/50 text-xs"
          >
            <!-- Top Controls: Where/And + Field + Operator + Mobile Trash (Mobile Line 1, Desktop Inline Left) -->
            <div class="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <!-- Conjunction Label for row 2+ -->
              <span
                class="font-mono text-[10px] uppercase font-bold text-primary w-8 shrink-0 text-center"
              >
                {{ index > 0 ? (conjunction === 'or' ? locale.messages.filterBuilder.or : locale.messages.filterBuilder.and) : resolvedWhereLabel }}
              </span>

              <!-- Field Selector -->
              <Select
                :model-value="rule.field"
                @update:model-value="(val) => handleFieldChange(rule.id, String(val))"
              >
                <SelectTrigger class="h-7 flex-1 sm:w-[130px] sm:flex-none text-xs bg-background">
                  <SelectValue :placeholder="locale.messages.filterBuilder.where">
                    {{ getColumnDef(rule.field)?.label || rule.field || locale.messages.filterBuilder.where }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="col in columnDefs"
                    :key="col.id"
                    :value="col.id"
                    class="text-xs"
                  >
                    {{ col.label }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <!-- Operator Selector -->
              <Select
                :model-value="rule.operator"
                @update:model-value="(val) => handleOperatorChange(rule.id, val as FilterOperator)"
              >
                <SelectTrigger class="h-7 flex-1 sm:w-[135px] sm:flex-none text-xs bg-background">
                  <SelectValue :placeholder="locale.messages.filterBuilder.and">
                    {{ getOperatorInfo(rule.operator)?.label || rule.operator }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="op in getOperatorsForField(rule.field)"
                    :key="op"
                    :value="op"
                    class="text-xs"
                  >
                    {{ getOperatorInfo(op)?.label || op }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <!-- Mobile Trash button (visible only on mobile) -->
              <button
                type="button"
                class="h-7 w-7 sm:hidden inline-flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                :title="removeRuleLabel"
                :aria-label="removeRuleLabel"
                @click="removeRule(rule.id)"
              >
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>

            <!-- Value Input (Dòng value: Mobile Line 2 taking 100% width, Desktop flex-1 min-w-[140px]) -->
            <div class="flex-1 flex items-center gap-1.5 min-w-0 w-full sm:w-auto">
              <!-- Empty or Boolean Operators (no value input required) -->
              <template v-if="OPERATOR_METADATA[rule.operator]?.requiresValue === false">
                <span class="text-[11px] text-muted-foreground italic px-2 py-1 bg-muted/50 rounded w-full sm:w-auto text-center sm:text-left">
                  {{ locale.messages.filterBuilder.noValueNeeded }}
                </span>
              </template>

              <!-- Between Operator (Two inputs) -->
              <template v-else-if="rule.operator === 'between'">
                <Input
                  :model-value="rule.value !== undefined ? String(rule.value) : ''"
                  :type="getColumnDef(rule.field)?.dataType === 'date' ? 'date' : 'number'"
                  :placeholder="locale.messages.filterBuilder.betweenFrom"
                  class="h-7 px-2 py-0 text-xs bg-background flex-1 w-full"
                  @update:model-value="(val) => handleValueChange(rule.id, val)"
                />
                <span class="text-muted-foreground text-xs shrink-0">-</span>
                <Input
                  :model-value="rule.valueTo !== undefined ? String(rule.valueTo) : ''"
                  :type="getColumnDef(rule.field)?.dataType === 'date' ? 'date' : 'number'"
                  :placeholder="locale.messages.filterBuilder.betweenTo"
                  class="h-7 px-2 py-0 text-xs bg-background flex-1 w-full"
                  @update:model-value="(val) => handleValueToChange(rule.id, val)"
                />
              </template>

              <!-- Select / Enum with Options (only for single selection operators 'is', 'isNot', 'eq', 'ne') -->
              <template v-else-if="getColumnDef(rule.field)?.dataType === 'select' && getColumnDef(rule.field)?.options && ['is', 'isNot', 'eq', 'ne'].includes(rule.operator)">
                <Select
                  :model-value="rule.value !== undefined ? String(rule.value) : undefined"
                  @update:model-value="(val) => handleValueChange(rule.id, String(val))"
                >
                  <SelectTrigger class="h-7 w-full text-xs bg-background px-2 py-0">
                    <SelectValue :placeholder="locale.messages.filterBuilder.selectPlaceholder">
                      <template v-if="rule.value !== undefined">
                        {{ getOptionLabel(rule.field, rule.value) }}
                      </template>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="opt in getColumnDef(rule.field)?.options"
                      :key="String(opt.value)"
                      :value="String(opt.value)"
                      class="text-xs"
                    >
                      {{ opt.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </template>

              <!-- Standard Number / Date / Text / Free-form Input -->
              <template v-else>
                <Input
                  :model-value="rule.value !== undefined ? String(rule.value) : ''"
                  :type="getColumnDef(rule.field)?.dataType === 'number' ? 'number' : getColumnDef(rule.field)?.dataType === 'date' ? 'date' : 'text'"
                  :placeholder="getColumnDef(rule.field)?.placeholder || locale.messages.filterBuilder.valuePlaceholder || (isVi ? 'Nhập giá trị...' : 'Enter value...')"
                  class="h-7 px-2 py-0 text-xs bg-background w-full"
                  @update:model-value="(val) => handleValueChange(rule.id, val)"
                />
              </template>
            </div>

            <!-- Desktop Trash button (visible only on sm and up) -->
            <button
              type="button"
              class="h-7 w-7 hidden sm:inline-flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
              :title="removeRuleLabel"
              :aria-label="removeRuleLabel"
              @click="removeRule(rule.id)"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <!-- Panel Footer -->
        <div class="flex items-center justify-between border-t pt-3 mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            class="h-7 text-xs gap-1"
            @click="addRule"
          >
            <Plus class="h-3 w-3" />
            <span>{{ locale.messages.filterBuilder.addRule }}</span>
          </Button>

          <Button
            v-if="rules.length > 0"
            type="button"
            variant="ghost"
            size="sm"
            class="h-7 text-xs text-muted-foreground hover:text-destructive"
            @click="clearAll"
          >
            {{ locale.messages.filterBuilder.clearAll }}
          </Button>
        </div>
      </PopoverContent>
    </Popover>

    <!-- Active Filter Chips (Inline row) -->
    <template v-if="showChips && rules.length > 0">
      <div class="flex flex-wrap items-center gap-1.5">
        <template v-for="rule in rules" :key="`chip-${rule.id}`">
          <Badge
            v-if="isRuleComplete(rule)"
            variant="secondary"
            class="h-7 text-xs pl-2 pr-1 gap-1 font-normal bg-muted/80 hover:bg-muted border border-border"
          >
            <span>{{ getRuleChipLabel(rule) }}</span>
            <button
              type="button"
              class="h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-muted-foreground/20"
              :title="removeRuleLabel"
              :aria-label="removeRuleLabel"
              @click="removeRule(rule.id)"
            >
              <X class="h-3 w-3" />
            </button>
          </Badge>
        </template>
      </div>
    </template>
  </div>
</template>
