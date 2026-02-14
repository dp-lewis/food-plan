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

/**
 * Demonstrates the Floating Action Button (FAB) design in action.
 * The FAB is positioned above the navigation bar, providing a prominent
 * action button while keeping navigation tabs cleanly laid out.
 */
export const WithFAB: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/shopping-list',
      },
    },
  },
  args: {
    onAddItemClick: () => alert('FAB clicked - Add item'),
  },
  render: (args) => (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Shopping List</h1>
        <p className="text-muted-foreground mb-4">
          Notice the circular Floating Action Button (FAB) positioned above the navigation bar.
          This design provides better usability on iPhone by:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>Avoiding corner cutoffs on curved iPhone displays</li>
          <li>Providing a prominent, easy-to-reach primary action</li>
          <li>Following Material Design FAB patterns</li>
          <li>Keeping navigation tabs cleanly separated and centered</li>
        </ul>
      </div>
      <BottomNav {...args} />
    </div>
  ),
};
