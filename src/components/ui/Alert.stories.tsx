import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Alert from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
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

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'Failed to load recipe. Please check the URL and try again.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Recipe saved successfully!',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Some ingredients could not be categorized automatically.',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Tip: You can import recipes from most popular cooking websites.',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Alert variant="error">This is an error message</Alert>
      <Alert variant="success">This is a success message</Alert>
      <Alert variant="warning">This is a warning message</Alert>
      <Alert variant="info">This is an info message</Alert>
    </div>
  ),
};
