"use client"

import { useState } from "react"
import { FaCopy, FaCheck, FaSearch, FaLink, FaExternalLinkAlt } from "react-icons/fa"
import type { Product } from "../types"
import { generateProductLink } from "../utils"
import { useProductSearch } from "../hooks"

interface ProductLinkGeneratorProps {
  affiliateLink: string
  copiedProductLink: string | null
  onCopy: (text: string, type: "product") => void
}

export function ProductLinkGenerator({
  affiliateLink,
  copiedProductLink,
  onCopy,
}: ProductLinkGeneratorProps) {
  const { searchQuery, setSearchQuery, products, isSearching, clearSearch } = useProductSearch()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [generatedLink, setGeneratedLink] = useState("")

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    const link = generateProductLink(product, affiliateLink)
    setGeneratedLink(link)
    clearSearch()
  }

  return (
    <div className="border border-border/50 rounded-xl p-6 bg-card shadow-sm">
      <h2 className="text-lg-semi mb-4 flex items-center gap-2 text-foreground">
        <FaLink size={20} className="text-primary" />
        Product Link Generator
      </h2>
      <div className="mb-4 space-y-2">
        <p className="text-sm text-muted-foreground">
          Search and select products to generate links with your affiliate parameters
        </p>
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Tip:</strong> Enter a product title in the search box to find products, then
            select a product to generate your affiliate link.
          </p>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="relative mb-4">
        <div className="flex items-center gap-2 border border-border/50 rounded-lg px-4 py-2 bg-background focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all duration-200">
          <FaSearch size={16} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground"
          />
          {isSearching && (
            <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full" />
          )}
        </div>

        {/* 搜索结果下拉 */}
        {products.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-card border border-border/50 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors duration-200 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
                aria-label={`Select product: ${product.title}`}
              >
                {product.thumbnail && (
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-10 h-10 object-cover rounded-lg"
                  />
                )}
                <span className="text-sm text-foreground">{product.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 选中的产品和生成的链接 */}
      {selectedProduct && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border/50">
          <div className="flex items-center gap-3">
            {selectedProduct.thumbnail && (
              <img
                src={selectedProduct.thumbnail}
                alt={selectedProduct.title}
                className="w-12 h-12 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground">{selectedProduct.title}</p>
              <a
                href={`/products/${selectedProduct.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1 transition-colors duration-200"
              >
                View Product <FaExternalLinkAlt size={12} />
              </a>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1 font-medium">
              Your Affiliate Link:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-1 px-4 py-2 border border-border/50 rounded-lg bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200"
              />
              <button
                onClick={() => onCopy(generatedLink, "product")}
                className="px-5 py-2 bg-card border border-border/50 rounded-lg hover:bg-muted/50 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] min-w-[44px]"
                aria-label={
                  copiedProductLink === generatedLink
                    ? "Product link copied to clipboard"
                    : "Copy product affiliate link"
                }
              >
                {copiedProductLink === generatedLink ? (
                  <FaCheck size={16} className="text-primary" />
                ) : (
                  <FaCopy size={16} className="text-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
