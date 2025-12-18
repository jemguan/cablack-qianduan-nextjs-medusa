"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { subscribeToNewsletter } from "@lib/data/newsletter"
import type { NewsletterProps, NewsletterFormState } from "./types"

/**
 * Newsletter 订阅组件
 * 用于在 Footer 中收集用户邮箱订阅
 * 
 * 使用 Medusa 标准方式：
 * - 调用 Server Action subscribeToNewsletter
 * - Server Action 使用 Medusa JS SDK 调用后端 /store/newsletter API
 * - 后端发出 newsletter.signup 事件，由订阅者处理
 */
export function Newsletter({
  title,
  description,
  placeholder = "Enter your email",
  className,
}: NewsletterProps) {
  const [formState, setFormState] = useState<NewsletterFormState>("idle")
  const [email, setEmail] = useState("")
  const [isClient, setIsClient] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")

  // 确保只在客户端渲染表单
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 订阅成功后5秒自动隐藏表单和提示信息
  useEffect(() => {
    if (formState === "success") {
      const timer = setTimeout(() => {
        setFormState("idle")
        setErrorMessage("")
        setEmail("")
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [formState])

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // 验证邮箱格式
    if (!email || !isValidEmail(email)) {
      setFormState("error")
      setErrorMessage("Please enter a valid email address")
      return
    }

    setFormState("submitting")
    setErrorMessage("")

    try {
      await subscribeToNewsletter(email)

      setFormState("success")
      setEmail("")
    } catch (error) {
      console.error("Newsletter subscription error:", error)
      setFormState("error")
      setErrorMessage(
        error instanceof Error ? error.message : "Subscription failed, please try again"
      )
    }
  }

  // 在服务端渲染时显示占位符
  if (!isClient) {
    return (
      <div className={cn("w-full", className)}>
        {title && (
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        )}
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-muted/20 rounded-md animate-pulse" />
          <div className="w-24 h-10 bg-muted/20 rounded-md animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}

      {(formState === "idle" || formState === "submitting" || formState === "error") && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              required
              disabled={formState === "submitting"}
              className="flex-1"
              aria-label="Email address"
            />
            <Button
              type="submit"
              disabled={formState === "submitting"}
              size="default"
            >
              {formState === "submitting" ? "Subscribing..." : "Subscribe"}
            </Button>
          </div>

          {/* 错误提示 */}
          {formState === "error" && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errorMessage || "Something went wrong. Please try again."}
            </p>
          )}
        </form>
      )}

      {/* 成功提示 - 5秒后自动消失 */}
      {formState === "success" && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Thank you for subscribing! We'll be in touch soon.
        </p>
      )}
    </div>
  )
}

/**
 * 验证邮箱格式
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

