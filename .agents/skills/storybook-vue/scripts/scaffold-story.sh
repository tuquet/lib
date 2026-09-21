#!/usr/bin/env bash
set -euo pipefail

# Helper script to scaffold a new CSF3 Storybook story for a Vue 3 component.
# Usage: ./scaffold-story.sh <ComponentName> <PathToComponent>

COMPONENT_NAME="${1:-}"
TARGET_PATH="${2:-}"

if [[ -z "$COMPONENT_NAME" || -z "$TARGET_PATH" ]]; then
  echo "Usage: $0 <ComponentName> <PathToComponent>"
  echo "Example: $0 MyButton packages/vue-ui/src/components/MyButton.vue"
  exit 1
fi

STORY_FILE="${TARGET_PATH%.vue}.stories.ts"

if [[ -f "$STORY_FILE" ]]; then
  echo "Story file already exists at: $STORY_FILE"
  exit 0
fi

cat <<EOF > "$STORY_FILE"
import type { Meta, StoryObj } from '@storybook/vue3';
import ${COMPONENT_NAME} from './${COMPONENT_NAME}.vue';

const meta: Meta<typeof ${COMPONENT_NAME}> = {
  title: 'Components/${COMPONENT_NAME}',
  component: ${COMPONENT_NAME},
  tags: ['autodocs'],
  argTypes: {},
  args: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { ${COMPONENT_NAME} },
    setup() {
      return { args };
    },
    template: '<${COMPONENT_NAME} v-bind="args" />',
  }),
};
EOF

echo "Scaffolded CSF3 story at: $STORY_FILE"
