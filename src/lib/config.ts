import Medusa from "@medusajs/js-sdk"

/**
 * 获取 Medusa 后端 URL（运行时动态获取）
 * 优先使用客户端环境变量（NEXT_PUBLIC_*），如果没有则使用服务端环境变量
 */
function getMedusaBackendUrl(): string {
  if (typeof window !== 'undefined') {
    // 客户端：优先使用从 HTML 注入的 URL（window.__MEDUSA_BACKEND_URL__）
    // 这样可以确保在生产环境中使用正确的 URL，即使构建时环境变量未设置
    const windowUrl = (window as any).__MEDUSA_BACKEND_URL__
    const envUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
    
    // 优先使用 window 对象中的 URL（从服务端注入，包含正确的环境变量）
    if (windowUrl && !windowUrl.includes('localhost')) {
      return windowUrl
    }
    
    // 其次使用环境变量中的 URL
    if (envUrl && !envUrl.includes('localhost')) {
      return envUrl
    }
    
    // 如果 window 对象中有 URL（即使是 localhost），也使用它（开发环境）
    if (windowUrl) {
      return windowUrl
    }
    
    // 使用环境变量或默认值
    return envUrl || "http://localhost:9000"
  } else {
    // 服务端：可以使用不带 NEXT_PUBLIC_ 前缀的环境变量
    return process.env.MEDUSA_BACKEND_URL || 
           process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 
           "http://localhost:9000"
  }
}

// 延迟初始化 SDK，使用运行时获取的 URL
let sdkInstance: Medusa | null = null
let sdkInitError: Error | null = null

function getSdk(): Medusa {
  // 如果之前初始化失败，抛出错误
  if (sdkInitError) {
    throw sdkInitError
  }
  
  if (!sdkInstance) {
    try {
      const baseUrl = getMedusaBackendUrl()
      const isServer = typeof window === 'undefined'
      const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      
      // 调试日志：仅在服务端输出，避免客户端暴露敏感信息
      if (isServer && process.env.NODE_ENV === "development") {
        console.log('[Medusa SDK] Initializing with:', {
          baseUrl,
          isServer,
          hasPublishableKey: !!publishableKey,
        })
      }
      
      // 验证必要的配置
      if (!baseUrl) {
        throw new Error("MEDUSA_BACKEND_URL is not configured")
      }
      
      sdkInstance = new Medusa({
        baseUrl: baseUrl,
        debug: process.env.NODE_ENV === "development",
        publishableKey: publishableKey,
        // 配置认证方式
        // 服务端使用 "nostore" 避免 localStorage 错误
        // 客户端使用默认的 localStorage
        auth: {
          type: "jwt",
          jwtTokenStorageMethod: isServer ? "nostore" : "local",
        },
      })
      
      // 验证 SDK 初始化成功
      if (!sdkInstance) {
        throw new Error("Medusa SDK initialization returned null")
      }
      
      // 验证 auth 模块存在
      if (!sdkInstance.auth) {
        console.error('[Medusa SDK] WARNING: auth module is null after initialization')
      }
    } catch (error: any) {
      console.error('[Medusa SDK] Initialization failed:', error.message)
      sdkInitError = error
      throw error
    }
  }
  return sdkInstance
}

/**
 * 创建一个安全的 auth 代理
 * 当 SDK 未初始化时返回空操作
 */
function createSafeAuthProxy() {
  return new Proxy({} as any, {
    get(_target, prop) {
      // 返回一个 async 函数，避免解构错误
      return async () => {
        throw new Error("Medusa SDK not initialized. Check MEDUSA_BACKEND_URL configuration.")
      }
    }
  })
}

// 导出 SDK 实例（延迟初始化，带安全回退）
export const sdk = new Proxy({} as Medusa, {
  get(_target, prop) {
    try {
      const instance = getSdk()
      const value = instance[prop as keyof Medusa]
      
      // 如果 auth 属性为 null，返回安全代理
      if (prop === 'auth' && !value) {
        return createSafeAuthProxy()
      }
      
      return value
    } catch (error) {
      // 如果初始化失败且请求的是 auth，返回安全代理
      if (prop === 'auth') {
        return createSafeAuthProxy()
      }
      throw error
    }
  }
})
