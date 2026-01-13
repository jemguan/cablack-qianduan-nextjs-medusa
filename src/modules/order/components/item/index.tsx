"use client"

import { HttpTypes } from "@medusajs/types"
import { Table, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LineItemCustomOptions from "@modules/common/components/line-item-custom-options"
import Thumbnail from "@modules/products/components/thumbnail"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
}

const Item = ({ item, currencyCode }: ItemProps) => {
  // 检测是否为移动端
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <div className="flex w-16">
          <Thumbnail thumbnail={item.thumbnail} size="square" />
        </div>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          className="txt-medium-plus text-ui-fg-base"
          data-testid="product-name"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
        {/* 移动端：将选项放在价格上方 */}
        {isMobile && (
          <div className="mt-2">
            <LineItemCustomOptions item={item} currencyCode={currencyCode} />
          </div>
        )}
        {/* 桌面端：选项在价格上方 */}
        {!isMobile && (
          <LineItemCustomOptions item={item} currencyCode={currencyCode} />
        )}
        {/* 移动端：价格放在选项下方 */}
        {isMobile && (
          <div className="mt-2">
            <LineItemUnitPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
              showPreTaxPrice={true}
            />
          </div>
        )}
      </Table.Cell>

      {/* 桌面端：显示价格 */}
      {!isMobile && (
        <Table.Cell className="!pr-0">
          <span className="!pr-0 flex flex-col items-end h-full justify-center">
            <span className="flex gap-x-1 ">
              <Text className="text-ui-fg-muted">
                <span data-testid="product-quantity">{item.quantity}</span>x{" "}
              </Text>
              <LineItemUnitPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
                showPreTaxPrice={true}
              />
            </span>
          </span>
        </Table.Cell>
      )}
    </Table.Row>
  )
}

export default Item
