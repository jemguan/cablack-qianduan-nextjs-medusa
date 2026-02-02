import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"
import { getPageTitle, getPageTitleConfig } from "@lib/data/page-title-config"

export async function generateMetadata(): Promise<Metadata> {
  const [title, config] = await Promise.all([
    getPageTitle("account_login", { title: "Sign in" }),
    getPageTitleConfig(),
  ])
  const siteName = config.site_name || "Store"
  return {
    title,
    description: `Sign in to your ${siteName} account.`,
  }
}

export default async function Login() {
  const config = await getPageTitleConfig()
  const siteName = config.site_name || "Store"
  return <LoginTemplate storeName={siteName} />
}
