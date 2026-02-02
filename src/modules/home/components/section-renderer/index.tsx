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
            <Component {...blockConfig.props} blockId={node.id} {...sharedProps} />
          </div>
        )
      })}

      {insideContainer && (
        <style
          dangerouslySetInnerHTML={{
            __html: `.slot-child .content-container { max-width: none !important; padding: 0 !important; margin: 0 !important; } .container-slot { height: 100%; } .container-slot > .slot-child { height: 100%; } .container-slot > .slot-child > div { height: 100%; } .slot-child .slideshow-wrapper { padding: 0 !important; height: 100%; } .slot-child .slideshow-wrapper > .relative.group { height: 100%; } .slot-child .slideshow-wrapper .overflow-hidden { height: 100%; } .slot-child .slideshow-wrapper .overflow-hidden > .flex { height: 100%; } .slot-child .slideshow-wrapper .flex-\\[0_0_100\\%\\] { height: 100%; } .slot-child .slideshow-wrapper .flex-\\[0_0_100\\%\\] > div, .slot-child .slideshow-wrapper .flex-\\[0_0_100\\%\\] > a { height: 100%; } .slot-child .slideshow-wrapper img, .slot-child .slideshow-wrapper video { width: 100%; height: 100%; object-fit: fill; }`,
          }}
        />
      )}
    </>
  )
}
