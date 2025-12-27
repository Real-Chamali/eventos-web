/**
 * Configuración centralizada de branding para PDFs y documentos
 * Puede ser extendida con variables de entorno o configuración de usuario
 */

export interface BrandingConfig {
  companyName: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  primaryColor: [number, number, number] // RGB
  secondaryColor: [number, number, number] // RGB
  logoPath?: string
}

/**
 * Configuración de branding por defecto
 * Puede ser sobrescrita con variables de entorno o configuración de usuario
 */
export const defaultBranding: BrandingConfig = {
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Eventos CRM',
  companyAddress: process.env.NEXT_PUBLIC_COMPANY_ADDRESS,
  companyPhone: process.env.NEXT_PUBLIC_COMPANY_PHONE,
  companyEmail: process.env.NEXT_PUBLIC_COMPANY_EMAIL,
  primaryColor: [59, 130, 246], // #3B82F6 - azul
  secondaryColor: [107, 114, 128], // #6B7280 - gris
  logoPath: '/icon-512.png', // Logo por defecto en public/
}

/**
 * Obtiene la configuración de branding
 * Permite sobrescribir valores específicos
 */
export function getBrandingConfig(overrides?: Partial<BrandingConfig>): BrandingConfig {
  return {
    ...defaultBranding,
    ...overrides,
  }
}

