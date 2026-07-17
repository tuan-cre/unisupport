import { test, expect } from '@playwright/test';

test.describe('Create ticket flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure logged in before each test
    await page.goto('/login');
    await page.fill('#login-email', 'john@example.com');
    await page.fill('#login-password', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/tickets');
  });

  test('should create a new ticket', async ({ page }) => {
    await page.goto('/tickets/new');

    // Fill subject and description
    await page.locator('label:has-text("Subject") + input').fill('E2E Test Ticket');
    await page
      .locator('label:has-text("Description") + textarea')
      .fill('This is a test ticket created by Playwright E2E test.');

    // Submit the form
    await page.click('button[type="submit"]');

    // Should be redirected back to tickets list
    await expect(page).toHaveURL('/tickets');

    // Check for toast success or ticket in list (simplified: check page contains ticket subject)
    await expect(page).toContainText('E2E Test Ticket');
  });
});
