"use client"

import { useState } from "react"
import { FaChevronDown } from "react-icons/fa"
import type { Commission } from "../types"
import { formatCurrency, formatDateTime, getOrderNumber } from "../utils"
import { usePagination } from "../hooks"
import { Pagination } from "./Pagination"

interface CommissionsListProps {
  commissions: Commission[]
  autoApproveDays: number
}

function CommissionItem({ commission }: { commission: Commission }) {
  const orderNumber = getOrderNumber(commission.order_id, commission.order_display_id)
  const isVoid = commission.status === "VOID"
  const hasRefundInfo = !!commission.void_reason

  return (
    <div
      className={`flex items-start justify-between py-3 border-b border-border/50 last:border-0 ${
        isVoid ? "opacity-60" : ""
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-foreground">Order {orderNumber}</p>
          {(isVoid || hasRefundInfo) && (
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs font-medium rounded">
              {isVoid ? "Returned" : "Refunded"}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-1">{formatDateTime(commission.created_at)}</p>
        {isVoid && commission.void_reason && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-400">
            <p className="font-medium mb-1">Void Reason:</p>
            <p>{commission.void_reason}</p>
          </div>
        )}
      </div>
      <div className="text-right ml-4">
        <p
          className={`text-sm font-semibold ${
            isVoid ? "line-through text-muted-foreground" : "text-foreground"
          }`}
        >
          {formatCurrency(commission.amount)}
        </p>
        <p className="text-xs text-muted-foreground">
          {commission.status === "PENDING" && "Pending"}
          {commission.status === "APPROVED" && "Approved"}
          {commission.status === "PAID" && "Paid"}
          {commission.status === "VOID" && "Void"}
        </p>
      </div>
    </div>
  )
}

export function CommissionsList({ commissions, autoApproveDays }: CommissionsListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    currentPage,
    totalPages,
    paginatedItems,
    goToNextPage,
    goToPrevPage,
    hasNextPage,
    hasPrevPage,
  } = usePagination(commissions)

  if (!commissions || commissions.length === 0) {
    return null
  }

  return (
    <div className="border border-border/50 rounded-xl p-6 bg-card shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4 hover:opacity-70 transition-opacity cursor-pointer"
      >
        <h2 className="text-lg-semi text-foreground">Recent Commissions</h2>
        <FaChevronDown
          className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          size={20}
        />
      </button>

      {isExpanded && (
        <>
          {/* 自动审核提示 */}
          {autoApproveDays > 0 ? (
            <div className="mb-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Auto-approval:</strong> Commissions will be automatically approved after{" "}
                <strong>{autoApproveDays}</strong> days
              </p>
            </div>
          ) : (
            <div className="mb-4 bg-muted/50 border border-border/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Review Note:</strong> Commissions require manual approval by an
                administrator
              </p>
            </div>
          )}

          <div className="space-y-3">
            {paginatedItems.map((commission) => (
              <CommissionItem key={commission.id} commission={commission} />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevPage={goToPrevPage}
            onNextPage={goToNextPage}
            hasPrevPage={hasPrevPage}
            hasNextPage={hasNextPage}
          />
        </>
      )}
    </div>
  )
}
