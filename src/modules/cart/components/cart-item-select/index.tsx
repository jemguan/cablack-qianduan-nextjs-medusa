"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type CartItemSelectProps = {
  value: string | number
  onChange: (event: { target: { value: string } }) => void
  className?: string
  children: React.ReactNode
  placeholder?: string
  "data-testid"?: string
}

const CartItemSelect = React.forwardRef<HTMLButtonElement, CartItemSelectProps>(
  ({ value, onChange, className, children, placeholder = "Select...", "data-testid": dataTestId, ...props }, ref) => {
    const handleValueChange = (newValue: string) => {
      onChange({ target: { value: newValue } })
    }

    return (
      <Select
        value={String(value)}
        onValueChange={handleValueChange}
        {...props}
      >
        <SelectTrigger
          ref={ref}
          className={cn("text-base font-medium", className)}
          data-testid={dataTestId}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === "option") {
              const childProps = child.props as { value?: string | number; children?: React.ReactNode }
              const optionValue = childProps.value
              const optionLabel = childProps.children || optionValue
              return (
                <SelectItem key={String(optionValue)} value={String(optionValue)}>
                  {optionLabel}
                </SelectItem>
              )
            }
            return null
          })}
        </SelectContent>
      </Select>
    )
  }
)

CartItemSelect.displayName = "CartItemSelect"

export default CartItemSelect
