export default function Spinner({ size = 'md' }) {
  const dims = size === 'sm' ? 'h-4 w-4 border-2' : 'h-8 w-8 border-4';
  return (
    <div
      className={`${dims} animate-spin rounded-full border-stone-300 border-t-brand-600`}
      role="status"
      aria-label="loading"
    />
  );
}
