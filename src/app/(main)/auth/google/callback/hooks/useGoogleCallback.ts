"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { decodeToken } from "react-jwt"
import { sdk } from "@lib/config"
import type { HttpTypes } from "@medusajs/types"

import {
  setTokenToCookie,
  clearAllMedusaTokens,
  getLatestTokenFromStorage,
} from "../utils/token"
import {
  verifyCustomerToken,
  handleDeletedCustomer,
  parseGoogleUserName,
} from "../utils/customer"

interface UseGoogleCallbackReturn {
  loading: boolean
  error: string | null
  customer: HttpTypes.StoreCustomer | null
}

interface DecodedToken {
  actor_id?: string
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
}

export function useGoogleCallback(): UseGoogleCallbackReturn {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null)

  // 用于跟踪组件是否已卸载
  const isMountedRef = useRef(true)

  // 获取所有查询参数
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    return params
  }, [searchParams])

  useEffect(() => {
    isMountedRef.current = true

    const validateCallback = async () => {
      try {
        if (isMountedRef.current) {
          setLoading(true)
          setError(null)
        }

        // 检查是否有必要的参数
        if (!queryParams.code) {
          if (isMountedRef.current) {
            setError("Missing authorization code from Google")
            setLoading(false)
          }
          return
        }

        // 步骤 1: 调用 Medusa 的 callback API 验证 Google 认证
        const token = await sdk.auth.callback(
          "customer",
          "google",
          queryParams
        )

        if (!isMountedRef.current) return

        if (!token || typeof token !== "string") {
          if (isMountedRef.current) {
            setError("Authentication failed: Invalid token received")
            setLoading(false)
          }
          return
        }

        // 立即将初始 token 设置到服务端 cookie
        try {
          await setTokenToCookie(token)
        } catch {
          // 忽略错误，后续会重试
        }

        await new Promise((resolve) => setTimeout(resolve, 100))

        // 步骤 2: 解码 token 检查客户是否已注册
        const decodedToken = decodeToken(token) as DecodedToken

        const appMetadata = decodedToken?.app_metadata || {}
        const hasCustomerIdKey = "customer_id" in appMetadata

        const shouldCreateCustomer =
          (!decodedToken.actor_id || decodedToken.actor_id === "") &&
          !hasCustomerIdKey

        // 保存最新的有效 token
        let latestValidToken = token

        // 刷新 token 并更新 cookie 的辅助函数
        const refreshAndUpdateCookie = async () => {
          try {
            const refreshedToken = await sdk.auth.refresh()
            await new Promise((resolve) => setTimeout(resolve, 200))

            if (refreshedToken && typeof refreshedToken === "string") {
              latestValidToken = refreshedToken
              await setTokenToCookie(refreshedToken)
            } else {
              const storedToken = getLatestTokenFromStorage()
              if (storedToken) {
                latestValidToken = storedToken
                await setTokenToCookie(storedToken)
              }
            }
          } catch {
            // 刷新失败，忽略
          }
        }

        // 步骤 3: 如果客户不存在，创建客户
        if (shouldCreateCustomer) {
          const email = decodedToken.user_metadata?.email as string
          const userMetadata = decodedToken.user_metadata || {}

          if (!email) {
            if (isMountedRef.current) {
              setError(
                "Unable to retrieve email from Google authentication"
              )
              setLoading(false)
            }
            return
          }

          const { firstName, lastName } = parseGoogleUserName(userMetadata)

          try {
            await sdk.store.customer.create({
              email: email,
              first_name: firstName || undefined,
              last_name: lastName || undefined,
              metadata: {
                created_via: "google_oauth",
              },
            })
            await refreshAndUpdateCookie()
          } catch {
            await refreshAndUpdateCookie()
          }
        } else {
          await refreshAndUpdateCookie()
        }

        // 步骤 4: 验证 token 是否有效
        let tokenValid = false
        let refreshRetryCount = 0
        const maxRefreshRetries = 3

        // 先尝试直接验证
        if (decodedToken.actor_id) {
          const result = await verifyCustomerToken()
          if (result.valid) {
            tokenValid = true
          } else if (result.deleted) {
            const shouldStop = await handleDeletedCustomer(
              setError,
              setLoading,
              isMountedRef,
              clearAllMedusaTokens
            )
            if (shouldStop) return
          }
        }

        // 如果 token 无效，尝试刷新并验证
        while (!tokenValid && refreshRetryCount < maxRefreshRetries) {
          try {
            const refreshedToken = await sdk.auth.refresh()
            await new Promise((resolve) => setTimeout(resolve, 200))

            if (refreshedToken && typeof refreshedToken === "string") {
              latestValidToken = refreshedToken
              await setTokenToCookie(refreshedToken)
            }

            const result = await verifyCustomerToken(
              refreshedToken || getLatestTokenFromStorage()
            )
            if (result.valid) {
              tokenValid = true
              break
            } else if (result.deleted) {
              const shouldStop = await handleDeletedCustomer(
                setError,
                setLoading,
                isMountedRef,
                clearAllMedusaTokens
              )
              if (shouldStop) return
            }
          } catch {
            // 刷新失败，继续重试
          }

          refreshRetryCount++
          if (refreshRetryCount < maxRefreshRetries) {
            await new Promise((resolve) => setTimeout(resolve, 500))
          }
        }

        // 步骤 5: 确保最终 token 已设置到 cookie
        if (latestValidToken) {
          await setTokenToCookie(latestValidToken)
        }

        // 获取客户信息
        if (tokenValid) {
          sessionStorage.removeItem("medusa_reauth_count")
          const result = await verifyCustomerToken(
            latestValidToken || getLatestTokenFromStorage()
          )
          if (result.valid && result.customer && isMountedRef.current) {
            setCustomer(result.customer)
          } else if (result.deleted) {
            const shouldStop = await handleDeletedCustomer(
              setError,
              setLoading,
              isMountedRef,
              clearAllMedusaTokens
            )
            if (shouldStop) return
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 500))

        // 重定向到账户页面
        window.location.replace("/account")
      } catch (err: any) {
        if (isMountedRef.current) {
          setError(err.message || "Authentication failed. Please try again.")
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    if (queryParams.code) {
      validateCallback()
    } else {
      if (isMountedRef.current) {
        setError("Missing required parameters from Google")
        setLoading(false)
      }
    }

    return () => {
      isMountedRef.current = false
    }
  }, [queryParams])

  return { loading, error, customer }
}
