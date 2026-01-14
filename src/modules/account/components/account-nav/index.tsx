"use client"

import React, { useState, useEffect } from "react"
import { clx } from "@medusajs/ui"
import { usePathname } from "next/navigation"
import { FaSignOutAlt, FaChevronDown, FaUser, FaMapMarkerAlt, FaBox, FaHeart, FaStar, FaUsers } from "react-icons/fa"

import Spinner from "@modules/common/icons/spinner"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"
import { getLoyaltyAccount } from "@lib/data/loyalty"

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isPointsEnabled, setIsPointsEnabled] = useState(false)
  const [isAffiliate, setIsAffiliate] = useState(false)

  // 获取积分系统启用状态和 Affiliate 状态
  useEffect(() => {
    const fetchConfig = async () => {
      // 获取积分配置
      try {
        const data = await getLoyaltyAccount()
        if (data?.config) {
          setIsPointsEnabled(data.config.is_points_enabled || false)
        }
      } catch (error) {
        // 忽略错误，默认不显示积分入口
      }

      // 检查是否是 Affiliate
      // 使用 API route 代理请求，服务端可以访问 httpOnly cookie
      try {
        const response = await fetch("/api/affiliate/me", {
          credentials: "include",
        })
        
        if (response.ok) {
          const data = await response.json()
          setIsAffiliate(!!data?.affiliate)
        }
      } catch (error) {
        // 忽略错误，默认不显示 Affiliate 入口
        console.error("[AccountNav] Error checking affiliate status:", error)
      }
    }
    fetchConfig()
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signout()
    } catch (error) {
      setIsLoggingOut(false)
      console.error("Logout failed:", error)
    }
  }

  return (
    <div>
      <div className="small:hidden" data-testid="mobile-account-nav">
        {route !== `/account` ? (
          <LocalizedClientLink
            href="/account"
            className="flex items-center gap-x-2 text-small-regular py-2"
            data-testid="account-main-link"
          >
            <>
              <FaChevronDown className="transform rotate-90 w-5 h-5" />
              <span>Account</span>
            </>
          </LocalizedClientLink>
        ) : (
          <>
            <div className="text-xl-semi mb-4 px-8 text-foreground">
              Hello {customer?.first_name}
            </div>
            <div className="text-base-regular">
              <ul>
                <li>
                  <LocalizedClientLink
                    href="/account/profile"
                    className="flex items-center justify-between py-4 border-b border-border/50 px-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
                    data-testid="profile-link"
                    aria-label="Go to profile page"
                  >
                    <>
                      <div className="flex items-center gap-x-2">
                        <FaUser className="w-5 h-5" />
                        <span>Profile</span>
                      </div>
                      <FaChevronDown className="transform -rotate-90 w-5 h-5" />
                    </>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/addresses"
                    className="flex items-center justify-between py-4 border-b border-border/50 px-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
                    data-testid="addresses-link"
                    aria-label="Go to addresses page"
                  >
                    <>
                      <div className="flex items-center gap-x-2">
                        <FaMapMarkerAlt className="w-5 h-5" />
                        <span>Addresses</span>
                      </div>
                      <FaChevronDown className="transform -rotate-90 w-5 h-5" />
                    </>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/orders"
                    className="flex items-center justify-between py-4 border-b border-border/50 px-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
                    data-testid="orders-link"
                    aria-label="Go to orders page"
                  >
                    <div className="flex items-center gap-x-2">
                      <FaBox className="w-5 h-5" />
                      <span>Orders</span>
                    </div>
                    <FaChevronDown className="transform -rotate-90 w-5 h-5" />
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/wishlist"
                    className="flex items-center justify-between py-4 border-b border-border/50 px-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
                    data-testid="wishlist-link"
                    aria-label="Go to wishlist page"
                  >
                    <div className="flex items-center gap-x-2">
                      <FaHeart className="w-5 h-5" />
                      <span>Wishlist</span>
                    </div>
                    <FaChevronDown className="transform -rotate-90 w-5 h-5" />
                  </LocalizedClientLink>
                </li>
                {/* 积分入口 - 仅在积分系统启用时显示 */}
                {isPointsEnabled && (
                  <li>
                    <LocalizedClientLink
                      href="/account/loyalty"
                      className="flex items-center justify-between py-4 border-b border-border/50 px-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
                      data-testid="loyalty-link"
                      aria-label="Go to loyalty points page"
                    >
                      <div className="flex items-center gap-x-2">
                        <FaStar className="w-5 h-5" />
                        <span>Points</span>
                      </div>
                      <FaChevronDown className="transform -rotate-90 w-5 h-5" />
                    </LocalizedClientLink>
                  </li>
                )}
                {/* Affiliate Program 入口 - 仅对 Affiliate 显示 */}
                {isAffiliate && (
                  <li>
                    <LocalizedClientLink
                      href="/account/affiliate"
                      className="flex items-center justify-between py-4 border-b border-border/50 px-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
                      data-testid="affiliate-link"
                      aria-label="Go to affiliate program page"
                    >
                      <div className="flex items-center gap-x-2">
                        <FaUsers className="w-5 h-5" />
                        <span>Affiliate Program</span>
                      </div>
                      <FaChevronDown className="transform -rotate-90 w-5 h-5" />
                    </LocalizedClientLink>
                  </li>
                )}
                <li>
                  <button
                    type="button"
                    disabled={isLoggingOut}
                    className={clx(
                      "flex items-center justify-between py-4 border-b border-border/50 px-8 w-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]",
                      isLoggingOut ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    )}
                    onClick={handleLogout}
                    data-testid="logout-button"
                    aria-label={isLoggingOut ? "Logging out" : "Log out"}
                  >
                    <div className="flex items-center gap-x-2">
                      {isLoggingOut ? (
                        <Spinner className="w-5 h-5 animate-spin" />
                      ) : (
                        <FaSignOutAlt className="w-5 h-5" />
                      )}
                      <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                    </div>
                    {!isLoggingOut && <FaChevronDown className="transform -rotate-90 w-5 h-5" />}
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
      <div className="hidden small:block" data-testid="account-nav">
        <div>
          <div className="pb-4">
            <h3 className="text-base-semi text-foreground">Account</h3>
          </div>
          <div className="text-base-regular">
            <ul className="flex mb-0 justify-start items-start flex-col gap-y-4">
              <li className="w-full">
                <AccountNavLink
                  href="/account"
                  route={route!}
                  data-testid="overview-link"
                  icon={<FaUser className="w-4 h-4" />}
                >
                  Overview
                </AccountNavLink>
              </li>
              <li className="w-full">
                <AccountNavLink
                  href="/account/profile"
                  route={route!}
                  data-testid="profile-link"
                  icon={<FaUser className="w-4 h-4" />}
                >
                  Profile
                </AccountNavLink>
              </li>
              <li className="w-full">
                <AccountNavLink
                  href="/account/addresses"
                  route={route!}
                  data-testid="addresses-link"
                  icon={<FaMapMarkerAlt className="w-4 h-4" />}
                >
                  Addresses
                </AccountNavLink>
              </li>
              <li className="w-full">
                <AccountNavLink
                  href="/account/orders"
                  route={route!}
                  data-testid="orders-link"
                  icon={<FaBox className="w-4 h-4" />}
                >
                  Orders
                </AccountNavLink>
              </li>
              <li className="w-full">
                <AccountNavLink
                  href="/account/wishlist"
                  route={route!}
                  data-testid="wishlist-link"
                  icon={<FaHeart className="w-4 h-4" />}
                >
                  Wishlist
                </AccountNavLink>
              </li>
              {/* 积分入口 - 仅在积分系统启用时显示 */}
              {isPointsEnabled && (
                <li className="w-full">
                  <AccountNavLink
                    href="/account/loyalty"
                    route={route!}
                    data-testid="loyalty-link"
                    icon={<FaStar className="w-4 h-4" />}
                  >
                    Points
                  </AccountNavLink>
                </li>
              )}
              {/* Affiliate Program 入口 - 仅对 Affiliate 显示 */}
              {isAffiliate && (
                <li className="w-full">
                  <AccountNavLink
                    href="/account/affiliate"
                    route={route!}
                    data-testid="affiliate-link"
                    icon={<FaUsers className="w-4 h-4" />}
                  >
                    Affiliate Program
                  </AccountNavLink>
                </li>
              )}
              <li className="w-full">
                <button
                  type="button"
                  disabled={isLoggingOut}
                  className={clx(
                    "flex items-center gap-x-2 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer relative py-1.5 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] w-full",
                    isLoggingOut ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  )}
                  onClick={handleLogout}
                  data-testid="logout-button"
                  aria-label={isLoggingOut ? "Logging out" : "Log out"}
                >
                  <span className="flex-shrink-0">
                    {isLoggingOut ? (
                      <Spinner className="w-4 h-4 animate-spin" />
                    ) : (
                      <FaSignOutAlt className="w-4 h-4" />
                    )}
                  </span>
                  <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  children: React.ReactNode
  icon?: React.ReactNode
  "data-testid"?: string
}

const AccountNavLink = ({
  href,
  route,
  children,
  icon,
  "data-testid": dataTestId,
}: AccountNavLinkProps) => {
  const active = route === href
  return (
    <LocalizedClientLink
      href={href}
      className={clx(
        "flex items-center gap-x-2 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer relative py-1.5 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] w-full",
        {
          "text-primary font-semibold bg-primary/10": active,
        }
      )}
      data-testid={dataTestId}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </LocalizedClientLink>
  )
}

export default AccountNav
