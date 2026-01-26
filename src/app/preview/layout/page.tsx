import { Metadata } from "next"
import Nav from "@modules/layout/templates/nav"
import Footer from "@modules/layout/templates/footer"
import DynamicColors from "@modules/layout/components/dynamic-colors"
import { getMedusaConfig } from "@lib/admin-api/config"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Layout Preview",
  robots: { index: false, follow: false },
}

export default async function LayoutPreviewPage() {
  const config = await getMedusaConfig()
  
  return (
    <div className="min-h-screen flex flex-col">
      <DynamicColors config={config} />
      <Nav />
      
      <main className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg">Header / Footer Preview</p>
          <p className="text-sm mt-2">This area represents the main content</p>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
