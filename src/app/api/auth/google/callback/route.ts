import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// 简单的 JWT 解码函数（仅解码 payload，不验证签名）
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    const payload = parts[1]
    // Base64 URL 解码
    const decoded = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  if (!code) {
    return NextResponse.redirect(
      new URL("/account/login?error=missing_code", request.url)
    )
  }

  try {
    const baseUrl = process.env.MEDUSA_BACKEND_URL || 
                   process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 
                   "http://localhost:9000"
    
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

    // 调用 Medusa 的 callback API
    const queryParams = new URLSearchParams()
    if (code) queryParams.set("code", code)
    if (state) queryParams.set("state", state)

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    
    if (publishableKey) {
      headers["x-publishable-api-key"] = publishableKey
    }

    const response = await fetch(
      `${baseUrl}/auth/customer/google/callback?${queryParams.toString()}`,
      {
        method: "POST",
        headers,
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Authentication failed" }))
      return NextResponse.redirect(
        new URL(`/account/login?error=${encodeURIComponent(errorData.message || "Authentication failed")}`, request.url)
      )
    }

    const data = await response.json()
    const token = data.token

    if (!token || typeof token !== "string") {
      return NextResponse.redirect(
        new URL("/account/login?error=invalid_token", request.url)
      )
    }

    // 解码 token 检查客户是否已注册
    const decodedToken = decodeJWT(token) as {
      actor_id?: string
      user_metadata?: Record<string, unknown>
      app_metadata?: Record<string, unknown>
    } | null

    // 检查 app_metadata 中是否已经有 customer_id key
    const appMetadata = decodedToken?.app_metadata || {}
    const hasCustomerIdKey = "customer_id" in appMetadata
    const customerId = appMetadata.customer_id as string | null | undefined
    
    // 如果 actor_id 不为空，客户已存在
    // 如果 actor_id 为空但 app_metadata 中已有 customer_id key，说明之前尝试过创建，不要再次创建
    const shouldCreateCustomer = 
      (!decodedToken?.actor_id || decodedToken.actor_id === "") && 
      !hasCustomerIdKey

    // 设置 token 到 cookie
    const cookieStore = await cookies()
    cookieStore.set("_medusa_jwt", token, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      sameSite: "lax", // 改为 lax 以确保重定向后 cookie 可用
      secure: process.env.NODE_ENV === "production",
      path: "/", // 确保 cookie 在所有路径可用
    })

    // 刷新 token 的辅助函数
    const refreshToken = async (currentToken: string): Promise<string | null> => {
      try {
        const refreshHeaders: Record<string, string> = {
          "Authorization": `Bearer ${currentToken}`,
          "Content-Type": "application/json",
        }
        
        if (publishableKey) {
          refreshHeaders["x-publishable-api-key"] = publishableKey
        }

        const refreshResponse = await fetch(`${baseUrl}/auth/token/refresh`, {
          method: "POST",
          headers: refreshHeaders,
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          if (refreshData.token) {
            // 更新 cookie 中的 token
            cookieStore.set("_medusa_jwt", refreshData.token, {
              maxAge: 60 * 60 * 24 * 7,
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              path: "/",
            })
            return refreshData.token
          }
        }
      } catch (refreshError) {
        // 忽略刷新错误
      }
      return null
    }

    // 如果 app_metadata 中已有 customer_id key，直接刷新 token（不要尝试创建）
    // 这避免了 "customer_id already exists" 错误
    if (hasCustomerIdKey && (!decodedToken?.actor_id || decodedToken.actor_id === "")) {
      // customer_id key 已存在但 actor_id 为空，刷新 token 以获取最新信息
      const refreshedToken = await refreshToken(token)
      
      // 如果刷新成功，验证客户是否可以访问
      if (refreshedToken) {
        try {
          const verifyHeaders: Record<string, string> = {
            "Authorization": `Bearer ${refreshedToken}`,
            "Content-Type": "application/json",
          }
          
          if (publishableKey) {
            verifyHeaders["x-publishable-api-key"] = publishableKey
          }

          const verifyResponse = await fetch(`${baseUrl}/store/customers/me`, {
            method: "GET",
            headers: verifyHeaders,
          })

          // 如果仍然无法访问，可能需要等待或客户确实不存在
        } catch (verifyError) {
          // 忽略验证错误
        }
      }
    }
    // 如果客户不存在且没有 customer_id key，先尝试获取客户信息（可能客户已存在但 token 未更新）
    else if (shouldCreateCustomer && decodedToken?.user_metadata?.email) {
      const email = decodedToken.user_metadata.email as string
      
      // 先尝试获取客户信息
      try {
        const checkHeaders: Record<string, string> = {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
        
        if (publishableKey) {
          checkHeaders["x-publishable-api-key"] = publishableKey
        }

        const checkResponse = await fetch(`${baseUrl}/store/customers/me`, {
          method: "GET",
          headers: checkHeaders,
        })

        if (checkResponse.ok) {
          // 客户已存在，刷新 token 即可
          await refreshToken(token)
        } else {
          // 客户不存在，尝试创建
          try {
            const createHeaders: Record<string, string> = {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            }
            
            if (publishableKey) {
              createHeaders["x-publishable-api-key"] = publishableKey
            }

            const createResponse = await fetch(`${baseUrl}/store/customers`, {
              method: "POST",
              headers: createHeaders,
              body: JSON.stringify({
                email: email,
              }),
            })

            if (createResponse.ok) {
              // 客户创建成功，刷新 token
              await refreshToken(token)
            } else {
              // 创建失败，检查是否是 customer_id already exists 错误
              const errorData = await createResponse.json().catch(() => null)
              const errorMessage = errorData?.message || ""
              
              if (
                errorMessage.includes("customer_id already exists") ||
                errorMessage.includes("Key customer_id already exists")
              ) {
                // customer_id key 已存在，说明客户可能已通过其他方式创建
                // 刷新 token 以获取最新的客户信息
                await refreshToken(token)
              } else {
                // 其他错误，也尝试刷新 token（可能客户已通过其他方式创建）
                await refreshToken(token)
              }
            }
          } catch (createError) {
            // 即使创建失败，也尝试刷新 token
            await refreshToken(token)
          }
        }
      } catch (checkError) {
        // 检查失败，尝试创建客户
        try {
          const createHeaders: Record<string, string> = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          }
          
          if (publishableKey) {
            createHeaders["x-publishable-api-key"] = publishableKey
          }

          const createResponse = await fetch(`${baseUrl}/store/customers`, {
            method: "POST",
            headers: createHeaders,
            body: JSON.stringify({
              email: email,
            }),
          })

          if (createResponse.ok) {
            await refreshToken(token)
          } else {
            // 即使创建失败，也刷新 token
            await refreshToken(token)
          }
        } catch (createError) {
          // 即使创建失败，也尝试刷新 token
          await refreshToken(token)
        }
      }
    } else if (!shouldCreateCustomer) {
      // 客户已存在（actor_id 不为空），刷新 token 以确保获取最新信息
      await refreshToken(token)
    }

    // 重定向到账户页面
    return NextResponse.redirect(new URL("/account", request.url))
  } catch (error: any) {
    return NextResponse.redirect(
      new URL(`/account/login?error=${encodeURIComponent(error.message || "Authentication failed")}`, request.url)
    )
  }
}

