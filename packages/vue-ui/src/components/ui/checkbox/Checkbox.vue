<script setup lang="ts">
import type { CheckboxRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { computed } from "vue"
import { Check, Minus } from "lucide-vue-next"
import { CheckboxIndicator, CheckboxRoot } from "reka-ui"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends /* @vue-ignore */ CheckboxRootProps {
  class?: HTMLAttributes["class"]
  checked?: boolean | 'indeterminate'
  modelValue?: boolean | 'indeterminate'
}

export type CheckboxEmits = {
  'update:modelValue': [value: boolean | 'indeterminate']
  'update:checked': [value: boolean | 'indeterminate']
}

const props = defineProps<CheckboxProps>()
const emits = defineEmits<CheckboxEmits>()

const computedModelValue = computed(() => {
  if (props.modelValue !== undefined) return props.modelValue
  if (props.checked !== undefined) return props.checked
  return undefined
})

function onModelValueChange(val: boolean | 'indeterminate') {
  emits('update:modelValue', val)
  emits('update:checked', val)
}
</script>

<template>
  <CheckboxRoot
    :model-value="computedModelValue"
    :disabled="props.disabled"
    :name="props.name"
    :required="props.required"
    :as="props.as"
    :as-child="props.asChild"
    :id="props.id"
    :value="props.value"
    :class="
      cn('grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
         props.class)"
    @update:model-value="onModelValueChange"
  >
    <CheckboxIndicator class="grid place-content-center text-current">
      <slot>
        <Minus v-if="computedModelValue === 'indeterminate'" class="h-3 w-3 stroke-[3]" />
        <Check v-else class="h-4 w-4" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
