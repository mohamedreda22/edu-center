import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your_super_secret_key');

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      redirect('/dashboard');
    } catch {
      redirect('/login');
    }
  } else {
    redirect('/login');
  }
}
