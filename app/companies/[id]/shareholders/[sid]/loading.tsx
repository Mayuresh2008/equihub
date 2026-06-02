export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-32 bg-gray-200 rounded" />
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-56 bg-gray-300 rounded" />
            <div className="h-3 w-72 bg-gray-200 rounded" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-50 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card space-y-3">
          <div className="h-5 w-32 bg-gray-300 rounded" />
          <div className="h-10 w-full bg-gray-100 rounded" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 w-full bg-gray-50 rounded" />
          ))}
        </div>
        <div className="card">
          <div className="h-5 w-32 bg-gray-300 rounded mb-4" />
          <div className="aspect-square bg-gray-100 rounded-full mx-auto w-56" />
        </div>
      </div>
    </div>
  )
}
