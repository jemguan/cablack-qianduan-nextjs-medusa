import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
import { ThemeProvider } from "@modules/common/components/theme-toggle"
import { ScrollToTop } from "@components/ScrollToTop"
import { getPageTitleConfig } from "@lib/data/page-title-config"
import { listAnnouncements } from "@lib/data/announcements"
import AnnouncementBar from "@modules/layout/components/announcement-bar"

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPageTitleConfig()
  const metadata: Metadata = {
    metadataBase: new URL(getBaseURL()),
  }

  // 如果配置了 logo_url，设置 favicon
  if (config.logo_url) {
    metadata.icons = {
      icon: config.logo_url,
      shortcut: config.logo_url,
      apple: config.logo_url,
    }
  }

  return metadata
}

// 获取 Medusa 后端 URL（服务端）
function getMedusaBackendUrl(): string {
  return process.env.MEDUSA_BACKEND_URL || 
         process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 
         "http://localhost:9000"
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const medusaBackendUrl = getMedusaBackendUrl()
  const announcements = await listAnnouncements()
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* 
          合并的初始化脚本：
          1. 注入 Medusa 后端 URL
          2. 主题初始化（防止闪烁）
          3. 滚动位置重置
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){window.__MEDUSA_BACKEND_URL__=${JSON.stringify(medusaBackendUrl)};try{var t=localStorage.getItem('theme-preference')||'dark',r=document.documentElement;t==='dark'&&r.classList.add('dark');r.setAttribute('data-theme',t);r.setAttribute('data-mode',t);r.style.colorScheme=t}catch(e){}scrollTo(0,0)})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <ScrollToTop />
          {announcements.length > 0 && <AnnouncementBar announcements={announcements} />}
          <main className="relative">{props.children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
