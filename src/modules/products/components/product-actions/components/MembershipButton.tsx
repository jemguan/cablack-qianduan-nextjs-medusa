"use client"

import { Button } from "@medusajs/ui"

type MembershipLoginButtonProps = {
  onClick: () => void
}

/**
 * 会员产品 - 需要登录按钮
 */
export function MembershipLoginButton({ onClick }: MembershipLoginButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="primary"
      className="flex-1 h-10 text-white border-none !border-2 !shadow-none bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 !border-green-600 hover:!border-green-700 dark:!border-green-600 dark:hover:!border-green-700"
      style={{ borderColor: 'rgb(22 163 74)', borderWidth: '2px', borderStyle: 'solid' }}
      data-testid="membership-login-button"
    >
      Need login to buy
    </Button>
  )
}

/**
 * 会员产品 - 已是VIP按钮
 */
export function MembershipVipButton() {
  return (
    <Button
      disabled
      variant="primary"
      className="flex-1 h-10 text-white border-none !border-2 !shadow-none bg-ui-bg-disabled hover:bg-ui-bg-disabled dark:bg-ui-bg-disabled dark:hover:bg-ui-bg-disabled !border-ui-border-base cursor-not-allowed"
      style={{ borderColor: 'rgb(229 231 235)', borderWidth: '2px', borderStyle: 'solid' }}
      data-testid="membership-vip-button"
    >
      You are already a VIP
    </Button>
  )
}
