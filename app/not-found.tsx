import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold text-brand">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">Page not found</h1>
        <p className="text-sm text-gray-600 mt-2">The page you are looking for does not exist or has been moved.</p>
        <Link href="/dashboard" className="btn btn-primary mt-6 inline-flex">Back to dashboard</Link>
      </div>
    </div>
  )
}
