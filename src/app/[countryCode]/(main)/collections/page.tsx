import { Metadata } from "next"

import { listCollections } from "@lib/data/collections"
import CollectionsListTemplate from "@modules/collections/templates/collections-list"
import Breadcrumb from "@modules/common/components/breadcrumb"

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse all our collections.",
}

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

export default async function CollectionsPage(props: Params) {
  const params = await props.params

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
          <Breadcrumb items={breadcrumbItems} countryCode={params.countryCode} />
        </div>
      </div>

      {/* Collections list content */}
      <CollectionsListTemplate
        collections={collections}
        countryCode={params.countryCode}
      />
    </>
  )
}

