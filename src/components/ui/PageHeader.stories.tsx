import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import PageHeader from './PageHeader';

const meta: Meta<typeof PageHeader> = {
  title: 'UI/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    sticky: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Page Title',
  },
};

export const WithBackButton: Story = {
  args: {
    title: 'Meal Plan',
    backHref: '/',
  },
};

export const Sticky: Story = {
  args: {
    title: 'Shopping List',
    backHref: '/',
    sticky: true,
  },
};

export const WithActions: Story = {
  args: {
    title: 'Meal Plan',
    backHref: '/',
    actions: (
      <button className="p-1 rounded-md hover:bg-white/10 text-white text-sm">
        Share
      </button>
    ),
  },
};

export const WithChildren: Story = {
  args: {
    title: 'Shopping List',
    backHref: '/',
    sticky: true,
    children: (
      <div className="mt-3">
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full" style={{ width: '60%' }} />
        </div>
      </div>
    ),
  },
};
