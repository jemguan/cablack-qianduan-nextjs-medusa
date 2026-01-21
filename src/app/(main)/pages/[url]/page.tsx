import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getPageByUrl } from "@lib/data/pages"
import { getCountryCode } from "@lib/data/regions"
import { getPageTitle } from "@lib/data/page-title-config"
import PageDetailTemplate from "@modules/pages/templates/page-detail"
import Breadcrumb from "@modules/common/components/breadcrumb"

// 强制动态渲染 - 避免构建时因后端不可用而失败
export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ url: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const page = await getPageByUrl(params.url)

  if (!page) {
    return {
      title: "Page Not Found",
    }
  }

  const title = await getPageTitle("page", { title: page.title })
  const metaTitle = page.meta_title || title
  const metaDescription =
    page.meta_description || page.subtitle || "Read more about us"

  const metadata: Metadata = {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: "website",
    },
  }

  return metadata
}

export default async function PageDetailPage(props: Props) {
  const params = await props.params
  const countryCode = await getCountryCode()
  const page = await getPageByUrl(params.url)

  if (!page) {
    notFound()
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: page.title },
  ]

  return (
    <>
      {/* Breadcrumb container below header */}
      <div className="border-b border-ui-border-base bg-background">
        <div className="content-container py-2">
          <Breadcrumb items={breadcrumbItems} countryCode={countryCode} />
        </div>
      </div>
      
      {/* Page content */}
      <PageDetailTemplate page={page} />
    </>
  )
}

