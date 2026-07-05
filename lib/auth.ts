import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your_super_secret_key');

export async function verifyAuth(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return { authenticated: false, error: 'Authentication token missing' };
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      authenticated: true,
      userId: payload.userId as string,
      role: payload.role as string,
    };
  } catch (error) {
    return { authenticated: false, error: 'Invalid token' };
  }
}

export async function requireAuth(
  request: NextRequest,
  requiredRoles: string[] = []
): Promise<{ success: true; userId: string; role: string } | { success: false; error: string }> {
  const auth = await verifyAuth(request);

  if (!auth.authenticated) {
    return { success: false, error: auth.error || 'Authentication required' };
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(auth.role || '')) {
    return { success: false, error: 'Insufficient permissions' };
  }

  return { success: true, userId: auth.userId!, role: auth.role! };
}
