import { Metadata } from "next"
import { notFound } from "next/navigation"

import AddressBook from "@modules/account/components/address-book"

import { getCurrentRegion } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Addresses",
  description: "View your addresses",
}

export default async function Addresses() {
  const customer = await retrieveCustomer()
  const region = await getCurrentRegion()

  if (!customer || !region) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <div className="mb-4 small:mb-8 flex flex-col gap-y-3">
        <h1 className="text-2xl-semi text-foreground">Shipping Addresses</h1>
        <p className="text-base-regular text-muted-foreground">
          View and update your shipping addresses, you can add as many as you
          like. Saving your addresses will make them available during checkout.
        </p>
      </div>
      <AddressBook customer={customer} region={region} />
    </div>
  )
}
