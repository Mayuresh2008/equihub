'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { db } from '@/lib/mock/db'
import { RoleBadge } from '@/components/shared/RoleBadge'
import { Plus, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Role } from '@/lib/types'

export default function UsersPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)

  if (!user) return null
  if (user.role !== 'main_admin') return <DashboardLayout><div className="text-center py-12 text-gray-500">Main Admin access only</div></DashboardLayout>

  const filtered = db.users.filter(u =>
    (roleFilter === 'all' || u.role === roleFilter) &&
    (u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
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
                    <td className="py-3"><span className={`badge ${u.isActive ? 'badge-green' : 'badge-gray'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="py-3 text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="py-3 text-right">
                      <button className="text-xs text-brand hover:underline">Edit</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
      </div>
    </DashboardLayout>
  )
}

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ fullName: '', email: '', role: 'startup_admin' as Role, companyId: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    db.users.push({
      id: 'u' + Date.now(),
      fullName: form.fullName,
      email: form.email,
      passwordHash: 'demo',
      role: form.role,
      companyId: form.role === 'startup_admin' ? form.companyId : undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Create New User</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
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
            <button type="submit" className="btn btn-primary flex-1 justify-center">Create</button>
          </div>
        </form>
      </div>
    </div>
  )
}
