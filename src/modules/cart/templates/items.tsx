import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@medusajs/ui"

import Item from "@modules/cart/components/item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  const sortedItems = items
    ? items.sort((a, b) => {
        return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
      })
    : []
  
  return (
    <div>
      <div className="pb-3 flex items-center border-b border-border mb-4 small:mb-6">
        <Heading className="text-xl small:text-[2rem] leading-tight small:leading-[2.75rem] text-foreground">Cart</Heading>
      </div>
      
      {/* Mobile: Card Layout */}
      {sortedItems.length > 0 && (
        <div className="small:hidden flex flex-col gap-4">
          {sortedItems.map((item) => {
            return (
              <Item
                key={item.id}
                item={item}
                currencyCode={cart?.currency_code}
                isMobile={true}
              />
            )
          })}
        </div>
      )}

      {/* Desktop: Table Layout */}
      {sortedItems.length > 0 && (
        <div className="hidden small:block w-full overflow-x-auto overflow-y-hidden no-scrollbar">
          <Table className="text-foreground w-full table-fixed">
            <Table.Header className="border-t-0 border-b border-border">
              <Table.Row className="text-muted-foreground txt-medium-plus">
                <Table.HeaderCell className="px-4 w-[15%]">Item</Table.HeaderCell>
                <Table.HeaderCell className="px-4 w-[35%]"></Table.HeaderCell>
                <Table.HeaderCell className="px-4 w-[20%]">Quantity</Table.HeaderCell>
                <Table.HeaderCell className="text-right px-4 w-[15%]">
                  Price
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sortedItems.map((item) => {
                return (
                  <Item
                    key={item.id}
                    item={item}
                    currencyCode={cart?.currency_code}
                    isMobile={false}
                  />
                )
              })}
            </Table.Body>
          </Table>
        </div>
      )}
    </div>
  )
}

export default ItemsTemplate
