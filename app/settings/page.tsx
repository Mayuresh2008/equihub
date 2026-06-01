'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/lib/store/auth'
import { Settings, Cloud, Mail, Key, Save } from 'lucide-react'
import { useState } from 'react'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [config, setConfig] = useState({
    awsRegion: 'ap-southeast-1',
    s3Bucket: 'equihub-documents',
    sesFromEmail: 'noreply@equihub.com',
    bedrockModelId: 'anthropic.claude-3-sonnet',
    jwtExpiry: '3600',
    enableMFA: false,
  })

  if (!user) return null
  if (user.role !== 'main_admin') return <DashboardLayout><div className="text-center py-12 text-gray-500">Main Admin access only</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-sm text-gray-500 mt-1">AWS configuration and platform settings</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Cloud className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">AWS Configuration</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">AWS Region</label>
              <input className="input" value={config.awsRegion} onChange={e => setConfig({ ...config, awsRegion: e.target.value })} />
            </div>
            <div>
              <label className="label">S3 Bucket</label>
              <input className="input" value={config.s3Bucket} onChange={e => setConfig({ ...config, s3Bucket: e.target.value })} />
            </div>
            <div>
              <label className="label">SES From Email</label>
              <input className="input" value={config.sesFromEmail} onChange={e => setConfig({ ...config, sesFromEmail: e.target.value })} />
            </div>
            <div>
              <label className="label">Bedrock Model ID</label>
              <input className="input" value={config.bedrockModelId} onChange={e => setConfig({ ...config, bedrockModelId: e.target.value })} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">All values are read from AWS Secrets Manager in production. Changes here update the local mock config.</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Security</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="label">JWT Token Expiry (seconds)</label>
              <input type="number" className="input" value={config.jwtExpiry} onChange={e => setConfig({ ...config, jwtExpiry: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="mfa" checked={config.enableMFA} onChange={e => setConfig({ ...config, enableMFA: e.target.checked })} />
              <label htmlFor="mfa" className="text-sm text-gray-700">Enable Multi-Factor Authentication</label>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Email Templates</h2>
          </div>
          <div className="space-y-2">
            {['Document ready to sign', 'Document fully signed', 'New funding round', 'Options vested', 'Welcome email'].map(t => (
              <div key={t} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                <span className="text-sm">{t}</span>
                <button className="text-xs text-brand hover:underline">Edit</button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary"><Save className="w-4 h-4" /> Save Settings</button>
        </div>
      </div>
    </DashboardLayout>
  )
}
