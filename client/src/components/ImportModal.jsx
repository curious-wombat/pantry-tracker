import { useState, useRef } from 'react'
import { apiFetch } from '../api'

export default function ImportModal({ onClose, onImportComplete }) {
  const [step, setStep] = useState('choose') // choose | preview | result
  const [rows, setRows] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  const parseCSV = (text) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    return lines.slice(1).map(line => {
      const values = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) || []
      const row = {}
      headers.forEach((h, i) => {
        row[h] = (values[i] || '').replace(/^"|"$/g, '').trim()
      })
      return row
    }).filter(r => r.name)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result)
      if (parsed.length === 0) {
        setError('No valid rows found. Make sure the CSV has a "name" column.')
        return
      }
      setRows(parsed)
      setStep('preview')
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: rows })
      })
      const data = await res.json()
      setResult(data)
      setStep('result')
      if (data.imported > 0) onImportComplete()
    } catch (err) {
      setError('Import failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const LOCATION_COLORS = {
    pantry: 'bg-amber/20 text-amber-dark',
    fridge: 'bg-frost/20 text-frost-dark',
    freezer: 'bg-blue-100 text-blue-600'
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl shadow-lift animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-gray-100">
          <h2 className="font-display text-xl font-bold text-gray-900">📥 Import Items</h2>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto scroll-container px-5 py-4 flex-1">
          {step === 'choose' && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-gray-600 text-sm leading-relaxed">
                Upload a CSV file to bulk-add items to your inventory. Download the starter template below to get started.
              </p>

              {/* CSV format info */}
              <div className="bg-cream rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">CSV Columns</p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-semibold text-gray-800">name</span> — item name (required)</p>
                  <p><span className="font-semibold text-gray-800">quantity</span> — number (default: 1)</p>
                  <p><span className="font-semibold text-gray-800">unit</span> — oz, lb, can, item, etc.</p>
                  <p><span className="font-semibold text-gray-800">category</span> — Produce, Protein, etc.</p>
                  <p><span className="font-semibold text-gray-800">storage_location</span> — pantry, fridge, freezer</p>
                  <p><span className="font-semibold text-gray-800">commonly_used</span> — true or false</p>
                  <p><span className="font-semibold text-gray-800">low_stock_threshold</span> — number</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
              <button onClick={() => fileRef.current.click()}
                className="w-full py-4 bg-forest text-white rounded-2xl font-bold text-base shadow-md active:scale-98 transition-all">
                📂 Choose CSV File
              </button>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-gray-600">
                Found <span className="font-bold text-gray-900">{rows.length} items</span> ready to import. Review below then tap Import.
              </p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {rows.map((row, i) => (
                  <div key={i} className="flex items-center gap-3 bg-cream rounded-xl px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{row.name}</p>
                      <p className="text-xs text-gray-400">{row.quantity || 1} {row.unit || 'item'} · {row.category || 'General'}</p>
                    </div>
                    <span className={`tag text-xs ${LOCATION_COLORS[row.storage_location] || 'bg-gray-100 text-gray-600'}`}>
                      {row.storage_location || 'pantry'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <div className="text-center py-6 animate-fade-in">
              <div className="text-5xl mb-4">{result.imported > 0 ? '✅' : '⚠️'}</div>
              <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
                {result.imported > 0 ? `${result.imported} items imported!` : 'Nothing imported'}
              </h3>
              {result.errors?.length > 0 && (
                <div className="mt-4 bg-red-50 rounded-xl p-3 text-left">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Errors ({result.errors.length})</p>
                  {result.errors.map((e, i) => <p key={i} className="text-xs text-red-400">{e}</p>)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          {step === 'preview' && (
            <div className="flex gap-3">
              <button onClick={() => setStep('choose')} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm">
                Back
              </button>
              <button onClick={handleImport} disabled={loading}
                className="flex-1 py-3 bg-forest text-white rounded-2xl font-bold text-sm shadow-md disabled:opacity-50">
                {loading ? 'Importing…' : `Import ${rows.length} Items`}
              </button>
            </div>
          )}
          {(step === 'choose' || step === 'result') && (
            <button onClick={onClose} className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm">
              {step === 'result' ? 'Done' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
