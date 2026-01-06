const c = require("ansi-colors")

const isProduction = process.env.NODE_ENV === "production"

// 始终需要的环境变量
const requiredEnvs = [
  {
    key: "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
    description:
      "Learn how to create a publishable key: https://docs.medusajs.com/v2/resources/storefront-development/publishable-api-keys",
  },
  {
    key: "MEDUSA_BACKEND_URL",
    description:
      "The URL of your Medusa backend server (e.g., https://api.example.com)",
  },
]

// 仅在生产环境需要的环境变量
const productionOnlyEnvs = [
  {
    key: "ADMIN_API_KEY",
    description:
      "API key for admin proxy authentication (required in production)",
  },
]

// 推荐但不强制的环境变量（仅警告）
const recommendedEnvs = [
  {
    key: "NEXT_PUBLIC_IMAGE_HOSTNAMES",
    description:
      "Comma-separated list of allowed image hostnames for Next.js Image optimization",
  },
]

function checkEnvVariables() {
  const allRequired = isProduction
    ? [...requiredEnvs, ...productionOnlyEnvs]
    : requiredEnvs

  const missingEnvs = allRequired.filter(function (env) {
    return !process.env[env.key]
  })

  const missingRecommended = recommendedEnvs.filter(function (env) {
    return !process.env[env.key]
  })

  // 检查必需的环境变量
  if (missingEnvs.length > 0) {
    console.error(
      c.red.bold("\n🚫 Error: Missing required environment variables\n")
    )

    missingEnvs.forEach(function (env) {
      console.error(c.yellow(`  ${c.bold(env.key)}`))
      if (env.description) {
        console.error(c.dim(`    ${env.description}\n`))
      }
    })

    console.error(
      c.yellow(
        "\nPlease set these variables in your .env file or environment before starting the application.\n"
      )
    )

    process.exit(1)
  }

  // 警告推荐的环境变量（不阻止启动）
  if (missingRecommended.length > 0) {
    console.warn(
      c.yellow.bold("\n⚠️  Warning: Missing recommended environment variables\n")
    )

    missingRecommended.forEach(function (env) {
      console.warn(c.dim(`  ${env.key}`))
      if (env.description) {
        console.warn(c.dim(`    ${env.description}\n`))
      }
    })
  }

  // 生产环境安全检查
  if (isProduction) {
    console.log(c.green.bold("\n✅ All required environment variables are set for production.\n"))
  }
}

module.exports = checkEnvVariables
