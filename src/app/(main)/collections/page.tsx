import { Metadata } from "next"

import { listCollections } from "@lib/data/collections"
import { getCountryCode } from "@lib/data/regions"
import CollectionsListTemplate from "@modules/collections/templates/collections-list"
import Breadcrumb from "@modules/common/components/breadcrumb"

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse all our collections.",
}

export default async function CollectionsPage() {
  const countryCode = await getCountryCode()

  const { collections } = await listCollections({
    limit: "100",
    offset: "0",
  })

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Collections" },
  ]

  return (
    <>
      {/* Breadcrumb container below header */}
      <div className="border-b border-ui-border-base bg-background">
        <div className="content-container py-2">
          <Breadcrumb items={breadcrumbItems} countryCode={countryCode} />
        </div>
      </div>

      {/* Collections list content */}
      <CollectionsListTemplate
        collections={collections}
        countryCode={countryCode}
      />
    </>
  )
}
