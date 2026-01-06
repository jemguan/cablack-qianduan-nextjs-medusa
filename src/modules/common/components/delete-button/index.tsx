import { deleteLineItem, syncBundlePromotions } from "@lib/data/cart"
import { Spinner, Trash } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import { useState } from "react"
import type { HttpTypes } from "@medusajs/types"

const DeleteButton = ({
  id,
  item,
  children,
  className,
}: {
  id: string
  item?: HttpTypes.StoreCartLineItem
  children?: React.ReactNode
  className?: string
}) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      const result = await deleteLineItem(id)
      
      if (!result.success) {
        setIsDeleting(false)
        alert(result.error || "Failed to delete item. Please try again.")
        return
      }
      
      // 如果删除的是捆绑包产品，同步折扣
      // 即使同步失败也不阻止删除操作
      if (item?.metadata?.bundle_id) {
        try {
          await syncBundlePromotions()
        } catch (syncError) {
          console.error("Failed to sync bundle promotions after delete:", syncError)
          // 不抛出错误，允许删除操作完成
        }
      }
    } catch (err: any) {
      console.error("Failed to delete cart item:", err)
      setIsDeleting(false)
      // 显示错误提示给用户
      alert(err?.message || "Failed to delete item. Please try again.")
    }
  }

  return (
    <div
      className={clx(
        "flex items-center justify-between text-small-regular",
        className
      )}
    >
      <button
        className="flex gap-x-1 text-ui-fg-subtle hover:text-ui-fg-base cursor-pointer"
        onClick={() => handleDelete(id)}
      >
        {isDeleting ? <Spinner className="animate-spin" /> : <Trash />}
        <span>{children}</span>
      </button>
    </div>
  )
}

export default DeleteButton
