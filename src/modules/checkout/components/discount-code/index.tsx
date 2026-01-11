"use client"

import { Badge, Heading, Input, Label, Text } from "@medusajs/ui"
import React from "react"
import { useRouter } from "next/navigation"

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

  const { promotions = [] } = cart
  const removePromotionCode = async (code: string) => {
    try {
      // 使用专门的 removePromotion 函数来删除 promotion
      await removePromotion(code)
      // 刷新页面以更新购物车数据
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to remove promotion")
    }
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")
    setIsSubmitting(true)

    const code = formData.get("code")
    if (!code) {
      setIsSubmitting(false)
      return
    }
    
    // 去除前后空格并转换为字符串
    const trimmedCode = code.toString().trim()
    if (!trimmedCode) {
      setErrorMessage("Please enter a valid promotion code")
      setIsSubmitting(false)
      return
    }
    
    const input = document.getElementById("promotion-input") as HTMLInputElement
    const codes = promotions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)
    
    // 检查是否已经存在该 code
    if (codes.includes(trimmedCode)) {
      setErrorMessage("This promotion code is already applied")
      if (input) {
        input.value = ""
      }
      setIsSubmitting(false)
      return
    }
    
    codes.push(trimmedCode)

    try {
      await applyPromotions(codes)
      // 刷新页面以更新购物车数据
      router.refresh()
    } catch (e: any) {
      setErrorMessage(e.message)
    } finally {
      setIsSubmitting(false)
    }

    if (input) {
      input.value = ""
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
              className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground h-10"
              id="promotion-input"
              name="code"
              type="text"
              placeholder="Enter promotion code..."
              autoFocus={false}
              data-testid="discount-input"
            />
            <SubmitButton
              variant="secondary"
              className="border-border bg-primary hover:bg-primary/90 text-primary-foreground px-4 whitespace-nowrap h-10"
              data-testid="discount-apply-button"
              disabled={isSubmitting}
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
