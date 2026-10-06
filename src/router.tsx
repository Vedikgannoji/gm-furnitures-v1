import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

// Layouts
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AccountLayout } from '@/pages/customer/AccountLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { StorefrontErrorBoundary } from '@/components/layout/StorefrontErrorBoundary'

// Customer Pages
import { HomePage } from '@/pages/customer/HomePage'
import { ShopPage } from '@/pages/customer/ShopPage'
import { CategoryPage } from '@/pages/customer/CategoryPage'
import { ProductDetailPage } from '@/pages/customer/ProductDetailPage'
import { RoomsPage } from '@/pages/customer/RoomsPage'
import { RoomDetailPage } from '@/pages/customer/RoomDetailPage'
import { CollectionsPage } from '@/pages/customer/CollectionsPage'
import { CollectionDetailPage } from '@/pages/customer/CollectionDetailPage'
import { SearchPage } from '@/pages/customer/SearchPage'
import { CartPage } from '@/pages/customer/CartPage'
import { CheckoutPage } from '@/pages/customer/CheckoutPage'
import { AuthPage } from '@/pages/customer/AuthPage'
import { AccountDashboardPage } from '@/pages/customer/AccountDashboardPage'
import { AccountOrdersPage } from '@/pages/customer/AccountOrdersPage'
import { AccountOrderDetailPage } from '@/pages/customer/AccountOrderDetailPage'
import { AccountWishlistPage } from '@/pages/customer/AccountWishlistPage'
import { AccountAddressesPage } from '@/pages/customer/AccountAddressesPage'
import { AboutPage } from '@/pages/customer/AboutPage'
import { ContactPage } from '@/pages/customer/ContactPage'
import { FaqPage } from '@/pages/customer/FaqPage'
import { PolicyPage } from '@/pages/customer/PolicyPage'

// Admin Pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage'
import { AdminProductFormPage } from '@/pages/admin/AdminProductFormPage'
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage'
import { AdminCollectionsPage } from '@/pages/admin/AdminCollectionsPage'
import { AdminRoomsPage } from '@/pages/admin/AdminRoomsPage'
import { AdminInventoryPage } from '@/pages/admin/AdminInventoryPage'
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage'
import { AdminOrderDetailPage } from '@/pages/admin/AdminOrderDetailPage'
import { AdminCustomersPage } from '@/pages/admin/AdminCustomersPage'
import { AdminInvoicesPage } from '@/pages/admin/AdminInvoicesPage'
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage'
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'

// 404 Page
import { EmptyState } from '@/components/commerce/EmptyState'
import { Compass } from 'lucide-react'

const NotFoundPage: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 py-24 text-center">
    <EmptyState
      icon={Compass}
      title="404 — Page Not Found"
      description="The spatial destination or furniture piece you navigated to could not be found."
      actionLabel="Return to Storefront"
      actionHref="/"
    />
  </div>
)

export const router = createBrowserRouter([
  // Customer Storefront Routes
  {
    path: '/',
    element: <CustomerLayout />,
    errorElement: <StorefrontErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'shop/:category', element: <CategoryPage /> },
      { path: 'products/:slug', element: <ProductDetailPage />, errorElement: <StorefrontErrorBoundary /> },
      { path: 'rooms', element: <RoomsPage /> },
      { path: 'rooms/:slug', element: <RoomDetailPage /> },
      { path: 'collections', element: <CollectionsPage /> },
      { path: 'collections/:slug', element: <CollectionDetailPage /> },
      { path: 'search', element: <SearchPage /> },
      {
        path: 'cart',
        element: (
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'wishlist',
        element: (
          <ProtectedRoute>
            <Navigate to="/account/wishlist" replace />
          </ProtectedRoute>
        ),
      },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        ),
      },
      { path: 'auth', element: <AuthPage /> },
      { path: 'login', element: <AuthPage /> },
      { path: 'register', element: <AuthPage /> },
      { path: 'forgot-password', element: <AuthPage /> },
      {
        path: 'account',
        element: (
          <ProtectedRoute>
            <AccountLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AccountDashboardPage /> },
          { path: 'orders', element: <AccountOrdersPage /> },
          { path: 'orders/:id', element: <AccountOrderDetailPage /> },
          { path: 'wishlist', element: <AccountWishlistPage /> },
          { path: 'addresses', element: <AccountAddressesPage /> },
        ],
      },
      { path: 'about', element: <AboutPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'faq', element: <FaqPage /> },
      { path: 'policies/:policyType', element: <PolicyPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  // Admin Routes
  {
    path: '/admin/login',
    element: <AuthPage />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'products', element: <AdminProductsPage /> },
      { path: 'products/new', element: <AdminProductFormPage /> },
      { path: 'products/:id', element: <AdminProductFormPage /> },
      { path: 'categories', element: <AdminCategoriesPage /> },
      { path: 'collections', element: <AdminCollectionsPage /> },
      { path: 'rooms', element: <AdminRoomsPage /> },
      { path: 'inventory', element: <AdminInventoryPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'orders/:id', element: <AdminOrderDetailPage /> },
      { path: 'customers', element: <AdminCustomersPage /> },
      { path: 'invoices', element: <AdminInvoicesPage /> },
      { path: 'analytics', element: <AdminAnalyticsPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
    ],
  },
])
