import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="flex-1 small:py-12 bg-background" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-5xl mx-auto bg-card border border-border rounded-lg flex flex-col shadow-sm">
        <div className="grid grid-cols-1 small:grid-cols-[240px_1fr] py-12 px-6 small:px-12">
          <div className="border-b small:border-b-0 small:border-r border-border pb-8 small:pb-0 mb-8 small:mb-0">
            {customer && <AccountNav customer={customer} />}
          </div>
          <div className="flex-1 small:pl-12">{children}</div>
        </div>
        <div className="flex flex-col small:flex-row items-end justify-between small:border-t border-border py-12 px-6 small:px-12 gap-8 bg-muted/30">
          <div>
            <h3 className="text-xl-semi mb-4 text-foreground">Got questions?</h3>
            <span className="txt-medium text-muted-foreground">
              You can find frequently asked questions and answers on our
              customer service page.
            </span>
          </div>
          <div>
            <UnderlineLink href="/customer-service" className="text-primary">
              Customer Service
            </UnderlineLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
