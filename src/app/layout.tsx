import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
import { ThemeProvider } from "@modules/common/components/theme-toggle"
import { ScrollToTop } from "@components/ScrollToTop"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
                  document.documentElement.scrollTop = 0;
                  document.body.scrollTop = 0;
                  
                  // 监听页面加载完成
                  if (document.readyState === 'complete') {
                    window.scrollTo(0, 0);
                  } else {
                    window.addEventListener('load', function() {
                      window.scrollTo(0, 0);
                      document.documentElement.scrollTop = 0;
                      document.body.scrollTop = 0;
                    });
                  }
                  
                  // 监听 DOM 加载完成
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', function() {
                      window.scrollTo(0, 0);
                      document.documentElement.scrollTop = 0;
                      document.body.scrollTop = 0;
                    });
                  } else {
                    window.scrollTo(0, 0);
                    document.documentElement.scrollTop = 0;
                    document.body.scrollTop = 0;
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
