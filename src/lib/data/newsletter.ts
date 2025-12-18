"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"

/**
 * 订阅 Newsletter
 * 使用 Medusa JS SDK 调用后端 API
 * 
 * @param email - 用户邮箱地址
 * @param firstName - 用户名字（可选）
 * @param lastName - 用户姓氏（可选）
 */
export async function subscribeToNewsletter(
  email: string,
  firstName?: string,
  lastName?: string
) {
  // Medusa JS SDK 的 client.fetch 会自动解析 JSON，返回的是数据对象
  // 使用 .then() 和 .catch() 处理响应和错误
  return sdk.client
    .fetch(`/store/newsletter`, {
      method: "POST",
      body: {
        email,
        first_name: firstName,
        last_name: lastName,
      },
    })
    .then((data) => {
      return {
        success: true,
        message: data.message || "Successfully subscribed",
      }
    })
    .catch((err) => {
      console.error("Newsletter subscription error:", err)
      // medusaError 会抛出错误，所以这里直接使用它
      medusaError(err)
    })
}

