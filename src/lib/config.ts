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
    
    // 最后使用环境变量或默认值
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

function getSdk(): Medusa {
  if (!sdkInstance) {
    const baseUrl = getMedusaBackendUrl()
    sdkInstance = new Medusa({
      baseUrl: baseUrl,
      debug: process.env.NODE_ENV === "development",
      publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
    })
  }
  return sdkInstance
}

// 导出 SDK 实例（延迟初始化）
export const sdk = new Proxy({} as Medusa, {
  get(_target, prop) {
    return getSdk()[prop as keyof Medusa]
  }
})
