// AWS S3 helpers
// Used for document uploads, downloads, presigned URLs
// Falls back to local /public/uploads when AWS keys are not configured

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { awsConfig, s3Buckets } from './config'

const s3 = new S3Client(awsConfig)

export interface UploadResult {
  key: string
  url: string
  bucket: string
  provider: 's3' | 'local'
}

/** Check whether S3 is configured (real keys) */
export function isS3Configured(): boolean {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
}

/** Upload a file. Returns the S3 key + a (possibly presigned) URL. */
export async function uploadDocument(
  companyId: string,
  filename: string,
  body: Buffer,
  contentType: string
): Promise<UploadResult> {
  const key = `companies/${companyId}/documents/${Date.now()}-${filename}`
  if (!isS3Configured()) {
    return { key, url: `/api/files/${encodeURIComponent(key)}`, bucket: s3Buckets.documents, provider: 'local' }
  }
  await s3.send(new PutObjectCommand({
    Bucket: s3Buckets.documents,
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
  const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: s3Buckets.documents, Key: key }), { expiresIn: 3600 })
  return { key, url, bucket: s3Buckets.documents, provider: 's3' }
}

/** Get a presigned download URL for a document. */
export async function getDownloadUrl(key: string): Promise<string> {
  if (!isS3Configured()) return `/api/files/${encodeURIComponent(key)}`
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: s3Buckets.documents, Key: key }), { expiresIn: 900 })
}

/** Delete a document. */
export async function deleteDocument(key: string): Promise<void> {
  if (!isS3Configured()) return
  await s3.send(new DeleteObjectCommand({ Bucket: s3Buckets.documents, Key: key }))
}
