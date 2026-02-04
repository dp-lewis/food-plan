import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import Checkbox from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: {
    checked: false,
    label: '2 cups flour',
    onChange: () => {},
  },
};

export const Checked: Story = {
  args: {
    checked: true,
    label: '2 cups flour',
    onChange: () => {},
  },
};

export const NoStrikethrough: Story = {
  args: {
    checked: true,
    label: 'Checked without strikethrough',
    onChange: () => {},
    strikethrough: false,
  },
};

export const Interactive: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        checked={checked}
        onChange={setChecked}
        label="1 lb chicken breast"
      />
    );
  },
};

export const ShoppingList: Story = {
  render: () => {
    const [items, setItems] = useState([
      { id: '1', label: '2 cups flour', checked: false },
      { id: '2', label: '1 cup sugar', checked: true },
      { id: '3', label: '3 eggs', checked: false },
      { id: '4', label: '1 cup milk', checked: true },
    ]);

    const toggle = (id: string) => {
      setItems(items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ));
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {items.map(item => (
          <Checkbox
            key={item.id}
            checked={item.checked}
            onChange={() => toggle(item.id)}
            label={item.label}
          />
        ))}
      </div>
    );
  },
};
