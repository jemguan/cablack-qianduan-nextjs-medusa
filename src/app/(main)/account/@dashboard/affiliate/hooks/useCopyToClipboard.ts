"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

type CopyType = "link" | "code" | "product"

/**
 * 复制到剪贴板 Hook
 */
export function useCopyToClipboard() {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedProductLink, setCopiedProductLink] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, type: CopyType) => {
    try {
      await navigator.clipboard.writeText(text)

      if (type === "link") {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      } else if (type === "code") {
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
      } else if (type === "product") {
        setCopiedProductLink(text)
        setTimeout(() => setCopiedProductLink(null), 2000)
      }

      toast.success("Copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy")
    }
  }, [])

  return {
    copiedLink,
    copiedCode,
    copiedProductLink,
    copyToClipboard,
  }
}
