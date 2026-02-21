import { ImageResponse } from 'next/og';
import { getMealPlanByShareCode } from '@/lib/supabase/queries';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

export default async function Image({
  params,
}: {
  params: { code: string };
}) {
  const sharedData = await getMealPlanByShareCode(params.code);

  const mealCount = sharedData?.plan.meals.length ?? 0;
  const mealText = mealCount === 1 ? '1 meal' : `${mealCount} meals`;
  const hasShoppingList =
    (sharedData?.customItems.length ?? 0) > 0 ||
    (sharedData?.recipes.length ?? 0) > 0;
  const subtitle = sharedData
    ? hasShoppingList
      ? `${mealText} planned this week · Shopping list included`
      : `${mealText} planned this week`
    : 'Weekly meal planning made simple';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#15803d',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        {/* Grocery bag icon — simple SVG */}
        <svg
          width="96"
          height="96"
          viewBox="0 0 24 24"
          fill="none"
          style={{ marginBottom: '32px' }}
        >
          <path
            d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="3"
            y1="6"
            x2="21"
            y2="6"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 10a4 4 0 01-8 0"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div
          style={{
            color: 'white',
            fontSize: '72px',
            fontWeight: '700',
            letterSpacing: '-2px',
            textAlign: 'center',
            lineHeight: '1.1',
            marginBottom: '24px',
          }}
        >
          Did we get...?
        </div>

        <div
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: '32px',
            fontWeight: '400',
            textAlign: 'center',
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
