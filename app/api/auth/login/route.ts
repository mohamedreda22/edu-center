import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';
import { logActivity } from '@/lib/activityLog';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your_super_secret_key');

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { success } = await checkRateLimit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Phone and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid phone or password' },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid phone or password' },
        { status: 401 }
      );
    }

    const token = await new SignJWT({
      userId: user.id,
      role: user.role,
      phone: user.phone,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .setIssuedAt()
      .sign(JWT_SECRET);

    await logActivity(user.id, 'LOGIN', 'User', user.id, {
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
