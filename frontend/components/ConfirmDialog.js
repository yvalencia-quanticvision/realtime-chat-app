'use client';

import Spinner from './Spinner';

export default function ConfirmDialog({ title, message, confirmLabel, pending, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm animate-fade-in rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold tracking-tight text-stone-900">{title}</h2>
        <p className="mt-2 text-sm text-stone-600">{message}</p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {pending && <Spinner size="sm" />}
            {pending ? 'Eliminando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
