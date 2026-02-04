import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ProgressBar from './ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  title: 'UI/ProgressBar',
  component: ProgressBar,
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

export const Empty: Story = {
  args: {
    value: 0,
    max: 10,
  },
};

export const Partial: Story = {
  args: {
    value: 4,
    max: 10,
  },
};

export const Complete: Story = {
  args: {
    value: 10,
    max: 10,
  },
};

export const WithLabel: Story = {
  args: {
    value: 7,
    max: 15,
    showLabel: true,
  },
};

export const ShoppingListProgress: Story = {
  args: {
    value: 12,
    max: 24,
    showLabel: true,
  },
};

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>0% Complete</p>
        <ProgressBar value={0} max={10} />
      </div>
      <div>
        <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>25% Complete</p>
        <ProgressBar value={25} max={100} />
      </div>
      <div>
        <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>50% Complete</p>
        <ProgressBar value={5} max={10} />
      </div>
      <div>
        <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>75% Complete</p>
        <ProgressBar value={75} max={100} />
      </div>
      <div>
        <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>100% Complete</p>
        <ProgressBar value={10} max={10} />
      </div>
    </div>
  ),
};
