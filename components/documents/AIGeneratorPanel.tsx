'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Sparkles } from 'lucide-react'
import { db } from '@/lib/mock/db'
import { useAuthStore } from '@/lib/store/auth'
import { formatDate, formatPct } from '@/lib/utils'

const STATUS = {
  draft: { label: 'Draft', className: 'badge-gray' },
  pending_signature: { label: 'Pending Signature', className: 'badge-yellow' },
  signed: { label: 'Signed', className: 'badge-green' },
  voided: { label: 'Voided', className: 'badge-red' },
}

export function AIGeneratorPanel() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [docType, setDocType] = useState('Shareholder Agreement')
  const [companyId, setCompanyId] = useState('c1')
  const [party, setParty] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<{ name: string; content: string } | null>(null)

  // Main Admin exclusive
  if (!user || user.role !== 'main_admin') return null

  const company = db.companies.find(c => c.id === companyId)
  const shareholders = db.shareholders.filter(s => s.companyId === companyId)

  const handleGenerate = async () => {
    setGenerating(true)
    setGenerated(null)
    // Simulate AWS Bedrock Claude API call
    await new Promise(r => setTimeout(r, 1800))
    const templates: Record<string, (c: any, p: string) => string> = {
      'Shareholder Agreement': (c, p) =>
        `SHAREHOLDER AGREEMENT

This Shareholder Agreement is entered into on ${new Date().toLocaleDateString()} between ${c.companyName}, a ${c.country} corporation ("Company"), and ${p || 'Investor'} ("Shareholder").

RECITALS
WHEREAS, the Company is engaged in the business of ${c.industry};
WHEREAS, the Shareholder desires to acquire shares of the Company;

NOW, THEREFORE, in consideration of the mutual covenants herein, the parties agree:

1. PURCHASE OF SHARES
The Shareholder agrees to purchase shares of ${c.fundingStage.toUpperCase().replace('_', '-')} Stock at a price per share determined by the Company's most recent valuation of $${(c.currentValuation || 0).toLocaleString()}.

2. REPRESENTATIONS AND WARRANTIES
The Company represents that it is duly organized and in good standing under the laws of ${c.country}, and that the issuance of shares has been duly authorized.

3. INFORMATION RIGHTS
The Shareholder shall be entitled to receive annual financial statements and quarterly updates.

4. PRO-RATA RIGHTS
The Shareholder shall have the right to participate pro-rata in future financings.

5. GOVERNING LAW
This Agreement shall be governed by the laws of ${c.country}.

IN WITNESS WHEREOF, the parties have executed this Agreement.

_______________________
${c.companyName}

_______________________
${p || 'Shareholder'}`,
      'SAFE Agreement': (c, p) =>
        `SIMPLE AGREEMENT FOR FUTURE EQUITY (SAFE)

This certifies that in exchange for the payment by ${p || 'Investor'} (the "Investor") of the Purchase Amount, ${c.companyName}, a ${c.country} corporation (the "Company"), issues to the Investor the right to certain shares of the Company's capital stock, subject to the terms set forth below.

Purchase Amount: $[Amount]
Date: ${new Date().toLocaleDateString()}
Company: ${c.companyName}
Industry: ${c.industry}
Valuation Cap: $${(c.currentValuation || 0).toLocaleString()}

See attached Exhibit A for full terms.`,
      'Term Sheet': (c, p) =>
        `TERM SHEET

Company: ${c.companyName}
Industry: ${c.industry}
Stage: ${c.fundingStage}
Pre-Money Valuation: $[Amount]
Investment Amount: $[Amount]
Lead Investor: ${p || 'Lead'}
Closing Date: ${new Date().toLocaleDateString()}

TERMS
- Series: ${c.fundingStage.toUpperCase().replace('_', '-')}
- Liquidation: 1x non-participating preferred
- Board: 1 seat for lead investor
- Pro-rata: Yes
- Information rights: Standard quarterly + annual`,
      'Option Grant Letter': (c, p) =>
        `STOCK OPTION GRANT LETTER

${c.companyName} hereby grants to ${p || 'Employee'} (the "Optionee") an option to purchase shares of the Company's Common Stock as follows:

Number of Options: [N]
Exercise Price: $[X] per share
Grant Date: ${new Date().toLocaleDateString()}
Vesting: 4 years with 1-year cliff
Expiration: 10 years from grant date

This grant is made under the Company's Stock Option Plan.`,
      'Board Resolution': (c, p) =>
        `BOARD RESOLUTION

RESOLVED, that the Board of Directors of ${c.companyName}, a ${c.country} corporation, hereby approves:

WHEREAS, the Company is engaged in ${c.industry};
WHEREAS, the Board finds it in the best interest of the Company to [action];

NOW, BE IT RESOLVED, that the officers of the Company are authorized to take all necessary actions.

Date: ${new Date().toLocaleDateString()}`,
    }
    const content = templates[docType]?.(company, party) || 'Document template not found'
    setGenerated({ name: `${company?.companyName} - ${docType}`, content })
    setGenerating(false)
  }

  const handleSaveAsDoc = () => {
    if (!generated || !user) return
    const newDoc = {
      id: 'd' + Date.now(),
      companyId,
      documentType: docType,
      documentName: generated.name,
      generatedById: user.id,
      status: 'pending_signature' as const,
      signatories: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: generated.content,
    }
    db.documents.push(newDoc)
    db.auditLogs.push({
      id: 'al' + Date.now(),
      userId: user.id,
      action: 'ai.document.generated',
      resourceType: 'Document',
      resourceId: newDoc.id,
      newValue: { type: docType, company: company?.companyName, model: 'claude-3-sonnet' },
      timestamp: new Date().toISOString(),
    })
    router.push('/documents')
  }

  return (
    <div className="card bg-gradient-to-br from-purple-50 via-white to-blue-50 border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">AI Document Generator</h3>
          <p className="text-xs text-gray-500">Main Admin exclusive · Powered by AWS Bedrock (Claude)</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="label">Document Type</label>
          <select className="input" value={docType} onChange={e => setDocType(e.target.value)}>
            <option>Shareholder Agreement</option>
            <option>SAFE Agreement</option>
            <option>Term Sheet</option>
            <option>Option Grant Letter</option>
            <option>Board Resolution</option>
            <option>Investment Agreement</option>
          </select>
        </div>
        <div>
          <label className="label">Company</label>
          <select className="input" value={companyId} onChange={e => setCompanyId(e.target.value)}>
            {db.companies.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Party / Recipient</label>
          <select className="input" value={party} onChange={e => setParty(e.target.value)}>
            <option value="">Select party...</option>
            {shareholders.map(s => <option key={s.id} value={s.name}>{s.name} ({s.roleType})</option>)}
            <option value="">— External party —</option>
          </select>
        </div>
      </div>
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="btn btn-primary w-full justify-center disabled:opacity-50"
      >
        <Sparkles className="w-4 h-4" />
        {generating ? 'Generating with AI...' : 'Generate with AI'}
      </button>
      {generated && (
        <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">{generated.name}</h4>
            <div className="flex gap-2">
              <button onClick={() => setGenerated(null)} className="btn btn-secondary btn-sm">Discard</button>
              <button onClick={handleSaveAsDoc} className="btn btn-primary btn-sm">Save as Pending</button>
            </div>
          </div>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto bg-gray-50 p-3 rounded">
{generated.content}
          </pre>
        </div>
      )}
    </div>
  )
}
