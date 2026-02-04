import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Input from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'number', 'url', 'email'],
    },
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

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'you@example.com',
  },
};

export const WithError: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    error: 'Username is required',
  },
};

export const NumberInput: Story = {
  args: {
    label: 'Prep Time (mins)',
    type: 'number',
    placeholder: '15',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    disabled: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Input placeholder="Default input" />
      <Input label="With Label" placeholder="Enter value" />
      <Input label="With Error" error="This field is required" />
      <Input label="Number" type="number" placeholder="0" />
    </div>
  ),
};
