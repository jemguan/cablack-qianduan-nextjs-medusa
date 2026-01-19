"use client"

import { FaCopy, FaCheck } from "react-icons/fa"

interface AffiliateLinkCardProps {
  title: string
  value: string
  isCopied: boolean
  onCopy: () => void
  isMono?: boolean
}

export function AffiliateLinkCard({
  title,
  value,
  isCopied,
  onCopy,
  isMono = false,
}: AffiliateLinkCardProps) {
  return (
    <div className="border border-border/50 rounded-xl p-6 bg-card shadow-sm">
      <h2 className="text-lg-semi mb-4 text-foreground">{title}</h2>
      <div className="flex items-center gap-3">
        <input
          type="text"
          readOnly
          value={value}
          className={`flex-1 px-4 py-2 border border-border/50 rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 ${
            isMono ? "font-mono" : ""
          }`}
        />
        <button
          onClick={onCopy}
          className="px-5 py-2 bg-card border border-border/50 rounded-lg hover:bg-muted/50 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] min-w-[44px]"
          aria-label={isCopied ? `${title} copied to clipboard` : `Copy ${title.toLowerCase()}`}
        >
          {isCopied ? (
            <FaCheck size={16} className="text-primary" />
          ) : (
            <FaCopy size={16} className="text-foreground" />
          )}
        </button>
      </div>
    </div>
  )
}
