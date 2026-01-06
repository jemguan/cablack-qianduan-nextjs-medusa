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
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

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

    const code = formData.get("code")
    if (!code) {
      return
    }
    
    // 去除前后空格并转换为字符串
    const trimmedCode = code.toString().trim()
    if (!trimmedCode) {
      setErrorMessage("Please enter a valid promotion code")
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
      return
    }
    
    codes.push(trimmedCode)

    try {
      await applyPromotions(codes)
      // 刷新页面以更新购物车数据
      router.refresh()
    } catch (e: any) {
      setErrorMessage(e.message)
    }

    if (input) {
      input.value = ""
    }
  }

  return (
    <div className="w-full bg-card flex flex-col">
      <div className="txt-medium">
        <form action={(a) => addPromotionCode(a)} className="w-full mb-5">
          <Label className="flex gap-x-1 my-2 items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="txt-medium text-primary hover:text-primary/80 transition-colors font-medium"
              data-testid="add-discount-button"
            >
              Add Promotion Code(s)
            </button>
          </Label>

          {isOpen && (
            <>
              <div className="flex w-full gap-x-2">
                <Input
                  className="size-full bg-background border-border text-foreground"
                  id="promotion-input"
                  name="code"
                  type="text"
                  autoFocus={false}
                  data-testid="discount-input"
                />
                <SubmitButton
                  variant="secondary"
                  className="border-border bg-muted hover:bg-muted/80 text-foreground"
                  data-testid="discount-apply-button"
                >
                  Apply
                </SubmitButton>
              </div>

              <ErrorMessage
                error={errorMessage}
                data-testid="discount-error-message"
              />
            </>
          )}
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
