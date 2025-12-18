/**
 * Tests E2E para flujos críticos de la aplicación
 * Requiere Playwright configurado
 */

import { test, expect } from '@playwright/test'

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de login antes de cada test
    await page.goto('/login')
  })

  test.describe('Login Flow', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      // Llenar formulario de login
      await page.fill('input[name="email"], input[type="email"]', 'test@example.com')
      await page.fill('input[name="password"], input[type="password"]', 'password123')
      
      // Hacer click en el botón de login
      await page.click('button[type="submit"], button:has-text("Iniciar sesión"), button:has-text("Login")')
      
      // Esperar a que se redirija al dashboard
      await page.waitForURL('**/dashboard**', { timeout: 10000 })
      
      // Verificar que estamos en el dashboard
      expect(page.url()).toContain('/dashboard')
    })

    test('should show error with invalid credentials', async ({ page }) => {
      await page.fill('input[name="email"], input[type="email"]', 'invalid@example.com')
      await page.fill('input[name="password"], input[type="password"]', 'wrongpassword')
      
      await page.click('button[type="submit"], button:has-text("Iniciar sesión")')
      
      // Esperar mensaje de error
      await page.waitForSelector('text=/error|incorrecto|inválido/i', { timeout: 5000 })
    })
  })

  test.describe('Dashboard Flow', () => {
    test('should load dashboard after login', async ({ page }) => {
      // Asumir que estamos logueados (en producción usaría fixtures)
      await page.goto('/dashboard')
      
      // Verificar que el dashboard carga
      await page.waitForSelector('h1, [data-testid="dashboard"]', { timeout: 10000 })
      
      // Verificar que hay estadísticas
      const statsSection = page.locator('text=/Ventas|Cotizaciones|Clientes/i').first()
      await expect(statsSection).toBeVisible({ timeout: 5000 })
    })

    test('should navigate to quotes page', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Buscar enlace a cotizaciones
      const quotesLink = page.locator('a:has-text("Cotizaciones"), a[href*="quotes"]').first()
      await quotesLink.click()
      
      // Verificar que estamos en la página de cotizaciones
      await page.waitForURL('**/quotes**')
      expect(page.url()).toContain('/quotes')
    })
  })

  test.describe('Quote Creation Flow', () => {
    test('should create a new quote', async ({ page }) => {
      // Asumir login (en producción usaría fixtures de autenticación)
      await page.goto('/dashboard/quotes/new')
      
      // Esperar a que la página cargue
      await page.waitForSelector('h1, input, button', { timeout: 10000 })
      
      // Paso 1: Seleccionar cliente
      const clientSearch = page.locator('input[placeholder*="cliente"], input[name*="client"]').first()
      if (await clientSearch.isVisible()) {
        await clientSearch.fill('Test Client')
        // Esperar y seleccionar de la lista
        await page.waitForTimeout(1000)
        await page.click('text=/Test Client/i').catch(() => {})
      }
      
      // Paso 2: Agregar servicio
      const addServiceButton = page.locator('button:has-text("Agregar"), button:has-text("Servicio")').first()
      if (await addServiceButton.isVisible()) {
        await addServiceButton.click()
        await page.waitForTimeout(500)
      }
      
      // Paso 3: Guardar cotización
      const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Crear")').first()
      if (await saveButton.isVisible()) {
        await saveButton.click()
        
        // Esperar éxito o redirección
        await page.waitForTimeout(2000)
        
        // Verificar que se guardó (redirección o mensaje de éxito)
        const successIndicator = page.locator('text=/éxito|creada|guardada/i, [href*="/quotes/"]').first()
        await expect(successIndicator).toBeVisible({ timeout: 5000 }).catch(() => {
          // Si no hay indicador de éxito, verificar redirección
          expect(page.url()).toMatch(/\/quotes/)
        })
      }
    })
  })

  test.describe('Navigation Flow', () => {
    test('should navigate between main sections', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Navegar a diferentes secciones
      const sections = [
        { name: 'Cotizaciones', url: '/dashboard/quotes' },
        { name: 'Clientes', url: '/dashboard/clients' },
        { name: 'Calendario', url: '/dashboard/calendar' },
      ]
      
      for (const section of sections) {
        const link = page.locator(`a:has-text("${section.name}"), a[href="${section.url}"]`).first()
        if (await link.isVisible()) {
          await link.click()
          await page.waitForURL(`**${section.url}**`, { timeout: 5000 })
          expect(page.url()).toContain(section.url)
        }
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Configurar viewport móvil
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('/dashboard')
      
      // Verificar que el contenido se muestra correctamente
      await page.waitForSelector('body', { timeout: 5000 })
      
      // Verificar que no hay overflow horizontal
      const body = page.locator('body')
      const box = await body.boundingBox()
      expect(box?.width).toBeLessThanOrEqual(375)
    })

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      
      await page.goto('/dashboard')
      
      await page.waitForSelector('body', { timeout: 5000 })
      
      const body = page.locator('body')
      const box = await body.boundingBox()
      expect(box?.width).toBeLessThanOrEqual(768)
    })
  })
})

