import { test, expect, type Page } from '@playwright/test';

test.describe('Dynamic Real-time Updates', () => {
  let page1: Page;
  let page2: Page;

  test.beforeAll(async ({ browser }) => {
    // Create two browser contexts to simulate multiple users/tabs
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    page1 = await context1.newPage();
    page2 = await context2.newPage();
  });

  test.beforeEach(async () => {
    // Navigate both pages to the application
    await Promise.all([
      page1.goto('http://localhost:3000'),
      page2.goto('http://localhost:3000')
    ]);
    
    // Wait for both pages to load
    await Promise.all([
      page1.waitForLoadState('networkidle'),
      page2.waitForLoadState('networkidle')
    ]);
  });

  test('should update dashboard statistics in real-time when tasks are created', async () => {
    // Get initial task count on both pages
    const initialTaskCount1 = await page1.locator('[data-testid="task-count"]').textContent();
    const initialTaskCount2 = await page2.locator('[data-testid="task-count"]').textContent();
    
    console.log(`Initial task counts - Page 1: ${initialTaskCount1}, Page 2: ${initialTaskCount2}`);

    // Create a new task on page 1
    await page1.click('[data-testid="create-task-button"]');
    await page1.fill('[data-testid="task-title-input"]', 'Test Dynamic Task');
    await page1.fill('[data-testid="task-description-input"]', 'Testing real-time updates');
    await page1.click('[data-testid="task-submit-button"]');

    // Wait for success toast on page 1
    await expect(page1.locator('.toast-success')).toBeVisible({ timeout: 5000 });

    // Verify page 1 updates immediately (optimistic update)
    await expect(page1.locator('[data-testid="task-count"]')).not.toHaveText(initialTaskCount1 || '');

    // Verify page 2 updates automatically (real-time subscription)
    await expect(page2.locator('[data-testid="task-count"]')).not.toHaveText(initialTaskCount2 || '', { timeout: 10000 });

    // Check that the new task appears in the task list on both pages
    await Promise.all([
      expect(page1.locator('text=Test Dynamic Task')).toBeVisible(),
      expect(page2.locator('text=Test Dynamic Task')).toBeVisible({ timeout: 10000 })
    ]);
  });

  test('should update project lists in real-time when projects are created', async () => {
    // Get initial project count
    const initialProjectCount1 = await page1.locator('[data-testid="project-count"]').textContent();
    
    // Create a new project on page 1
    await page1.click('[data-testid="create-project-button"]');
    await page1.fill('[data-testid="project-name-input"]', 'Test Dynamic Project');
    await page1.fill('[data-testid="project-description-input"]', 'Testing real-time project updates');
    await page1.click('[data-testid="project-submit-button"]');

    // Wait for success notification
    await expect(page1.locator('.toast-success')).toBeVisible({ timeout: 5000 });

    // Verify both pages show the new project without refresh
    await Promise.all([
      expect(page1.locator('text=Test Dynamic Project')).toBeVisible(),
      expect(page2.locator('text=Test Dynamic Project')).toBeVisible({ timeout: 10000 })
    ]);

    // Verify project counts updated on both pages
    await expect(page1.locator('[data-testid="project-count"]')).not.toHaveText(initialProjectCount1 || '');
    await expect(page2.locator('[data-testid="project-count"]')).not.toHaveText(initialProjectCount1 || '', { timeout: 10000 });
  });

  test('should update report lists in real-time when reports are uploaded', async () => {
    // Navigate to a specific project page
    await page1.click('text=Test Dynamic Project');
    await page2.click('text=Test Dynamic Project');

    // Get initial report count
    const initialReportCount1 = await page1.locator('[data-testid="report-count"]').textContent();

    // Upload a report on page 1
    await page1.click('[data-testid="upload-report-button"]');
    
    // Create a test file (mock file upload)
    const fileInput = page1.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-report.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content')
    });

    await page1.fill('[data-testid="report-title-input"]', 'Test Dynamic Report');
    await page1.selectOption('[data-testid="report-category-select"]', 'Progress Report');
    await page1.click('[data-testid="report-upload-submit"]');

    // Wait for upload success
    await expect(page1.locator('.toast-success')).toBeVisible({ timeout: 10000 });

    // Verify report appears on both pages without refresh
    await Promise.all([
      expect(page1.locator('text=Test Dynamic Report')).toBeVisible(),
      expect(page2.locator('text=Test Dynamic Report')).toBeVisible({ timeout: 15000 })
    ]);

    // Verify report counts updated
    await expect(page1.locator('[data-testid="report-count"]')).not.toHaveText(initialReportCount1 || '');
    await expect(page2.locator('[data-testid="report-count"]')).not.toHaveText(initialReportCount1 || '', { timeout: 10000 });
  });

  test('should update task status in real-time across multiple tabs', async () => {
    // Navigate both pages to the tasks/gantt view
    await page1.click('[data-testid="gantt-tab"]');
    await page2.click('[data-testid="gantt-tab"]');

    // Find a task and update its status on page 1
    const taskElement = page1.locator('[data-testid="task-item"]').first();
    await taskElement.click();
    
    // Change status from "not-started" to "in-progress"
    await page1.click('[data-testid="task-status-dropdown"]');
    await page1.click('text=In Progress');
    await page1.click('[data-testid="save-task-changes"]');

    // Wait for update success
    await expect(page1.locator('.toast-success')).toBeVisible({ timeout: 5000 });

    // Verify status updates on both pages
    await Promise.all([
      expect(page1.locator('[data-testid="task-status-badge"]').first()).toContainText('In Progress'),
      expect(page2.locator('[data-testid="task-status-badge"]').first()).toContainText('In Progress', { timeout: 10000 })
    ]);
  });

  test('should handle offline/online scenarios gracefully', async () => {
    // Simulate going offline
    await page1.context().setOffline(true);

    // Try to create a task while offline
    await page1.click('[data-testid="create-task-button"]');
    await page1.fill('[data-testid="task-title-input"]', 'Offline Task');
    await page1.click('[data-testid="task-submit-button"]');

    // Should show appropriate error message
    await expect(page1.locator('text=Network error')).toBeVisible({ timeout: 5000 });

    // Go back online
    await page1.context().setOffline(false);

    // Wait for reconnection and retry
    await page1.waitForTimeout(2000);
    await page1.click('[data-testid="retry-button"]');

    // Should now succeed
    await expect(page1.locator('.toast-success')).toBeVisible({ timeout: 10000 });

    // Verify task appears on both pages
    await Promise.all([
      expect(page1.locator('text=Offline Task')).toBeVisible(),
      expect(page2.locator('text=Offline Task')).toBeVisible({ timeout: 10000 })
    ]);
  });

  test('should maintain real-time sync during heavy usage', async () => {
    console.log('🚀 Starting heavy usage test...');

    // Create multiple tasks quickly on page 1
    for (let i = 1; i <= 5; i++) {
      await page1.click('[data-testid="create-task-button"]');
      await page1.fill('[data-testid="task-title-input"]', `Bulk Task ${i}`);
      await page1.click('[data-testid="task-submit-button"]');
      await page1.waitForTimeout(500); // Brief pause between creations
    }

    // Wait for all operations to complete
    await page1.waitForTimeout(3000);

    // Verify all tasks appear on page 2
    for (let i = 1; i <= 5; i++) {
      await expect(page2.locator(`text=Bulk Task ${i}`)).toBeVisible({ timeout: 15000 });
    }

    console.log('✅ Heavy usage test completed successfully');
  });

  test.afterAll(async () => {
    await page1.close();
    await page2.close();
  });
});

// Performance monitoring test
test.describe('Real-time Performance', () => {
  test('should maintain good performance during real-time updates', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Monitor performance metrics
    const performanceMetrics = await page.evaluate(() => {
      return {
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
        memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : null
      };
    });

    console.log('📊 Performance Metrics:', performanceMetrics);

    // Performance should be reasonable
    expect(performanceMetrics.domContentLoaded).toBeLessThan(5000); // 5 seconds
    expect(performanceMetrics.loadComplete).toBeLessThan(10000); // 10 seconds

    // Test real-time subscription setup time
    const subscriptionStartTime = Date.now();
    
    // Wait for real-time subscriptions to be established
    await page.waitForFunction(() => {
      return window.console.log.toString().includes('Setting up real-time') || 
             document.querySelector('[data-testid="realtime-connected"]') !== null;
    }, { timeout: 5000 });

    const subscriptionSetupTime = Date.now() - subscriptionStartTime;
    console.log(`⚡ Real-time setup time: ${subscriptionSetupTime}ms`);
    
    // Real-time setup should be fast
    expect(subscriptionSetupTime).toBeLessThan(3000); // 3 seconds
  });
});
