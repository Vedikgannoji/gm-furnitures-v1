import React, { useState, useEffect, useCallback } from 'react'
import {
  Save,
  Building2,
  ShieldCheck,
  Receipt,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StoreSettings, CashfreeGatewayStatus } from '@/types'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'

export const AdminSettingsPage: React.FC = () => {
  const { showToast } = useToast()
  const { token } = useAuth()
  const { settings, updateSettings, refreshSettings, isLoading } = useSettings()

  const [formData, setFormData] = useState<StoreSettings>(settings)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Cashfree Gateway Status State
  const [cashfreeStatus, setCashfreeStatus] = useState<CashfreeGatewayStatus | null>(null)
  const [isLoadingGateway, setIsLoadingGateway] = useState(true)
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false)
  const [targetMode, setTargetMode] = useState<'sandbox' | 'production' | null>(null)
  const [switchPassword, setSwitchPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmittingSwitch, setIsSubmittingSwitch] = useState(false)
  const [switchModalError, setSwitchModalError] = useState<string | null>(null)

  // Fetch gateway configuration status
  const fetchGatewayStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/cashfree/status', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (res.ok) {
        const data = await res.json()
        setCashfreeStatus(data)
      }
    } catch (err) {
      console.error('Failed to load Cashfree status:', err)
    } finally {
      setIsLoadingGateway(false)
    }
  }, [token])

  useEffect(() => {
    fetchGatewayStatus()
  }, [fetchGatewayStatus])

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

  // Handle clicking the Sandbox Mode Toggle
  const handleToggleClick = () => {
    const current = cashfreeStatus?.environment || settings.cashfreeEnvironment || 'sandbox'
    const next = current === 'sandbox' ? 'production' : 'sandbox'
    setTargetMode(next)
    setSwitchPassword('')
    setShowPassword(false)
    setSwitchModalError(null)
    setIsSwitchModalOpen(true)
  }

  // Cancel modal
  const handleCancelSwitch = () => {
    setIsSwitchModalOpen(false)
    setTargetMode(null)
    setSwitchPassword('')
    setSwitchModalError(null)
  }

  // Confirm environment switch with password
  const handleConfirmSwitch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetMode) return

    if (!switchPassword.trim()) {
      setSwitchModalError('Please enter the authorization password.')
      return
    }

    setIsSubmittingSwitch(true)
    setSwitchModalError(null)

    try {
      const res = await fetch('/api/admin/cashfree/environment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          environment: targetMode,
          password: switchPassword.trim(),
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const errorMsg =
          data.error ||
          (res.status === 401
            ? 'Incorrect password. Environment unchanged.'
            : 'Failed to switch environment.')
        setSwitchModalError(errorMsg)
        showToast('Environment Switch Failed', errorMsg, 'error')
        return
      }

      showToast(
        'Environment Updated',
        `Cashfree gateway successfully switched to ${
          targetMode === 'production' ? 'Production (Live)' : 'Sandbox (Test)'
        } mode.`,
        'success'
      )
      setIsSwitchModalOpen(false)
      setSwitchPassword('')
      setTargetMode(null)
      await fetchGatewayStatus()
      await refreshSettings()
    } catch (err: any) {
      setSwitchModalError(err.message || 'Network error occurred while switching environment.')
    } finally {
      setIsSubmittingSwitch(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-muted">
        Loading store settings from database...
      </div>
    )
  }

  const isSandbox = (cashfreeStatus?.environment || settings.cashfreeEnvironment || 'sandbox') === 'sandbox'

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
            Manage store identity, registered legal details, GSTIN, payment gateways, and checkout charges.
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

      {/* ======================================================== */}
      {/* PAYMENT GATEWAY SETTINGS (CASHFREE SANDBOX / PRODUCTION) */}
      {/* ======================================================== */}
      <div className="bg-background border border-border p-6 space-y-6 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-foreground" />
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Payment Gateway Settings
              </h2>
              <p className="text-[11px] text-muted mt-0.5">
                Configure Cashfree Payment Gateway environment and verify gateway credentials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted">Active Environment:</span>
            {isSandbox ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sandbox / Test Mode
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-300 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Production / Live Mode
              </span>
            )}
          </div>
        </div>

        {/* Live Mode Caution Banner */}
        {!isSandbox && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-900 rounded space-y-1">
            <div className="flex items-center gap-2 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Live mode is enabled. Customers may be charged real money.</span>
            </div>
            <p className="text-[11px] text-amber-800/90 pl-6">
              Genuine customer payments are being processed through Cashfree's live production endpoint.
              Verify your production bank account settlement details in the Cashfree Merchant Dashboard.
            </p>
          </div>
        )}

        {/* Toggle Control Card */}
        <div className="bg-surface border border-border p-5 rounded space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
                <span>Cashfree Sandbox Mode</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-background border border-border rounded text-muted">
                  {isSandbox ? 'ON' : 'OFF'}
                </span>
              </h3>
              <p className="text-[11px] text-muted mt-1 max-w-lg">
                {isSandbox
                  ? 'ON: Test transactions only. Uses Cashfree Sandbox endpoints. No real funds are debited.'
                  : 'OFF: Production Mode. Customer cards, UPI, and net banking will be charged real money.'}
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted font-medium">
                {isSandbox ? 'Sandbox (Test)' : 'Production (Live)'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isSandbox}
                onClick={handleToggleClick}
                disabled={isLoadingGateway}
                className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 ${
                  isSandbox ? 'bg-emerald-600' : 'bg-amber-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isSandbox ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Configuration Status Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between p-3 bg-background border border-border rounded text-[11px]">
              <span className="text-muted">Sandbox Credentials:</span>
              {cashfreeStatus?.sandboxConfigured ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
                  <X className="w-3.5 h-3.5" />
                  Not Configured
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-background border border-border rounded text-[11px]">
              <span className="text-muted">Production Credentials:</span>
              {cashfreeStatus?.productionConfigured ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                  Pending (Add via Vercel)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

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

      {/* ======================================================== */}
      {/* PASSWORD CONFIRMATION MODAL FOR ENVIRONMENT SWITCH       */}
      {/* ======================================================== */}
      {isSwitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-background border border-border w-full max-w-md p-6 shadow-2xl relative space-y-5 rounded">
            {/* Close button */}
            <button
              type="button"
              onClick={handleCancelSwitch}
              disabled={isSubmittingSwitch}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Lock className="w-4 h-4 text-foreground" />
                <span>Confirm Payment Gateway Environment Switch</span>
              </div>
              <p className="text-xs text-muted">
                {targetMode === 'production'
                  ? 'You are switching Cashfree to Production (Live Mode). Genuine customer payments will be charged real money.'
                  : 'You are switching Cashfree to Sandbox (Test Mode). Real customer payments will NOT be processed.'}
              </p>
            </div>

            {targetMode === 'production' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs rounded flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Warning: In Production mode, genuine customer payments will be processed through your live Cashfree gateway.
                </span>
              </div>
            )}

            {switchModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">
                {switchModalError}
              </div>
            )}

            {/* Password Form */}
            <form onSubmit={handleConfirmSwitch} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1.5">
                  Administrator Authorization Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={switchPassword}
                    onChange={(e) => setSwitchPassword(e.target.value)}
                    placeholder="Enter confirmation password"
                    autoFocus
                    disabled={isSubmittingSwitch}
                    className="w-full h-10 bg-surface border border-border px-3 pr-10 text-xs focus:border-foreground focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-2.5 text-muted hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelSwitch}
                  disabled={isSubmittingSwitch}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingSwitch}
                  disabled={isSubmittingSwitch || !switchPassword.trim()}
                  className="flex items-center gap-1.5"
                >
                  {isSubmittingSwitch && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Switch</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

