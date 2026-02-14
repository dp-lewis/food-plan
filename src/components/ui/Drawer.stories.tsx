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
      <div className="py-4">
        <p className="text-muted-foreground mb-4">
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
      <div className="flex flex-col gap-2">
        {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((option) => (
          <button
            key={option}
            className="py-3 px-4 rounded-md border border-border bg-background text-left cursor-pointer text-base text-foreground"
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
      <div className="p-8">
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Open Drawer
        </Button>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Interactive Drawer"
        >
          <p className="text-muted-foreground mb-4">
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
      <div className="flex flex-col gap-3">
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="p-4 rounded-md bg-muted"
          >
            <p className="font-semibold text-foreground">
              Item {i + 1}
            </p>
            <p className="text-sm text-muted-foreground">
              Description for item {i + 1}
            </p>
          </div>
        ))}
      </div>
    ),
    onClose: () => {},
  },
};
