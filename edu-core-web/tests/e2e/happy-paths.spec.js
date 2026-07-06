import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully', async ({ page }) => {
    // Note: This assumes a seeded database or a mock API
    await page.goto('/login');

    // Check if we are on the login page
    await expect(page).toHaveURL(/.*login/);

    // Fill login form
    await page.fill('input[type="email"]', 'admin@rakanacademy.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should be redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('لوحة التحكم');
  });
});

test.describe('Student Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@rakanacademy.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should list students', async ({ page }) => {
    await page.goto('/students');
    await expect(page.locator('h1')).toContainText('الطلاب');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should open create student dialog', async ({ page }) => {
    await page.goto('/students');
    await page.click('button:has-text("إضافة طالب")');
    await expect(page.locator('role=dialog')).toBeVisible();
    await expect(page.locator('role=dialog')).toContainText('إضافة طالب جديد');
  });
});
