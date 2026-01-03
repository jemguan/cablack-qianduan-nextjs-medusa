/**
 * Medusa Store API 代理路由
 * 用于避免客户端直接调用 Medusa API 时的 CORS 问题
 */

import { NextRequest, NextResponse } from 'next/server';

// 获取 Medusa 后端 URL（服务端）
function getMedusaBackendUrl(): string {
  return process.env.MEDUSA_BACKEND_URL || 
         process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 
         "http://localhost:9000";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendUrl = getMedusaBackendUrl();
    
    // 构建目标 URL，保留所有查询参数
    const targetUrl = new URL('/store/products', backendUrl);
    searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
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
      const errorText = await response.text();
      console.error('[Medusa Proxy] Error response:', response.status, errorText);
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
    console.error('[Medusa Proxy] Request failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

