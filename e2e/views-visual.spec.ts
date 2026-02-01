import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for report View components.
 * Tests each view in both radar (dark) and swiss (light) themes.
 *
 * Run: npx playwright test
 * Update snapshots: npx playwright test --update-snapshots
 */

const views = [
  'overview',
  'findings',
  'sources',
  'analysis',
  'entities',
  'perspectives',
] as const;

const themes = ['radar', 'swiss'] as const;

test.describe('View Components Visual Regression', () => {
  for (const view of views) {
    for (const theme of themes) {
      test(`${view} view renders correctly in ${theme} theme`, async ({ page }) => {
        // Navigate to the test page with view and theme parameters
        await page.goto(`/test/views?view=${view}&theme=${theme}`);

        // Wait for the view to fully render
        await page.waitForSelector('[data-testid="view-container"]', {
          state: 'visible',
          timeout: 10000,
        });

        // Wait for any animations to complete
        await page.waitForTimeout(500);

        // Take a screenshot and compare against baseline
        await expect(page.locator('[data-testid="view-container"]')).toHaveScreenshot(
          `${view}-${theme}.png`,
          {
            animations: 'disabled',
            mask: [
              // Mask any dynamic content like timestamps
              page.locator('[data-testid="timestamp"]'),
            ],
          }
        );
      });
    }
  }

  test.describe('Theme switching', () => {
    test('view maintains layout when switching themes', async ({ page }) => {
      // Start with radar theme
      await page.goto('/test/views?view=overview&theme=radar');
      await page.waitForSelector('[data-testid="view-container"]');
      await page.waitForTimeout(300);

      const radarBoundingBox = await page.locator('[data-testid="view-container"]').boundingBox();

      // Switch to swiss theme
      await page.goto('/test/views?view=overview&theme=swiss');
      await page.waitForSelector('[data-testid="view-container"]');
      await page.waitForTimeout(300);

      const swissBoundingBox = await page.locator('[data-testid="view-container"]').boundingBox();

      // Layout dimensions should be similar (within 10px tolerance)
      expect(radarBoundingBox).toBeTruthy();
      expect(swissBoundingBox).toBeTruthy();
      if (radarBoundingBox && swissBoundingBox) {
        expect(Math.abs(radarBoundingBox.width - swissBoundingBox.width)).toBeLessThan(10);
        expect(Math.abs(radarBoundingBox.height - swissBoundingBox.height)).toBeLessThan(50);
      }
    });
  });

  test.describe('Responsive views', () => {
    test('views render correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/test/views?view=findings&theme=swiss');
      await page.waitForSelector('[data-testid="view-container"]');
      await page.waitForTimeout(300);

      await expect(page.locator('[data-testid="view-container"]')).toHaveScreenshot(
        'findings-swiss-mobile.png',
        { animations: 'disabled' }
      );
    });

    test('views render correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/test/views?view=entities&theme=radar');
      await page.waitForSelector('[data-testid="view-container"]');
      await page.waitForTimeout(300);

      await expect(page.locator('[data-testid="view-container"]')).toHaveScreenshot(
        'entities-radar-tablet.png',
        { animations: 'disabled' }
      );
    });
  });
});
