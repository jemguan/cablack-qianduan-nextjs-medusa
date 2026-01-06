import { retrieveCustomer } from "@lib/data/customer"
import AccountDropdown from "../account-dropdown"
import AccountLoggedInDropdown from "../account-logged-in-dropdown"

export default async function AccountButton() {
  const customer = await retrieveCustomer()

  // If customer is logged in, show dropdown menu with account options
  if (customer) {
    return <AccountLoggedInDropdown customer={customer} />
  }

  // If not logged in, show dropdown login form
  return <AccountDropdown />
}

