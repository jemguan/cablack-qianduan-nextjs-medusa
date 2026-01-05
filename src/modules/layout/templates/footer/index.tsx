import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { Text, clx } from "@medusajs/ui"
import { getMedusaConfig } from "@lib/admin-api/config"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MedusaCTA from "@modules/layout/components/medusa-cta"
import { Announcement } from "@modules/layout/components/announcement"
import { Newsletter } from "@modules/layout/components/newsletter"
import { SocialShare } from "@modules/layout/components/social-share"
import type { SocialPlatform } from "@modules/layout/components/social-share/types"

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  })
  const productCategories = await listCategories()
  const config = await getMedusaConfig()
  const footerConfig = config?.footerConfig

  return (
    <footer className="border-t border-border w-full bg-background">
      <div className="content-container flex flex-col w-full text-foreground">
        <div className="flex flex-col gap-y-6 xsmall:flex-row items-start justify-between py-10">
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 flex-1">
            {/* 使用动态配置的菜单 */}
            {footerConfig?.menu?.menuItems && footerConfig.menu.menuItems.length > 0 ? (
              footerConfig.menu.menuItems.map((menuItem) => (
                <div key={menuItem.id} className="flex flex-col gap-y-2">
                  <span className="txt-small-plus txt-ui-fg-base">
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
                                href={child.url}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-ui-fg-base"
                              >
                                {child.label}
                              </a>
                            ) : (
                              <LocalizedClientLink
                                href={child.url}
                                className="hover:text-ui-fg-base"
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
                            className="hover:text-ui-fg-base"
                          >
                            {menuItem.label}
                          </a>
                        ) : (
                          <LocalizedClientLink
                            href={menuItem.url}
                            className="hover:text-ui-fg-base"
                          >
                            {menuItem.label}
                          </LocalizedClientLink>
                        )}
                      </li>
                    )}
                  </ul>
                </div>
              ))
            ) : (
              <>
                {/* 降级方案：如果没有配置菜单，使用默认的 Categories 和 Collections */}
                {productCategories && productCategories?.length > 0 && (
                  <div className="flex flex-col gap-y-2">
                    <span className="txt-small-plus txt-ui-fg-base">
                      Categories
                    </span>
                    <ul
                      className="grid grid-cols-1 gap-2"
                      data-testid="footer-categories"
                    >
                      {productCategories?.slice(0, 6).map((c) => {
                        if (c.parent_category) {
                          return
                        }

                        const children =
                          c.category_children?.map((child) => ({
                            name: child.name,
                            handle: child.handle,
                            id: child.id,
                          })) || null

                        return (
                          <li
                            className="flex flex-col gap-2 text-ui-fg-subtle txt-small"
                            key={c.id}
                          >
                            <LocalizedClientLink
                              className={clx(
                                "hover:text-ui-fg-base",
                                children && "txt-small-plus"
                              )}
                              href={`/categories/${c.handle}`}
                              data-testid="category-link"
                            >
                              {c.name}
                            </LocalizedClientLink>
                            {children && (
                              <ul className="grid grid-cols-1 ml-3 gap-2">
                                {children &&
                                  children.map((child) => (
                                    <li key={child.id}>
                                      <LocalizedClientLink
                                        className="hover:text-ui-fg-base"
                                        href={`/categories/${child.handle}`}
                                        data-testid="category-link"
                                      >
                                        {child.name}
                                      </LocalizedClientLink>
                                    </li>
                                  ))}
                              </ul>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
                {collections && collections.length > 0 && (
                  <div className="flex flex-col gap-y-2">
                    <span className="txt-small-plus txt-ui-fg-base">
                      Collections
                    </span>
                    <ul
                      className={clx(
                        "grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small",
                        {
                          "grid-cols-2": (collections?.length || 0) > 3,
                        }
                      )}
                    >
                      {collections?.slice(0, 6).map((c) => (
                        <li key={c.id}>
                          <LocalizedClientLink
                            className="hover:text-ui-fg-base"
                            href={`/collections/${c.handle}`}
                          >
                            {c.title}
                          </LocalizedClientLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* Newsletter 和 SocialShare 区域 */}
            <div className="flex flex-col gap-y-4">
              {/* Newsletter 组件 */}
              {footerConfig?.newsletter?.enabled && (
                <Newsletter
                  title={footerConfig.newsletter.title}
                  description={footerConfig.newsletter.description}
                  placeholder={footerConfig.newsletter.placeholder}
                />
              )}

              {/* SocialShare 组件 */}
              {footerConfig?.socialShare?.enabled &&
                footerConfig.socialShare.platforms &&
                footerConfig.socialShare.platforms.length > 0 && (
                  <div className="flex flex-col gap-y-2">
                    <SocialShare
                      platforms={
                        footerConfig.socialShare.platforms as SocialPlatform[]
                      }
                    />
                  </div>
                )}
            </div>

            {/* Announcement 组件 - 单独占据一列 */}
            {footerConfig?.announcement?.enabled &&
              footerConfig.announcement.text && (
                <div className="flex flex-col gap-y-2">
                  <Announcement
                    text={footerConfig.announcement.text}
                    link={footerConfig.announcement.link}
                    linkText={footerConfig.announcement.linkText}
                    imageUrl={footerConfig.announcement.imageUrl}
                    lightLogoUrl={footerConfig.announcement.lightLogoUrl}
                    darkLogoUrl={footerConfig.announcement.darkLogoUrl}
                  />
                </div>
              )}
          </div>
        </div>
        <div className="flex flex-col items-center small:items-start w-full mb-0 pt-[12px] pb-[12px] gap-y-2 text-ui-fg-muted">
          {/* 版权信息、Sitemap 和 PoweredBy - 桌面端同一行 */}
          <div className="flex flex-col sm:flex-row items-center gap-x-4 gap-y-1">
            {footerConfig?.copyright?.enabled && footerConfig.copyright.text ? (
              <Text className="txt-compact-small text-center sm:text-left">
                {footerConfig.copyright.text.replace('{year}', new Date().getFullYear().toString())}
              </Text>
            ) : !footerConfig?.copyright?.enabled && !footerConfig?.poweredBy?.enabled ? (
              <Text className="txt-compact-small text-center sm:text-left">
                © {new Date().getFullYear()} Onahole Station. All rights reserved.
              </Text>
            ) : null}

            {/* Sitemap Link */}
            <LocalizedClientLink
              href="/site-map"
              className="txt-compact-small hover:text-ui-fg-base transition-colors"
            >
              Sitemap
            </LocalizedClientLink>

            {/* PoweredBy */}
            {footerConfig?.poweredBy?.enabled ? (
              <Text className="flex gap-x-2 txt-compact-small-plus items-center text-center sm:text-left">
                {footerConfig.poweredBy.text || "Powered by"}
                {footerConfig.poweredBy.links && footerConfig.poweredBy.links.length > 0 && (
                  <>
                    {footerConfig.poweredBy.links.map((link, index) => (
                      <span key={index}>
                        {index > 0 && " & "}
                        <a
                          href={link.url}
                          target={link.openInNewTab ? "_blank" : "_self"}
                          rel={link.openInNewTab ? "noreferrer" : undefined}
                          className="hover:text-ui-fg-base transition-colors"
                        >
                          {link.text}
                        </a>
                      </span>
                    ))}
                  </>
                )}
              </Text>
            ) : null}
          </div>

          {/* MedusaCTA - 仅在没有任何配置时显示 */}
          {!footerConfig?.copyright?.enabled && !footerConfig?.poweredBy?.enabled ? (
            <div className="flex justify-center">
              <MedusaCTA />
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
