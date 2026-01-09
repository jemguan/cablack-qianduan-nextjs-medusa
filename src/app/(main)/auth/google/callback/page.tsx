"use client"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useState, useMemo, useRef } from "react"
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

// 辅助函数：获取 Medusa 后端 URL
function getMedusaBackendUrl(): string {
  if (typeof window !== "undefined") {
    // 客户端：优先使用从 HTML 注入的 URL
    const windowUrl = (window as any).__MEDUSA_BACKEND_URL__
    const envUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
    
    if (windowUrl && !windowUrl.includes("localhost")) {
      return windowUrl
    }
    
    if (envUrl && !envUrl.includes("localhost")) {
      return envUrl
    }
    
    if (windowUrl) {
      return windowUrl
    }
    
    return envUrl || "http://localhost:9000"
  }
  
  return process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
}

// 辅助函数：清除所有可能的 Medusa 认证 token
async function clearAllMedusaTokens() {
  if (typeof window === "undefined") return
  
  console.warn("[Auth] Clearing all Medusa tokens and session data")
  
  // 1. 清除 localStorage 中的所有可能 key
  const keysToRemove = [
    "_medusa_jwt", 
    "_medusa_refresh_token",
    "medusa_auth_token",
    "medusa_refresh_token",
    "medusa_jwt",
    "jwt",
    "refresh_token"
  ]
  
  // 遍历所有 key，清除包含 medusa 或 auth 的项
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (
      key.toLowerCase().includes("medusa") || 
      key.toLowerCase().includes("auth") || 
      key.toLowerCase().includes("jwt") ||
      key.toLowerCase().includes("token")
    )) {
      keysToRemove.push(key)
    }
  }
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key)
    } catch (e) {}
  })
  
  // 2. 清除服务端 cookie
  try {
    await fetch("/api/auth/clear-token", { 
      method: "POST", 
      credentials: "include" 
    })
  } catch (e) {
    console.error("[Auth] Failed to clear server cookie:", e)
  }
  
  // 3. 给浏览器一点时间处理存储更新
  await new Promise(resolve => setTimeout(resolve, 100))
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
  
  // 用于跟踪组件是否已卸载，防止在卸载后调用 setState
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
    // 标记组件已挂载
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
        const token = await sdk.auth.callback("customer", "google", queryParams)
        
        // 检查组件是否仍然挂载
        if (!isMountedRef.current) return

        if (!token || typeof token !== "string") {
          if (isMountedRef.current) {
            setError("Authentication failed: Invalid token received")
            setLoading(false)
          }
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
          const userMetadata = decodedToken.user_metadata || {}
          
          // 从 Google 用户信息中提取名字
          const fullName = (userMetadata.name as string) || ""
          const givenName = (userMetadata.given_name as string) || ""
          const familyName = (userMetadata.family_name as string) || ""
          
          // 解析名字：优先使用 given_name/family_name，否则从 name 中解析
          let firstName = givenName
          let lastName = familyName
          
          if (!firstName && !lastName && fullName) {
            const nameParts = fullName.trim().split(" ")
            firstName = nameParts[0] || ""
            lastName = nameParts.slice(1).join(" ") || ""
          }
          
          if (!email) {
            if (isMountedRef.current) {
              setError("Unable to retrieve email from Google authentication")
              setLoading(false)
            }
            return
          }

          try {
            // 创建客户（token 已经在 SDK 中，会自动附加到请求）
            // 提供完整的客户数据，避免 Medusa Admin 渲染错误
            await sdk.store.customer.create({
              email: email,
              first_name: firstName || undefined,
              last_name: lastName || undefined,
              // 初始化空数组字段，避免 Medusa Admin 的 reduce 错误
              metadata: {
                created_via: "google_oauth",
              },
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
            // 使用原生 fetch 来检查响应，以便正确捕获 deleted 标志
            const baseUrl = getMedusaBackendUrl()
            const token = getLatestTokenFromStorage()
            const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
            
            if (token) {
              const headers: Record<string, string> = {
                "Authorization": `Bearer ${token}`,
              }
              
              if (publishableKey) {
                headers["x-publishable-api-key"] = publishableKey
              }
              
              const response = await fetch(`${baseUrl}/store/customers/me`, {
                method: "GET",
                headers,
              })
              
              if (response.ok) {
                const data = await response.json()
                if (data?.customer) {
                  tokenValid = true
                }
              } else if (response.status === 404) {
                // 检查是否是客户被删除的情况
                try {
                  const errorData = await response.json()
                  console.log("[OAuth Callback] 404 response data:", errorData)
                  if (errorData?.deleted === true) {
                    // 客户已被删除，清除 token 并重新登录
                    console.warn("[OAuth Callback] Customer was deleted, clearing token and re-authenticating")
                    await clearAllMedusaTokens()
                    
                    // 检查是否已经尝试过重新登录，避免死循环
                    const reauthCount = parseInt(sessionStorage.getItem("medusa_reauth_count") || "0")
                    if (reauthCount >= 2) {
                      console.error("[OAuth Callback] Re-authentication loop detected")
                      if (isMountedRef.current) {
                        setError("Your account was deleted and we couldn't recreate it automatically after multiple attempts. Please try logging out and logging in again manually.")
                        setLoading(false)
                      }
                      sessionStorage.removeItem("medusa_reauth_count")
                      return
                    }
                    sessionStorage.setItem("medusa_reauth_count", (reauthCount + 1).toString())

                    // 使用 replace 重新触发 OAuth 登录
                    window.location.replace("/auth/customer/google?prompt=select_account")
                    return
                  }
                } catch (parseError) {
                  // JSON 解析失败，继续执行刷新逻辑
                  console.warn("[OAuth Callback] Failed to parse 404 response:", parseError)
                }
              }
            }
          } catch (testError: any) {
            // 如果直接验证失败，继续执行刷新逻辑
            console.warn("Failed to verify customer:", testError)
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
            
            // 直接通过原生 fetch 验证 token 是否有效
            try {
              const baseUrl = getMedusaBackendUrl()
              const currentToken = refreshedToken || getLatestTokenFromStorage()
              const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
              
              if (currentToken) {
                const headers: Record<string, string> = {
                  "Authorization": `Bearer ${currentToken}`,
                }
                
                if (publishableKey) {
                  headers["x-publishable-api-key"] = publishableKey
                }
                
                const response = await fetch(`${baseUrl}/store/customers/me`, {
                  method: "GET",
                  headers,
                })
                
                if (response.ok) {
                  const data = await response.json()
                  if (data?.customer) {
                    tokenValid = true
                    break
                  }
                } else if (response.status === 404) {
                  // 检查是否是客户被删除的情况
                  try {
                    const errorData = await response.json()
                    console.log("[OAuth Callback] 404 response data (after refresh):", errorData)
                    if (errorData?.deleted === true) {
                      console.warn("[OAuth Callback] Customer was deleted, clearing token and re-authenticating")
                      await clearAllMedusaTokens()
                      
                      const reauthCount = parseInt(sessionStorage.getItem("medusa_reauth_count") || "0")
                      if (reauthCount >= 2) {
                        if (isMountedRef.current) {
                          setError("Account recreation failed after multiple attempts. Please contact support.")
                          setLoading(false)
                        }
                        sessionStorage.removeItem("medusa_reauth_count")
                        return
                      }
                      sessionStorage.setItem("medusa_reauth_count", (reauthCount + 1).toString())

                      window.location.replace("/auth/customer/google?prompt=select_account")
                      return
                    }
                  } catch (parseError) {
                    // JSON 解析失败，继续尝试刷新
                    console.warn("[OAuth Callback] Failed to parse 404 response (after refresh):", parseError)
                  }
                }
              }
            } catch (testError: any) {
              // API 调用失败，继续尝试刷新
              console.warn("Failed to verify customer after refresh:", testError)
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
        
        // 如果成功获取到客户信息，清除重试计数
        if (tokenValid) {
          sessionStorage.removeItem("medusa_reauth_count")
          try {
            const baseUrl = getMedusaBackendUrl()
            const token = latestValidToken || getLatestTokenFromStorage()
            const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
            
            if (token) {
              const headers: Record<string, string> = {
                "Authorization": `Bearer ${token}`,
              }
              
              if (publishableKey) {
                headers["x-publishable-api-key"] = publishableKey
              }
              
              const response = await fetch(`${baseUrl}/store/customers/me`, {
                method: "GET",
                headers,
              })
              
              if (response.ok) {
                const data = await response.json()
                if (data?.customer && isMountedRef.current) {
                  setCustomer(data.customer)
                }
              } else if (response.status === 404) {
                // 检查是否是客户被删除的情况
                try {
                  const errorData = await response.json()
                  console.log("[OAuth Callback] 404 response data (final check):", errorData)
                  if (errorData?.deleted === true) {
                    console.warn("[OAuth Callback] Customer was deleted, clearing token and re-authenticating")
                    await clearAllMedusaTokens()
                    
                    const reauthCount = parseInt(sessionStorage.getItem("medusa_reauth_count") || "0")
                    if (reauthCount >= 2) {
                      if (isMountedRef.current) {
                        setError("Account recreation failed. Please contact support.")
                        setLoading(false)
                      }
                      sessionStorage.removeItem("medusa_reauth_count")
                      return
                    }
                    sessionStorage.setItem("medusa_reauth_count", (reauthCount + 1).toString())

                    window.location.replace("/auth/customer/google?prompt=select_account")
                    return
                  }
                } catch (parseError) {
                  // JSON 解析失败，继续重定向
                  console.warn("[OAuth Callback] Failed to parse 404 response (final check):", parseError)
                }
              }
            }
          } catch (customerError: any) {
            // 获取客户信息失败，继续重定向
            console.warn("Failed to get customer info:", customerError)
          }
        }
        
        // 等待确保 cookie 已设置
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 重定向到账户页面
        window.location.replace("/account")
        return
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
    
    // 清理函数：标记组件已卸载
    return () => {
      isMountedRef.current = false
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

