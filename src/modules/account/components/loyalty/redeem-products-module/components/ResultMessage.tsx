"use client"

import clsx from "clsx"
import type { ResultMessageProps } from "../types"

/**
 * 兑换结果消息组件
 */
export function ResultMessage({
  result,
  onCopyCode,
  onGoToCart,
}: ResultMessageProps) {
  return (
    <div
      className={clsx(
        "rounded-lg p-4",
        result.success
          ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
          : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
      )}
    >
      {result.success ? (
        <div>
          <p className="text-green-700 dark:text-green-300 font-medium">
            {result.message}
          </p>
          {result.code && (
            <div className="mt-3 bg-white dark:bg-gray-900 rounded-lg p-3 border border-green-300 dark:border-green-700">
              <p className="text-xs text-muted-foreground mb-1">
                Product discount code (auto-applied)
              </p>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg text-green-800 dark:text-green-200 select-all">
                  {result.code}
                </span>
                <button
                  onClick={() => onCopyCode(result.code!)}
                  className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
          {result.showCartLink && (
            <button
              onClick={onGoToCart}
              className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              🛒 Go to Cart
            </button>
          )}
        </div>
      ) : (
        <p className="text-red-700 dark:text-red-300">{result.message}</p>
      )}
    </div>
  )
}
