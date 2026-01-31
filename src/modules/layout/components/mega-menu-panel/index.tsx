"use client"

import React, { useState, useCallback, useRef, useLayoutEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@medusajs/ui"

export interface MegaMenuItem {
  id: string
  label: string
  url?: string | null
  openInNewTab?: boolean
  children?: MegaMenuItem[]
  image1Url?: string
  image2Url?: string
}

interface MegaMenuPanelProps {
  item: MegaMenuItem
  pathname: string
  onMouseEnter: () => void
  onMouseLeave: () => void
}

const MegaMenuPanel = ({
  item,
  pathname,
  onMouseEnter,
  onMouseLeave,
}: MegaMenuPanelProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [topOffset, setTopOffset] = useState(0)
  const [hoveredImages, setHoveredImages] = useState<{ image1?: string; image2?: string } | null>(null)

  useLayoutEffect(() => {
    if (wrapperRef.current) {
      // 找到最近的 nav 祖先元素，取其底部位置作为 top
      const nav = wrapperRef.current.closest("nav")
      if (nav) {
        setTopOffset(nav.getBoundingClientRect().bottom)
      }
    }
  }, [])

  const handleChildHover = useCallback((child: MegaMenuItem) => {
    const img1 = child.image1Url || item.image1Url
    const img2 = child.image2Url || item.image2Url
    if (img1 || img2) {
      setHoveredImages({ image1: img1, image2: img2 })
    } else {
      setHoveredImages(null)
    }
  }, [item.image1Url, item.image2Url])

  const handleGrandchildHover = useCallback((grandchild: MegaMenuItem, child: MegaMenuItem) => {
    const img1 = grandchild.image1Url || child.image1Url || item.image1Url
    const img2 = grandchild.image2Url || child.image2Url || item.image2Url
    if (img1 || img2) {
      setHoveredImages({ image1: img1, image2: img2 })
    } else {
      setHoveredImages(null)
    }
  }, [item.image1Url, item.image2Url])

  const handleChildLeave = useCallback(() => {
    setHoveredImages(null)
  }, [])

  const currentImages = hoveredImages || { image1: item.image1Url, image2: item.image2Url }
  const hasImages = !!(currentImages.image1 || currentImages.image2)
  const childCount = (item.children || []).length
  const colsPerRow = Math.min(childCount, 4)

  return (
    <div
      ref={wrapperRef}
      className="fixed left-1/2 -translate-x-1/2 z-50"
      style={{ width: "60vw", top: topOffset ? `${topOffset}px` : undefined }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="rounded-b-lg shadow-2xl flex gap-8"
        style={{
          backgroundColor: "var(--mega-menu-bg, #1a1a1a)",
          padding: "32px 40px",
        }}
      >
        {/* Menu Columns */}
        <div className="flex flex-wrap gap-8 flex-1 min-w-0" style={{ maxWidth: hasImages ? 'calc(100% - 352px)' : '100%' }}>
          {(item.children || []).map((child) => {
            const childUrl = child.url?.trim() || ""
            const hasChildUrl = childUrl !== ""
            const hasGrandchildren = child.children && child.children.length > 0

            return (
              <div
                key={child.id}
                className="flex flex-col gap-3 min-w-[160px]"
                style={{ width: `calc((100% - ${(colsPerRow - 1) * 32}px) / ${colsPerRow})` }}
                onMouseEnter={() => handleChildHover(child)}
                onMouseLeave={handleChildLeave}
              >
                {/* Column Heading */}
                <div>
                  <LocalizedClientLink
                    href={child.url}
                    className="text-xs font-bold uppercase tracking-widest block"
                    style={{ color: "var(--mega-menu-heading-color, #7bc67e)" }}
                    {...(child.openInNewTab && hasChildUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {child.label}
                  </LocalizedClientLink>
                  <div
                    className="h-0.5 mt-2 w-full rounded"
                    style={{ backgroundColor: "var(--mega-menu-heading-color, #7bc67e)" }}
                  />
                </div>

                {/* Grandchildren Items */}
                {hasGrandchildren && (
                  <div className="flex flex-col gap-2">
                    {child.children!.map((grandchild) => {
                      const gcUrl = grandchild.url?.trim() || ""
                      const hasGcUrl = gcUrl !== ""
                      const isGcActive = hasGcUrl && (pathname === grandchild.url || pathname.startsWith(`${grandchild.url}/`))

                      return (
                        <LocalizedClientLink
                          key={grandchild.id}
                          href={grandchild.url}
                          className={clx(
                            "block px-4 py-2.5 rounded-lg text-sm transition-all duration-150 whitespace-nowrap",
                            isGcActive ? "font-semibold ring-1 ring-[var(--mega-menu-heading-color,#7bc67e)]" : "hover:opacity-80"
                          )}
                          style={{
                            backgroundColor: "var(--mega-menu-item-bg, #2a2a2a)",
                            color: "var(--mega-menu-item-text, #e0e0e0)",
                          }}
                          onMouseEnter={() => handleGrandchildHover(grandchild, child)}
                          onMouseLeave={handleChildLeave}
                          {...(grandchild.openInNewTab && hasGcUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          {grandchild.label}
                        </LocalizedClientLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Banner Images */}
        {hasImages && (
          <div className="flex flex-col gap-4 w-[320px] flex-shrink-0">
            {currentImages.image1 && (
              <div className="rounded-xl overflow-hidden flex-1">
                <img
                  src={currentImages.image1}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {currentImages.image2 && (
              <div className="rounded-xl overflow-hidden flex-1">
                <img
                  src={currentImages.image2}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MegaMenuPanel
