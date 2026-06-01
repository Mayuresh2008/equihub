export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-[#0F172A]" />
      <div className="ml-64 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded" />)}
          </div>
          <div className="h-64 bg-gray-200 rounded mt-6" />
        </div>
      </div>
    </div>
  )
}
