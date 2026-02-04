import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import MetaChip from './MetaChip';

const meta: Meta<typeof MetaChip> = {
  title: 'UI/MetaChip',
  component: MetaChip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Total time',
    value: '30 mins',
  },
};

export const Servings: Story = {
  args: {
    label: 'Servings',
    value: 4,
  },
};

export const Difficulty: Story = {
  args: {
    label: 'Difficulty',
    value: 'Easy',
  },
};

export const Cost: Story = {
  args: {
    label: 'Cost',
    value: 'Budget',
  },
};

export const MealType: Story = {
  args: {
    label: 'Meal type',
    value: 'Dinner',
  },
};

export const RecipeMetaGroup: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <MetaChip label="Total time" value="45 mins" />
      <MetaChip label="Servings" value={4} />
      <MetaChip label="Difficulty" value="Medium" />
      <MetaChip label="Cost" value="Moderate" />
    </div>
  ),
};
