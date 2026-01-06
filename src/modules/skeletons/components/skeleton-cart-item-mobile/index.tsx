const SkeletonCartItemMobile = () => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm animate-pulse w-full overflow-hidden">
      <div className="flex gap-4 w-full">
        {/* Product Image */}
        <div className="shrink-0">
          <div className="w-24 h-24 small:w-20 small:h-20 bg-muted rounded-lg" />
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-3 overflow-hidden">
          <div className="flex-1 min-w-0">
            {/* Title - 2行，固定高度 */}
            <div className="h-5 bg-muted rounded mb-1.5 w-full" />
            <div className="h-4 bg-muted rounded mb-1.5 w-3/4" />
            
            {/* Variant Options */}
            <div className="h-3 bg-muted rounded mb-2 w-1/2" />
            
            {/* Price and Delete Button */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="h-6 bg-muted rounded w-20 shrink-0" />
              <div className="w-11 h-11 bg-muted rounded shrink-0 flex-shrink-0" />
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-border gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <div className="h-4 bg-muted rounded w-16 shrink-0 whitespace-nowrap" />
              <div className="w-20 h-10 bg-muted rounded shrink-0 flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonCartItemMobile

