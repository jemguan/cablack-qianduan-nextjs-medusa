"use client"

import { useState, useEffect, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import { Copy, Check, Search, Link2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import ChevronDown from "@modules/common/icons/chevron-down"

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
    order_display_id: number | null
    amount: number
    status: string
    created_at: string
    void_reason: string | null
  }>
}

type PaymentRecord = {
  paid_at: string
  amount: number
  commission_count: number
  order_ids: string[]
  order_display_ids?: number[]
  payment_note: string | null
}

type PaymentHistoryData = {
  payment_records: PaymentRecord[]
  total_paid: number
  total_commissions: number
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
  
  // 支付历史状态
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryData | null>(null)
  const [isLoadingPaymentHistory, setIsLoadingPaymentHistory] = useState(false)
  
  // 自动审核配置
  const [autoApproveDays, setAutoApproveDays] = useState<number>(0)
  
  // 折叠状态
  const [isCommissionsExpanded, setIsCommissionsExpanded] = useState(false)
  const [isPaymentsExpanded, setIsPaymentsExpanded] = useState(false)
  
  // 分页状态
  const [commissionsPage, setCommissionsPage] = useState(1)
  const [paymentsPage, setPaymentsPage] = useState(1)
  const itemsPerPage = 5
  
  // 使用服务端传入的初始数据
  const affiliateData = initialAffiliateData
  const statsData = initialStatsData
  
  // 分页计算
  const paginatedCommissions = useMemo(() => {
    if (!statsData?.recent_commissions) return []
    const start = (commissionsPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return statsData.recent_commissions.slice(start, end)
  }, [statsData?.recent_commissions, commissionsPage])
  
  const paginatedPayments = useMemo(() => {
    if (!paymentHistory?.payment_records) return []
    const start = (paymentsPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return paymentHistory.payment_records.slice(start, end)
  }, [paymentHistory?.payment_records, paymentsPage])
  
  const totalCommissionsPages = Math.ceil((statsData?.recent_commissions?.length || 0) / itemsPerPage)
  const totalPaymentsPages = Math.ceil((paymentHistory?.payment_records?.length || 0) / itemsPerPage)

  // 获取支付历史
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      setIsLoadingPaymentHistory(true)
      try {
        const response = await fetch("/api/affiliate/payment-history", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setPaymentHistory(data)
        }
      } catch (error) {
        console.error("Error fetching payment history:", error)
      } finally {
        setIsLoadingPaymentHistory(false)
      }
    }
    
    if (affiliateData?.affiliate) {
      fetchPaymentHistory()
    }
  }, [affiliateData])

  // 获取自动审核配置
  useEffect(() => {
    const fetchAutoApproveConfig = async () => {
      try {
        const response = await fetch("/api/affiliate/auto-approve-config", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          const days = data.auto_approve_days || 0
          setAutoApproveDays(days)
        } else {
          const errorText = await response.text()
          console.error("[Affiliate] Failed to fetch auto approve config:", response.status, errorText)
        }
      } catch (error) {
        console.error("[Affiliate] Error fetching auto approve config:", error)
      }
    }
    
    // 无论是否有 affiliate 数据都尝试获取配置（因为这是全局配置）
    fetchAutoApproveConfig()
  }, [])

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
      toast.success("Copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy")
    }
  }

  if (!affiliateData?.affiliate) {
    return (
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-2xl-semi">Affiliate Program</h1>
          <p className="text-base-regular text-ui-fg-subtle mt-2">
            You are not an Affiliate yet. Please contact the administrator to apply.
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
          Promote products and earn commissions
        </p>
      </div>

      {/* 专属链接和折扣码 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-ui-border-base rounded-lg p-6">
          <h2 className="text-lg-semi mb-4">Your Affiliate Link</h2>
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
          <h2 className="text-lg-semi mb-4">Your Discount Code</h2>
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
        <h2 className="text-lg-semi mb-6">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-ui-fg-subtle mb-1">Total Orders</p>
            <p className="text-2xl font-semibold">{stats.total_orders}</p>
          </div>
          <div>
            <p className="text-sm text-ui-fg-subtle mb-1">Pending Amount</p>
            <p className="text-2xl font-semibold">
              {formatCurrency(stats.pending_amount + stats.approved_amount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-ui-fg-subtle mb-1">Paid Amount</p>
            <p className="text-2xl font-semibold text-green-600">
              {formatCurrency(stats.paid_amount)}
            </p>
          </div>
        </div>
      </div>

      {/* 提成比例 */}
      <div className="border border-ui-border-base rounded-lg p-6">
        <h2 className="text-lg-semi mb-4">Commission Settings</h2>
        <p className="text-base-regular">
          Your commission rate: <span className="font-semibold">{affiliate.commission_rate}%</span>
        </p>
      </div>

      {/* 产品推广链接生成器 */}
      <div className="border border-ui-border-base rounded-lg p-6">
        <h2 className="text-lg-semi mb-4 flex items-center gap-2">
          <Link2 size={20} />
          Product Link Generator
        </h2>
        <div className="mb-4 space-y-2">
          <p className="text-sm text-ui-fg-subtle">
            Search and select products to generate links with your affiliate parameters
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Enter a product title in the search box to find products, then select a product to generate your affiliate link.
            </p>
          </div>
        </div>
        
        {/* 搜索框 */}
        <div className="relative mb-4">
          <div className="flex items-center gap-2 border border-ui-border-base rounded-md px-3 py-2">
            <Search size={16} className="text-ui-fg-subtle" />
            <input
              type="text"
              placeholder="Search product name..."
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
                  View Product <ExternalLink size={12} />
                </a>
              </div>
            </div>
            
            <div>
              <label className="text-xs text-ui-fg-subtle block mb-1">Your Affiliate Link:</label>
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

      {/* 最近佣金记录和提现记录 - 并排显示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 最近佣金记录 */}
        {statsData?.recent_commissions && statsData.recent_commissions.length > 0 && (
          <div className="border border-ui-border-base rounded-lg p-6">
            <button
              onClick={() => setIsCommissionsExpanded(!isCommissionsExpanded)}
              className="w-full flex items-center justify-between mb-4 hover:opacity-70 transition-opacity"
            >
              <h2 className="text-lg-semi">Recent Commissions</h2>
              <ChevronDown 
                className={`transition-transform ${isCommissionsExpanded ? 'rotate-180' : ''}`}
                size={20}
              />
            </button>
            {isCommissionsExpanded && (
              <>
                {/* 指导文案 - 自动审核提示 */}
                {autoApproveDays > 0 ? (
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Auto-approval:</strong> Commissions will be automatically approved after <strong>{autoApproveDays}</strong> days
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 bg-gray-50 border border-gray-200 rounded-md p-3">
                    <p className="text-sm text-gray-600">
                      💡 <strong>Review Note:</strong> Commissions require manual approval by an administrator
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {paginatedCommissions.map((commission) => {
              // 优先使用 display_id，如果没有则使用完整的 order_id
              const orderNumber = commission.order_display_id 
                ? `#${commission.order_display_id}` 
                : commission.order_id 
                  ? `#${commission.order_id}` 
                  : "Unknown Order"
              const isVoid = commission.status === "VOID"
              // 如果有 void_reason，说明有退款或调整，需要显示
              const hasRefundInfo = !!commission.void_reason
              
              return (
                <div
                  key={commission.id}
                  className={`flex items-start justify-between py-3 border-b border-ui-border-base last:border-0 ${
                    isVoid ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">Order {orderNumber}</p>
                      {(isVoid || hasRefundInfo) && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                          {isVoid ? "Returned" : "Refunded"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ui-fg-subtle mb-1">
                      {new Date(commission.created_at).toLocaleString("en-US")}
                    </p>
                    {isVoid && commission.void_reason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        <p className="font-medium mb-1">Void Reason:</p>
                        <p>{commission.void_reason}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className={`text-sm font-semibold ${isVoid ? "line-through text-ui-fg-subtle" : ""}`}>
                      {formatCurrency(commission.amount)}
                    </p>
                    <p className="text-xs text-ui-fg-subtle">
                      {commission.status === "PENDING" && "Pending"}
                      {commission.status === "APPROVED" && "Approved"}
                      {commission.status === "PAID" && "Paid"}
                      {commission.status === "VOID" && "Void"}
                    </p>
                  </div>
                </div>
                  )
                  })}
                </div>
                
                {/* 分页控件 */}
                {totalCommissionsPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-ui-border-base">
                    <button
                      onClick={() => setCommissionsPage(Math.max(1, commissionsPage - 1))}
                      disabled={commissionsPage === 1}
                      className="px-3 py-1 text-sm border border-ui-border-base rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ui-bg-subtle"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-ui-fg-subtle">
                      Page {commissionsPage} / {totalCommissionsPages}
                    </span>
                    <button
                      onClick={() => setCommissionsPage(Math.min(totalCommissionsPages, commissionsPage + 1))}
                      disabled={commissionsPage === totalCommissionsPages}
                      className="px-3 py-1 text-sm border border-ui-border-base rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ui-bg-subtle"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 提现记录 */}
        <div className="border border-ui-border-base rounded-lg p-6">
          <button
            onClick={() => setIsPaymentsExpanded(!isPaymentsExpanded)}
            className="w-full flex items-center justify-between mb-4 hover:opacity-70 transition-opacity"
          >
            <h2 className="text-lg-semi">Payment History</h2>
            <ChevronDown 
              className={`transition-transform ${isPaymentsExpanded ? 'rotate-180' : ''}`}
              size={20}
            />
          </button>
          {isLoadingPaymentHistory ? (
            <div className="text-center py-8">
              <p className="text-sm text-ui-fg-subtle">Loading...</p>
            </div>
          ) : paymentHistory && paymentHistory.payment_records.length > 0 ? (
            isPaymentsExpanded && (
              <div className="space-y-4">
                {/* 指导文案 */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Payment Note:</strong> Please contact the administrator to request a withdrawal. The withdrawal amount is your pending balance (approved commissions).
                  </p>
                </div>
                
                {/* 统计摘要 */}
                <div className="bg-ui-bg-subtle rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-ui-fg-subtle">Total Paid:</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(paymentHistory.total_paid)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-ui-fg-subtle">Payment Count:</p>
                    <p className="text-sm font-medium">
                      {paymentHistory.payment_records.length} times
                    </p>
                  </div>
                </div>

                {/* 提现记录列表 */}
                <div className="space-y-3">
                  {paginatedPayments.map((record, index) => (
                <div
                  key={record.paid_at || index}
                  className="border border-ui-border-base rounded-lg p-4 space-y-2 hover:bg-ui-bg-subtle transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-ui-fg-subtle">
                      {new Date(record.paid_at).toLocaleString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Paid
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-ui-fg-subtle">
                      {record.commission_count} commission{record.commission_count !== 1 ? 's' : ''}
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(record.amount)}
                    </p>
                  </div>
                  {record.order_display_ids && record.order_display_ids.length > 0 ? (
                    <div className="text-xs text-ui-fg-subtle mt-1">
                      Orders: {record.order_display_ids.slice(0, 3).map(id => `#${id}`).join(", ")}
                      {record.order_display_ids.length > 3 && ` and ${record.order_display_ids.length} more`}
                    </div>
                  ) : record.order_ids && record.order_ids.length > 0 ? (
                    <div className="text-xs text-ui-fg-subtle mt-1">
                      Orders: {record.order_ids.slice(0, 3).map(id => `#${id.slice(0, 8)}`).join(", ")}
                      {record.order_ids.length > 3 && ` and ${record.order_ids.length} more`}
                    </div>
                  ) : null}
                  </div>
                  ))}
                </div>
                
                {/* 分页控件 */}
                {totalPaymentsPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-ui-border-base">
                    <button
                      onClick={() => setPaymentsPage(Math.max(1, paymentsPage - 1))}
                      disabled={paymentsPage === 1}
                      className="px-3 py-1 text-sm border border-ui-border-base rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ui-bg-subtle"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-ui-fg-subtle">
                      Page {paymentsPage} / {totalPaymentsPages}
                    </span>
                    <button
                      onClick={() => setPaymentsPage(Math.min(totalPaymentsPages, paymentsPage + 1))}
                      disabled={paymentsPage === totalPaymentsPages}
                      className="px-3 py-1 text-sm border border-ui-border-base rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ui-bg-subtle"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )
          ) : isPaymentsExpanded ? (
            <div className="space-y-4">
              {/* 指导文案 */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  💡 <strong>Payment Note:</strong> Please contact the administrator to request a withdrawal. The withdrawal amount is your pending balance (approved commissions).
                </p>
              </div>
              
              <div className="text-center py-8">
                <p className="text-sm text-ui-fg-subtle">No payment records yet</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
