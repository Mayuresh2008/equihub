'use client'

import { Download, FileText, FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'

export function ExportButton({ data, filename }: { data: any[]; filename: string }) {
  const [open, setOpen] = useState(false)

  const exportCSV = () => {
    if (!data.length) return
    const headers = Object.keys(data[0])
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  const exportPDF = () => {
    // In production this would call a Lambda to generate a PDF
    // For the prototype, we open a print-friendly view
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <html><head><title>${filename}</title>
      <style>body{font-family:sans-serif;padding:32px;color:#111}h1{margin:0 0 8px}h2{margin:24px 0 8px;font-size:14px;color:#6b7280;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px}th{background:#f9fafb;font-weight:600}</style>
      </head><body>
      <h1>${filename}</h1>
      <div>Generated: ${new Date().toLocaleString()}</div>
      <h2>Data</h2>
      <table><thead><tr>${Object.keys(data[0] || {}).map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${data.map(row => `<tr>${Object.values(row).map(v => `<td>${v ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <script>window.print();</script>
      </body></html>
    `)
    w.document.close()
    setOpen(false)
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="btn btn-secondary">
        <Download className="w-4 h-4" /> Export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
            <button onClick={exportPDF} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <FileText className="w-4 h-4" /> Export as PDF
            </button>
            <button onClick={exportCSV} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <FileSpreadsheet className="w-4 h-4" /> Export as CSV
            </button>
          </div>
        </>
      )}
    </div>
  )
}
