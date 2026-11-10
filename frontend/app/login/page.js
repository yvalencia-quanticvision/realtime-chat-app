'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';
import Spinner from '../../components/Spinner';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/chat');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al iniciar sesion');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white shadow-sm">C</span>
          <span className="text-sm font-semibold tracking-tight text-stone-500">Chat</span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
          <h1 className="mb-1 text-xl font-semibold tracking-tight text-stone-900">Bienvenido de vuelta</h1>
          <p className="mb-6 text-sm text-stone-500">Inicia sesion para seguir tus conversaciones.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 transition-shadow focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:bg-stone-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Contrasena</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 transition-shadow focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:bg-stone-100"
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {submitting && <Spinner size="sm" />}
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-stone-500">
          No tienes cuenta?{' '}
          <Link href="/register" className="font-medium text-brand-700 hover:text-brand-800 hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
