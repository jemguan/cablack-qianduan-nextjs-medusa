import { useResponsiveRender } from './useResponsiveRender'

/**
 * 判断当前是否为移动端
 * 基于 useResponsiveRender hook，当 isDesktop 为 false 时认为是移动端
 */
export function useIsMobile(): boolean {
  const { isDesktop, isHydrated } = useResponsiveRender()
  
  // 在服务端渲染或未水合时，默认返回 false（桌面端）
  if (!isHydrated) {
    return false
  }
  
  return !isDesktop
}

export default useIsMobile

