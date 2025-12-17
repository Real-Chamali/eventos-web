'use client'

/**
 * Context API para estado global de la aplicación
 * Reduce el uso excesivo de useState/useEffect
 */

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
import { logger } from '@/lib/utils/logger'

// Tipos del estado
interface AppState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  notifications: Notification[]
  filters: {
    quotes: {
      searchTerm: string
      statusFilter: 'all' | 'pending' | 'confirmed' | 'cancelled' | 'draft'
    }
    clients: {
      searchTerm: string
    }
  }
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  timestamp: number
}

type AppAction =
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'system' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SET_QUOTES_FILTER'; payload: Partial<AppState['filters']['quotes']> }
  | { type: 'SET_CLIENTS_FILTER'; payload: Partial<AppState['filters']['clients']> }
  | { type: 'RESET_FILTERS' }

const initialState: AppState = {
  theme: 'system',
  sidebarOpen: true,
  notifications: [],
  filters: {
    quotes: {
      searchTerm: '',
      statusFilter: 'all',
    },
    clients: {
      searchTerm: '',
    },
  },
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload }
    
    case 'ADD_NOTIFICATION': {
      const notification: Notification = {
        ...action.payload,
        id: `notif-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      }
      return {
        ...state,
        notifications: [...state.notifications, notification].slice(-10), // Máximo 10 notificaciones
      }
    }
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      }
    
    case 'SET_QUOTES_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          quotes: { ...state.filters.quotes, ...action.payload },
        },
      }
    
    case 'SET_CLIENTS_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          clients: { ...state.filters.clients, ...action.payload },
        },
      }
    
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: {
          quotes: { searchTerm: '', statusFilter: 'all' },
          clients: { searchTerm: '' },
        },
      }
    
    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  actions: {
    setTheme: (theme: 'light' | 'dark' | 'system') => void
    toggleSidebar: () => void
    setSidebarOpen: (open: boolean) => void
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
    removeNotification: (id: string) => void
    setQuotesFilter: (filter: Partial<AppState['filters']['quotes']>) => void
    setClientsFilter: (filter: Partial<AppState['filters']['clients']>) => void
    resetFilters: () => void
  }
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  
  const actions = {
    setTheme: useCallback((theme: 'light' | 'dark' | 'system') => {
      dispatch({ type: 'SET_THEME', payload: theme })
      logger.info('AppContext', 'Theme changed', { theme })
    }, []),
    
    toggleSidebar: useCallback(() => {
      dispatch({ type: 'TOGGLE_SIDEBAR' })
    }, []),
    
    setSidebarOpen: useCallback((open: boolean) => {
      dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open })
    }, []),
    
    addNotification: useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
    }, []),
    
    removeNotification: useCallback((id: string) => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
    }, []),
    
    setQuotesFilter: useCallback((filter: Partial<AppState['filters']['quotes']>) => {
      dispatch({ type: 'SET_QUOTES_FILTER', payload: filter })
    }, []),
    
    setClientsFilter: useCallback((filter: Partial<AppState['filters']['clients']>) => {
      dispatch({ type: 'SET_CLIENTS_FILTER', payload: filter })
    }, []),
    
    resetFilters: useCallback(() => {
      dispatch({ type: 'RESET_FILTERS' })
    }, []),
  }
  
  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

