import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Drawer from './Drawer';
import Button from './Button';

const meta: Meta<typeof Drawer> = {
  title: 'UI/Drawer',
  component: Drawer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    title: 'Drawer Title',
    children: (
      <div style={{ padding: '1rem 0' }}>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          This is the drawer content. You can put anything here.
        </p>
        <Button variant="primary">Take Action</Button>
      </div>
    ),
    onClose: () => {},
  },
};

export const WithList: Story = {
  args: {
    isOpen: true,
    title: 'Select an Option',
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((option) => (
          <button
            key={option}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'var(--border-width) solid var(--color-border)',
              backgroundColor: 'var(--color-bg-primary)',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: 'var(--font-size-body)',
              color: 'var(--color-text-primary)',
            }}
          >
            {option}
          </button>
        ))}
      </div>
    ),
    onClose: () => {},
  },
};

export const Interactive: Story = {
  render: function InteractiveDrawer() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div style={{ padding: '2rem' }}>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Open Drawer
        </Button>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Interactive Drawer"
        >
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Click the backdrop, press Escape, or click the close button to close this drawer.
          </p>
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Close Drawer
          </Button>
        </Drawer>
      </div>
    );
  },
};

export const LongContent: Story = {
  args: {
    isOpen: true,
    title: 'Scrollable Content',
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-bg-tertiary)',
            }}
          >
            <p style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
              Item {i + 1}
            </p>
            <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>
              Description for item {i + 1}
            </p>
          </div>
        ))}
      </div>
    ),
    onClose: () => {},
  },
};
