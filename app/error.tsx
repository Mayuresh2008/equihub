'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center text-2xl">!</div>
        <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
        <p className="text-sm text-gray-600 mt-2">{error.message || 'An unexpected error occurred'}</p>
        {error.digest && <p className="text-xs text-gray-400 mt-2 font-mono">digest: {error.digest}</p>}
        <button onClick={reset} className="btn btn-primary mt-6 w-full justify-center">Try again</button>
        <a href="/dashboard" className="block mt-3 text-sm text-brand hover:underline">Go to dashboard</a>
      </div>
    </div>
  )
}
