import type { Role } from '@/lib/types'

const ROLE_CONFIG = {
  main_admin: { label: 'Main Admin', className: 'bg-purple-100 text-purple-700' },
  startup_admin: { label: 'Startup Admin', className: 'bg-blue-100 text-blue-700' },
  investor: { label: 'Investor', className: 'bg-emerald-100 text-emerald-700' },
}

export function RoleBadge({ role }: { role: Role }) {
  const config = ROLE_CONFIG[role]
  return <span className={`badge ${config.className}`}>{config.label}</span>
}
