<script setup lang="ts">
import type { DropdownMenuCheckboxItemProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { computed } from "vue"
import { Check } from "lucide-vue-next"
import {
  DropdownMenuCheckboxItem,
  DropdownMenuItemIndicator,
} from "reka-ui"
import { cn } from "@/lib/utils"

export interface CustomDropdownMenuCheckboxItemProps extends /* @vue-ignore */ DropdownMenuCheckboxItemProps {
  class?: HTMLAttributes["class"]
  checked?: boolean | 'indeterminate'
  modelValue?: boolean | 'indeterminate'
}

export type CustomDropdownMenuCheckboxItemEmits = {
  'update:modelValue': [value: boolean | 'indeterminate']
  'update:checked': [value: boolean | 'indeterminate']
  select: [event: Event]
}

const props = defineProps<CustomDropdownMenuCheckboxItemProps>()
const emits = defineEmits<CustomDropdownMenuCheckboxItemEmits>()

const computedModelValue = computed(() => {
  if (props.modelValue !== undefined) return props.modelValue
  if (props.checked !== undefined) return props.checked
  return false
})

function onModelValueChange(val: boolean | 'indeterminate') {
  emits('update:modelValue', val)
  emits('update:checked', val)
}
</script>

<template>
  <DropdownMenuCheckboxItem
    :model-value="computedModelValue"
    :disabled="props.disabled"
    :text-value="props.textValue"
    :as="props.as"
    :as-child="props.asChild"
    :class="cn(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      props.class,
    )"
    @update:model-value="onModelValueChange"
    @select="(e: Event) => emits('select', e)"
  >
    <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuItemIndicator>
        <Check class="w-4 h-4" />
      </DropdownMenuItemIndicator>
    </span>
    <slot />
  </DropdownMenuCheckboxItem>
</template>
