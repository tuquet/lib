# Automated Interaction Testing with `play` Functions

Storybook's `play` function simulates user interactions (clicks, keyboard input, checkbox toggles, scrolling) and asserts DOM results in the browser using `@storybook/test`.

---

## 1. Baseline `play` Function Structure

```typescript
import { within, userEvent, expect } from '@storybook/test';

export const MyStory: Story = {
  // ... args, render ...
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('1. Verify initial mount state', async () => {
      const heading = await canvas.findByText(/Title/i);
      expect(heading).toBeInTheDocument();
    });

    await step('2. Simulate typing into search input', async () => {
      const searchInput = canvas.getByPlaceholderText(/search/i);
      await userEvent.type(searchInput, 'Keyword', { delay: 40 });
      expect(searchInput).toHaveValue('Keyword');
    });

    await step('3. Click action button and assert result', async () => {
      const submitBtn = canvas.getByRole('button', { name: /confirm/i });
      await userEvent.click(submitBtn);
      expect(await canvas.findByText(/success/i)).toBeInTheDocument();
    });
  },
};
```

---

## 2. Common Interaction Testing Scenarios

### 1. Testing Debounced Search

```typescript
await step('Interact with debounced search input', async () => {
  const searchInput = canvas.getByPlaceholderText(/filter records/i);
  await userEvent.type(searchInput, 'ORD-202603', { delay: 40 });
  expect(searchInput).toHaveValue('ORD-202603');

  // Clear input
  await userEvent.clear(searchInput);
});
```

### 2. Testing Select-All Checkbox

```typescript
await step('Toggle Select-All checkbox in header', async () => {
  const checkboxes = await canvas.findAllByRole('checkbox');
  const headerCheckbox = checkboxes[0];
  await userEvent.click(headerCheckbox);

  // Assert floating bulk action toolbar appears
  const bulkBtn = await canvas.findByText(/complete \(/i);
  expect(bulkBtn).toBeInTheDocument();

  // Click again to deselect all
  await userEvent.click(headerCheckbox);
});
```

### 3. Testing Dropdown Menu Open

```typescript
await step('Verify export button opens dropdown menu', async () => {
  const exportBtn = canvas.getByRole('button', { name: /export/i });
  expect(exportBtn).toBeInTheDocument();
  await userEvent.click(exportBtn);
});
```

### 4. Testing Inline Cell Editing

```typescript
await step('Interact with inline cell edit: Customer Name', async () => {
  const customerCell = await canvas.findByText('John Doe #1');
  expect(customerCell).toBeInTheDocument();
  await userEvent.click(customerCell);

  const cellInput = canvasElement.querySelector('input.font-mono') as HTMLInputElement | null;
  if (cellInput) {
    await userEvent.clear(cellInput);
    await userEvent.type(cellInput, 'John Doe VIP{enter}');
    expect(await canvas.findByText('John Doe VIP')).toBeInTheDocument();
    expect(await canvas.findByText(/Customer updated/i)).toBeInTheDocument();
  }
});
```

---

## 3. Key Testing Best Practices

- Wrap interaction blocks in `await step('Step name', async () => { ... })` so Storybook displays detailed step-by-step progress in the Interactions panel.
- Supply `{ delay: 40 }` to `userEvent.type()` to accurately simulate realistic human typing cadence and trigger debounce timers naturally.
