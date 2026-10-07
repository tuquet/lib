import type { Component } from 'vue';
import type { NormalizedFieldDefinition, UIWidgetType } from '@/schema/types.js';

import WidgetText from './widgets/WidgetText.vue';
import WidgetNumber from './widgets/WidgetNumber.vue';
import WidgetPillBadges from './widgets/WidgetPillBadges.vue';
import WidgetSlider from './widgets/WidgetSlider.vue';
import WidgetSwitch from './widgets/WidgetSwitch.vue';
import WidgetCurrency from './widgets/WidgetCurrency.vue';
import WidgetDate from './widgets/WidgetDate.vue';

export type WidgetComponentMap = Record<UIWidgetType, Component>;

export const defaultWidgetRegistry: WidgetComponentMap = {
  text: WidgetText,
  password: WidgetText,
  textarea: WidgetText,
  number: WidgetNumber,
  stepper: WidgetNumber,
  slider: WidgetSlider,
  'pill-badges': WidgetPillBadges,
  select: WidgetPillBadges,
  switch: WidgetSwitch,
  currency: WidgetCurrency,
  date: WidgetDate,
};

/**
 * Resolve the appropriate Vue Component for a given field definition
 */
export function resolveWidget(
  field: NormalizedFieldDefinition,
  customRegistry?: Partial<WidgetComponentMap>
): Component {
  if (customRegistry && customRegistry[field.widget]) {
    return customRegistry[field.widget]!;
  }
  return defaultWidgetRegistry[field.widget] || WidgetText;
}
