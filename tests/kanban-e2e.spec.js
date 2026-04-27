import { test, expect } from '@playwright/test';

test.describe('KanbanPro E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Auto-accept alerts
    page.on('dialog', dialog => dialog.accept());
  });

  test('complete user journey: register, create board, invite user, collaborate', async ({ page }) => {
    // Test user registration
    await page.goto('/register');
    const testEmail = `test_${Date.now()}@example.com`;
    await page.fill('input[name="nombre"]', 'Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="contrasena"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to login after registration
    await expect(page).toHaveURL(/.*login/);

    // Now login
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="contrasena"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Check that a default board was created
    await expect(page.locator('.tablero-title')).toContainText('Tablero de Test User');

    // Create a new board
    await page.click('#btnNuevoTablero');
    await page.fill('#tituloTablero', 'Test Board');
    await page.fill('#descripcionTablero', 'A test board for collaboration');
    await page.click('button:has-text("Crear Tablero")');

    // Should show the new board
    await expect(page.locator('#selectTablero')).toContainText('Test Board');

    // Select the new board
    await page.selectOption('#selectTablero', { label: 'Test Board' });

    // Add a task
    await page.click('#btnAbrirModal');
    await page.fill('input[name="titulo"]', 'Test Task');
    await page.fill('textarea[name="descripcion"]', 'This is a test task');
    await page.selectOption('select[name="lista"]', 'Por Hacer');
    await page.click('button[type="submit"]');

    // Should see the task
    await expect(page.locator('.tarjeta')).toContainText('Test Task');

    // Test logout
    await page.goto('/logout');
    await expect(page).toHaveURL('/login');
  });

  test('board sharing and permissions', async ({ page, browser }) => {
    // This test would require multiple browser contexts
    // For simplicity, we'll test the invitation flow from one user

    // Login as first user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'c.vega@email.cl');
    await page.fill('input[name="contrasena"]', 'caro123');
    await page.click('button[type="submit"]');

    // Wait for login to complete and redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Go to invitations
    await page.goto('/invitations');

    // Open invitation modal
    await page.click('#btn-enviar-invitacion');

    // Fill invitation form
    await page.selectOption('#board-select', { index: 1 }); // Select first board
    await page.fill('#invitee-email', 'r.fuentes@email.cl');
    await page.selectOption('#invitee-role', 'editor');
    await page.click('button[type="submit"]');

    // Check sent invitations
    await expect(page.locator('#enviadas-list')).toContainText('r.fuentes@email.cl');
    await expect(page.locator('#enviadas-list')).toContainText('r.fuentes@email.cl');

    // Logout and login as second user
    await page.goto('/logout');
    await page.goto('/login');
    await page.fill('input[name="email"]', 'r.fuentes@email.cl');
    await page.fill('input[name="contrasena"]', 'rorro369');
    await page.click('button[type="submit"]');

    // Wait for login to complete and redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Go to invitations
    await page.goto('/invitations');

    // Should see received invitation
    await expect(page.locator('#recibidas-list')).toContainText('Carolina Vega');

    // Accept invitation
    await page.click('button:has-text("Aceptar")');

    // Go to dashboard
    await page.goto('/dashboard');

    // Should see the shared board
    await expect(page.locator('#selectTablero')).toContainText('Optimización Línea de Producción N°3');

    // Select shared board
    await page.selectOption('#selectTablero', { label: 'Optimización Línea de Producción N°3' });

    // Should be able to add a task (editor permission)
    await page.click('#btnAbrirModal');
    await page.fill('input[name="titulo"]', 'Collaborative Task');
    await page.fill('textarea[name="descripcion"]', 'Added by collaborator');
    await page.selectOption('select[name="lista"]', 'Por Hacer');
    await page.click('button[type="submit"]');

    // Should see the task
    await expect(page.locator('.tarjeta')).toContainText('Collaborative Task');
  });

  test('permission restrictions', async ({ page }) => {
    // Login as viewer user (if we have one in seed)
    // This would test that viewers can't edit, editors can't delete boards, etc.
    // For now, we'll skip detailed permission tests
    test.skip();
  });

  test('dashboard functionality', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'c.vega@email.cl');
    await page.fill('input[name="contrasena"]', 'caro123');
    await page.click('button[type="submit"]');

    // Wait for login to complete and redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Check multiple boards
    const boardSelect = page.locator('#selectTablero');
    const count = await boardSelect.locator('option').count();
    expect(count).toBeGreaterThan(1);

    // Switch between boards
    const options = await boardSelect.locator('option').allTextContents();
    for (const option of options.slice(1)) { // Skip "Selecciona un tablero"
      await page.selectOption('#selectTablero', { label: option });
      await expect(page.locator('.tablero-title', { hasText: option }).first()).toBeVisible();
    }
  });
});