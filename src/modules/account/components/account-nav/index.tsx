"use client"

import { useState, useEffect } from "react"
import { clx } from "@medusajs/ui"
import { ArrowRightOnRectangle } from "@medusajs/icons"
import { usePathname } from "next/navigation"

import ChevronDown from "@modules/common/icons/chevron-down"
import User from "@modules/common/icons/user"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import Heart from "@modules/common/icons/heart"
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
      try {
        const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }
        if (publishableKey) {
          headers["x-publishable-api-key"] = publishableKey
        }
        
        const response = await fetch("/store/affiliate/me", {
          headers,
          credentials: "include",
        })
        
        if (response.ok) {
          const data = await response.json()
          setIsAffiliate(!!data?.affiliate)
        }
      } catch (error) {
        // 忽略错误，默认不显示 Affiliate 入口
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
              <ChevronDown className="transform rotate-90" />
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
                    className="flex items-center justify-between py-4 border-b border-border px-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                    data-testid="profile-link"
                  >
                    <>
                      <div className="flex items-center gap-x-2">
                        <User size={20} />
                        <span>Profile</span>
                      </div>
                      <ChevronDown className="transform -rotate-90" />
                    </>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/addresses"
                    className="flex items-center justify-between py-4 border-b border-border px-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                    data-testid="addresses-link"
                  >
                    <>
                      <div className="flex items-center gap-x-2">
                        <MapPin size={20} />
                        <span>Addresses</span>
                      </div>
                      <ChevronDown className="transform -rotate-90" />
                    </>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/orders"
                    className="flex items-center justify-between py-4 border-b border-border px-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                    data-testid="orders-link"
                  >
                    <div className="flex items-center gap-x-2">
                      <Package size={20} />
                      <span>Orders</span>
                    </div>
                    <ChevronDown className="transform -rotate-90" />
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/wishlist"
                    className="flex items-center justify-between py-4 border-b border-border px-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                    data-testid="wishlist-link"
                  >
                    <div className="flex items-center gap-x-2">
                      <Heart size="20" />
                      <span>Wishlist</span>
                    </div>
                    <ChevronDown className="transform -rotate-90" />
                  </LocalizedClientLink>
                </li>
                {/* 积分入口 - 仅在积分系统启用时显示 */}
                {isPointsEnabled && (
                  <li>
                    <LocalizedClientLink
                      href="/account/loyalty"
                      className="flex items-center justify-between py-4 border-b border-border px-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                      data-testid="loyalty-link"
                    >
                      <div className="flex items-center gap-x-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Points</span>
                      </div>
                      <ChevronDown className="transform -rotate-90" />
                    </LocalizedClientLink>
                  </li>
                )}
                {/* Affiliate Program 入口 - 仅对 Affiliate 显示 */}
                {isAffiliate && (
                  <li>
                    <LocalizedClientLink
                      href="/account/affiliate"
                      className="flex items-center justify-between py-4 border-b border-border px-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                      data-testid="affiliate-link"
                    >
                      <div className="flex items-center gap-x-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        <span>Affiliate Program</span>
                      </div>
                      <ChevronDown className="transform -rotate-90" />
                    </LocalizedClientLink>
                  </li>
                )}
                <li>
                  <button
                    type="button"
                    disabled={isLoggingOut}
                    className={clx(
                      "flex items-center justify-between py-4 border-b border-border px-8 w-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all",
                      isLoggingOut && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={handleLogout}
                    data-testid="logout-button"
                  >
                    <div className="flex items-center gap-x-2">
                      {isLoggingOut ? (
                        <Spinner className="w-5 h-5 animate-spin" />
                      ) : (
                        <ArrowRightOnRectangle />
                      )}
                      <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                    </div>
                    {!isLoggingOut && <ChevronDown className="transform -rotate-90" />}
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
              <li>
                <AccountNavLink
                  href="/account"
                  route={route!}
                  data-testid="overview-link"
                >
                  Overview
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/account/profile"
                  route={route!}
                  data-testid="profile-link"
                >
                  Profile
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/account/addresses"
                  route={route!}
                  data-testid="addresses-link"
                >
                  Addresses
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/account/orders"
                  route={route!}
                  data-testid="orders-link"
                >
                  Orders
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/account/wishlist"
                  route={route!}
                  data-testid="wishlist-link"
                >
                  Wishlist
                </AccountNavLink>
              </li>
              {/* 积分入口 - 仅在积分系统启用时显示 */}
              {isPointsEnabled && (
                <li>
                  <AccountNavLink
                    href="/account/loyalty"
                    route={route!}
                    data-testid="loyalty-link"
                  >
                    Points
                  </AccountNavLink>
                </li>
              )}
              {/* Affiliate Program 入口 - 仅对 Affiliate 显示 */}
              {isAffiliate && (
                <li>
                  <AccountNavLink
                    href="/account/affiliate"
                    route={route!}
                    data-testid="affiliate-link"
                  >
                    Affiliate Program
                  </AccountNavLink>
                </li>
              )}
              <li className="text-muted-foreground hover:text-foreground transition-colors">
                <button
                  type="button"
                  disabled={isLoggingOut}
                  className={clx(
                    "flex items-center gap-x-2",
                    isLoggingOut && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={handleLogout}
                  data-testid="logout-button"
                >
                  {isLoggingOut && <Spinner className="w-4 h-4 animate-spin" />}
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
  "data-testid"?: string
}

const AccountNavLink = ({
  href,
  route,
  children,
  "data-testid": dataTestId,
}: AccountNavLinkProps) => {
  const active = route === href
  return (
    <LocalizedClientLink
      href={href}
      className={clx("text-muted-foreground hover:text-foreground transition-all", {
        "text-primary font-semibold": active,
      })}
      data-testid={dataTestId}
    >
      {children}
    </LocalizedClientLink>
  )
}

export default AccountNav
