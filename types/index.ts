/**
 * Tipos compartidos para toda la aplicación
 * Evita duplicación y asegura consistencia
 */

export interface Quote {
  id: string
  client_id: string
  vendor_id: string
  total_price: number
  status: 'draft' | 'pending' | 'confirmed' | 'cancelled'
  notes?: string | null
  event_date?: string | null
  created_at: string
  updated_at?: string | null
  client_name?: string // Campo calculado para UI
  client?: Client
  quote_services?: QuoteService[]
}

export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  created_at: string
  created_by?: string | null
}

export interface QuoteService {
  id: string
  quote_id: string
  service_id: string
  quantity: number
  final_price: number
  service?: Service
}

export interface Service {
  id: string
  name: string
  base_price: number
  cost_price: number
  created_at: string
}

export interface Event {
  id: string
  quote_id: string
  start_date: string
  end_date: string | null
  start_time?: string | null
  end_time?: string | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  location?: string | null
  guest_count?: number | null
  event_type?: string | null
  emergency_contact?: string | null
  emergency_phone?: string | null
  special_requirements?: string | null
  additional_notes?: string | null
  created_at: string
  quote?: Quote
}

export interface PartialPayment {
  id: string
  quote_id: string
  amount: number
  payment_date: string
  payment_method: 'cash' | 'transfer' | 'card' | 'check' | 'other'
  reference_number?: string | null
  notes?: string | null
  is_cancelled?: boolean
  cancellation_reason?: string | null
  created_by: string
  created_at: string
  updated_at?: string | null
}

export interface QuoteFinancialStatus {
  quote_id: string
  total_amount: number
  total_paid: number
  remaining_balance: number
  financial_status: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED'
  payment_count: number
  last_payment_date?: string | null
}

export interface FinanceEntry {
  id: string
  amount: number
  type: 'income' | 'expense'
  description: string
  created_at: string
  created_by?: string | null
}

export interface User {
  id: string
  email: string
  role: 'admin' | 'vendor'
  created_at: string
  last_sign_in_at?: string | null
}

export interface DashboardStats {
  totalSales: number
  totalCommissions: number
  pendingQuotes: number
  confirmedQuotes: number
  conversionRate: number
  averageSale: number
  monthlySales: number
  totalClients: number
}

// Tipos para formularios
export interface CreateQuoteData {
  client_id: string
  services: Array<{
    service_id: string
    quantity: number
    final_price: number
  }>
  notes?: string
  event_date?: string
}

export interface UpdateQuoteData {
  services?: Array<{
    service_id: string
    quantity: number
    final_price: number
  }>
  notes?: string
  event_date?: string
  status?: Quote['status']
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  data: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

