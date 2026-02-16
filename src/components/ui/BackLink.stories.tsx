import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import BackLink from './BackLink';

const meta: Meta<typeof BackLink> = {
  title: 'UI/BackLink',
  component: BackLink,
  parameters: {
    layout: 'centered',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/test',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    href: '/',
  },
};

export const CustomText: Story = {
  args: {
    href: '/recipes',
    children: 'Back to My Recipes',
  },
};

export const ToDashboard: Story = {
  args: {
    href: '/',
    children: 'Back to Dashboard',
  },
};
