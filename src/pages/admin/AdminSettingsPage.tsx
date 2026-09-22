import React, { useState } from 'react'
import { Save, Building2, ShieldCheck, Bell, Truck, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { mockStoreSettings } from '@/data/mockData'
import { StoreSettings } from '@/types'
import { useToast } from '@/context/ToastContext'

export const AdminSettingsPage: React.FC = () => {
  const { showToast } = useToast()
  const [settings, setSettings] = useState<StoreSettings>(mockStoreSettings)
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setSettings((prev) => ({ ...prev, [name]: checked }))
    } else {
      setSettings((prev) => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value,
      }))
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    setTimeout(() => {
      setIsSaving(false)
      showToast('Settings Saved', 'Atelier configuration and taxation parameters updated.', 'success')
    }, 600)
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="editorial-badge text-muted">Platform Controls</span>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
            Atelier Configuration & Settings
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Manage legal registered entities, statutory GSTIN credentials, and logistics thresholds.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          isLoading={isSaving}
          onClick={handleSave}
          className="flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* 1. Store Identity */}
        <div className="bg-background border border-border p-6 space-y-4 text-xs">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border flex items-center gap-2">
            <Building2 className="w-4 h-4 text-foreground" />
            <span>Store Identity & Atelier Branding</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Storefront Name
              </label>
              <input
                type="text"
                name="storeName"
                value={settings.storeName}
                onChange={handleChange}
                className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Brand Tagline
              </label>
              <input
                type="text"
                name="brandTagline"
                value={settings.brandTagline}
                onChange={handleChange}
                className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Registered Head Office Address
            </label>
            <textarea
              name="registeredAddress"
              rows={2}
              value={settings.registeredAddress}
              onChange={handleChange}
              className="w-full bg-surface border border-border p-3 text-xs focus:border-foreground focus:outline-none"
            />
          </div>
        </div>

        {/* 2. Statutory Legal & Taxation */}
        <div className="bg-background border border-border p-6 space-y-4 text-xs">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-foreground" />
            <span>Statutory Legal & GST Credentials</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Goods and Services Tax Identification Number (GSTIN)
              </label>
              <input
                type="text"
                name="gstin"
                value={settings.gstin}
                onChange={handleChange}
                className="w-full h-10 bg-surface border border-border px-3 text-xs font-mono focus:border-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Permanent Account Number (PAN)
              </label>
              <input
                type="text"
                name="pan"
                value={settings.pan}
                onChange={handleChange}
                className="w-full h-10 bg-surface border border-border px-3 text-xs font-mono focus:border-foreground focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Logistics & Freight Pricing */}
        <div className="bg-background border border-border p-6 space-y-4 text-xs">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border flex items-center gap-2">
            <Truck className="w-4 h-4 text-foreground" />
            <span>Shipping & White-Glove Thresholds</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Complimentary Shipping Threshold (₹)
              </label>
              <input
                type="number"
                name="freeShippingThreshold"
                value={settings.freeShippingThreshold}
                onChange={handleChange}
                className="w-full h-10 bg-surface border border-border px-3 text-xs font-semibold focus:border-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Standard Logistics Fee (₹)
              </label>
              <input
                type="number"
                name="standardShippingFee"
                value={settings.standardShippingFee}
                onChange={handleChange}
                className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                White-Glove Assembly Fee (₹)
              </label>
              <input
                type="number"
                name="whiteGloveAssemblyFee"
                value={settings.whiteGloveAssemblyFee}
                onChange={handleChange}
                className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 4. Notification Preferences */}
        <div className="bg-background border border-border p-6 space-y-4 text-xs">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border flex items-center gap-2">
            <Bell className="w-4 h-4 text-foreground" />
            <span>Operational Dispatch & Alerts</span>
          </h2>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
              Internal Order Dispatch Notification Email
            </label>
            <input
              type="email"
              name="orderNotificationEmail"
              value={settings.orderNotificationEmail}
              onChange={handleChange}
              className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="enableLowStockAlerts"
                checked={settings.enableLowStockAlerts}
                onChange={handleChange}
                className="accent-foreground w-4 h-4"
              />
              <span className="text-xs font-medium text-foreground">
                Enable automated alerts when SKU inventory drops below safety threshold ({settings.lowStockThreshold} units)
              </span>
            </label>
          </div>
        </div>

        {/* Bottom submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
            Commit Store Settings
          </Button>
        </div>
      </form>
    </div>
  )
}
