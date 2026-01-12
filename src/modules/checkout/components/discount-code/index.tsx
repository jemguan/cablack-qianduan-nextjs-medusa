"use client"

import { Badge, Heading, Input, Label, Text } from "@medusajs/ui"
import React from "react"
import { useRouter } from "next/navigation"
import { useFormStatus } from "react-dom"

import { applyPromotions, removePromotion } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Trash from "@modules/common/icons/trash"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)

  const { promotions = [] } = cart
  const removePromotionCode = async (code: string) => {
    try {
      setErrorMessage("")
      setHasError(false)
      // 使用专门的 removePromotion 函数来删除 promotion
      await removePromotion(code)
      // 刷新页面以更新购物车数据
      router.refresh()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to remove promotion code. Please try again."
      setErrorMessage(errorMsg)
      setHasError(true)
    }
  }

  /**
   * Extract and format friendly error messages
   */
  const getFriendlyErrorMessage = (error: any): string => {
    if (!error) {
      return "Failed to apply promotion code. Please try again."
    }

    const errorMessage = error?.message || error?.toString() || ""
    const lowerMessage = errorMessage.toLowerCase()

    // Check various error cases and return friendly English messages
    if (lowerMessage.includes("not found")) {
      return "Promotion code not found. Please check and try again."
    }

    if (lowerMessage.includes("invalid")) {
      return "Invalid promotion code. Please check and try again."
    }

    if (lowerMessage.includes("expired")) {
      return "Promotion code has expired"
    }

    if (lowerMessage.includes("already")) {
      return "This promotion code is already applied"
    }

    if (lowerMessage.includes("not applicable") || lowerMessage.includes("not valid")) {
      return "This promotion code is not applicable to your cart"
    }

    if (lowerMessage.includes("minimum")) {
      return "Minimum purchase requirement not met"
    }

    if (lowerMessage.includes("maximum") || lowerMessage.includes("usage limit")) {
      return "Promotion code usage limit reached"
    }

    if (lowerMessage.includes("network") || lowerMessage.includes("timeout")) {
      return "Network connection failed. Please check your connection and try again."
    }

    if (lowerMessage.includes("cart") && lowerMessage.includes("not found")) {
      return "Cart not found. Please refresh the page and try again."
    }

    // If error message contains Chinese characters, translate to English
    if (/[\u4e00-\u9fa5]/.test(errorMessage)) {
      // Translate common Chinese error messages to English
      // Default for Chinese errors - return generic English message
      return "Failed to apply promotion code. Please try again."
    }

    // Default: return original error message with friendly prefix
    return `Failed to apply promotion code: ${errorMessage}`
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")
    setHasError(false)
    setIsSubmitting(true)

    const code = formData.get("code")
    if (!code) {
      setIsSubmitting(false)
      return
    }
    
    // Remove leading/trailing spaces and convert to string
    const trimmedCode = code.toString().trim()
    if (!trimmedCode) {
      setErrorMessage("Please enter a valid promotion code")
      setHasError(true)
      setIsSubmitting(false)
      return
    }
    
    const input = document.getElementById("promotion-input") as HTMLInputElement
    const codes = promotions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)
    
    // 检查是否已经存在该 code（不区分大小写）
    const isAlreadyApplied = codes.some(
      (existingCode) => existingCode.toLowerCase() === trimmedCode.toLowerCase()
    )
    
    if (isAlreadyApplied) {
      setErrorMessage("This promotion code is already applied")
      setHasError(true)
      if (input) {
        input.value = ""
      }
      setIsSubmitting(false)
      return
    }
    
    codes.push(trimmedCode)

    try {
      const result = await applyPromotions(codes)
      
      // 检查折扣码是否真的被应用了
      // 即使后端返回 200，也可能没有应用某些折扣码
      if (result.success && result.appliedCodes && result.requestedCodes) {
        const codeLower = trimmedCode.toLowerCase()
        const wasApplied = result.appliedCodes.some(
          (appliedCode: string) => appliedCode.toLowerCase() === codeLower
        )
        
        if (!wasApplied) {
          // Promotion code was not applied, need to determine the reason
          // Priority check: usage limit reached (most common case)
          let errorMsg = "Promotion code usage limit reached"
          
          // Check error information in response
          if (result.errors) {
            const errorStr = JSON.stringify(result.errors).toLowerCase()
            if (errorStr.includes("limit") || errorStr.includes("usage") || errorStr.includes("maximum")) {
              errorMsg = "Promotion code usage limit reached"
            } else if (errorStr.includes("expired")) {
              errorMsg = "Promotion code has expired"
            } else if (errorStr.includes("minimum")) {
              errorMsg = "Minimum purchase requirement not met"
            } else if (errorStr.includes("not applicable") || errorStr.includes("not valid")) {
              errorMsg = "This promotion code is not applicable to your cart"
            } else if (errorStr.includes("invalid") || errorStr.includes("not found")) {
              errorMsg = "Invalid promotion code. Please check and try again."
            } else if (errorStr.includes("already")) {
              errorMsg = "This promotion code is already applied"
            } else {
              // If there's other error information, try to extract it
              errorMsg = "Invalid or inapplicable promotion code. Please verify the code."
            }
          } else {
            // If there's no explicit error information, but the code wasn't applied
            // It's likely a usage limit or other restriction
            // Check cart response for relevant information
            if (result.cart) {
              const cartStr = JSON.stringify(result.cart).toLowerCase()
              // Check for any restriction-related information
              if (cartStr.includes("limit") || cartStr.includes("usage limit") || cartStr.includes("maximum")) {
                errorMsg = "Promotion code usage limit reached"
              } else if (cartStr.includes("expired")) {
                errorMsg = "Promotion code has expired"
              } else if (cartStr.includes("minimum")) {
                errorMsg = "Minimum purchase requirement not met"
              } else {
                // Default message: usage limit reached (most common case)
                errorMsg = "Promotion code usage limit reached"
              }
            }
          }
          
          setErrorMessage(errorMsg)
          setHasError(true)
          setIsSubmitting(false)
          return
        }
      } else if (!result.success) {
        // Request failed
        setErrorMessage("Failed to apply promotion code. Please try again.")
        setHasError(true)
        setIsSubmitting(false)
        return
      }
      
      // 清除错误状态
      setHasError(false)
      // 成功时清空输入框
      if (input) {
        input.value = ""
      }
      // 刷新页面以更新购物车数据
      router.refresh()
    } catch (e: any) {
      const friendlyError = getFriendlyErrorMessage(e)
      setErrorMessage(friendlyError)
      setHasError(true)
      // 失败时不清空输入框，让用户看到他们输入的代码
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full bg-card flex flex-col">
      <div className="txt-medium">
        <form action={(a) => addPromotionCode(a)} className="w-full mb-4">
          {/* 标题和图标 */}
          <Label className="flex gap-x-2 mb-3 items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-5 h-5 text-primary"
            >
              <path fillRule="evenodd" d="M5.25 2.25a3 3 0 00-3 3v4.318a3 3 0 00.879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 005.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 00-2.122-.879H5.25zM6.375 7.5a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z" clipRule="evenodd" />
            </svg>
            <span className="txt-medium text-foreground font-medium">
              Promotion Code
            </span>
          </Label>

          {/* 输入框和按钮 - 始终显示 */}
          <div className="flex w-full gap-x-2 items-stretch">
            <Input
              className={`flex-1 bg-background text-foreground placeholder:text-muted-foreground h-10 ${
                hasError 
                  ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" 
                  : "border-border"
              }`}
              id="promotion-input"
              name="code"
              type="text"
              placeholder="Enter promotion code..."
              autoFocus={false}
              data-testid="discount-input"
              onChange={() => {
                // 用户开始输入时清除错误状态
                if (hasError) {
                  setHasError(false)
                  setErrorMessage("")
                }
              }}
            />
            <SubmitButton
              variant="secondary"
              className="border-border bg-primary hover:bg-primary/90 text-primary-foreground px-4 whitespace-nowrap h-10 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="discount-apply-button"
            >
              Apply
            </SubmitButton>
          </div>

          <ErrorMessage
            error={errorMessage}
            data-testid="discount-error-message"
          />
        </form>

        {promotions.length > 0 && (
          <div className="w-full flex items-center">
            <div className="flex flex-col w-full">
              <Heading className="txt-medium mb-2 text-foreground font-semibold">
                Promotion(s) applied:
              </Heading>

              {promotions.map((promotion) => {
                return (
                  <div
                    key={promotion.id}
                    className="flex items-center justify-between w-full max-w-full mb-2 bg-muted/20 p-2 rounded-md border border-border"
                    data-testid="discount-row"
                  >
                    <Text className="flex gap-x-1 items-baseline txt-small-plus w-4/5 pr-1 text-foreground">
                      <span className="truncate" data-testid="discount-code">
                        <Badge
                          color={promotion.is_automatic ? "green" : "grey"}
                          size="small"
                          className="font-bold"
                        >
                          {promotion.code}
                        </Badge>{" "}
                        <span className="text-muted-foreground ml-1">
                          (
                          {promotion.application_method?.value !== undefined &&
                            promotion.application_method.currency_code !==
                              undefined && (
                              <>
                                {promotion.application_method.type ===
                                "percentage"
                                  ? `${promotion.application_method.value}%`
                                  : convertToLocale({
                                      amount: +promotion.application_method.value,
                                      currency_code:
                                        promotion.application_method
                                          .currency_code,
                                    })}
                              </>
                            )}
                          )
                        </span>
                      </span>
                    </Text>
                    {/* 允许删除所有 promotion，包括自动应用的（如 bundle promotion） */}
                    <button
                      className="flex items-center text-muted-foreground hover:text-destructive transition-colors p-1"
                      onClick={() => {
                        if (!promotion.code) {
                          return
                        }

                        removePromotionCode(promotion.code)
                      }}
                      data-testid="remove-discount-button"
                    >
                      <Trash size={14} />
                      <span className="sr-only">
                        Remove discount code from order
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiscountCode
