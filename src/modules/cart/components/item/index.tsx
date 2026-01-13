"use client"

import { Table, Text, clx } from "@medusajs/ui"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemCustomOptions from "@modules/common/components/line-item-custom-options"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
  isMobile?: boolean
}

const Item = ({ item, type = "full", currencyCode, isMobile = false }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  // TODO: Update this to grab the actual max inventory
  const maxQtyFromInventory = 10
  const maxQuantity = item.variant?.manage_inventory ? 10 : maxQtyFromInventory

  // Mobile Card Layout
  if (isMobile && type === "full") {
    return (
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm" data-testid="product-row-mobile">
        <div className="flex gap-4">
          {/* Product Image */}
          <LocalizedClientLink
            href={`/products/${item.product_handle}`}
            className="shrink-0"
          >
            <Thumbnail
              thumbnail={item.thumbnail}
              images={item.variant?.images || item.variant?.product?.images}
              size="square"
              className="rounded-lg border border-border w-24 h-24 small:w-20 small:h-20"
            />
          </LocalizedClientLink>

          {/* Product Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
            <div className="flex-1">
              <LocalizedClientLink href={`/products/${item.product_handle}`}>
                <Text
                  className="text-base font-semibold text-foreground line-clamp-2 mb-1.5"
                  data-testid="product-title"
                >
                  {item.product_title}
                </Text>
              </LocalizedClientLink>
              <div className="text-muted-foreground text-xs mb-2">
                <LineItemOptions variant={item.variant} data-testid="product-variant" />
              </div>
              <div className="flex items-center justify-between gap-2">
              <div className="text-foreground font-bold text-lg">
                <LineItemPrice
                  item={item}
                  style="tight"
                  currencyCode={currencyCode}
                  showPreTaxPrice={true}
                  />
                </div>
                <DeleteButton 
                  id={item.id}
                  item={item}
                  data-testid="product-delete-button" 
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-2 min-w-[44px] flex items-center justify-center" 
                />
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
              <div className="flex items-center gap-2 relative z-0 min-w-0 flex-1">
                <span className="text-sm text-muted-foreground whitespace-nowrap shrink-0">Quantity:</span>
                <div className="relative z-10 shrink-0">
                  <CartItemSelect
                    value={item.quantity}
                    onChange={(value) => changeQuantity(parseInt(value.target.value))}
                    className="w-20 h-10 text-center shrink-0"
                    data-testid="product-select-button"
                  >
                  {Array.from(
                    {
                      length: Math.min(maxQuantity, 10),
                    },
                    (_, i) => (
                      <option value={i + 1} key={i}>
                        {i + 1}
                      </option>
                    )
                  )}
                  </CartItemSelect>
                </div>
                {updating && <Spinner className="w-4 h-4 text-primary animate-spin ml-1 shrink-0" />}
              </div>
            </div>
            <ErrorMessage error={error} data-testid="product-error-message" className="mt-1 text-xs" />
          </div>
        </div>
      </div>
    )
  }

  // Desktop Table Layout
  return (
    <Table.Row className="w-full border-b border-border transition-colors hover:bg-muted/5" data-testid="product-row">
      <Table.Cell className="p-4">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className={clx("flex", {
            "w-16": type === "preview",
            "small:w-20 w-12": type === "full",
          })}
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.images || item.variant?.product?.images}
            size="square"
            className="rounded-lg border border-border"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="text-left overflow-hidden px-4">
        <Text
          className="txt-medium-plus text-foreground font-bold line-clamp-2"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <div className="text-muted-foreground text-xs mt-1 truncate">
          <LineItemOptions variant={item.variant} data-testid="product-variant" />
        </div>
        <LineItemCustomOptions item={item} currencyCode={currencyCode} />
      </Table.Cell>

      {type === "full" && (
        <Table.Cell className="px-4">
          <div className="flex gap-2 items-center flex-wrap">
            <DeleteButton id={item.id} item={item} data-testid="product-delete-button" className="text-muted-foreground hover:text-destructive transition-colors shrink-0" />
            <CartItemSelect
              value={item.quantity}
              onChange={(value) => changeQuantity(parseInt(value.target.value))}
              className="w-14 h-9 text-center shrink-0"
              data-testid="product-select-button"
            >
              {/* TODO: Update this with the v2 way of managing inventory */}
              {Array.from(
                {
                  length: Math.min(maxQuantity, 10),
                },
                (_, i) => (
                  <option value={i + 1} key={i}>
                    {i + 1}
                  </option>
                )
              )}
            </CartItemSelect>
            {updating && <Spinner className="w-4 h-4 text-primary animate-spin" />}
          </div>
          <ErrorMessage error={error} data-testid="product-error-message" className="mt-1" />
        </Table.Cell>
      )}

      <Table.Cell className="text-right px-4">
        <div className="text-foreground font-bold text-lg">
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
            showPreTaxPrice={true}
          />
        </div>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
