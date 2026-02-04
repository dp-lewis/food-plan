import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import Stepper from './Stepper';

const meta: Meta<typeof Stepper> = {
  title: 'UI/Stepper',
  component: Stepper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 4,
    onChange: () => {},
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Number of people',
    value: 4,
    onChange: () => {},
  },
};

export const WithMinMax: Story = {
  args: {
    label: 'Servings',
    value: 1,
    min: 1,
    max: 12,
    onChange: () => {},
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState(4);
    return (
      <Stepper
        label="Number of people"
        value={value}
        onChange={setValue}
        min={1}
        max={12}
      />
    );
  },
};

export const AtMinimum: Story = {
  args: {
    label: 'At minimum',
    value: 1,
    min: 1,
    max: 10,
    onChange: () => {},
  },
};

export const AtMaximum: Story = {
  args: {
    label: 'At maximum',
    value: 10,
    min: 1,
    max: 10,
    onChange: () => {},
  },
};
