/**
 * Admin API 代理路由
 * 用于 Medusa 前端调用管理前端 API
 * 类似 shopify-hydrogen-flow-tackle 的实现
 */

import { NextRequest, NextResponse } from 'next/server';

const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:3003';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
const MEDUSA_SHOP_DOMAIN = process.env.MEDUSA_SHOP_DOMAIN || 'medusa-store.local';

// 允许代理的路径白名单
const ALLOWED_PROXY_PATHS = [
  '/api/public/medusa/config',
  '/api/public/medusa/categories',
];

function isPathAllowed(path: string): boolean {
  return ALLOWED_PROXY_PATHS.some(allowed => path.startsWith(allowed));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleAdminApiProxy(request, path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleAdminApiProxy(request, path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleAdminApiProxy(request, path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleAdminApiProxy(request, path, 'DELETE');
}

async function handleAdminApiProxy(
  request: NextRequest,
  pathSegments: string[],
  method: string
): Promise<NextResponse> {
  try {
    // 构建代理路径
    const proxyPath = '/' + pathSegments.join('/');
    
    // 验证路径是否在白名单中
    if (!isPathAllowed(proxyPath)) {
      console.warn('[Admin API Proxy] Blocked request to unauthorized path:', proxyPath);
      return NextResponse.json(
        { success: false, error: 'Unauthorized API path' },
        { status: 403 }
      );
    }

    // 构建目标 URL
    const url = new URL(request.url);
    const targetUrl = `${ADMIN_API_URL}${proxyPath}${url.search}`;

    // 准备请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    };

    if (ADMIN_API_KEY) {
      headers['X-API-Key'] = ADMIN_API_KEY;
    }

    // Medusa API 需要 X-Shop-Domain 请求头
    // 确保只传递域名，不包含协议和端口
    if (MEDUSA_SHOP_DOMAIN) {
      // 如果 MEDUSA_SHOP_DOMAIN 是完整 URL，提取域名部分
      let shopDomain = MEDUSA_SHOP_DOMAIN;
      try {
        const url = new URL(MEDUSA_SHOP_DOMAIN);
        shopDomain = url.hostname;
      } catch {
        // 如果不是 URL，直接使用原值（可能是域名）
        shopDomain = MEDUSA_SHOP_DOMAIN;
      }
      headers['X-Shop-Domain'] = shopDomain;
    }

    // 处理请求体
    let body: any = undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await request.text();
      } catch (error) {
        // 如果没有请求体，body 保持为 undefined
      }
    }

    // 执行 fetch 请求
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    // 读取响应体
    const responseText = await response.text();

    // 解析 JSON 响应
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[Admin API Proxy] Invalid JSON response:', {
        status: response.status,
        bodyPreview: responseText.substring(0, 200),
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid response from Admin API',
          details: responseText.length > 200
            ? responseText.substring(0, 200) + '...'
            : responseText,
        },
        { status: response.status >= 400 ? response.status : 500 }
      );
    }

    // 返回响应（保持原始状态码）
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[Admin API Proxy] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to Admin API',
        details: error.message || 'Unknown error',
      },
      { status: 503 }
    );
  }
}

