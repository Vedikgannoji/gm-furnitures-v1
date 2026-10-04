import { Product } from '@/types'

/**
 * Storefront Availability Rules:
 * Current Launch: DINING TABLES ONLY are available for purchase.
 * All other categories/collections are Coming Soon.
 */

export const AVAILABLE_CATEGORY_SLUG = 'dining'

export const isProductAvailableForPurchase = (product: Product): boolean => {
  if (product.category !== AVAILABLE_CATEGORY_SLUG) return false
  const nameLower = product.name.toLowerCase()
  const slugLower = product.slug.toLowerCase()
  // Matches authentic dining table pieces (e.g. Atelier Solid Walnut Dining Table, Column Round Carrara Marble Dining Table)
  return nameLower.includes('dining table') || slugLower.includes('dining-table') || (nameLower.includes('table') && !nameLower.includes('coffee') && !nameLower.includes('side'))
}

export const isCategoryAvailable = (categorySlug: string): boolean => {
  return categorySlug === AVAILABLE_CATEGORY_SLUG
}

export const isRoomAvailable = (room: { slug: string; comingSoon?: boolean }): boolean => {
  if (room.comingSoon !== undefined) {
    return !room.comingSoon
  }
  return room.slug === 'dining-room'
}
