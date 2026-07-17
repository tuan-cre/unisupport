import { test, expect } from '@playwright/test';

test.describe('Admin users page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/tickets');
  });

  test('should display admin users page with seeded users', async ({ page }) => {
    await page.goto('/admin/users');

    // Expect page title
    await expect(page).toHaveTitle(/UniSupport/);
    await expect(page).toContainText('Users');

    // Check that seeded admin user appears in table
    await expect(page).toContainText('admin@example.com');
    // The user list might contain other users; at least one entry
    await expect(page.locator('table')).toBeVisible();
  });
});
