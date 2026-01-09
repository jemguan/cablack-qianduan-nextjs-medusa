"use client"

import { useState } from "react"
import {
  LoyaltyTransaction,
  LoyaltyTransactionType,
  TRANSACTION_TYPE_LABELS,
} from "@/types/loyalty"
import { getLoyaltyTransactions } from "@lib/data/loyalty"
import clsx from "clsx"

interface LoyaltyTransactionsProps {
  initialTransactions: LoyaltyTransaction[]
  totalCount: number
  pageSize?: number
}

export default function LoyaltyTransactions({
  initialTransactions,
  totalCount,
  pageSize = 6,
}: LoyaltyTransactionsProps) {
  // 初始只显示前 pageSize 条记录
  const [transactions, setTransactions] =
    useState<LoyaltyTransaction[]>(initialTransactions.slice(0, pageSize))
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [count, setCount] = useState(totalCount || initialTransactions.length)

  const totalPages = Math.ceil(count / pageSize)

  const loadPage = async (page: number) => {
    setIsLoading(true)
    try {
      const result = await getLoyaltyTransactions({ page, limit: pageSize })
      setTransactions(result.transactions)
      setCount(result.count)
      setCurrentPage(page)
    } catch (error) {
      console.error("Failed to load transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTypeLabel = (type: string) => {
    return TRANSACTION_TYPE_LABELS[type as LoyaltyTransactionType] || type
  }

  const getOrderId = (tx: LoyaltyTransaction): string | null => {
    if (tx.type === "EARN_ORDER" && tx.reference_id) {
      return tx.reference_id
    }
    if (
      (tx.type === "REFUND_DEDUCT" || tx.type === "REFUND_CLAWBACK") &&
      tx.metadata?.original_order_id
    ) {
      return tx.metadata.original_order_id
    }
    return null
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto mb-4 opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p>No transaction history</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        className={clsx(
          "divide-y divide-border rounded-lg border",
          isLoading && "opacity-50 pointer-events-none"
        )}
      >
        {transactions.map((tx) => {
          const orderId = getOrderId(tx)
          return (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getTypeLabel(tx.type)}</span>
                  {orderId && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      #{orderId.replace("order_", "").substring(0, 8)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(tx.created_at)}
                </p>
              </div>
              <span
                className={clsx(
                  "text-lg font-semibold",
                  tx.amount > 0 ? "text-green-600" : "text-red-500"
                )}
              >
                {tx.amount > 0 ? "+" : ""}
                {tx.amount.toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => loadPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground px-3">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => loadPage(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
