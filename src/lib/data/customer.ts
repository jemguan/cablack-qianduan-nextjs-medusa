/**
 * Customer 模块入口文件
 * 为保持向后兼容，从拆分后的模块重新导出所有功能
 *
 * 模块结构：
 * - customer/retrieve.ts    - 客户信息获取 (retrieveCustomer, updateCustomer)
 * - customer/auth.ts        - 认证相关 (signup, login, signout, transferCart, handleGoogleCallback)
 * - customer/address.ts     - 地址管理 (addCustomerAddress, deleteCustomerAddress, updateCustomerAddress)
 * - customer/password.ts    - 密码管理 (requestPasswordReset, resetPassword)
 * - customer/email-verification.ts - 邮箱验证 (verifyEmail, getEmailVerificationStatus, resendVerificationEmail)
 *
 * 注意：此文件不包含 "use server" 指令，因为它只是重新导出。
 * 实际的服务器操作定义在各自的子模块文件中，它们已经包含了 "use server" 指令。
 */

export {
  // 客户信息获取
  retrieveCustomer,
  updateCustomer,
  // 认证相关
  signup,
  login,
  signout,
  transferCart,
  handleGoogleCallback,
  // 地址管理
  addCustomerAddress,
  deleteCustomerAddress,
  updateCustomerAddress,
  // 密码管理
  requestPasswordReset,
  resetPassword,
  // 邮箱验证
  verifyEmail,
  getEmailVerificationStatus,
  resendVerificationEmail,
} from "./customer/index"
