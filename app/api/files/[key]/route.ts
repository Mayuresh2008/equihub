import { NextRequest, NextResponse } from 'next/server'
import { authFromHeader } from '@/lib/server-auth'
import { s3 } from '@/lib/aws'

export const runtime = 'nodejs'

// Local-mode file serving. In production, this route is unused because
// S3 presigned URLs are returned directly by /api/documents/upload.
export async function GET(req: NextRequest, { params }: { params: { key: string } }) {
  const auth = authFromHeader(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (s3.isS3Configured()) return NextResponse.json({ error: 'Use presigned URL' }, { status: 400 })
  const key = decodeURIComponent(params.key)
  // We don't actually persist the bytes in mock mode — return a placeholder
  return new NextResponse(`Mock file contents for key: ${key}\n(In production this is the S3 object body.)`, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  })
}
