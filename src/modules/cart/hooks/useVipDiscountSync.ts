"use client"

import { useEffect, useState, useRef } from "react"
import { getVipDiscount, getLoyaltyConfig } from "@lib/data/loyalty"
import { applyPromotions } from "@lib/data/cart"
import type { HttpTypes } from "@medusajs/types"

const VIP_DISCOUNT_STORAGE_KEY = "vip_discount_applied"

// 防抖延迟时间（毫秒）
const DEBOUNCE_DELAY = 500

// 最大尝试次数（防止无限循环）
const MAX_APPLY_ATTEMPTS = 3

// 冷却时间（毫秒）- 防止短时间内重复调用
const COOLDOWN_MS = 30000 // 30 秒

/**
 * 获取已应用的 VIP 折扣码（从 sessionStorage）
 */
function getAppliedCode(cartId: string): string | null {
  if (typeof window === "undefined") return null
  try {
    const data = sessionStorage.getItem(VIP_DISCOUNT_STORAGE_KEY)
    if (!data) return null
    const parsed = JSON.parse(data)
    // 只返回与当前购物车匹配的记录
    return parsed.cartId === cartId ? parsed.code : null
  } catch {
    return null
  }
}

/**
 * 标记 VIP 折扣码已应用（保存到 sessionStorage）
 */
function setAppliedCode(cartId: string, code: string): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(VIP_DISCOUNT_STORAGE_KEY, JSON.stringify({ cartId, code }))
  } catch {
    // 忽略存储错误
  }
}

/**
 * 清除已应用的记录
 */
function clearAppliedCode(): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(VIP_DISCOUNT_STORAGE_KEY)
  } catch {
    // 忽略错误
  }
}

/**
 * VIP 会员折扣自动应用 Hook
 * 当用户是 VIP 会员且配置了专属折扣码时，自动应用到购物车
 * 
 * 注意：VIP 折扣主要在 server action (addToCart) 中应用，
 * 这个 hook 只作为备用检查，确保折扣不会丢失
 */
export function useVipDiscountSync(
  cart: HttpTypes.StoreCart | null,
  customer: HttpTypes.StoreCustomer | null
) {
  const [isApplying, setIsApplying] = useState(false)
  
  // 使用 ref 跟踪应用状态，避免触发 effect 重新运行
  const isApplyingRef = useRef(false)
  // 用于防抖的 timer ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 用于防止重复调用的 ref
  const lastApplyAttemptRef = useRef<string | null>(null)
  // 调用计数器（防止无限循环）
  const applyAttemptsRef = useRef(0)
  // 上次调用时间（用于冷却检查）
  const lastApplyTimeRef = useRef(0)

  // 清理防抖 timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // 主要的 VIP 折扣同步逻辑
  useEffect(() => {
    // 如果没有购物车、没有客户，则跳过
    if (!cart?.id || !customer?.id) {
      return
    }

    // 如果正在应用中，跳过（使用 ref 检查，不触发 effect）
    if (isApplyingRef.current) {
      return
    }

    // 检查是否超过最大尝试次数
    if (applyAttemptsRef.current >= MAX_APPLY_ATTEMPTS) {
      return
    }

    // 检查冷却时间
    const now = Date.now()
    if (now - lastApplyTimeRef.current < COOLDOWN_MS) {
      return
    }

    // 清除之前的防抖 timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 使用防抖延迟执行，避免短时间内多次调用
    debounceTimerRef.current = setTimeout(async () => {
      // 再次检查是否正在应用
      if (isApplyingRef.current) {
        return
      }

      // 再次检查最大尝试次数和冷却时间
      if (applyAttemptsRef.current >= MAX_APPLY_ATTEMPTS) {
        return
      }
      
      const currentTime = Date.now()
      if (currentTime - lastApplyTimeRef.current < COOLDOWN_MS) {
        return
      }

      // 创建唯一的调用标识，防止重复调用
      const attemptKey = `${cart.id}-${customer.id}`
      if (lastApplyAttemptRef.current === attemptKey) {
        return
      }

      try {
        // 检查积分系统是否启用，如果未启用则不应用 VIP 折扣
        const loyaltyConfig = await getLoyaltyConfig()
        if (!loyaltyConfig?.config?.is_points_enabled) {
          return
        }

        // 获取 VIP 折扣信息
        const vipDiscount = await getVipDiscount()

        // 如果不是 VIP 或没有配置折扣码，跳过
        if (!vipDiscount.is_vip || !vipDiscount.discount_code) {
          return
        }

        const discountCode = vipDiscount.discount_code

        // 检查折扣码是否已经应用到购物车
        const existingPromotions = (cart as any).promotions || []
        
        const isAlreadyApplied = existingPromotions.some(
          (p: HttpTypes.StorePromotion) => 
            p.code?.toLowerCase() === discountCode.toLowerCase()
        )

        if (isAlreadyApplied) {
          setAppliedCode(cart.id, discountCode)
          lastApplyAttemptRef.current = attemptKey
          return
        }

        // 检查是否刚刚应用过（通过 sessionStorage，避免刷新后重复应用）
        const previouslyApplied = getAppliedCode(cart.id)
        if (previouslyApplied === discountCode) {
          lastApplyAttemptRef.current = attemptKey
          return
        }

        // 标记为正在应用，增加尝试计数，记录时间
        isApplyingRef.current = true
        setIsApplying(true)
        lastApplyAttemptRef.current = attemptKey
        applyAttemptsRef.current += 1
        lastApplyTimeRef.current = Date.now()

        // 获取现有的折扣码
        const existingCodes = existingPromotions
          .filter((p: any) => p.code)
          .map((p: any) => p.code!)

        // 添加 VIP 折扣码
        const newCodes = [...existingCodes, discountCode]

        try {
          await applyPromotions(newCodes)
          
          // 标记为已尝试应用（保存到 sessionStorage）
          // 注意：不再调用 router.refresh()，依赖 revalidateTag 机制
          // 下次用户操作（如添加商品、刷新页面）时会自动获取最新数据
          setAppliedCode(cart.id, discountCode)
        } catch (applyError: any) {
          // 标记为已尝试，避免无限重试
          setAppliedCode(cart.id, discountCode)
          console.warn("[VIP Discount] Failed to apply discount:", applyError?.message)
        }
      } catch (error) {
        // 静默失败，但记录日志用于调试
        console.warn("[VIP Discount] Error in sync:", error)
      } finally {
        isApplyingRef.current = false
        setIsApplying(false)
      }
    }, DEBOUNCE_DELAY)
  }, [cart?.id, customer?.id]) // 只依赖 ID，不依赖整个对象，避免不必要的重新运行

  // 当客户变化时，重置应用状态
  useEffect(() => {
    if (customer?.id) {
      // 客户变化时清除之前的记录，重置计数器
      clearAppliedCode()
      lastApplyAttemptRef.current = null
      applyAttemptsRef.current = 0
      lastApplyTimeRef.current = 0
    }
  }, [customer?.id])

  return { isApplying }
}
