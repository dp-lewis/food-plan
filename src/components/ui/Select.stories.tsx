import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Select from './Select';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
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

const mealTypeOptions = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
];

const categoryOptions = [
  { value: 'produce', label: 'Produce' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'meat', label: 'Meat' },
  { value: 'pantry', label: 'Pantry' },
  { value: 'frozen', label: 'Frozen' },
];

export const Default: Story = {
  args: {
    options: mealTypeOptions,
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Meal Type',
    options: mealTypeOptions,
  },
};

export const Categories: Story = {
  args: {
    label: 'Category',
    options: categoryOptions,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Select',
    options: mealTypeOptions,
    disabled: true,
  },
};
