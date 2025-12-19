import { retrieveCustomer } from "@lib/data/customer"
import AccountDropdown from "../account-dropdown"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import User from "@modules/common/icons/user"

export default async function AccountButton() {
  const customer = await retrieveCustomer()

  // If customer is logged in, show link to account page
  if (customer) {
    return (
      <LocalizedClientLink
        className="p-2 text-ui-fg-subtle hover:text-ui-fg-base transition-colors flex items-center justify-center"
        href="/account"
        data-testid="nav-account-link"
        aria-label="Account"
      >
        <User size="20" />
      </LocalizedClientLink>
    )
  }

  // If not logged in, show dropdown login form
  return <AccountDropdown />
}

