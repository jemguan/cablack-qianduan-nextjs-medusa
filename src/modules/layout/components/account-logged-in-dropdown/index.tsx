"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { ArrowRightOnRectangle } from "@medusajs/icons"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import User from "@modules/common/icons/user"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import Heart from "@modules/common/icons/heart"
import Spinner from "@modules/common/icons/spinner"
import { Fragment } from "react"

interface AccountLoggedInDropdownProps {
  customer: HttpTypes.StoreCustomer
}

const AccountLoggedInDropdown = ({ customer }: AccountLoggedInDropdownProps) => {
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

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
          className="h-full focus:outline-none p-2 text-ui-fg-subtle hover:text-ui-fg-base transition-colors flex items-center justify-center"
          aria-label="Account"
          data-testid="nav-account-link"
        >
          <User size="20" />
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
                <div className="text-base-semi text-foreground">
                  {customer.first_name ? `Hello, ${customer.first_name}` : "Account"}
                </div>
                {customer.email && (
                  <div className="text-small-regular text-ui-fg-muted mt-1">
                    {customer.email}
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
                  <User size="18" />
                  <span>Overview</span>
                </LocalizedClientLink>

                <LocalizedClientLink
                  href="/account/profile"
                  className="flex items-center gap-x-3 py-2 px-2 text-base-regular text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover rounded-md transition-colors"
                  onClick={close}
                  data-testid="account-profile-link"
                >
                  <User size="18" />
                  <span>Profile</span>
                </LocalizedClientLink>

                <LocalizedClientLink
                  href="/account/addresses"
                  className="flex items-center gap-x-3 py-2 px-2 text-base-regular text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover rounded-md transition-colors"
                  onClick={close}
                  data-testid="account-addresses-link"
                >
                  <MapPin size="18" />
                  <span>Addresses</span>
                </LocalizedClientLink>

                <LocalizedClientLink
                  href="/account/orders"
                  className="flex items-center gap-x-3 py-2 px-2 text-base-regular text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover rounded-md transition-colors"
                  onClick={close}
                  data-testid="account-orders-link"
                >
                  <Package size="18" />
                  <span>Orders</span>
                </LocalizedClientLink>

                <LocalizedClientLink
                  href="/account/wishlist"
                  className="flex items-center gap-x-3 py-2 px-2 text-base-regular text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover rounded-md transition-colors"
                  onClick={close}
                  data-testid="account-wishlist-link"
                >
                  <Heart size="18" />
                  <span>Wishlist</span>
                </LocalizedClientLink>

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
                    <ArrowRightOnRectangle className="w-[18px] h-[18px]" />
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

