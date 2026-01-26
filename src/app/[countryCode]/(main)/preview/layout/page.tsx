import { Metadata } from "next"
import Nav from "@modules/layout/templates/nav"
import Footer from "@modules/layout/templates/footer"

export const metadata: Metadata = {
  title: "Layout Preview",
  robots: { index: false, follow: false },
}

export default function LayoutPreviewPage() {
  return (
    <div className="min-h-screen flex flex-col">
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
