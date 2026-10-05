import React, { useState, useEffect } from 'react'
import { Save, Building2, ShieldCheck, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StoreSettings } from '@/types'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'

export const AdminSettingsPage: React.FC = () => {
  const { showToast } = useToast()
  const { token } = useAuth()
  const { settings, updateSettings, isLoading } = useSettings()

  const [formData, setFormData] = useState<StoreSettings>(settings)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Sync state when settings are loaded from backend
  useEffect(() => {
    setFormData(settings)
  }, [settings])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    }))
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage(null)

    if (!formData.storeName.trim()) {
      setErrorMessage('Store name is required.')
      return
    }

    if (!formData.gstin.trim()) {
      setErrorMessage('GSTIN is required.')
      return
    }

    setIsSaving(true)
    try {
      await updateSettings(formData, token)
      showToast('Settings Saved', 'Store configuration and checkout charges updated in PostgreSQL.', 'success')
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to persist settings to database.')
      showToast('Save Failed', err.message || 'Could not save settings.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-muted">
        Loading store settings from database...
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="editorial-badge text-muted">Platform Controls</span>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mt-1">
            Store Settings
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Manage store identity, registered legal details, GSTIN, and checkout charges.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          isLoading={isSaving}
          onClick={() => handleSave()}
          className="flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </Button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* 1. Store Identity */}
        <div className="bg-background border border-border p-6 space-y-4 text-xs">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border flex items-center gap-2">
            <Building2 className="w-4 h-4 text-foreground" />
            <span>Store Identity & Branding</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Store Name
              </label>
              <input
                type="text"
                name="storeName"
                required
                value={formData.storeName}
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
                value={formData.brandTagline}
                onChange={handleChange}
                className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Support Email
              </label>
              <input
                type="email"
                name="supportEmail"
                value={formData.supportEmail}
                onChange={handleChange}
                className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Support Phone
              </label>
              <input
                type="text"
                name="supportPhone"
                value={formData.supportPhone}
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
              value={formData.registeredAddress}
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
                required
                value={formData.gstin}
                onChange={handleChange}
                className="w-full h-10 bg-surface border border-border px-3 text-xs font-mono uppercase focus:border-foreground focus:outline-none"
              />
              <p className="text-[10px] text-muted mt-1">
                Single source of truth used across invoices, checkout, footer, and confirmations.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Permanent Account Number (PAN)
              </label>
              <input
                type="text"
                name="pan"
                value={formData.pan}
                onChange={handleChange}
                className="w-full h-10 bg-surface border border-border px-3 text-xs font-mono uppercase focus:border-foreground focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Checkout Charges Section */}
        <div className="bg-background border border-border p-6 space-y-4 text-xs">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground pb-2 border-b border-border flex items-center gap-2">
            <Receipt className="w-4 h-4 text-foreground" />
            <span>Checkout Charges</span>
          </h2>
          <p className="text-xs text-muted">
            Configures mandatory delivery fees, convenience percentage, and statutory GST on convenience fee.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Assembly Charge (₹)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                name="assemblyCharge"
                value={formData.assemblyCharge}
                onChange={handleChange}
                className="w-full h-10 bg-surface border border-border px-3 text-xs font-semibold focus:border-foreground focus:outline-none"
              />
              <p className="text-[10px] text-muted mt-1">Default: ₹3,000</p>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                Convenience Fee (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                name="convenienceFeePercent"
                value={formData.convenienceFeePercent}
                onChange={handleChange}
                className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              />
              <p className="text-[10px] text-muted mt-1">Percentage of product price</p>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1">
                GST on Convenience Fee (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                name="gstPercent"
                value={formData.gstPercent}
                onChange={handleChange}
                className="w-full h-10 bg-surface border border-border px-3 text-xs focus:border-foreground focus:outline-none"
              />
              <p className="text-[10px] text-muted mt-1">Applied solely to the convenience fee (Default: 18%)</p>
            </div>
          </div>
        </div>

        {/* Bottom submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
