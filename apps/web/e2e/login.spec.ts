import { test, expect } from '@playwright/test';

test.describe('Login flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', 'john@example.com');
    await page.fill('#login-password', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/tickets');
  });
});
