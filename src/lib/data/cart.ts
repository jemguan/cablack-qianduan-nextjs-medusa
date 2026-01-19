/**
 * Cart Module - Legacy Entry Point
 *
 * This file has been refactored into multiple modules for better maintainability.
 * All functionality is re-exported from the cart/ directory.
 *
 * New structure:
 * - cart/cart-cache.ts - Cache management
 * - cart/cart-vip.ts - VIP discount logic
 * - cart/cart-retrieval.ts - Cart retrieval and management
 * - cart/cart-items.ts - Cart items operations
 * - cart/cart-promotions.ts - Promotions and discounts
 * - cart/cart-payment.ts - Payment and order placement
 * - cart/cart-shipping.ts - Shipping methods
 * - cart/cart-address.ts - Address management
 * - cart/cart-region.ts - Region updates
 *
 * @deprecated Import from '@lib/data/cart' will continue to work
 * but consider importing specific functions from cart/ subdirectory for better tree-shaking
 */

export * from "./cart/index"
