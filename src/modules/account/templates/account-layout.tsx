import React from "react"

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
      <div className="flex-1 content-container h-full mx-auto bg-card border border-border rounded-lg flex flex-col shadow-sm">
        <div className="grid grid-cols-1 small:grid-cols-[240px_1fr] py-12 px-6 small:px-12">
          <div className="border-b small:border-b-0 small:border-r border-border pb-8 small:pb-0 mb-8 small:mb-0">
            {customer && <AccountNav customer={customer} />}
          </div>
          <div className="flex-1 small:pl-12">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
