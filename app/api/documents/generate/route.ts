import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mock/db'
import type { DocumentType } from '@/lib/types'

const TEMPLATES: Record<string, { title: string; content: string }> = {
  sha: { title: 'Subscription Agreement', content: 'SHARE SUBSCRIPTION AGREEMENT...\n\nDrafted by AWS Bedrock (Claude 3 Sonnet) for {{company}}...' },
  safe: { title: 'SAFE Agreement', content: 'SIMPLE AGREEMENT FOR FUTURE EQUITY (SAFE)...\n\nDrafted by AWS Bedrock for {{company}}...' },
  term_sheet: { title: 'Term Sheet', content: 'TERM SHEET — {{round}} for {{company}}...\n\nDrafted by AWS Bedrock...' },
  option_grant: { title: 'Stock Option Grant', content: 'STOCK OPTION GRANT NOTICE...\n\nDrafted by AWS Bedrock for {{company}}...' },
  board_resolution: { title: 'Board Resolution', content: 'RESOLUTION OF THE BOARD OF DIRECTORS OF {{company}}...\n\nDrafted by AWS Bedrock...' },
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, docType, params, createdById } = body as { companyId: string; docType: DocumentType; params: Record<string, string>; createdById: string }
    if (!companyId || !docType) return NextResponse.json({ error: 'companyId and docType required' }, { status: 400 })
    const company = db.companies.find(c => c.id === companyId)
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    const tpl = TEMPLATES[docType]
    if (!tpl) return NextResponse.json({ error: 'Unknown docType' }, { status: 400 })
    const content = tpl.content.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => params[k] || `{{${k}}}`)
    const id = 'd' + Date.now()
    const document = {
      id, companyId, documentType: docType, documentName: `${tpl.title} — ${params.round || params.grantee || company.companyName}`,
      content, status: 'draft' as const, generatedById: createdById, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      signatories: [],
    }
    db.documents.push(document as any)
    db.auditLogs.push({
      id: 'al' + Date.now(), userId: createdById, action: 'document.generated',
      resourceType: 'document', resourceId: id, timestamp: new Date().toISOString(),
      newValue: { docType, companyId, aiModel: 'bedrock-claude-3-sonnet' },
    } as any)
    return NextResponse.json({ document }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
