/**
 * 生产环境日志控制工具
 * 在生产环境中禁用 console.log，保留 error 和 warn
 */

type LogLevel = "debug" | "log" | "info" | "warn" | "error"

interface LoggerConfig {
  /** 是否启用调试日志 */
  enableDebug: boolean
  /** 是否启用 info/log 日志 */
  enableInfo: boolean
  /** 是否启用警告日志 */
  enableWarn: boolean
  /** 是否启用错误日志 */
  enableError: boolean
  /** 日志前缀 */
  prefix?: string
}

const isDevelopment = process.env.NODE_ENV === "development"
const isTest = process.env.NODE_ENV === "test"

// 默认配置：开发环境启用所有日志，生产环境只启用 warn 和 error
const defaultConfig: LoggerConfig = {
  enableDebug: isDevelopment || isTest,
  enableInfo: isDevelopment || isTest,
  enableWarn: true,
  enableError: true,
}

/**
 * 创建日志记录器
 */
function createLogger(config: Partial<LoggerConfig> = {}) {
  const finalConfig: LoggerConfig = { ...defaultConfig, ...config }
  const prefix = finalConfig.prefix ? `[${finalConfig.prefix}]` : ""

  return {
    /**
     * 调试日志 - 仅开发环境
     */
    debug: (...args: unknown[]) => {
      if (finalConfig.enableDebug) {
        console.debug(prefix, ...args)
      }
    },

    /**
     * 普通日志 - 仅开发环境
     */
    log: (...args: unknown[]) => {
      if (finalConfig.enableInfo) {
        console.log(prefix, ...args)
      }
    },

    /**
     * 信息日志 - 仅开发环境
     */
    info: (...args: unknown[]) => {
      if (finalConfig.enableInfo) {
        console.info(prefix, ...args)
      }
    },

    /**
     * 警告日志 - 始终启用
     */
    warn: (...args: unknown[]) => {
      if (finalConfig.enableWarn) {
        console.warn(prefix, ...args)
      }
    },

    /**
     * 错误日志 - 始终启用
     */
    error: (...args: unknown[]) => {
      if (finalConfig.enableError) {
        console.error(prefix, ...args)
      }
    },

    /**
     * 条件日志 - 只在条件为 true 时输出
     */
    logIf: (condition: boolean, ...args: unknown[]) => {
      if (condition && finalConfig.enableInfo) {
        console.log(prefix, ...args)
      }
    },

    /**
     * 分组日志
     */
    group: (label: string, fn: () => void) => {
      if (finalConfig.enableInfo) {
        console.group(prefix ? `${prefix} ${label}` : label)
        fn()
        console.groupEnd()
      }
    },

    /**
     * 计时器
     */
    time: (label: string) => {
      if (finalConfig.enableDebug) {
        console.time(prefix ? `${prefix} ${label}` : label)
      }
    },

    timeEnd: (label: string) => {
      if (finalConfig.enableDebug) {
        console.timeEnd(prefix ? `${prefix} ${label}` : label)
      }
    },

    /**
     * 表格输出
     */
    table: (data: unknown) => {
      if (finalConfig.enableDebug) {
        console.table(data)
      }
    },
  }
}

// 默认日志记录器实例
export const logger = createLogger()

// 带前缀的日志记录器工厂
export function createPrefixedLogger(prefix: string) {
  return createLogger({ prefix })
}

// 用于特定模块的日志记录器
export const apiLogger = createLogger({ prefix: "API" })
export const authLogger = createLogger({ prefix: "Auth" })
export const cartLogger = createLogger({ prefix: "Cart" })
export const productLogger = createLogger({ prefix: "Product" })

/**
 * 安全的 JSON 字符串化
 * 处理循环引用和大对象
 */
export function safeStringify(obj: unknown, maxLength = 1000): string {
  try {
    const seen = new WeakSet()
    const str = JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular]"
          }
          seen.add(value)
        }
        return value
      },
      2
    )

    if (str && str.length > maxLength) {
      return str.substring(0, maxLength) + "... [truncated]"
    }

    return str || ""
  } catch {
    return "[Unable to stringify]"
  }
}

export default logger

