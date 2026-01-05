import { Text } from "@medusajs/ui"

import Medusa from "../../../common/icons/medusa"
import NextJs from "../../../common/icons/nextjs"

interface MedusaCTAProps {
  text?: string;
}

const MedusaCTA = ({ text }: MedusaCTAProps) => {
  // 如果提供了自定义文字，使用简单文字显示
  if (text && text.trim() !== '') {
    return (
      <Text className="txt-compact-small-plus text-ui-fg-subtle">
        {text}
      </Text>
    )
  }

  // 默认显示图标版本
  return (
    <Text className="flex gap-x-2 txt-compact-small-plus items-center">
      Powered by
      <a href="https://www.medusajs.com" target="_blank" rel="noreferrer">
        <Medusa fill="#9ca3af" className="fill-[#9ca3af]" />
      </a>
      &
      <a href="https://nextjs.org" target="_blank" rel="noreferrer">
        <NextJs fill="#9ca3af" />
      </a>
    </Text>
  )
}

export default MedusaCTA
