/**
 * Admin API 客户端
 * 用于 Medusa 前端调用 shopify-admin-api 的扩展功能
 */

interface AdminApiConfig {
  apiUrl: string;
  apiKey: string;
}

/**
 * 获取配置（客户端和服务端都使用代理路由）
 */
function getConfig(): AdminApiConfig {
  // 客户端：使用相对路径的代理路由
  if (typeof window !== 'undefined') {
    return {
      apiUrl: '/api/admin-proxy', // 使用服务端代理路由
      apiKey: '', // 客户端不需要 API Key
    };
  }

  // 服务端：也使用代理路由，但需要完整的 URL
  // 优先使用环境变量，如果没有则使用 localhost（Next.js 默认端口）
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  if (!baseUrl) {
    // 在 Vercel 等平台上使用 VERCEL_URL
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      // 开发环境默认使用 localhost:3000（Next.js 默认端口）
      // 如果设置了 PORT 环境变量，使用该端口
      const port = process.env.PORT || '3000';
      baseUrl = `http://localhost:${port}`;
    }
  }
  
  return {
    apiUrl: `${baseUrl}/api/admin-proxy`, // 服务端也使用代理路由
    apiKey: '', // 代理路由会处理 API Key
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 基础 API 请求函数
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const config = getConfig();
  
  // 构建完整的 URL
  // 如果是代理路由，endpoint 应该包含完整的路径（如 /api/public/medusa/config）
  // 代理路由会处理路径解析
  const url = `${config.apiUrl}${endpoint}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(options.headers as Record<string, string>),
    };

    // 代理路由会处理 API Key，这里不需要添加

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 读取响应文本
    const responseText = await response.text();

    // 解析 JSON
    let data: ApiResponse<T>;
    try {
      data = JSON.parse(responseText) as ApiResponse<T>;
    } catch (parseError) {
      console.error('[Admin API] Invalid JSON response:', {
        status: response.status,
        bodyPreview: responseText.substring(0, 200),
      });
      throw new Error('Invalid response from Admin API');
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP error: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error('[Admin API] Request failed:', error);
    throw error;
  }
}

/**
 * GET 请求
 */
export async function get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST 请求
 */
export async function post<T = any>(
  endpoint: string,
  data?: any
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT 请求
 */
export async function put<T = any>(
  endpoint: string,
  data?: any
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE 请求
 */
export async function del<T = any>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

