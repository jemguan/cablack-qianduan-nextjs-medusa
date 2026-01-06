import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"
import { getPageTitle } from "@lib/data/page-title-config"

export async function generateMetadata(): Promise<Metadata> {
  const title = await getPageTitle("account_login", { title: "Sign in" })
  return {
    title,
    description: "Sign in to your Onahole Station account.",
  }
}

export default function Login() {
  return <LoginTemplate />
}
