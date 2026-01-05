"use client"

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react"
import { Fragment, useEffect, useMemo, useState } from "react"
import ReactCountryFlag from "react-country-flag"
import { useRouter } from "next/navigation"

import { StateType } from "@lib/hooks/use-toggle-state"
import { updateRegion } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"

type CountryOption = {
  country: string
  region: string
  label: string
}

type CountrySelectProps = {
  toggleState: StateType
  regions: HttpTypes.StoreRegion[]
}

// Helper to get cookie value on client side
const getRegionCookie = (): string => {
  if (typeof document === "undefined") return "ca"
  const match = document.cookie.match(/(?:^|; )_medusa_region=([^;]*)/)
  return match ? match[1] : "ca"
}

const CountrySelect = ({ toggleState, regions }: CountrySelectProps) => {
  const [current, setCurrent] = useState<
    | { country: string | undefined; region: string; label: string | undefined }
    | undefined
  >(undefined)

  const router = useRouter()
  const [currentCountryCode, setCurrentCountryCode] = useState<string>("")

  const { state, close } = toggleState

  const options = useMemo(() => {
    return regions
      ?.map((r) => {
        return r.countries?.map((c) => ({
          country: c.iso_2,
          region: r.id,
          label: c.display_name,
        }))
      })
      .flat()
      .sort((a, b) => (a?.label ?? "").localeCompare(b?.label ?? ""))
  }, [regions])

  // Get current country code from cookie on client side
  useEffect(() => {
    const countryCode = getRegionCookie()
    setCurrentCountryCode(countryCode)
  }, [])

  useEffect(() => {
    if (currentCountryCode) {
      const option = options?.find((o) => o?.country === currentCountryCode)
      setCurrent(option)
    }
  }, [options, currentCountryCode])

  const handleChange = async (option: CountryOption) => {
    close()
    
    // Update local state first
    setCurrentCountryCode(option.country)
    setCurrent(option)
    
    // Update the region (this updates cart and sets cookie on server)
    await updateRegion(option.country)
    
    // Refresh the page to reload data with new region
    router.refresh()
  }

  const selectedOption = current || (currentCountryCode ? options?.find((o) => o?.country === currentCountryCode) : undefined)

  return (
    <div className="w-full min-w-0">
      <Listbox
        as="span"
        value={selectedOption}
        onChange={handleChange}
      >
        <ListboxButton className="py-1 w-full text-left focus:outline-none focus:ring-0 border-none bg-transparent">
          <div className="txt-compact-small flex items-center gap-x-2 min-w-0">
            <span className="shrink-0">Shipping to:</span>
            {selectedOption ? (
              <span className="txt-compact-small flex items-center gap-x-2 min-w-0 font-medium">
                {/* @ts-ignore */}
                <ReactCountryFlag
                  svg
                  style={{
                    width: "16px",
                    height: "16px",
                    flexShrink: 0,
                  }}
                  countryCode={selectedOption.country ?? ""}
                />
                <span className="truncate normal-case">{selectedOption.label}</span>
              </span>
            ) : (
              <span className="txt-compact-small text-muted-foreground">
                Select country
              </span>
            )}
          </div>
        </ListboxButton>
        <div className="flex relative w-full">
          <Transition
            show={state}
            as={Fragment}
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions
              className="absolute top-full left-0 mt-1 xsmall:left-auto xsmall:right-0 max-h-[442px] overflow-y-scroll z-[900] bg-white drop-shadow-md text-small-regular normal-case text-black no-scrollbar rounded-rounded w-full max-w-[calc(100vw-2rem)] sm:max-w-[400px]"
              static
            >
              {options?.map((o, index) => {
                return (
                  <ListboxOption
                    key={index}
                    value={o}
                    className="py-2 hover:bg-gray-200 px-3 cursor-pointer flex items-center gap-x-2 normal-case"
                  >
                    {/* @ts-ignore */}
                    <ReactCountryFlag
                      svg
                      style={{
                        width: "16px",
                        height: "16px",
                      }}
                      countryCode={o?.country ?? ""}
                    />
                    <span>{o?.label}</span>
                  </ListboxOption>
                )
              })}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}

export default CountrySelect
