import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import BottomNav from './BottomNav';

const meta: Meta<typeof BottomNav> = {
  title: 'UI/BottomNav',
  component: BottomNav,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const HomePage: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/',
      },
    },
  },
};

export const PlanPage: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/plan/current',
      },
    },
  },
  args: {
    onTodayClick: () => alert('Today clicked'),
  },
};

export const ShoppingPage: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/shopping-list',
      },
    },
  },
  args: {
    onAddItemClick: () => alert('Add item clicked'),
  },
};

export const RecipesPage: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/recipes',
      },
    },
  },
  args: {
    onImportClick: () => alert('Import clicked'),
  },
};
