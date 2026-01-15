import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

/**
 * POST /api/revalidate/page-title-config
 * 清除页面标题配置缓存
 * 需要提供 secret token 进行验证
 */
export async function POST(request: NextRequest) {
  try {
    // 验证 secret token（防止未授权访问）
    const authHeader = request.headers.get("authorization")
    const secretToken = process.env.REVALIDATE_SECRET_TOKEN || "your-secret-token"
    
    if (authHeader !== `Bearer ${secretToken}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 清除 page-title-config 缓存
    revalidateTag("page-title-config")

    return NextResponse.json({
      revalidated: true,
      message: "Page title config cache cleared successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error revalidating page-title-config cache:", error)
    return NextResponse.json(
      {
        error: "Failed to revalidate cache",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
