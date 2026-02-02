import React from "react"

export interface SlotConfig {
  name: string
  order: number
  /** CSS grid-column 值，如 "1 / -1"（跨满）、"span 2" */
  gridColumn?: string
  /** CSS grid-row 值，如 "1 / 2"、"span 2" */
  gridRow?: string
  /** 瀑布流模式下跨列数，默认 1 */
  columnSpan?: number
  /** Flex 模式下的比例，如 "2"、"1"，对应 CSS flex 属性 */
  flexSize?: string
}

export interface ContainerMetadata {
  layoutMode?: "grid" | "flex" | "stack" | "masonry"
  desktopTemplate?: string
  desktopRowTemplate?: string
  gap?: number
  slots?: Record<string, SlotConfig>
  /** 瀑布流列数（masonry 模式） */
  masonryCols?: number
}

export interface CompositeContainerProps {
  id: string
  metadata: ContainerMetadata
  slots: Map<string, React.ReactNode[]>
}

export function CompositeContainer({ id, metadata, slots }: CompositeContainerProps) {
  const {
    layoutMode = "stack",
    desktopTemplate,
    desktopRowTemplate,
    gap = 16,
    slots: slotConfig = {},
    masonryCols = 3,
  } = metadata

  const sortedSlotIds = Array.from(slots.keys()).sort((a, b) => {
    return (slotConfig[a]?.order ?? 999) - (slotConfig[b]?.order ?? 999)
  })

  const containerId = `container-${id}`

  // masonry 使用 CSS columns 实现瀑布流
  if (layoutMode === "masonry") {
    const fullWidthBreaks: { before: string[]; fullSlotId: string }[] = []
    let currentGroup: string[] = []

    let hasFullWidth = false
    for (const slotId of sortedSlotIds) {
      const cfg = slotConfig[slotId]
      if (cfg?.columnSpan === -1) {
        hasFullWidth = true
        fullWidthBreaks.push({ before: [...currentGroup], fullSlotId: slotId })
        currentGroup = []
      } else {
        currentGroup.push(slotId)
      }
    }

    if (!hasFullWidth) {
      return (
        <div
          id={containerId}
          className="content-container py-4"
          style={{ columnCount: masonryCols, columnGap: `${gap}px` }}
        >
          {sortedSlotIds.map((slotId) => {
            const children = slots.get(slotId)
            if (!children || children.length === 0) return null
            return (
              <div
                key={slotId}
                className="container-slot"
                data-slot-id={slotId}
                style={{ breakInside: "avoid", marginBottom: `${gap}px` }}
              >
                {children}
              </div>
            )
          })}
        </div>
      )
    }

    const renderColumnsGroup = (slotIds: string[], key: string) => {
      if (slotIds.length === 0) return null
      return (
        <div
          key={key}
          style={{ columnCount: masonryCols, columnGap: `${gap}px` }}
          className="masonry-group"
        >
          {slotIds.map((slotId) => {
            const children = slots.get(slotId)
            if (!children || children.length === 0) return null
            return (
              <div
                key={slotId}
                className="container-slot"
                data-slot-id={slotId}
                style={{ breakInside: "avoid", marginBottom: `${gap}px` }}
              >
                {children}
              </div>
            )
          })}
        </div>
      )
    }

    const renderFullSlot = (slotId: string) => {
      const children = slots.get(slotId)
      if (!children || children.length === 0) return null
      return (
        <div
          key={slotId}
          className="container-slot"
          data-slot-id={slotId}
          style={{ marginBottom: `${gap}px` }}
        >
          {children}
        </div>
      )
    }

    return (
      <div id={containerId} className="content-container py-4">
        {fullWidthBreaks.map(({ before, fullSlotId }, i) => (
          <React.Fragment key={i}>
            {renderColumnsGroup(before, `group-${i}`)}
            {renderFullSlot(fullSlotId)}
          </React.Fragment>
        ))}
        {renderColumnsGroup(currentGroup, "group-tail")}
      </div>
    )
  }

  // Grid 模式
  if (layoutMode === "grid") {
    const gridStyle: React.CSSProperties = {
      display: "grid",
      gridTemplateColumns: desktopTemplate || "1fr",
      ...(desktopRowTemplate ? { gridTemplateRows: desktopRowTemplate } : {}),
      gap: `${gap}px`,
    }

    return (
      <div id={containerId} className="content-container py-4" style={gridStyle}>
        {sortedSlotIds.map((slotId) => {
          const children = slots.get(slotId)
          if (!children || children.length === 0) return null

          const cfg = slotConfig[slotId]
          const slotStyle: React.CSSProperties = {}
          if (cfg?.gridColumn) slotStyle.gridColumn = cfg.gridColumn
          if (cfg?.gridRow) slotStyle.gridRow = cfg.gridRow

          return (
            <div
              key={slotId}
              className="container-slot"
              data-slot-id={slotId}
              style={Object.keys(slotStyle).length > 0 ? slotStyle : undefined}
            >
              {children}
            </div>
          )
        })}
      </div>
    )
  }

  // Flex 模式：每个插槽是一个垂直堆叠列，flex 比例控制宽度
  if (layoutMode === "flex") {
    return (
      <div
        id={containerId}
        className="content-container py-4"
        style={{ display: "flex", gap: `${gap}px`, alignItems: "flex-start" }}
      >
        {sortedSlotIds.map((slotId) => {
          const children = slots.get(slotId)
          if (!children || children.length === 0) return null

          const cfg = slotConfig[slotId]
          return (
            <div
              key={slotId}
              className="container-slot"
              data-slot-id={slotId}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: `${gap}px`,
                flex: cfg?.flexSize || "1",
                minWidth: 0,
              }}
            >
              {children}
            </div>
          )
        })}
      </div>
    )
  }

  // Stack 模式
  return (
    <div
      id={containerId}
      className="content-container py-4"
      style={{ display: "flex", flexDirection: "column", gap: `${gap}px` }}
    >
      {sortedSlotIds.map((slotId) => {
        const children = slots.get(slotId)
        if (!children || children.length === 0) return null
        return (
          <div key={slotId} className="container-slot" data-slot-id={slotId}>
            {children}
          </div>
        )
      })}
    </div>
  )
}
