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
  reactStrictMode: true,
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
    // Responsive image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimum cache TTL for optimized images (1 hour)
    minimumCacheTTL: 3600,
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
    // (useful if you have many external image sources not in remotePatterns)
    unoptimized: process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES === "true",
  },
  // Enable compression
  compress: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
  // Power optimizations
  poweredByHeader: false,
}

module.exports = withBundleAnalyzer(nextConfig)
