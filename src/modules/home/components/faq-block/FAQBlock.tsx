"use client"

import { useState, useEffect } from 'react'
import { Text } from '@medusajs/ui'
import ChevronDown from '@modules/common/icons/chevron-down'
import type { FAQBlockProps, FAQItem } from './types'
import { parseFAQMetadata, filterFAQItems } from './utils'

// 搜索图标组件
const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 19L14.65 14.65"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export function FAQBlock({ data }: FAQBlockProps) {
  const {
    // 向后兼容的原始items字段
    items: rawItems,
    defaultOpenFirst = false,
    allowMultiple = false,
    theme = 'default',
    showSearch = false,
    searchPlaceholder = '搜索问题...',
    iconType = 'chevron',
    animationDuration = 300,
    // 新增：支持两种数据源模式
    dataMode,
    metafieldConfig,
    directItems,
    // 兼容管理后台的数据结构（主要用于直接配置模式）
    items: configItems,
    // UI配置
    title,
    subtitle,
    showTitle = false,
    showSubtitle = false,
    titleAlign = 'left',
  } = data

  // 处理数据源
  const [items, setItems] = useState<FAQItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredItems, setFilteredItems] = useState<FAQItem[]>([])

  useEffect(() => {
    let finalItems: FAQItem[] = []

    // 数据已经在 blockHandlers 中处理好了（包括 metadata 模式的解析）
    // 直接使用传入的 items 或 directItems
    finalItems = directItems || configItems || rawItems || []

    setItems(finalItems)
  }, [rawItems, directItems, configItems])

  useEffect(() => {
    if (showSearch && searchQuery.trim()) {
      setFilteredItems(filterFAQItems(items, searchQuery))
    } else {
      setFilteredItems(items)
    }
  }, [items, searchQuery, showSearch])

  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [lastItemsLength, setLastItemsLength] = useState(0)

  // 当 items 加载完成且 defaultOpenFirst 为 true 时，自动展开第一个
  // 当 items 数量变化时（新数据加载），重新应用 defaultOpenFirst
  useEffect(() => {
    if (defaultOpenFirst && items.length > 0) {
      // 如果 items 数量变化了（新数据加载），重置 openItems 并展开第一个
      if (items.length !== lastItemsLength) {
        setOpenItems(new Set([items[0].id]))
        setLastItemsLength(items.length)
      }
    } else if (items.length !== lastItemsLength) {
      // 如果 defaultOpenFirst 为 false 或 items 为空，更新 lastItemsLength
      setLastItemsLength(items.length)
    }
  }, [defaultOpenFirst, items, lastItemsLength])

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        if (!allowMultiple) {
          newSet.clear()
        }
        newSet.add(id)
      }
      return newSet
    })
  }

  const themeClasses = {
    default: 'border-b border-border',
    bordered: 'border border-border rounded-lg mb-4 p-4',
    minimal: 'border-b border-border/50',
  }

  const getIcon = (isOpen: boolean) => {
    switch (iconType) {
      case 'plus':
        return (
          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center relative">
            <div
              className={`w-4 h-0.5 bg-current transition-transform duration-200 ${
                isOpen ? 'rotate-90' : ''
              }`}
            />
            <div
              className={`absolute w-4 h-0.5 bg-current transition-opacity duration-200 ${
                isOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
          </div>
        )
      case 'arrow':
        return (
          <ChevronDown
            size="20"
            className={`flex-shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )
      case 'chevron':
      default:
        return (
          <ChevronDown
            size="20"
            className={`flex-shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )
    }
  }

  const titleAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[titleAlign]

  // 如果没有数据，不渲染
  if (items.length === 0 && filteredItems.length === 0) {
    return null
  }

  return (
    <div className="content-container py-8">
      {/* 标题和副标题 */}
      {((showTitle && title) || (showSubtitle && subtitle)) && (
        <div className={`mb-6 ${titleAlignClass}`}>
          {showTitle && title && (
            <Text className="txt-xlarge mb-2">{title}</Text>
          )}
          {showSubtitle && subtitle && (
            <Text className="text-medium text-ui-fg-subtle">{subtitle}</Text>
          )}
        </div>
      )}

      <div className="w-full mx-auto">
        {/* 搜索框 */}
        {showSearch && (
          <div className="mb-6">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ui-fg-muted">
                <SearchIcon />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* FAQ 列表 */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-ui-fg-muted">
            {showSearch && searchQuery.trim()
              ? '没有找到匹配的问题'
              : '暂无FAQ内容'}
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const isOpen = openItems.has(item.id)
            return (
              <div
                key={item.id || `faq-item-${index}`}
                className={themeClasses[theme]}
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between py-4 text-left hover:text-primary transition-colors"
                  aria-expanded={isOpen}
                  style={{ transitionDuration: `${animationDuration}ms` }}
                >
                  <span className="text-lg font-semibold pr-4">
                    {item.question}
                  </span>
                  {getIcon(isOpen)}
                </button>
                {isOpen && (
                  <div
                    className="pb-4 text-ui-fg-subtle animate-in fade-in slide-in-from-top-2"
                    style={{ animationDuration: `${animationDuration}ms` }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: item.answer }} />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

