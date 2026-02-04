import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import EmptyState from './EmptyState';
import Button from './Button';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '400px', border: '1px dashed #ccc', borderRadius: '8px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'No items found',
    description: 'Try adjusting your search or filters.',
  },
};

export const WithIcon: Story = {
  args: {
    icon: '📖',
    title: 'No recipes yet',
    description: 'Add your own recipes or import from your favourite food websites.',
  },
};

export const WithAction: Story = {
  args: {
    icon: '🍽️',
    title: 'Plan your meals for the week',
    description: 'Generate a weekly meal plan, get recipes, and create a shopping list.',
    action: <Button variant="primary">Create Your First Plan</Button>,
  },
};

export const NoRecipes: Story = {
  args: {
    icon: '📖',
    title: 'No recipes yet',
    description: 'Add your own recipes or import from your favourite food websites.',
    action: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Button variant="primary">Import from URL</Button>
        <Button variant="secondary">Create Your Own Recipe</Button>
      </div>
    ),
  },
};

export const NoPlan: Story = {
  args: {
    icon: '📅',
    title: 'No meal plan found',
    description: 'Create a meal plan to get started.',
    action: <Button variant="primary">Create Meal Plan</Button>,
  },
};
