"use client"

import { useState, useEffect } from "react"
import type { CountdownBannerData, ContentPosition } from "../../utils/handlers/countdownBanner"

interface CountdownBannerBlockProps {
  data: CountdownBannerData
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(endTime: string): TimeLeft | null {
  const end = new Date(endTime).getTime()
  const now = Date.now()
  const diff = end - now

  if (diff <= 0) return null

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0")
  return (
    <div className="flex flex-col items-center">
      <div
        className="bg-black text-white font-bold rounded flex items-center justify-center"
        style={{
          fontSize: "clamp(1rem, 3vw, 1.75rem)",
          width: "clamp(36px, 8vw, 56px)",
          height: "clamp(36px, 8vw, 56px)",
        }}
      >
        {display}
      </div>
      <span
        className="uppercase font-semibold mt-0.5"
        style={{ fontSize: "clamp(0.45rem, 1.2vw, 0.625rem)" }}
      >
        {label}
      </span>
    </div>
  )
}

const positionClasses: Record<ContentPosition, string> = {
  center: "items-center justify-center text-center",
  "top-left": "items-start justify-start text-left",
  "top-right": "items-end justify-start text-right",
  "bottom-left": "items-start justify-end text-left",
  "bottom-right": "items-end justify-end text-right",
}

export function CountdownBannerBlock({ data }: CountdownBannerBlockProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    data.endTime ? calculateTimeLeft(data.endTime) : null
  )

  useEffect(() => {
    if (!data.endTime) return

    const timer = setInterval(() => {
      const tl = calculateTimeLeft(data.endTime)
      setTimeLeft(tl)
      if (!tl) clearInterval(timer)
    }, 1000)

    return () => clearInterval(timer)
  }, [data.endTime])

  if (!data.endTime || !timeLeft) return null

  const containerClass = data.fullWidth ? "w-full" : "content-container"
  const hasImage = !!data.backgroundImage
  const showDays = timeLeft.days > 0
  const position = data.contentPosition || "center"
  const paddingY = data.paddingY ?? 16

  return (
    <div className={containerClass} style={{ paddingTop: paddingY, paddingBottom: paddingY }}>
      <div
        className="relative overflow-hidden rounded-lg"
        style={{ backgroundColor: data.backgroundColor, color: data.textColor }}
      >
        {/* 背景图：不裁剪不拉伸，容器高度跟随图片 */}
        {hasImage && (
          <>
            <img
              src={data.backgroundImage}
              alt=""
              className={`w-full h-auto block ${data.backgroundImageMobile ? "hidden md:block" : ""}`}
            />
            {data.backgroundImageMobile && (
              <img
                src={data.backgroundImageMobile}
                alt=""
                className="w-full h-auto block md:hidden"
              />
            )}
          </>
        )}

        {/* 内容层 */}
        <div
          className={`flex flex-col gap-3 p-4 md:p-6 ${
            hasImage ? "absolute inset-0" : ""
          } ${positionClasses[position]}`}
        >
          {/* 标题 */}
          {data.showTitle && data.title && (
            <h2
              className="font-bold leading-tight"
              style={{
                fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
                color: data.textColor,
              }}
            >
              {data.title}
            </h2>
          )}

          {/* 副标题 */}
          {data.showSubtitle && data.subtitle && (
            <p
              className="opacity-80"
              style={{
                fontSize: "clamp(0.75rem, 1.5vw, 1rem)",
                color: data.textColor,
              }}
            >
              {data.subtitle}
            </p>
          )}

          {/* 倒计时数字 - 紧凑版 */}
          <div className="flex items-center gap-1 md:gap-2" style={{ color: data.textColor }}>
            {showDays && (
              <>
                <TimeUnit value={timeLeft.days} label="DAY" />
                <span className="text-lg md:text-2xl font-bold pb-3">:</span>
              </>
            )}
            <TimeUnit value={timeLeft.hours} label="HOUR" />
            <span className="text-lg md:text-2xl font-bold pb-3">:</span>
            <TimeUnit value={timeLeft.minutes} label="MIN" />
            <span className="text-lg md:text-2xl font-bold pb-3">:</span>
            <TimeUnit value={timeLeft.seconds} label="SEC" />
          </div>

          {/* CTA 按钮 */}
          {data.buttonText && (
            <a
              href={data.buttonLink || "#"}
              target={data.buttonLinkTarget || "_self"}
              rel={data.buttonLinkTarget === "_blank" ? "noopener noreferrer" : undefined}
              className="inline-block rounded-full px-6 py-2.5 font-bold text-sm uppercase tracking-wider transition-opacity hover:opacity-90"
              style={{
                backgroundColor: data.buttonBgColor,
                color: data.buttonTextColor,
              }}
            >
              {data.buttonText}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
