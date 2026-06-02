'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { api } from '@/lib/api-client'
import { Avatar } from '@/components/shared/Modal'
import type { ShareholderView, CapTableSummary, Company, DilutionEvent } from '@/lib/types'
import { SHAREHOLDER_ROLE_META, SHARE_CLASS_META, SHAREHOLDER_STATUS_META } from '@/lib/types'
import { formatNumber, formatPct, formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, FileText, Award, TrendingDown, TrendingUp, Mail, Phone, MapPin, Calendar, DollarSign, Shield } from 'lucide-react'

export default function ShareholderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const id = params?.id as string
  const sid = params?.sid as string
  const [shareholder, setShareholder] = useState<ShareholderView | null>(null)
  const [allShareholders, setAllShareholders] = useState<ShareholderView[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<DilutionEvent[]>([])

  useEffect(() => {
    if (!id || !sid) return
    ;(async () => {
      try {
        const res = await api.get<{ shareholder: ShareholderView; all: ShareholderView[] }>(`/api/companies/${id}/shareholders/${sid}`)
        setShareholder(res.shareholder)
        setAllShareholders(res.all)
        const companies = (await api.get<{ companies: Company[] }>('/api/companies')).companies
        setCompany(companies.find(c => c.id === id) || null)
        const h = await api.get<{ history: DilutionEvent[] }>(`/api/companies/${id}/dilution-history`)
        setHistory(h.history)
      } catch (e) {
        // fallback
      } finally {
        setLoading(false)
      }
    })()
  }, [id, sid])

  if (!user) return null
  if (loading) return <DashboardLayout><div className="text-center py-12 text-gray-500">Loading…</div></DashboardLayout>
  if (!shareholder || !company) return <DashboardLayout><div className="text-center py-12 text-gray-500">Shareholder not found</div></DashboardLayout>

  const roleMeta = SHAREHOLDER_ROLE_META[shareholder.roleType]
  const classMeta = SHARE_CLASS_META[shareholder.shareClass]
  const statusMeta = SHAREHOLDER_STATUS_META[shareholder.status]
  const holdingsEvents = history.filter(e => e.changes.some(c => c.shareholderId === sid))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div>
          <Link href={`/companies/${company.id}/captable`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Cap Table
          </Link>
        </div>

        {/* Header */}
        <div className="card">
          <div className="flex items-start gap-4">
            <Avatar name={shareholder.name} roleType={shareholder.roleType} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{shareholder.name}</h1>
                <span className={`badge ${statusMeta.badge}`}>
                  <span className="mr-1">{statusMeta.icon}</span>{statusMeta.label}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1"><span>{roleMeta.icon}</span> {roleMeta.label}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${classMeta.dot}`} />{classMeta.label}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{shareholder.country}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{shareholder.email}</span>
                {shareholder.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{shareholder.phone}</span>}
                <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Joined {formatDate(shareholder.dateIssued)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wider">Certificate</div>
              <div className="text-lg font-mono font-semibold text-gray-900">{shareholder.certificateNumber}</div>
            </div>
          </div>
        </div>

        {/* Sidebar + content layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-3">
            <SideLink icon="📊" label="Overview" active />
            <SideLink icon="💼" label="Holdings" />
            <SideLink icon="⏳" label="Vesting" />
            <SideLink icon="📄" label="Documents" />
            <SideLink icon="📜" label="Activity Log" />
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Ownership summary */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-3">Ownership Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBox label="Shares" value={formatNumber(shareholder.sharesOwned)} sub={`${formatPct(shareholder.ownershipPct)} undiluted`} color="blue" />
                <StatBox label="Ownership" value={formatPct(shareholder.ownershipPct)} sub="of issued" color="emerald" />
                <StatBox label="Fully Diluted" value={formatPct(shareholder.fullyDilutedPct)} sub="of FD shares" color="purple" />
                <StatBox label="Investment" value={formatCurrency(shareholder.investmentValue)} sub="Total committed" color="amber" />
              </div>
            </div>

            {/* Holdings breakdown */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-3">Holdings Breakdown</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="py-2 pr-3">Grant</th>
                    <th className="py-2 pr-3 text-right">Shares</th>
                    <th className="py-2 pr-3">Class</th>
                    <th className="py-2 pr-3 text-right">Price/Share</th>
                    <th className="py-2 text-right">% of Cap</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 pr-3 text-gray-700">Founding Grant</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums font-medium text-gray-900">{formatNumber(shareholder.sharesOwned)}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${classMeta.dot}`} />{classMeta.label}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-gray-700">${shareholder.pricePerShare.toFixed(4)}</td>
                    <td className="py-2.5 text-right tabular-nums font-semibold text-gray-900">{formatPct(shareholder.ownershipPct)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Dilution history for this shareholder */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-3">Dilution History</h2>
              {holdingsEvents.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500">No dilution events yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        <th className="py-2 pr-3">Event</th>
                        <th className="py-2 pr-3">Date</th>
                        <th className="py-2 pr-3 text-right">% Before</th>
                        <th className="py-2 pr-3 text-right">% After</th>
                        <th className="py-2 text-right">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdingsEvents.map(e => {
                        const change = e.changes.find(c => c.shareholderId === sid)
                        if (!change) return null
                        return (
                          <tr key={e.eventId} className="border-b border-gray-100">
                            <td className="py-2.5 pr-3 text-gray-900 font-medium">{e.eventName}</td>
                            <td className="py-2.5 pr-3 text-gray-600 text-xs">{formatDate(e.eventDate)}</td>
                            <td className="py-2.5 pr-3 text-right tabular-nums text-gray-600">{formatPct(change.pctBefore)}</td>
                            <td className="py-2.5 pr-3 text-right tabular-nums font-semibold text-gray-900">{formatPct(change.pctAfter)}</td>
                            <td className={`py-2.5 text-right tabular-nums font-semibold ${change.change < 0 ? 'text-rose-600' : change.change > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                              {change.change > 0 ? '+' : ''}{formatPct(change.change)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Rights & Vesting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-brand" /> Rights & Preferences</h2>
                <div className="space-y-2 text-sm">
                  <RightRow label="Board Seat" value={shareholder.rights?.boardSeat || false} />
                  <RightRow label="Voting Rights" value={shareholder.rights?.votingRights ?? true} />
                  <RightRow label="Pro-Rata Rights" value={shareholder.rights?.proRataRights || false} />
                  <RightRow label="Anti-Dilution" value={shareholder.rights?.antiDilution || false} />
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-gray-700">Liquidation Preference</span>
                    <span className="font-semibold text-gray-900">{shareholder.rights?.liquidationPreference || 1}x</span>
                  </div>
                </div>
              </div>
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-3">Vesting</h2>
                {shareholder.vesting?.enabled ? (
                  <div className="space-y-2 text-sm">
                    <Row label="Start Date" value={shareholder.vesting.startDate ? formatDate(shareholder.vesting.startDate) : '—'} />
                    <Row label="Total Period" value={`${shareholder.vesting.totalMonths} months`} />
                    <Row label="Cliff" value={`${shareholder.vesting.cliffMonths} months`} />
                    <Row label="Schedule" value={shareholder.vesting.type} />
                    <Row label="Acceleration" value={shareholder.vesting.acceleration ? 'Yes' : 'No'} />
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No vesting schedule (fully vested)</div>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-3">Documents</h2>
              <div className="space-y-2">
                <DocRow name={`Share Certificate #${shareholder.certificateNumber}`} />
                <DocRow name="Shareholder Agreement (SHA)" />
                {shareholder.roleType === 'vc_investor' && <DocRow name="Investment Agreement" />}
                {shareholder.shareClass === 'safe' && <DocRow name="SAFE Agreement" />}
                {shareholder.shareClass === 'options' && <DocRow name="Option Grant Letter" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function SideLink({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-brand text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
      <span>{icon}</span> {label}
    </button>
  )
}
function StatBox({ label, value, sub, color }: { label: string; value: any; sub: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    purple: 'bg-purple-50 text-purple-700',
    amber: 'bg-amber-50 text-amber-700',
  }
  return (
    <div className={`rounded-lg p-3 ${colors[color] || colors.blue}`}>
      <div className="text-xs uppercase tracking-wider opacity-80 mb-1">{label}</div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-xs opacity-75 mt-0.5">{sub}</div>
    </div>
  )
}
function RightRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-gray-700">{label}</span>
      <span className={`badge ${value ? 'badge-green' : 'badge-gray'}`}>{value ? 'Yes' : 'No'}</span>
    </div>
  )
}
function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-gray-700">{label}</span>
      <span className="font-medium text-gray-900 capitalize">{value}</span>
    </div>
  )
}
function DocRow({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <FileText className="w-4 h-4 text-gray-400" />{name}
      </div>
      <div className="flex items-center gap-2">
        <button className="text-xs text-brand hover:underline">View</button>
        <button className="text-xs text-gray-500 hover:underline">Download</button>
      </div>
    </div>
  )
}
