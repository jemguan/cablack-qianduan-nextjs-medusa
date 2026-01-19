// 客户信息获取
export { retrieveCustomer, updateCustomer } from "./retrieve"

// 认证相关
export {
  signup,
  login,
  signout,
  transferCart,
  handleGoogleCallback,
} from "./auth"

// 地址管理
export {
  addCustomerAddress,
  deleteCustomerAddress,
  updateCustomerAddress,
} from "./address"

// 密码管理
export { requestPasswordReset, resetPassword } from "./password"

// 邮箱验证
export {
  verifyEmail,
  getEmailVerificationStatus,
  resendVerificationEmail,
} from "./email-verification"
