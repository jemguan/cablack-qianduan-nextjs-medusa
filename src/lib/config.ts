import Medusa from "@medusajs/js-sdk"

// Defaults to standard port for Medusa server
// 优先使用客户端环境变量（NEXT_PUBLIC_*），如果没有则使用服务端环境变量
let MEDUSA_BACKEND_URL = "http://localhost:9000"

if (typeof window !== 'undefined') {
  // 客户端：使用 NEXT_PUBLIC_ 前缀的环境变量
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || MEDUSA_BACKEND_URL
} else {
  // 服务端：可以使用不带 NEXT_PUBLIC_ 前缀的环境变量
  MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || MEDUSA_BACKEND_URL
}

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})
