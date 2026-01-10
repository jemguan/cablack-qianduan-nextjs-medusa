"use client"

import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { Copy, Check, Search, Link2, ExternalLink } from "lucide-react"
import { toast } from "sonner"

type Product = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
}

type AffiliateData = {
  affiliate: {
    id: string
    code: string
    commission_rate: number
    is_active: boolean
    affiliate_link: string
    discount_code: string
    stats: {
      total_orders: number
      pending_amount: number
      approved_amount: number
      paid_amount: number
      void_amount: number
    }
  }
}

type StatsData = {
  stats: {
    total_orders: number
    pending_amount: number
    approved_amount: number
    paid_amount: number
    void_amount: number
    total_earnings: number
  }
  recent_commissions: Array<{
    id: string
    order_id: string
    amount: number
    status: string
    created_at: string
  }>
}

export default function AffiliatePageClient({
  customer,
  initialAffiliateData,
  initialStatsData,
}: {
  customer: HttpTypes.StoreCustomer
  initialAffiliateData: AffiliateData | null
  initialStatsData: StatsData | null
}) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedProductLink, setCopiedProductLink] = useState<string | null>(null)
  
  // 产品搜索状态
  const [productSearch, setProductSearch] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [generatedProductLink, setGeneratedProductLink] = useState("")
  
  // 使用服务端传入的初始数据
  const affiliateData = initialAffiliateData
  const statsData = initialStatsData

  // 搜索产品
  useEffect(() => {
    const searchProducts = async () => {
      if (productSearch.length < 2) {
        setProducts([])
        return
      }
      
      setIsSearching(true)
      try {
        const response = await fetch(
          `/api/medusa-proxy/products?q=${encodeURIComponent(productSearch)}&limit=10`
        )
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error("Error searching products:", error)
      } finally {
        setIsSearching(false)
      }
    }
    
    const debounce = setTimeout(searchProducts, 300)
    return () => clearTimeout(debounce)
  }, [productSearch])

  // 生成产品推广链接
  const generateProductLink = (product: Product) => {
    if (!affiliateData?.affiliate) return ""
    
    const affiliate = affiliateData.affiliate
    // 从 affiliate_link 中提取基础参数
    const affiliateLinkUrl = new URL(affiliate.affiliate_link)
    const baseUrl = affiliateLinkUrl.origin
    
    // 构建产品推广链接
    const params = new URLSearchParams()
    // 复制原有的 affiliate 参数
    affiliateLinkUrl.searchParams.forEach((value, key) => {
      params.set(key, value)
    })
    
    const productLink = `${baseUrl}/products/${product.handle}?${params.toString()}`
    return productLink
  }

  // 选择产品
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    const link = generateProductLink(product)
    setGeneratedProductLink(link)
    setProductSearch("")
    setProducts([])
  }

  const copyToClipboard = async (text: string, type: "link" | "code" | "product") => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === "link") {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      } else if (type === "code") {
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
      } else if (type === "product") {
        setCopiedProductLink(text)
        setTimeout(() => setCopiedProductLink(null), 2000)
      }
      toast.success("已复制到剪贴板")
    } catch (error) {
      toast.error("复制失败")
    }
  }

  if (!affiliateData?.affiliate) {
    return (
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-2xl-semi">Affiliate Program</h1>
          <p className="text-base-regular text-ui-fg-subtle mt-2">
            您还不是 Affiliate。请联系管理员申请加入。
          </p>
        </div>
      </div>
    )
  }

  const affiliate = affiliateData.affiliate
  const stats = statsData?.stats || affiliate.stats

  const formatCurrency = (amount: number) => {
    return `$${(Number(amount) / 100).toFixed(2)}`
  }

  return (
    <div className="w-full space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl-semi">Affiliate Program</h1>
        <p className="text-base-regular text-ui-fg-subtle mt-2">
          推广商品，赚取佣金
        </p>
      </div>

      {/* 专属链接和折扣码 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-ui-border-base rounded-lg p-6">
          <h2 className="text-lg-semi mb-4">你的专属链接</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={affiliate.affiliate_link}
              className="flex-1 px-3 py-2 border border-ui-border-base rounded-md bg-ui-bg-subtle text-sm"
            />
            <button
              onClick={() => copyToClipboard(affiliate.affiliate_link, "link")}
              className="px-4 py-2 bg-ui-bg-base border border-ui-border-base rounded-md hover:bg-ui-bg-base-hover transition-colors"
            >
              {copiedLink ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <div className="border border-ui-border-base rounded-lg p-6">
          <h2 className="text-lg-semi mb-4">你的专属折扣码</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={affiliate.discount_code}
              className="flex-1 px-3 py-2 border border-ui-border-base rounded-md bg-ui-bg-subtle text-sm font-mono"
            />
            <button
              onClick={() => copyToClipboard(affiliate.discount_code, "code")}
              className="px-4 py-2 bg-ui-bg-base border border-ui-border-base rounded-md hover:bg-ui-bg-base-hover transition-colors"
            >
              {copiedCode ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* 数据概览 */}
      <div className="border border-ui-border-base rounded-lg p-6">
        <h2 className="text-lg-semi mb-6">数据概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-ui-fg-subtle mb-1">已推广订单数</p>
            <p className="text-2xl font-semibold">{stats.total_orders}</p>
          </div>
          <div>
            <p className="text-sm text-ui-fg-subtle mb-1">待结算金额</p>
            <p className="text-2xl font-semibold">
              {formatCurrency(stats.pending_amount + stats.approved_amount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-ui-fg-subtle mb-1">已提现金额</p>
            <p className="text-2xl font-semibold text-green-600">
              {formatCurrency(stats.paid_amount)}
            </p>
          </div>
        </div>
      </div>

      {/* 提成比例 */}
      <div className="border border-ui-border-base rounded-lg p-6">
        <h2 className="text-lg-semi mb-4">提成设置</h2>
        <p className="text-base-regular">
          你的提成比例: <span className="font-semibold">{affiliate.commission_rate}%</span>
        </p>
      </div>

      {/* 产品推广链接生成器 */}
      <div className="border border-ui-border-base rounded-lg p-6">
        <h2 className="text-lg-semi mb-4 flex items-center gap-2">
          <Link2 size={20} />
          产品推广链接生成器
        </h2>
        <p className="text-sm text-ui-fg-subtle mb-4">
          搜索并选择产品，生成带有你专属推广参数的链接
        </p>
        
        {/* 搜索框 */}
        <div className="relative mb-4">
          <div className="flex items-center gap-2 border border-ui-border-base rounded-md px-3 py-2">
            <Search size={16} className="text-ui-fg-subtle" />
            <input
              type="text"
              placeholder="搜索产品名称..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="flex-1 outline-none bg-transparent text-sm"
            />
            {isSearching && (
              <div className="animate-spin h-4 w-4 border-2 border-ui-fg-subtle border-t-transparent rounded-full" />
            )}
          </div>
          
          {/* 搜索结果下拉 */}
          {products.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-ui-bg-base border border-ui-border-base rounded-md shadow-lg max-h-60 overflow-y-auto">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-ui-bg-subtle transition-colors text-left"
                >
                  {product.thumbnail && (
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <span className="text-sm">{product.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* 选中的产品和生成的链接 */}
        {selectedProduct && (
          <div className="bg-ui-bg-subtle rounded-md p-4 space-y-3">
            <div className="flex items-center gap-3">
              {selectedProduct.thumbnail && (
                <img
                  src={selectedProduct.thumbnail}
                  alt={selectedProduct.title}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">{selectedProduct.title}</p>
                <a
                  href={`/products/${selectedProduct.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-ui-fg-subtle hover:underline flex items-center gap-1"
                >
                  查看产品 <ExternalLink size={12} />
                </a>
              </div>
            </div>
            
            <div>
              <label className="text-xs text-ui-fg-subtle block mb-1">你的推广链接：</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedProductLink}
                  className="flex-1 px-3 py-2 border border-ui-border-base rounded-md bg-ui-bg-base text-xs font-mono"
                />
                <button
                  onClick={() => copyToClipboard(generatedProductLink, "product")}
                  className="px-4 py-2 bg-ui-bg-base border border-ui-border-base rounded-md hover:bg-ui-bg-base-hover transition-colors"
                >
                  {copiedProductLink === generatedProductLink ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 最近佣金记录 */}
      {statsData?.recent_commissions && statsData.recent_commissions.length > 0 && (
        <div className="border border-ui-border-base rounded-lg p-6">
          <h2 className="text-lg-semi mb-4">最近佣金记录</h2>
          <div className="space-y-3">
            {statsData.recent_commissions.map((commission) => (
              <div
                key={commission.id}
                className="flex items-center justify-between py-2 border-b border-ui-border-base last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">订单 #{commission.order_id.slice(0, 8)}</p>
                  <p className="text-xs text-ui-fg-subtle">
                    {new Date(commission.created_at).toLocaleString("zh-CN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(commission.amount)}</p>
                  <p className="text-xs text-ui-fg-subtle">
                    {commission.status === "PENDING" && "待审核"}
                    {commission.status === "APPROVED" && "已审核"}
                    {commission.status === "PAID" && "已支付"}
                    {commission.status === "VOID" && "已作废"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
