import { test, expect } from '@playwright/test'

test.describe('Cotizaciones - Flujo Completo', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a login
    await page.goto('http://localhost:3000/login')
  })

  test('Crear una nueva cotización', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', 'vendor@example.com')
    await page.fill('input[name="password"]', 'testPassword123')
    await page.click('button[type="submit"]')

    // Esperar a que se redirija
    await page.waitForURL('**/dashboard')

    // Navegar a nueva cotización
    await page.click('text=Nueva Cotización')
    await page.waitForURL('**/quotes/new')

    // Buscar cliente
    await page.fill('input[placeholder*="Buscar cliente"]', 'Test Client')
    await page.click('text=Test Client')

    // Agregar servicio
    await page.click('button:has-text("Agregar Servicio")')
    
    // Completar formulario
    await page.selectOption('select', 'service-1')
    await page.fill('input[type="number"]', '2')
    await page.click('button:has-text("Guardar Borrador")')

    // Verificar éxito
    await page.waitForURL('**/quotes/**')
    await expect(page.locator('text=Detalle de Cotización')).toBeVisible()
  })

  test('Cerrar una venta', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', 'vendor@example.com')
    await page.fill('input[name="password"]', 'testPassword123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/dashboard')

    // Navegar a una cotización existente
    // (Asumiendo que existe una cotización con ID específico)
    await page.goto('http://localhost:3000/dashboard/quotes/test-id')

    // Cerrar venta
    const closeButton = page.locator('button:has-text("CERRAR VENTA")')
    await expect(closeButton).toBeVisible()
    
    await closeButton.click()
    
    // Confirmar diálogo
    await page.on('dialog', (dialog) => {
      dialog.accept()
    })

    // Verificar éxito
    await page.waitForURL('**/events/**')
    await expect(page.locator('text=Venta Cerrada Exitosamente')).toBeVisible()
  })

  test('Ver historial de cotizaciones', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', 'vendor@example.com')
    await page.fill('input[name="password"]', 'testPassword123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/dashboard')

    // Verificar que se muestre el dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Mis Ventas')).toBeVisible()
    await expect(page.locator('text=Comisiones')).toBeVisible()
  })
})

test.describe('Admin - Gestión de Servicios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
  })

  test('Editar precios de servicios', async ({ page }) => {
    // Login como admin
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'adminPassword123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/admin')

    // Navegar a servicios
    await page.click('text=Servicios')
    await page.waitForURL('**/admin/services')

    // Editar un servicio
    const priceInput = page.locator('input[type="number"]').first()
    await priceInput.fill('150.50')
    await priceInput.blur()

    // Verificar que se guardó
    await expect(page.locator('text=Actualizado')).toBeVisible()
  })

  test('Ver datos financieros', async ({ page }) => {
    // Login como admin
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'adminPassword123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/admin')

    // Navegar a finanzas
    await page.click('text=Finanzas')
    await page.waitForURL('**/admin/finance')

    // Verificar elementos
    await expect(page.locator('text=Ingresos')).toBeVisible()
    await expect(page.locator('text=Gastos')).toBeVisible()
    await expect(page.locator('text=Balance Neto')).toBeVisible()
  })
})
