/**
 * Onahole Station API 代理路由
 * 用于避免客户端直接调用 Medusa API 时的 CORS 问题
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  rateLimit,
  getClientIdentifier,
  RATE_LIMITS,
} from '@lib/util/rate-limiter';

// 获取 Medusa 后端 URL（服务端）
function getMedusaBackendUrl(): string {
  return process.env.MEDUSA_BACKEND_URL || 
         process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 
         "http://localhost:9000";
}

export async function GET(request: NextRequest) {
  // 速率限制检查
  const clientId = getClientIdentifier(request);
  const rateLimitResult = rateLimit(
    `medusa-proxy:${clientId}`,
    RATE_LIMITS.API_DEFAULT
  );

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'Retry-After': Math.ceil(
            (rateLimitResult.resetAt - Date.now()) / 1000
          ).toString(),
        },
      }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const backendUrl = getMedusaBackendUrl();
    
    // 构建目标 URL，保留所有查询参数
    // 注意：必须使用 getAll 来获取所有同名参数的值（如多个 id 参数）
    const targetUrl = new URL('/store/products', backendUrl);
    const seenKeys = new Set<string>();
    searchParams.forEach((value, key) => {
      // 对于每个 key，获取所有值（处理数组参数如 id=xxx&id=yyy）
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        const allValues = searchParams.getAll(key);
        allValues.forEach((val) => {
          targetUrl.searchParams.append(key, val);
        });
      }
    });

    // 准备请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 添加 publishable key（如果有）
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
    if (publishableKey) {
      headers['x-publishable-api-key'] = publishableKey;
    }

    // 执行代理请求
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Medusa API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    // 不泄露内部错误详情到客户端
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

