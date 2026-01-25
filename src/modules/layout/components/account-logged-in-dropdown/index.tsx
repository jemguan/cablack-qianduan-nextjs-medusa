"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { FaSignOutAlt, FaUser, FaMapMarkerAlt, FaBox, FaHeart, FaStar, FaUsers, FaBell } from "react-icons/fa"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"
import { getLoyaltyAccount } from "@lib/data/loyalty"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import { Fragment } from "react"

interface AccountLoggedInDropdownProps {
  customer: HttpTypes.StoreCustomer
}

// 积分图标 - 使用星形图标
const PointsIcon = ({ size = 18 }: { size?: number }) => (
  <FaStar size={size} />
)

const AccountLoggedInDropdown = ({ customer }: AccountLoggedInDropdownProps) => {
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMember, setIsMember] = useState(false)
  const [points, setPoints] = useState(0)
  const [isPointsEnabled, setIsPointsEnabled] = useState(false)
  const [isAffiliate, setIsAffiliate] = useState(false)
  const router = useRouter()

  // 获取积分账户信息和 Affiliate 状态
  useEffect(() => {
    const fetchConfig = async () => {
      // 获取积分配置
      try {
        const data = await getLoyaltyAccount()
        if (data?.config) {
          setIsPointsEnabled(data.config.is_points_enabled || false)
        }
        if (data?.account) {
          setIsMember(data.account.is_member || false)
          setPoints(data.account.points || 0)
        }
      } catch (error) {
        // 忽略错误，默认不显示积分相关内容
      }

      // 检查是否是 Affiliate
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
        console.error("[AccountLoggedInDropdown] Error checking affiliate status:", error)
      }
    }
    fetchConfig()
  }, [])

  const open = () => setAccountDropdownOpen(true)
  const close = () => setAccountDropdownOpen(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signout()
      close()
      router.refresh()
    } catch (error) {
      setIsLoggingOut(false)
      console.error("Logout failed:", error)
    }
  }

  return (
    <div
      className="h-full z-50"
      onMouseEnter={open}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <PopoverButton 
          className="h-full focus:outline-none p-2 transition-colors flex items-center justify-center"
          style={{ color: 'var(--header-icon-color, inherit)' }}
          aria-label="Account"
          data-testid="nav-account-link"
        >
          <FaUser size={20} />
        </PopoverButton>
        <Transition
          show={accountDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="hidden small:block absolute top-[calc(100%+1px)] right-0 bg-card border border-border w-[280px] text-foreground shadow-xl rounded-b-lg overflow-hidden"
            data-testid="nav-account-dropdown"
          >
            <div className="p-4">
              {/* 用户信息 */}
              <div className="pb-4 mb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-base-semi text-foreground">
                    {customer.first_name ? `Hello, ${customer.first_name}` : "Account"}
                  </span>
                  {isPointsEnabled && isMember && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-sm">
                      VIP
                    </span>
                  )}
                </div>
                {customer.email && (
                  <div className="text-small-regular text-ui-fg-muted mt-1">
                    {customer.email}
                  </div>
                )}
                {/* 积分显示 - 仅在积分系统启用时显示 */}
                {isPointsEnabled && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-primary">
                    <PointsIcon size={14} />
                    <span className="font-medium">{points.toLocaleString()} pts</span>
                  </div>
                )}
              </div>

              {/* 菜单项 */}
              <div className="flex flex-col gap-y-2">
                <LocalizedClientLink
                  href="/account"
                  className="flex items-center gap-x-3 py-2 px-2 text-base-regular text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover rounded-md transition-colors"
                  onClick={close}
                  data-testid="account-overview-link"
                >
                  <FaUser size={18} />
                  <span>Overview</span>
                </LocalizedClientLink>

                <LocalizedClientLink
                  href="/account/profile"
                  className="flex items-center gap-x-3 py-2 px-2 text-base-regular text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover rounded-md transition-colors"
                  onClick={close}
                  data-testid="account-profile-link"
                >
                  <FaUser size={18} />
                  <span>Profile</span>
                </LocalizedClientLink>

                <LocalizedClientLink
                  href="/account/addresses"
                  className="flex items-center gap-x-3 py-2 px-2 text-base-regular text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover rounded-md transition-colors"
                  onClick={close}
                  data-testid="account-addresses-link"
                >
                  <FaMapMarkerAlt size={18} />
                  <span>Addresses</span>
                </LocalizedClientLink>

                <LocalizedClientLink
                  href="/account/orders"
                  className="flex items-center gap-x-3 py-2 px-2 text-base-regular text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover rounded-md transition-colors"
                  onClick={close}
                  data-testid="account-orders-link"
                >
                  <FaBox size={18} />
                  <span>Orders</span>
                </LocalizedClientLink>

                <LocalizedClientLink
                  href="/account/wishlist"
                  className="flex items-center gap-x-3 py-2 px-2 text-base-regular text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover rounded-md transition-colors"
                  onClick={close}
                  data-testid="account-wishlist-link"
                >
                  <FaHeart size={18} />
                  <span>Wishlist</span>
                </LocalizedClientLink>

                <LocalizedClientLink
                  href="/account/notify-me"
                  className="flex items-center gap-x-3 py-2 px-2 text-base-regular text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover rounded-md transition-colors"
                  onClick={close}
                  data-testid="account-notify-me-link"
                >
                  <FaBell size={18} />
                  <span>Notify Me</span>
                </LocalizedClientLink>

                {/* 积分入口 - 仅在积分系统启用时显示 */}
                {isPointsEnabled && (
                  <LocalizedClientLink
                    href="/account/loyalty"
                    className="flex items-center gap-x-3 py-2 px-2 text-base-regular text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover rounded-md transition-colors"
                    onClick={close}
                    data-testid="account-loyalty-link"
                  >
                    <PointsIcon size={18} />
                    <span>Points</span>
                  </LocalizedClientLink>
                )}

                {/* Affiliate Program 入口 - 仅对 Affiliate 显示 */}
                {isAffiliate && (
                  <LocalizedClientLink
                    href="/account/affiliate"
                    className="flex items-center gap-x-3 py-2 px-2 text-base-regular text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover rounded-md transition-colors"
                    onClick={close}
                    data-testid="account-affiliate-link"
                  >
                    <FaUsers size={18} />
                    <span>Affiliate Program</span>
                  </LocalizedClientLink>
                )}

                {/* 分隔线 */}
                <div className="border-t border-border my-2"></div>

                {/* 退出登录按钮 */}
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  className="flex items-center gap-x-3 py-2 px-2 text-base-regular text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="account-logout-link"
                >
                  {isLoggingOut ? (
                    <Spinner size="18" />
                  ) : (
                    <FaSignOutAlt size={18} />
                  )}
                  <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                </button>
              </div>
            </div>
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default AccountLoggedInDropdown

