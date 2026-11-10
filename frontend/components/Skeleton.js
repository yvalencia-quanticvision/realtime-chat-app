export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-200" />
      ))}
    </div>
  );
}

export function MessagesSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-gray-200" />
      <div className="h-10 w-1/2 animate-pulse self-end rounded-2xl bg-gray-200" />
      <div className="h-10 w-3/5 animate-pulse rounded-2xl bg-gray-200" />
    </div>
  );
}
