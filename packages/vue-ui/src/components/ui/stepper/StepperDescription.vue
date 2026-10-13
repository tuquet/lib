<script lang="ts" setup>
import type { StepperDescriptionProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"

import { StepperDescription as RekaStepperDescription, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<StepperDescriptionProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <RekaStepperDescription v-bind="forwarded" :class="cn('text-xs text-muted-foreground', props.class)">
    <slot />
  </RekaStepperDescription>
</template>
