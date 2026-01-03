import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
import { ThemeProvider } from "@modules/common/components/theme-toggle"
import { ScrollToTop } from "@components/ScrollToTop"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

// 获取 Medusa 后端 URL（服务端）
function getMedusaBackendUrl(): string {
  return process.env.MEDUSA_BACKEND_URL || 
         process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 
         "http://localhost:9000"
}

export default function RootLayout(props: { children: React.ReactNode }) {
  const medusaBackendUrl = getMedusaBackendUrl()
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* 注入 Medusa 后端 URL 到 window 对象 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                window.__MEDUSA_BACKEND_URL__ = ${JSON.stringify(medusaBackendUrl)};
              })();
            `,
          }}
        />
        {/* 主题初始化脚本 - 防止主题闪烁 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme-preference') || 'dark';
                  var root = document.documentElement;
                  if (theme === 'dark') {
                    root.classList.add('dark');
                  }
                  root.setAttribute('data-theme', theme);
                  root.setAttribute('data-mode', theme);
                  root.style.colorScheme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* 确保页面刷新时滚动到顶部 - 特别是在移动端 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  // 立即重置滚动位置
                  window.scrollTo(0, 0);
                  if (document.documentElement) {
                    document.documentElement.scrollTop = 0;
                  }
                  if (document.body) {
                    document.body.scrollTop = 0;
                  }
                  
                  // 监听页面加载完成
                  if (document.readyState === 'complete') {
                    window.scrollTo(0, 0);
                  } else {
                    window.addEventListener('load', function() {
                      window.scrollTo(0, 0);
                      if (document.documentElement) {
                        document.documentElement.scrollTop = 0;
                      }
                      if (document.body) {
                        document.body.scrollTop = 0;
                      }
                    });
                  }
                  
                  // 监听 DOM 加载完成
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', function() {
                      window.scrollTo(0, 0);
                      if (document.documentElement) {
                        document.documentElement.scrollTop = 0;
                      }
                      if (document.body) {
                        document.body.scrollTop = 0;
                      }
                    });
                  } else {
                    window.scrollTo(0, 0);
                    if (document.documentElement) {
                      document.documentElement.scrollTop = 0;
                    }
                    if (document.body) {
                      document.body.scrollTop = 0;
                    }
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <ScrollToTop />
          <main className="relative">{props.children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
