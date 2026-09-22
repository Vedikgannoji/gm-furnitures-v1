import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { CustomerNavbar } from './CustomerNavbar'
import { Footer } from './Footer'
import { QuickCartDrawer } from '@/components/commerce/QuickCartDrawer'

const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-foreground selection:text-background">
      <ScrollToTop />
      <CustomerNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <QuickCartDrawer />
      <Footer />
    </div>
  )
}
