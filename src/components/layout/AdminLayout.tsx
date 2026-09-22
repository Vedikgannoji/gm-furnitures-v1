import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'
import { Drawer } from '@/components/ui/Drawer'

export const AdminLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface flex antialiased selection:bg-foreground selection:text-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Drawer */}
      <Drawer
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        position="left"
        width="max-w-[280px]"
        title="Admin Navigation"
      >
        <AdminSidebar onItemClick={() => setIsMobileSidebarOpen(false)} />
      </Drawer>

      {/* Main Admin Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMobileMenuToggle={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
