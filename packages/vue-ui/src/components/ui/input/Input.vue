<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { ref, watch } from "vue"
import { cn } from "@/lib/utils"

defineOptions({
  inheritAttrs: true,
})

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes["class"]
}>()

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void
}>()

const innerValue = ref<string | number>(props.modelValue ?? props.defaultValue ?? "")

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined && val !== innerValue.value) {
      innerValue.value = val
    }
  }
)

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  innerValue.value = target.value
  emits("update:modelValue", target.value)
}
</script>

<template>
  <input
    :value="innerValue"
    :class="cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-foreground file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', props.class)"
    @input="handleInput"
  >
</template>

