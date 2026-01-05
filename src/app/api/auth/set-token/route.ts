import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    cookieStore.set("_medusa_jwt", token, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      sameSite: "lax", // 改为 lax 以确保重定向后 cookie 可用
      secure: process.env.NODE_ENV === "production",
      path: "/", // 确保 cookie 在所有路径可用
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to set token" },
      { status: 500 }
    )
  }
}

