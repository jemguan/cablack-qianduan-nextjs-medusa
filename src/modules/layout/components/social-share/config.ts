import type { SocialPlatform } from "./types"

/**
 * 平台配置
 */
export const PLATFORM_CONFIG: Record<
  SocialPlatform,
  {
    name: string
    color: string
    textColor: string
  }
> = {
  facebook: {
    name: "Facebook",
    color: "bg-[#1877F2] hover:bg-[#0C63D4]",
    textColor: "text-white",
  },
  twitter: {
    name: "Twitter",
    color: "bg-[#1DA1F2] hover:bg-[#0C8BD9]",
    textColor: "text-white",
  },
  instagram: {
    name: "Instagram",
    color: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90",
    textColor: "text-white",
  },
  linkedin: {
    name: "LinkedIn",
    color: "bg-[#0A66C2] hover:bg-[#004182]",
    textColor: "text-white",
  },
  pinterest: {
    name: "Pinterest",
    color: "bg-[#E60023] hover:bg-[#AD081B]",
    textColor: "text-white",
  },
  whatsapp: {
    name: "WhatsApp",
    color: "bg-[#25D366] hover:bg-[#1DA851]",
    textColor: "text-white",
  },
  email: {
    name: "Email",
    color: "bg-gray-600 hover:bg-gray-700",
    textColor: "text-white",
  },
  copy: {
    name: "Copy Link",
    color: "bg-gray-600 hover:bg-gray-700",
    textColor: "text-white",
  },
} as const

