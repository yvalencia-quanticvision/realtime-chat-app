'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? '/chat' : '/login');
  }, [loading, user, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-stone-100">
      <Spinner />
    </div>
  );
}
