import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import ToggleGroup from './ToggleGroup';

const meta: Meta<typeof ToggleGroup> = {
  title: 'UI/ToggleGroup',
  component: ToggleGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mealOptions = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
];

const dayOptions = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
];

export const SingleSelect: Story = {
  args: {
    label: 'Meal Type',
    options: mealOptions,
    value: 'dinner',
    onChange: () => {},
  },
};

export const MultiSelect: Story = {
  args: {
    label: 'Meals to include',
    options: mealOptions,
    value: ['breakfast', 'lunch', 'dinner'],
    onChange: () => {},
    multiple: true,
  },
};

export const CompactDays: Story = {
  args: {
    label: 'Days to plan',
    options: dayOptions,
    value: '7',
    onChange: () => {},
    variant: 'compact',
  },
};

export const InteractiveSingle: Story = {
  render: () => {
    const [value, setValue] = useState('dinner');
    return (
      <ToggleGroup
        label="Meal Type"
        options={mealOptions}
        value={value}
        onChange={(v) => setValue(v as string)}
      />
    );
  },
};

export const InteractiveMultiple: Story = {
  render: () => {
    const [values, setValues] = useState(['breakfast', 'lunch', 'dinner']);
    return (
      <ToggleGroup
        label="Meals to include"
        options={mealOptions}
        value={values}
        onChange={(v) => setValues(v as string[])}
        multiple
      />
    );
  },
};

export const InteractiveDays: Story = {
  render: () => {
    const [value, setValue] = useState('7');
    return (
      <ToggleGroup
        label="Days to plan"
        options={dayOptions}
        value={value}
        onChange={(v) => setValue(v as string)}
        variant="compact"
      />
    );
  },
};
