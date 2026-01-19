"use client"

import { Button, clx } from "@medusajs/ui"
import React from "react"
import { useFormStatus } from "react-dom"

export function SubmitButton({
  children,
  variant = "primary",
  className,
  disabled,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "transparent" | "danger" | null
  className?: string
  disabled?: boolean
  "data-testid"?: string
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      size="large"
      className={clx(className, {
        "bg-primary text-primary-foreground hover:bg-primary/90 border-none": variant === "primary",
        "bg-muted text-foreground hover:bg-muted/80 border-border": variant === "secondary",
      })}
      type="submit"
      isLoading={pending}
      disabled={disabled || pending}
      variant={variant || "primary"}
      data-testid={dataTestId}
    >
      {children}
    </Button>
  )
}
