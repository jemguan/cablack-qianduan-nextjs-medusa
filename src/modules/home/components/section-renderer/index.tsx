import React from "react"
import type { PageBlockNode } from "@lib/admin-api/pageLayoutUtils"
import { groupChildrenBySlot } from "@lib/admin-api/pageLayoutUtils"
import { CompositeContainer } from "../composite-container"
import type { BlockConfig } from "@modules/home/utils/handlers"

export interface SectionRendererProps {
  nodes: PageBlockNode[]
  componentMap: Record<string, React.ComponentType<any>>
  blockConfigs: Map<string, BlockConfig>
  sharedProps?: Record<string, any>
  /** 是否在容器内部渲染（子节点去掉 content-container 边距） */
  insideContainer?: boolean
}

const VISIBILITY_CLASSES: Record<string, string> = {
  desktop_only: "hidden md:block",
  mobile_only: "block md:hidden",
}

export function SectionRenderer({
  nodes,
  componentMap,
  blockConfigs,
  sharedProps = {},
  insideContainer = false,
}: SectionRendererProps) {
  return (
    <>
      {nodes.map((node) => {
        if (!node.enabled) return null

        const visibilityClass = VISIBILITY_CLASSES[node.visibility || ""] || ""

        // CompositeContainer 处理
        if (node.type === "compositeContainer") {
          const containerMetadata = node.config?.containerMetadata
          if (!containerMetadata) return null

          const childrenBySlot = groupChildrenBySlot(node.children)
          const renderedSlots = new Map<string, React.ReactNode[]>()

          childrenBySlot.forEach((children, slotId) => {
            renderedSlots.set(
              slotId,
              children.map((child) => (
                <SectionRenderer
                  key={child.id}
                  nodes={[child]}
                  componentMap={componentMap}
                  blockConfigs={blockConfigs}
                  sharedProps={sharedProps}
                  insideContainer
                />
              ))
            )
          })

          return (
            <div key={node.id} className={[
              visibilityClass,
              insideContainer ? "slot-child" : "",
            ].filter(Boolean).join(" ") || undefined}>
              <CompositeContainer
                id={node.id}
                metadata={containerMetadata}
                slots={renderedSlots}
              />
            </div>
          )
        }

        // 普通业务组件
        const blockConfig = blockConfigs.get(node.id)
        if (!blockConfig?.componentName) return null

        const Component = componentMap[blockConfig.componentName]
        if (!Component) return null

        return (
          <div
            key={node.id}
            className={[
              visibilityClass,
              insideContainer ? "slot-child" : "",
            ].filter(Boolean).join(" ") || undefined}
          >
            <Component {...blockConfig.props} {...sharedProps} />
          </div>
        )
      })}

      {insideContainer && (
        <style
          dangerouslySetInnerHTML={{
            __html: `.slot-child .content-container { max-width: none !important; padding: 0 !important; margin: 0 !important; }`,
          }}
        />
      )}
    </>
  )
}
