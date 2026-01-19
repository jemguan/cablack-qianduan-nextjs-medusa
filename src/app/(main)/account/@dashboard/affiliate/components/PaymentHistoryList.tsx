"use client"

import { useState } from "react"
import { FaChevronDown } from "react-icons/fa"
import type { PaymentHistoryData, PaymentRecord } from "../types"
import { formatCurrency, formatDateTimeDetailed } from "../utils"
import { usePagination } from "../hooks"
import { Pagination } from "./Pagination"

interface PaymentHistoryListProps {
  paymentHistory: PaymentHistoryData | null
  isLoading: boolean
}

function PaymentRecordItem({ record, index }: { record: PaymentRecord; index: number }) {
  return (
    <div className="border border-border/50 rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-all duration-200 bg-card">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{formatDateTimeDetailed(record.paid_at)}</p>
        <span className="px-2 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
          Paid
        </span>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {record.commission_count} commission{record.commission_count !== 1 ? "s" : ""}
        </p>
        <p className="text-lg font-semibold text-green-600 dark:text-green-500">
          {formatCurrency(record.amount)}
        </p>
      </div>
      {record.order_display_ids && record.order_display_ids.length > 0 ? (
        <div className="text-xs text-muted-foreground mt-1">
          Orders: {record.order_display_ids.slice(0, 3).map((id) => `#${id}`).join(", ")}
          {record.order_display_ids.length > 3 &&
            ` and ${record.order_display_ids.length - 3} more`}
        </div>
      ) : record.order_ids && record.order_ids.length > 0 ? (
        <div className="text-xs text-muted-foreground mt-1">
          Orders: {record.order_ids.slice(0, 3).map((id) => `#${id.slice(0, 8)}`).join(", ")}
          {record.order_ids.length > 3 && ` and ${record.order_ids.length - 3} more`}
        </div>
      ) : null}
    </div>
  )
}

function PaymentNote() {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
      <p className="text-sm text-blue-800 dark:text-blue-200">
        💡 <strong>Payment Note:</strong> Please contact the administrator to request a withdrawal.
        The withdrawal amount is your pending balance (approved commissions).
      </p>
    </div>
  )
}

export function PaymentHistoryList({ paymentHistory, isLoading }: PaymentHistoryListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const records = paymentHistory?.payment_records || []
  const {
    currentPage,
    totalPages,
    paginatedItems,
    goToNextPage,
    goToPrevPage,
    hasNextPage,
    hasPrevPage,
  } = usePagination(records)

  return (
    <div className="border border-border/50 rounded-xl p-6 bg-card shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4 hover:opacity-70 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1 min-h-[44px]"
        aria-label={isExpanded ? "Collapse payment history" : "Expand payment history"}
        aria-expanded={isExpanded}
      >
        <h2 className="text-lg-semi text-foreground">Payment History</h2>
        <FaChevronDown
          className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          size={20}
        />
      </button>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : paymentHistory && records.length > 0 ? (
        isExpanded && (
          <div className="space-y-4">
            <PaymentNote />

            {/* 统计摘要 */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 border border-border/50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground font-medium">Total Paid:</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-500">
                  {formatCurrency(paymentHistory.total_paid)}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground font-medium">Payment Count:</p>
                <p className="text-sm font-medium text-foreground">{records.length} times</p>
              </div>
            </div>

            {/* 提现记录列表 */}
            <div className="space-y-3">
              {paginatedItems.map((record, index) => (
                <PaymentRecordItem key={record.paid_at || index} record={record} index={index} />
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
          </div>
        )
      ) : isExpanded ? (
        <div className="space-y-4">
          <PaymentNote />
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No payment records yet</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
