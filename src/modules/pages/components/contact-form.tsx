"use client"

import React, { useState } from "react"
import { Button, Input, Label, Textarea } from "@medusajs/ui"

/**
 * 获取 Medusa 后端 URL
 */
function getMedusaBackendUrl(): string {
  if (typeof window !== 'undefined') {
    return (window as any).__MEDUSA_BACKEND_URL__ || 
           process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 
           "http://localhost:9000"
  }
  return process.env.MEDUSA_BACKEND_URL || 
         process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 
         "http://localhost:9000"
}

interface ContactFormProps {
  title?: string
  subtitle?: string
  recipientEmail?: string
  showTitle?: boolean
  showSubtitle?: boolean
}

export const ContactForm: React.FC<ContactFormProps> = ({
  title = "Contact Us",
  subtitle = "Have a question or feedback? We'd love to hear from you.",
  recipientEmail,
  showTitle = true,
  showSubtitle = true,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    order_id: "",
    message: "",
  })
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("submitting")
    setErrorMessage("")

    try {
      const backendUrl = getMedusaBackendUrl()
      const response = await fetch(`${backendUrl}/store/contact-form`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 这里的 x-publishable-api-key 可能需要从环境变量获取，或者在 storefront 中有全局配置
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        },
        body: JSON.stringify({
          ...formData,
          recipient_email: recipientEmail,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to send message")
      }

      setStatus("success")
      setFormData({ name: "", email: "", order_id: "", message: "" })
    } catch (error: any) {
      console.error("Contact form error:", error)
      setStatus("error")
      setErrorMessage(error.message || "An error occurred. Please try again later.")
    }
  }

  if (status === "success") {
    return (
      <div className="bg-ui-bg-subtle p-8 rounded-lg text-center max-w-2xl mx-auto my-12 border border-ui-border-base">
        <div className="mb-4 flex justify-center">
          <div className="bg-green-100 p-3 rounded-full">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
        <p className="text-ui-fg-subtle mb-6">
          Thank you for contacting us. We've received your message and will get back to you as soon as possible.
        </p>
        <Button onClick={() => setStatus("idle")} variant="secondary">
          Send Another Message
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto my-12 p-8 bg-background border border-ui-border-base rounded-xl shadow-sm">
      {(showTitle || showSubtitle) && (
        <div className="mb-8 text-center">
          {showTitle && <h2 className="text-3xl font-bold mb-2">{title}</h2>}
          {showSubtitle && <p className="text-ui-fg-subtle">{subtitle}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              required
              className="bg-ui-bg-field"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              className="bg-ui-bg-field"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="order_id">Order Number (Optional)</Label>
          <Input
            id="order_id"
            name="order_id"
            value={formData.order_id}
            onChange={handleChange}
            placeholder="e.g. #12345"
            className="bg-ui-bg-field"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message *</Label>
          <Textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="How can we help you?"
            required
            rows={5}
            className="bg-ui-bg-field resize-none"
          />
        </div>

        {status === "error" && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm border border-red-100">
            {errorMessage}
          </div>
        )}

        <div className="flex justify-center">
          <Button
            type="submit"
            className="w-full md:w-auto px-12 py-3"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "Sending..." : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  )
}

