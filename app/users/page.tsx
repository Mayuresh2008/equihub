'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { RoleBadge } from '@/components/shared/RoleBadge'
import { ModalShell, Field } from '@/components/shared/Modal'
import { api } from '@/lib/api-client'
import { toast } from '@/lib/store/toast'
import { Plus, Search, Edit } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Role } from '@/lib/types'

export default function UsersPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  if (!user) return null
  if (user.role !== 'main_admin') return <DashboardLayout><div className="text-center py-12 text-gray-500">Main Admin access only</div></DashboardLayout>

  const filtered = db.users.filter(u =>
    (roleFilter === 'all' || u.role === roleFilter) &&
    (u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <DashboardLayout>
      <div className="space-y-6" data-tick={tick}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">{db.users.length} users across all roles</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary"><Plus className="w-4 h-4" /> Create User</button>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input pl-10" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input w-auto" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="main_admin">Main Admin</option>
              <option value="startup_admin">Startup Admin</option>
              <option value="investor">Investor</option>
            </select>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <th className="py-3">User</th>
                <th className="py-3">Role</th>
                <th className="py-3">Company</th>
                <th className="py-3">Status</th>
                <th className="py-3">Created</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const company = u.companyId ? db.companies.find(c => c.id === u.companyId) : null
                return (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-light to-gold flex items-center justify-center text-white font-semibold text-xs">
                          {u.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{u.fullName}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3"><RoleBadge role={u.role} /></td>
                    <td className="py-3 text-gray-600 text-xs">{company?.companyName || '—'}</td>
                    <td className="py-3">
                      <button
                        onClick={async () => {
                          try {
                            const res = await api.patch<{ user: any }>('/api/users', { id: u.id, isActive: !u.isActive })
                            const idx = db.users.findIndex(x => x.id === u.id)
                            if (idx >= 0) db.users[idx] = res.user
                            setTick(t => t + 1)
                            toast.success(`${u.fullName} ${u.isActive ? 'deactivated' : 'activated'}`)
                          } catch (e: any) { toast.error(e.message) }
                        }}
                        className={`badge ${u.isActive ? 'badge-green' : 'badge-gray'} cursor-pointer`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => setEditing(u.id)} className="text-xs text-brand hover:underline inline-flex items-center gap-1">
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onSuccess={() => setTick(t => t + 1)} />}
        {editing && <EditUserModal id={editing} onClose={() => setEditing(null)} onSuccess={() => setTick(t => t + 1)} />}
      </div>
    </DashboardLayout>
  )
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ fullName: '', email: '', role: 'startup_admin' as Role, companyId: '' })
  const [busy, setBusy] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await api.post<{ user: any }>('/api/auth/login', { email: form.email, password: 'demo' })
      // Login route doesn't create users; we'll just push to db directly here since the create-user route isn't part of the API yet
      const newUser = {
        id: 'u' + Date.now(),
        fullName: form.fullName,
        email: form.email,
        passwordHash: 'demo',
        role: form.role,
        companyId: form.role === 'startup_admin' ? form.companyId : undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
      }
      db.users.push(newUser)
      db.auditLogs.push({
        id: 'al' + Date.now(), userId: 'u1', action: 'user.created',
        resourceType: 'user', resourceId: newUser.id, newValue: newUser, timestamp: new Date().toISOString(),
      } as any)
      toast.success(`User ${form.fullName} created`)
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally { setBusy(false) }
  }

  return (
    <ModalShell title="Create New User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Full Name *" value={form.fullName} onChange={v => setForm({ ...form, fullName: v })} required />
        <Field label="Email *" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} required />
        <div>
          <label className="label">Role *</label>
          <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}>
            <option value="startup_admin">Startup Admin</option>
            <option value="investor">Investor</option>
            <option value="main_admin">Main Admin</option>
          </select>
        </div>
        {form.role === 'startup_admin' && (
          <div>
            <label className="label">Company *</label>
            <select className="input" value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })} required>
              <option value="">Select company</option>
              {db.companies.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-primary flex-1 justify-center disabled:opacity-50">
            {busy ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

function EditUserModal({ id, onClose, onSuccess }: { id: string; onClose: () => void; onSuccess: () => void }) {
  const u = db.users.find(x => x.id === id)
  const [form, setForm] = useState({
    fullName: u?.fullName || '',
    role: u?.role || 'startup_admin',
    companyId: u?.companyId || '',
  })
  const [busy, setBusy] = useState(false)
  if (!u) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await api.patch<{ user: any }>('/api/users', { id, fullName: form.fullName, role: form.role, companyId: form.role === 'startup_admin' ? form.companyId : null })
      const idx = db.users.findIndex(x => x.id === id)
      if (idx >= 0) db.users[idx] = res.user
      toast.success('User updated')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally { setBusy(false) }
  }

  return (
    <ModalShell title="Edit User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Full Name *" value={form.fullName} onChange={v => setForm({ ...form, fullName: v })} required />
        <div>
          <label className="label">Role *</label>
          <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}>
            <option value="startup_admin">Startup Admin</option>
            <option value="investor">Investor</option>
            <option value="main_admin">Main Admin</option>
          </select>
        </div>
        {form.role === 'startup_admin' && (
          <div>
            <label className="label">Company *</label>
            <select className="input" value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })} required>
              <option value="">Select company</option>
              {db.companies.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-primary flex-1 justify-center disabled:opacity-50">
            {busy ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
