import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { retrieveCustomer } from "@lib/data/customer"
import { getLoyaltyAccount, getLoyaltyConfig } from "@lib/data/loyalty"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  brandId,
  countryCode,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  brandId?: string
  countryCode: string
}) {
  const queryParams: PaginatedProductsParams = {
    limit: 12,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  // 注意：排序逻辑现在在 listProductsWithSort 中处理
  // 不再需要在这里设置 order 参数

  // 并行获取 region、customer 和 loyalty 数据
  const [region, customer, loyaltyAccountResponse, loyaltyConfigResponse] = await Promise.all([
    getRegion(countryCode),
    retrieveCustomer(),
    getLoyaltyAccount(),
    getLoyaltyConfig(),
  ])

  if (!region) {
    return null
  }

  // 提取 loyaltyAccount 和 membershipProductIds
  const loyaltyAccount = loyaltyAccountResponse?.account || null
  const membershipProductIds = loyaltyConfigResponse?.config?.membership_product_ids || null

  let {
    response: { products, count },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
  })

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      <div className="mb-6">
        <p className="text-small-regular text-ui-fg-subtle">
          {count === 0 ? (
            "No products found"
          ) : (
            <>
              {count} {count === 1 ? 'product' : 'products'}
            </>
          )}
        </p>
      </div>
      {count > 0 && (
        <>
          <ul
            className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
            data-testid="products-list"
          >
            {products.map((p, index) => {
              // 首屏前4个产品优先加载以提升 LCP，其余使用懒加载
              const isPriority = index < 4 && page === 1
              return (
                <li key={p.id}>
                  <ProductPreview
                    product={p}
                    region={region}
                    priority={isPriority}
                    customer={customer}
                    loyaltyAccount={loyaltyAccount}
                    membershipProductIds={membershipProductIds}
                  />
                </li>
              )
            })}
          </ul>
          {totalPages > 1 && (
            <Pagination
              data-testid="product-pagination"
              page={page}
              totalPages={totalPages}
            />
          )}
        </>
      )}
    </>
  )
}
