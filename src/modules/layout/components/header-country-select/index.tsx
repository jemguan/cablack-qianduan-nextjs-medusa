"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { Fragment, useEffect, useMemo, useState } from "react"
import ReactCountryFlag from "react-country-flag"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { updateRegion } from "@lib/data/cart"

type CountryOption = {
  country: string | undefined
  region: string
  label: string | undefined
}

type HeaderCountrySelectProps = {
  regions: HttpTypes.StoreRegion[]
}

// Helper to get cookie value on client side
const getRegionCookie = (): string => {
  if (typeof document === "undefined") return "ca"
  const match = document.cookie.match(/(?:^|; )_medusa_region=([^;]*)/)
  return match ? match[1] : "ca"
}

const HeaderCountrySelect = ({ regions }: HeaderCountrySelectProps) => {
  const [current, setCurrent] = useState<
    | { country: string | undefined; region: string; label: string | undefined }
    | undefined
  >(undefined)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()
  const [currentCountryCode, setCurrentCountryCode] = useState<string>("")

  const open = () => setDropdownOpen(true)
  const close = () => setDropdownOpen(false)

  const options = useMemo(() => {
    return regions
      ?.map((r) => {
        return r.countries?.map((c) => ({
          country: c.iso_2?.toUpperCase(), // 确保国家代码是大写
          region: r.id,
          label: c.display_name,
        }))
      })
      .flat()
      .filter((o): o is CountryOption => o !== undefined && o.country !== undefined && o.country.length === 2) // 过滤掉无效的国家代码
      .sort((a, b) => (a?.label ?? "").localeCompare(b?.label ?? ""))
  }, [regions])

  // Get current country code from cookie on client side
  useEffect(() => {
    const countryCode = getRegionCookie()
    setCurrentCountryCode(countryCode.toUpperCase()) // 确保是大写
  }, [])

  useEffect(() => {
    if (currentCountryCode) {
      const option = options?.find((o) => o?.country === currentCountryCode.toUpperCase())
      setCurrent(option)
    }
  }, [options, currentCountryCode])

  const handleChange = async (option: CountryOption) => {
    if (!option || !option.country) return
    close()
    
    // Update local state first
    setCurrentCountryCode(option.country.toUpperCase())
    setCurrent(option)
    
    // Update the region (this updates cart and sets cookie on server)
    // updateRegion 需要小写的国家代码
    await updateRegion(option.country.toLowerCase())
    
    // Refresh the page to reload data with new region
    router.refresh()
  }

  const selectedOption = current || (currentCountryCode ? options?.find((o) => o?.country === currentCountryCode) : undefined)

  return (
    <div
      className="h-full z-50"
      onMouseEnter={open}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <PopoverButton 
          className="h-full focus:outline-none px-2 text-ui-fg-subtle hover:text-ui-fg-base active:text-ui-fg-base transition-colors flex items-center justify-center gap-x-1.5 touch-manipulation"
          aria-label="Select Country"
          onClick={() => {
            // 点击时切换状态（手机端）
            setDropdownOpen(!dropdownOpen)
          }}
        >
          {selectedOption && selectedOption.country ? (
            <>
              <div className="flex-shrink-0" style={{ width: "16px", height: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <ReactCountryFlag
                  countryCode={selectedOption.country.toUpperCase()}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                  title={selectedOption.label || selectedOption.country}
                  aria-label={selectedOption.label || selectedOption.country}
                />
              </div>
              <span className="hidden small:inline text-small-regular">
                {selectedOption.country.toUpperCase()}
              </span>
            </>
          ) : (
            <span className="text-small-regular">Country</span>
          )}
        </PopoverButton>
        <Transition
          show={dropdownOpen}
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
            className="absolute top-[calc(100%+1px)] right-0 bg-card border border-border w-[280px] small:w-[280px] text-foreground shadow-xl rounded-b-lg overflow-hidden max-h-[400px] overflow-y-auto z-[100]"
            onClick={(e) => {
              // 阻止点击事件冒泡，防止关闭
              e.stopPropagation()
            }}
          >
            <div className="p-2">
              {options?.map((option, index) => {
                if (!option || !option.country) return null
                return (
                  <button
                    key={index}
                    onClick={() => handleChange(option)}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-base-regular transition-colors
                      flex items-center gap-x-3 touch-manipulation
                      ${
                        selectedOption?.country === option.country
                          ? "bg-ui-bg-base-hover text-ui-fg-base font-medium"
                          : "text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover active:bg-ui-bg-base-hover"
                      }
                    `}
                  >
                    <div className="flex-shrink-0" style={{ width: "18px", height: "18px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <ReactCountryFlag
                        countryCode={option.country.toUpperCase()}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                        title={option.label || option.country}
                        aria-label={option.label || option.country}
                      />
                    </div>
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default HeaderCountrySelect

