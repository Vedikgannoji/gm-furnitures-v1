import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { StoreSettings } from '@/types'
import { API_BASE } from '@/lib/api'

interface SettingsContextType {
  settings: StoreSettings
  isLoading: boolean
  refreshSettings: () => Promise<void>
  updateSettings: (newSettings: Partial<StoreSettings>, token?: string | null) => Promise<boolean>
}

const defaultSettings: StoreSettings = {
  storeName: 'GM Furniture',
  brandTagline: 'Handcrafted Solid Wood Furniture for Modern Living',
  supportEmail: 'support@gmfurniture.in',
  supportPhone: '+91 (011) 4920-8000',
  registeredAddress: 'Studio GM, Sector 44, Institutional Area, Gurugram, Haryana 122003, India',
  gstin: '36AFNPV7079J1ZG',
  pan: 'AAACG1234F',
  currency: 'INR (₹)',
  assemblyCharge: 3000,
  convenienceFeePercent: 0,
  gstPercent: 18,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings`)
      if (res.ok) {
        const data = await res.json()
        setSettings({
          storeName: data.storeName || defaultSettings.storeName,
          brandTagline: data.brandTagline || defaultSettings.brandTagline,
          supportEmail: data.supportEmail || defaultSettings.supportEmail,
          supportPhone: data.supportPhone || defaultSettings.supportPhone,
          registeredAddress: data.registeredAddress || defaultSettings.registeredAddress,
          gstin: data.gstin || defaultSettings.gstin,
          pan: data.pan || defaultSettings.pan,
          currency: data.currency || defaultSettings.currency,
          assemblyCharge: Number(data.assemblyCharge !== undefined ? data.assemblyCharge : defaultSettings.assemblyCharge),
          convenienceFeePercent: Number(data.convenienceFeePercent !== undefined ? data.convenienceFeePercent : defaultSettings.convenienceFeePercent),
          gstPercent: Number(data.gstPercent !== undefined ? data.gstPercent : defaultSettings.gstPercent),
        })
      }
    } catch (err) {
      console.error('Failed to load store settings from database:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSettings()
  }, [refreshSettings])

  const updateSettings = async (newSettings: Partial<StoreSettings>, token?: string | null): Promise<boolean> => {
    try {
      const merged = { ...settings, ...newSettings }
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(merged),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to update settings')
      }

      const data = await res.json()
      if (data.settings) {
        setSettings(data.settings)
      } else {
        setSettings(merged as StoreSettings)
      }
      return true
    } catch (err) {
      console.error('Update settings error:', err)
      throw err
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refreshSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
