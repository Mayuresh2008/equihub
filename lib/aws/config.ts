// AWS shared config
// Centralized so all services use the same region + credentials

import { env } from '@/lib/env'

export const awsConfig = {
  region: env.AWS_REGION,
  credentials:
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
}

export const s3Buckets = {
  documents: env.S3_BUCKET_DOCUMENTS,
  public: env.S3_BUCKET_PUBLIC,
}
