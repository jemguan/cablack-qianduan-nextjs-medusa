const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Bundle Analyzer - 用于分析打包大小
 * 运行 ANALYZE=true npm run build 来生成分析报告
 */
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/**
 * Additional image hostnames from environment variable
 * Comma-separated list of hostnames, e.g., "cdn.example.com,images.example.com"
 */
const ADDITIONAL_IMAGE_HOSTNAMES = process.env.NEXT_PUBLIC_IMAGE_HOSTNAMES
  ? process.env.NEXT_PUBLIC_IMAGE_HOSTNAMES.split(",").map((h) => h.trim())
  : []

/**
 * Get backend URL from environment variable
 */
const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const backendUrl = new URL(MEDUSA_BACKEND_URL)

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // 🔥 [核心优化] 针对 Railway/Docker 容器化部署
  // 仅打包生产环境必须文件，大幅减小镜像体积 (1GB+ -> ~100MB)，提升启动速度
  output: "standalone",

  reactStrictMode: true,

  // 🔥 [性能优化] 自动优化第三方库的 Tree-shaking
  // 减少客户端 JS 体积，提升首屏加载速度
  experimental: {
    optimizePackageImports: [
      "@medusajs/ui",
      "lucide-react",
      "lodash",
      "date-fns",
      "@headlessui/react",
      "clsx",
      "tailwind-merge"
    ],
  },

  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    // Will be enabled later after fixing lint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Will be enabled later after fixing type errors
    ignoreBuildErrors: true,
  },
  images: {
    // Enable modern image formats for better compression
    formats: ["image/avif", "image/webp"],
    // Responsive image sizes - 移除过大的尺寸以减少图片下载大小
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // 🔥 [优化] 延长图片缓存时间至 7 天 (604800秒)
    // 电商图片通常不频繁变更，延长时间可减少服务器重复压缩的 CPU 消耗
    minimumCacheTTL: 604800,
    
    remotePatterns: [
      // Local development
      {
        protocol: "http",
        hostname: "localhost",
      },
      // Medusa backend
      {
        protocol: backendUrl.protocol.replace(":", "") || "https",
        hostname: backendUrl.hostname,
      },
      // Specific S3 buckets (for backward compatibility)
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      // Common CDN hostnames
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      // AWS S3 - 支持常见格式
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "s3.*.amazonaws.com",
      },
      // CloudFront
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
      // DigitalOcean Spaces - 支持所有子域名
      {
        protocol: "https",
        hostname: "*.digitaloceanspaces.com",
      },
      // Custom S3 hostname from environment variable
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
      // If S3_HOSTNAME is set but no pathname, allow all paths
      ...(S3_HOSTNAME && !S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
            },
          ]
        : []),
      // Additional hostnames from environment variable
      ...ADDITIONAL_IMAGE_HOSTNAMES.map((hostname) => ({
        protocol: "https",
        hostname,
      })),
    ],
    // Enable image optimization by default
    // Set NEXT_PUBLIC_UNOPTIMIZED_IMAGES=true to disable optimization
    unoptimized: process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES === "true",
  },
  
  // 🔥 [缓存优化] 强制浏览器缓存静态资源
  // Railway 不会自动像 Vercel 那样添加完美缓存头，需要手动配置
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|woff2|woff|ttf)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Enable compression
  compress: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
  // Power optimizations
  poweredByHeader: false,
}

module.exports = withBundleAnalyzer(nextConfig)