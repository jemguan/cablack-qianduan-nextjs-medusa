"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import { Fragment } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import { HttpTypes } from "@medusajs/types"

// 默认菜单项（当没有配置时使用）
const DEFAULT_SIDE_MENU_ITEMS = {
  Home: "/",
  Store: "/store",
  Account: "/account",
  Cart: "/cart",
}

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  openInNewTab?: boolean;
  children?: MenuItem[];
}

export interface SideMenuProps {
  regions: HttpTypes.StoreRegion[] | null;
  menuItems?: MenuItem[];
}

const SideMenu = ({ regions, menuItems }: SideMenuProps) => {
  const toggleState = useToggleState()

  // 如果没有配置菜单项，使用默认菜单项
  const displayMenuItems = menuItems && menuItems.length > 0
    ? menuItems
    : Object.entries(DEFAULT_SIDE_MENU_ITEMS).map(([label, url]) => ({
        id: label.toLowerCase(),
        label,
        url,
      }))

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="relative h-full flex items-center transition-all ease-out duration-200 focus:outline-none hover:text-ui-fg-base"
                >
                  Menu
                </Popover.Button>
              </div>

              {open && (
                <div
                  className="fixed inset-0 z-[50] bg-black/0 pointer-events-auto"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0"
                enterTo="opacity-100 backdrop-blur-2xl"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 backdrop-blur-2xl"
                leaveTo="opacity-0"
              >
                <PopoverPanel className="flex flex-col absolute w-full pr-4 sm:pr-0 sm:w-1/3 2xl:w-1/4 sm:min-w-min h-[calc(100vh-1rem)] z-[51] inset-x-0 text-sm text-ui-fg-on-color m-2 backdrop-blur-2xl">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full bg-[rgba(3,7,18,0.5)] rounded-rounded justify-between p-6"
                  >
                    <div className="flex justify-end" id="xmark">
                      <button data-testid="close-menu-button" onClick={close}>
                        <XMark />
                      </button>
                    </div>
                    <ul className="flex flex-col gap-6 items-start justify-start">
                      {displayMenuItems.map((item) => {
                        const hasChildren = item.children && item.children.length > 0
                        return (
                          <li key={item.id} className="w-full">
                            {hasChildren ? (
                              <div className="flex flex-col gap-4">
                                <LocalizedClientLink
                                  href={item.url}
                                  className="text-3xl leading-10 hover:text-ui-fg-disabled"
                                  onClick={close}
                                  data-testid={`${item.id}-link`}
                                  {...(item.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                >
                                  {item.label}
                                </LocalizedClientLink>
                                {item.children && (
                                  <ul className="flex flex-col gap-3 ml-4">
                                    {item.children.map((child) => (
                                      <li key={child.id}>
                                        <LocalizedClientLink
                                          href={child.url}
                                          className="text-xl leading-8 hover:text-ui-fg-disabled text-ui-fg-subtle"
                                          onClick={close}
                                          data-testid={`${child.id}-link`}
                                          {...(child.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                        >
                                          {child.label}
                                        </LocalizedClientLink>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ) : (
                              <LocalizedClientLink
                                href={item.url}
                                className="text-3xl leading-10 hover:text-ui-fg-disabled"
                                onClick={close}
                                data-testid={`${item.id}-link`}
                                {...(item.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                              >
                                {item.label}
                              </LocalizedClientLink>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                    <div className="flex flex-col gap-y-6">
                      <div
                        className="flex justify-between"
                        onMouseEnter={toggleState.open}
                        onMouseLeave={toggleState.close}
                      >
                        {regions && (
                          <CountrySelect
                            toggleState={toggleState}
                            regions={regions}
                          />
                        )}
                        <ArrowRightMini
                          className={clx(
                            "transition-transform duration-150",
                            toggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      <Text className="flex justify-between txt-compact-small">
                        © {new Date().getFullYear()} Medusa Store. All rights
                        reserved.
                      </Text>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
