export default function Skeleton({ count = 1, height = 'h-4' }: { count?: number; height?: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${height} mb-3 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700`} />
      ))}
    </>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className="h-8 flex-1 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="h-6 w-3/4 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-5/6 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
        </div>
      ))}
    </>
  )
}
