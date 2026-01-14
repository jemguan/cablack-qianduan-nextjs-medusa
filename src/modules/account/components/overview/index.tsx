import { Container } from "@medusajs/ui"
import { FaUser, FaMapMarkerAlt, FaChevronDown, FaBox } from "react-icons/fa"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import EmailVerificationBanner from "@modules/account/components/email-verification-banner"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Overview = ({ customer, orders }: OverviewProps) => {
  return (
    <div data-testid="overview-page-wrapper">
      <EmailVerificationBanner />
      <div className="hidden small:block">
        <div className="text-xl-semi flex justify-between items-center mb-4 text-foreground">
          <span data-testid="welcome-message" data-value={customer?.first_name}>
            Hello {customer?.first_name}
          </span>
          <span className="text-small-regular text-muted-foreground">
            Signed in as:{" "}
            <span
              className="font-semibold text-foreground"
              data-testid="customer-email"
              data-value={customer?.email}
            >
              {customer?.email}
            </span>
          </span>
        </div>
        <div className="flex flex-col py-4 small:py-8 border-t border-border/50">
          <div className="flex flex-col gap-y-4 small:gap-y-6 h-full col-span-1 row-span-2 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 small:mb-6">
              <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FaUser className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base-semi text-foreground">Profile</h3>
                </div>
                <div className="flex items-end gap-x-2">
                  <span
                    className="text-3xl-semi leading-none text-foreground"
                    data-testid="customer-profile-completion"
                    data-value={getProfileCompletion(customer)}
                  >
                    {getProfileCompletion(customer)}%
                  </span>
                  <span className="uppercase text-sm text-muted-foreground mb-1">
                    Completed
                  </span>
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FaMapMarkerAlt className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base-semi text-foreground">Addresses</h3>
                </div>
                <div className="flex items-end gap-x-2">
                  <span
                    className="text-3xl-semi leading-none text-foreground"
                    data-testid="addresses-count"
                    data-value={customer?.addresses?.length || 0}
                  >
                    {customer?.addresses?.length || 0}
                  </span>
                  <span className="uppercase text-sm text-muted-foreground mb-1">
                    Saved
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-y-4">
              <div className="flex items-center gap-x-2">
                <FaBox className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-large-semi text-foreground">Recent orders</h3>
              </div>
              <ul
                className="flex flex-col gap-y-3"
                data-testid="orders-wrapper"
              >
                {orders && orders.length > 0 ? (
                  orders.slice(0, 5).map((order) => {
                    return (
                      <li
                        key={order.id}
                        data-testid="order-wrapper"
                        data-value={order.id}
                      >
                        <LocalizedClientLink
                          href={`/account/orders/details/${order.id}`}
                          className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                          aria-label={`View order #${order.display_id} details`}
                        >
                          <Container className="bg-card hover:bg-muted/50 transition-all duration-200 flex justify-between items-center p-4 border border-border/50 rounded-lg shadow-sm hover:shadow-md cursor-pointer group">
                            <div className="grid grid-cols-3 grid-rows-2 text-small-regular gap-x-4 flex-1 text-foreground">
                              <span className="font-semibold text-muted-foreground">Date placed</span>
                              <span className="font-semibold text-muted-foreground">
                                Order number
                              </span>
                              <span className="font-semibold text-muted-foreground">
                                Total amount
                              </span>
                              <span data-testid="order-created-date" className="text-foreground">
                                {new Date(order.created_at).toDateString()}
                              </span>
                              <span
                                data-testid="order-id"
                                data-value={order.display_id}
                                className="text-foreground font-medium"
                              >
                                #{order.display_id}
                              </span>
                              <span data-testid="order-amount" className="text-foreground font-medium">
                                {convertToLocale({
                                  amount: order.total,
                                  currency_code: order.currency_code,
                                })}
                              </span>
                            </div>
                            <button
                              className="flex items-center justify-between text-muted-foreground group-hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md p-1"
                              data-testid="open-order-button"
                              aria-label={`Go to order #${order.display_id} details`}
                            >
                              <span className="sr-only">
                                Go to order #{order.display_id}
                              </span>
                              <FaChevronDown className="-rotate-90 w-5 h-5" />
                            </button>
                          </Container>
                        </LocalizedClientLink>
                      </li>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center" data-testid="no-orders-message">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <FaBox className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-base-regular text-muted-foreground mb-2">No recent orders</p>
                    <p className="text-sm text-muted-foreground">Start shopping to see your orders here</p>
                  </div>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
