export default function Spinner({ size = 'md' }) {
  const dims = size === 'sm' ? 'h-4 w-4 border-2' : 'h-8 w-8 border-4';
  return (
    <div
      className={`${dims} animate-spin rounded-full border-gray-300 border-t-blue-600`}
      role="status"
      aria-label="loading"
    />
  );
}
