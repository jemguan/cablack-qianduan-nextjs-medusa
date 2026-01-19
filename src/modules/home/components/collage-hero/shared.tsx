"use client"

/**
 * 共享模块导出
 * 从 components 目录重新导出所有共享组件
 */

// 动画组件
export { MotionDiv, AnimatePresence } from "./components/MotionDiv"

// 图标组件
export { Volume2Icon, VolumeXIcon, PlayIcon, PauseIcon } from "./components/Icons"

// 模块组件
export { ImageModuleComponent } from "./components/ImageModule"
export { CollectionModuleComponent } from "./components/CollectionModule"
export { VideoModuleComponent } from "./components/VideoModule"
export { ProductModuleComponent } from "./components/ProductModule"
export { TextModuleComponent } from "./components/TextModule"
export { ModuleContent } from "./components/ModuleContent"
export { ModuleRenderer } from "./components/ModuleRenderer"
export { BackgroundLayer } from "./components/BackgroundLayer"

// Hooks
export { useScrollOpacity } from "./hooks/useScrollOpacity"
export { useComponentVisibility } from "./hooks/useComponentVisibility"
export { useLinkPrefetch } from "./hooks/useLinkPrefetch"
