import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Card from './Card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light-gray',
      values: [{ name: 'light-gray', value: '#f5f5f5' }],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated'],
    },
    padding: {
      control: 'select',
      options: ['none', 'default', 'large'],
    },
  },
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

export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>Card Title</h3>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          This is some card content.
        </p>
      </div>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <div>
        <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>Elevated Card</h3>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          This card has a shadow instead of a border.
        </p>
      </div>
    ),
  },
};

export const NoPadding: Story = {
  args: {
    padding: 'none',
    children: (
      <div style={{ padding: 'var(--space-4)' }}>
        Content with custom padding
      </div>
    ),
  },
};

export const LargePadding: Story = {
  args: {
    padding: 'large',
    children: 'Card with large padding',
  },
};
