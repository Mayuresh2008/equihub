// AWS SES helper for transactional email
// In production, sends email. In dev/mock mode, just logs the message.

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { awsConfig } from './config'
import { env } from '@/lib/env'

const ses = new SESClient(awsConfig)

export interface EmailPayload {
  to: string
  subject: string
  body: string
  bodyHtml?: string
}

export async function sendEmail({ to, subject, body, bodyHtml }: EmailPayload): Promise<{ provider: 'ses' | 'log'; id?: string }> {
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    console.log(`[ses:mock] to=${to} subject="${subject}"\n${body}`)
    return { provider: 'log' }
  }
  const cmd = new SendEmailCommand({
    Source: env.SES_FROM_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Text: { Data: body, Charset: 'UTF-8' },
        ...(bodyHtml ? { Html: { Data: bodyHtml, Charset: 'UTF-8' } } : {}),
      },
    },
  })
  const res = await ses.send(cmd)
  return { provider: 'ses', id: res.MessageId }
}
