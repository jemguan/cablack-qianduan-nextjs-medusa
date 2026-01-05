"use client"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { decodeToken } from "react-jwt"

// 辅助函数：将 token 设置到服务端 cookie
async function setTokenToCookie(token: string): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/set-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
      credentials: "include",
    })
    return response.ok
  } catch {
    return false
  }
}

// 辅助函数：从 localStorage 获取 JWT token
// 注意：只查找精确的 JWT token key，避免匹配其他数据
function getLatestTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null
  
  // 精确匹配这些 key，不再使用模糊搜索
  const exactKeys = [
    "_medusa_jwt",
    "medusa_jwt",
    "medusa_token",
    "_medusa_access_token",
    "access_token",
    "auth_token",
    "jwt",
  ]
  
  for (const key of exactKeys) {
    const value = localStorage.getItem(key)
    // JWT token 通常以 "eyJ" 开头（Base64 编码的 "{" 开头的 JSON）
    if (value && value.startsWith("eyJ") && value.length > 50) {
      return value
    }
  }
  
  return null
}

export default function GoogleCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null)

  // 获取所有查询参数
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    return params
  }, [searchParams])

  useEffect(() => {
    const validateCallback = async () => {
      try {
        setLoading(true)
        setError(null)

        // 检查是否有必要的参数
        if (!queryParams.code) {
          setError("Missing authorization code from Google")
          setLoading(false)
          return
        }

        // 步骤 1: 调用 Medusa 的 callback API 验证 Google 认证
        const token = await sdk.auth.callback("customer", "google", queryParams)

        if (!token || typeof token !== "string") {
          setError("Authentication failed: Invalid token received")
          setLoading(false)
          return
        }

        // 立即将初始 token 设置到服务端 cookie（非常重要！）
        try {
          await fetch("/api/auth/set-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
            credentials: "include",
          })
        } catch {
          // 忽略错误，后续会重试
        }

        // SDK 会自动将 token 存储在 localStorage 并附加到后续请求
        // 等待一下确保 token 已存储
        await new Promise(resolve => setTimeout(resolve, 100))

        // 步骤 2: 解码 token 检查客户是否已注册
        const decodedToken = decodeToken(token) as {
          actor_id?: string
          user_metadata?: Record<string, unknown>
          app_metadata?: Record<string, unknown>
        }

        // 检查 app_metadata 中是否已经有 customer_id key
        const appMetadata = decodedToken?.app_metadata || {}
        const hasCustomerIdKey = "customer_id" in appMetadata
        
        const shouldCreateCustomer = 
          (!decodedToken.actor_id || decodedToken.actor_id === "") && 
          !hasCustomerIdKey

        // 辅助函数：刷新 token 并更新 cookie
        // 保存最新的有效 token
        let latestValidToken = token
        
        const refreshAndUpdateCookie = async () => {
          try {
            // sdk.auth.refresh() 返回刷新后的 token
            const refreshedToken = await sdk.auth.refresh()
            await new Promise(resolve => setTimeout(resolve, 200))
            
            // 使用 refresh 返回的 token
            if (refreshedToken && typeof refreshedToken === "string") {
              latestValidToken = refreshedToken
              await setTokenToCookie(refreshedToken)
            } else {
              // 如果 refresh 没有返回 token，尝试从 localStorage 获取
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

        // 步骤 3: 如果客户不存在且没有 customer_id key，创建客户
        if (shouldCreateCustomer) {
          const email = decodedToken.user_metadata?.email as string
          
          if (!email) {
            setError("Unable to retrieve email from Google authentication")
            setLoading(false)
            return
          }

          try {
            // 创建客户（token 已经在 SDK 中，会自动附加到请求）
            await sdk.store.customer.create({
              email: email,
            })

            // 步骤 4: 刷新 token 以获取新的客户 token，并更新 cookie
            await refreshAndUpdateCookie()
          } catch {
            // 无论什么错误，都尝试刷新 token
            await refreshAndUpdateCookie()
          }
        } else if (hasCustomerIdKey && (!decodedToken.actor_id || decodedToken.actor_id === "")) {
          // customer_id key 已存在但 actor_id 为空，刷新 token
          await refreshAndUpdateCookie()
        } else {
          // 客户已存在，也刷新一下 token 确保最新
          await refreshAndUpdateCookie()
        }

        // 步骤 5: 验证 token 是否有效，如果无效则刷新（最多重试 3 次）
        let tokenValid = false
        let refreshRetryCount = 0
        const maxRefreshRetries = 3

        // 如果初始 token 中已有 actor_id，先尝试直接验证
        if (decodedToken.actor_id) {
          try {
            const testResponse = await sdk.client.fetch<{ customer: HttpTypes.StoreCustomer }>(
              "/store/customers/me",
              { method: "GET" }
            )
            if (testResponse?.customer) {
              tokenValid = true
            }
          } catch (testError) {
            // 如果直接验证失败，继续执行刷新逻辑
          }
        }

        // 如果 token 无效，尝试刷新并验证
        while (!tokenValid && refreshRetryCount < maxRefreshRetries) {
          try {
            // 刷新 token - sdk.auth.refresh() 返回新的 token
            const refreshedToken = await sdk.auth.refresh()
            
            // 等待 SDK 内部更新 token
            await new Promise(resolve => setTimeout(resolve, 200))
            
            // 使用 refresh 返回的 token 更新 cookie
            if (refreshedToken && typeof refreshedToken === "string") {
              latestValidToken = refreshedToken
              await setTokenToCookie(refreshedToken)
            }
            
            // 直接通过 API 调用验证 token 是否有效
            try {
              const testResponse = await sdk.client.fetch<{ customer: HttpTypes.StoreCustomer }>(
                "/store/customers/me",
                { method: "GET" }
              )
              if (testResponse?.customer) {
                tokenValid = true
                break
              }
            } catch {
              // API 调用失败，继续尝试刷新
            }
          } catch {
            // 刷新失败，继续重试
          }
          
          refreshRetryCount++
          if (refreshRetryCount < maxRefreshRetries) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }

        // 步骤 6: 确保最终 token 已设置到 cookie
        // 使用 latestValidToken（可能已在刷新过程中更新）
        if (latestValidToken) {
          await setTokenToCookie(latestValidToken)
        }
        
        // 如果 token 有效，尝试获取客户信息
        if (tokenValid) {
          try {
            const customerResponse = await sdk.client.fetch<{ customer: HttpTypes.StoreCustomer }>(
              "/store/customers/me",
              { method: "GET" }
            )
            
            if (customerResponse?.customer) {
              setCustomer(customerResponse.customer)
            }
          } catch {
            // 获取客户信息失败，继续重定向
          }
        }
        
        // 等待确保 cookie 已设置
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 重定向到账户页面
        window.location.replace("/account")
        return
      } catch (err: any) {
        setError(err.message || "Authentication failed. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (queryParams.code) {
      validateCallback()
    } else {
      setError("Missing required parameters from Google")
      setLoading(false)
    }
  }, [queryParams, router])

  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="max-w-md w-full flex flex-col items-center gap-4">
        {loading && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ui-fg-interactive"></div>
            <p className="text-base-regular text-ui-fg-base">
              Authenticating with Google...
            </p>
          </>
        )}

        {error && (
          <>
            <div className="text-ui-fg-error text-large-semi mb-2">
              Authentication Failed
            </div>
            <p className="text-base-regular text-ui-fg-base text-center mb-4">
              {error}
            </p>
            <button
              onClick={() => router.push("/account/login")}
              className="px-4 py-2 bg-ui-button-primary text-ui-button-primary-text rounded-md hover:bg-ui-button-primary-hover"
            >
              Return to Login
            </button>
          </>
        )}

        {customer && !loading && (
          <>
            <div className="text-ui-fg-success text-large-semi mb-2">
              Success!
            </div>
            <p className="text-base-regular text-ui-fg-base text-center">
              Welcome back, {customer.email || "customer"}!
            </p>
            <p className="text-small-regular text-ui-fg-muted">
              Redirecting to your account...
            </p>
          </>
        )}
      </div>
    </div>
  )
}

