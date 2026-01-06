const SkeletonProductPreview = () => {
  return (
    <div className="group relative flex flex-col h-full rounded-lg p-2">
      {/* Image Container - 匹配实际产品预览的图片容器 */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted mb-3 shadow-md animate-pulse">
        {/* 图片占位符 */}
        <div className="w-full h-full bg-muted" />
        
        {/* Badge 占位符（可选） */}
        <div className="absolute top-0 left-0 z-20">
          <div className="bg-muted-foreground/20 h-6 w-12 rounded-br-md" />
        </div>
        
        {/* Wishlist 按钮占位符 */}
        <div className="absolute top-2 right-2 z-20">
          <div className="w-8 h-8 bg-muted-foreground/20 rounded-full" />
        </div>
      </div>

      {/* Product Info - 匹配实际产品预览的信息布局 */}
      <div className="flex flex-col gap-2 flex-1 px-1">
        {/* Title - 2行，固定高度 h-10 */}
        <div className="h-10 flex flex-col gap-1.5">
          <div className="h-4 bg-muted rounded w-full animate-pulse" />
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
        </div>

        {/* Subtitle - 1行，h-4 */}
        <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />

        {/* Rating - 评分占位符 */}
        <div className="flex items-center gap-1 h-4">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-3 h-3 bg-muted rounded-sm animate-pulse" />
            ))}
          </div>
          <div className="h-3 w-8 bg-muted rounded ml-1 animate-pulse" />
        </div>

        {/* Price - 价格占位符 */}
        <div className="flex items-center gap-x-2 h-6">
          <div className="h-5 bg-muted rounded w-20 animate-pulse" />
        </div>

        {/* Variant Selector - 变体选择器占位符（可选） */}
        <div className="mt-1 h-8 flex gap-1">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
        </div>

        {/* Quick Add Button - 快速添加按钮占位符 */}
        <div className="mt-2 h-9 bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}

export default SkeletonProductPreview
