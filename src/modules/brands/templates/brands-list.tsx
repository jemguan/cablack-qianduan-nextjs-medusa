import { Brand } from "@lib/data/brands"
import { BrandCard } from "@modules/home/components/brand-showcase/BrandCard"

export default function BrandsListTemplate({
  brands,
  countryCode,
}: {
  brands: Brand[]
  countryCode: string
}) {
  if (!brands || brands.length === 0) {
    return (
      <div className="content-container py-12">
        <div className="mb-8 text-2xl-semi">
          <h1>All Brands</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-ui-fg-subtle">No brands available</p>
        </div>
      </div>
    )
  }

  // 转换品牌数据格式以匹配 BrandCard 组件
  const brandCards = brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    slug: brand.slug || undefined,
    image: brand.logo_url || '/placeholder-brand.png',
  }))

  return (
    <div className="content-container py-12">
      <div className="mb-8 text-2xl-semi">
        <h1>All Brands</h1>
      </div>
      <ul className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {brandCards.map((brand) => (
          <li key={brand.id}>
            <BrandCard
              brand={brand}
              showBrandName={true}
              imageFit="contain"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

