// EquiHub AWS integration layer
// All AWS service helpers in one place. To enable real AWS:
//   1. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY in .env
//   2. Set COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID
//   3. Set S3_BUCKET_DOCUMENTS, SES_FROM_EMAIL
//   4. Set USE_MOCK_DB=false and DATABASE_URL
//
// If keys are missing, all helpers fall back to mock mode (logged output, local URLs).

export { awsConfig, s3Buckets } from './config'
export * as cognito from './cognito'
export * as s3 from './s3'
export * as ses from './ses'
