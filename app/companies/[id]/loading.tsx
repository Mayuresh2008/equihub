export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-7 w-48 bg-gray-300 rounded" />
          <div className="h-3 w-72 bg-gray-200 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-gray-200 rounded" />
          <div className="h-9 w-32 bg-gray-300 rounded" />
        </div>
      </div>

      {/* Summary panel skeleton */}
      <div className="card grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-6 w-28 bg-gray-300 rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="card">
        <div className="h-5 w-32 bg-gray-300 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-9 w-full bg-gray-100 rounded" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-gray-50 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}
