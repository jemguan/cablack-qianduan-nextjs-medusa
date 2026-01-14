"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const searchParams = useSearchParams()
  const viewParam = searchParams?.get("view")
  
  // 初始化视图：如果 URL 中有 view=register，则显示注册页面
  const [currentView, setCurrentView] = useState(() => {
    return viewParam === "register" ? LOGIN_VIEW.REGISTER : LOGIN_VIEW.SIGN_IN
  })

  // 当 URL 参数变化时，更新视图
  useEffect(() => {
    if (viewParam === "register") {
      setCurrentView(LOGIN_VIEW.REGISTER)
    } else if (viewParam === "sign-in" || !viewParam) {
      setCurrentView(LOGIN_VIEW.SIGN_IN)
    }
  }, [viewParam])

  return (
    <div className="w-full flex justify-start px-8 py-8">
      {currentView === LOGIN_VIEW.SIGN_IN ? (
        <Login setCurrentView={setCurrentView} />
      ) : (
        <Register setCurrentView={setCurrentView} />
      )}
    </div>
  )
}

export default LoginTemplate
