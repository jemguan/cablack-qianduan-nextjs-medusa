"use client"

import React from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { usePreviewConfig } from "@lib/context/preview-config-context"

interface MenuItem {
  id: string
  label: string
  url?: string | null
  openInNewTab?: boolean
  children?: MenuItem[]
}

interface PreviewFooterMenuProps {
  serverMenuItems: MenuItem[]
}

export function PreviewFooterMenu({ serverMenuItems }: PreviewFooterMenuProps) {
  const { previewConfig, isPreviewMode } = usePreviewConfig()

  const menuItems: MenuItem[] = isPreviewMode && previewConfig?.footerConfig?.menu?.menuItems
    ? (previewConfig.footerConfig.menu.menuItems as MenuItem[])
    : serverMenuItems

  if (!menuItems || menuItems.length === 0) {
    return null
  }

  return (
    <>
      {menuItems.map((menuItem) => (
        <div key={menuItem.id} className="flex flex-col gap-y-2">
          <span className="text-base font-semibold txt-ui-fg-base text-[var(--footer-heading-color)]">
            {menuItem.label}
          </span>
          <ul className="grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small">
            {menuItem.children && menuItem.children.length > 0 ? (
              menuItem.children.map((child) => {
                const hasUrl = child.url && child.url.trim() !== ""
                return (
                  <li key={child.id}>
                    {!hasUrl ? (
                      <span className="text-ui-fg-subtle">
                        {child.label}
                      </span>
                    ) : child.openInNewTab ? (
                      <a
                        href={child.url!}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--footer-link-color)] hover:text-[var(--footer-link-hover-color)]"
                      >
                        {child.label}
                      </a>
                    ) : (
                      <LocalizedClientLink
                        href={child.url!}
                        className="text-[var(--footer-link-color)] hover:text-[var(--footer-link-hover-color)]"
                      >
                        {child.label}
                      </LocalizedClientLink>
                    )}
                  </li>
                )
              })
            ) : (
              <li>
                {!menuItem.url || menuItem.url.trim() === "" ? (
                  <span className="text-ui-fg-subtle">
                    {menuItem.label}
                  </span>
                ) : menuItem.openInNewTab ? (
                  <a
                    href={menuItem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--footer-link-color)] hover:text-[var(--footer-link-hover-color)]"
                  >
                    {menuItem.label}
                  </a>
                ) : (
                  <LocalizedClientLink
                    href={menuItem.url}
                    className="text-[var(--footer-link-color)] hover:text-[var(--footer-link-hover-color)]"
                  >
                    {menuItem.label}
                  </LocalizedClientLink>
                )}
              </li>
            )}
          </ul>
        </div>
      ))}
    </>
  )
}

export default PreviewFooterMenu
