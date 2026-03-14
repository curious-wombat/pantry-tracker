import { useState, useRef } from 'react'
import { apiFetch } from '../api'

const UNITS = ['each', 'serving', 'oz', 'lb', 'can', 'jar', 'bag', 'bunch', 'bottle', 'pack', 'container']
const CATEGORIES = ['Produce', 'Protein', 'Dairy', 'Grains', 'Pantry Staples', 'Spices', 'Frozen', 'Condiments', 'Beverages', 'Snacks', 'Other']
const LOCATIONS = ['pantry', 'fridge', 'freezer']

export default function ScanModal({ onClose, onImportComplete }) {
  const [phase, setPhase] = useState('upload') // upload | scanning | review | adding
  const [preview, setPreview] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [mediaType, setMediaType] = useState('image/jpeg')
  const [scannedItems, setScannedItems] = useState([])
  const [selected, setSelected] = useState({})
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaType(file.type || 'image/jpeg')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      setPreview(dataUrl)
      // Extract base64 portion only
      setImageData(dataUrl.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  const handleScan = async () => {
    if (!imageData) return
    setPhase('scanning')
    setError(null)
    try {
      const res = await apiFetch('/api/items/scan', {
        method: 'POST',
        body: JSON.stringify({ image: imageData, media_type: mediaType })
      })
      if (!res.ok) throw new Error('Scan failed')
      const data = await res.json()
      if (!data.items?.length) {
        setError('No food items detected. Try a clearer photo.')
        setPhase('upload')
        return
      }
      const items = data.items.map((item, i) => ({ ...item, _id: i }))
      setScannedItems(items)
      // Select all by default
      const sel = {}
      items.forEach(item => { sel[item._id] = true })
      setSelected(sel)
      setPhase('review')
    } catch (e) {
      setError('Something went wrong. Please try again.')
      setPhase('upload')
    }
  }

  const updateItem = (id, key, val) => {
    setScannedItems(prev => prev.map(i => i._id === id ? { ...i, [key]: val } : i))
  }

  const handleAddAll = async () => {
    const toAdd = scannedItems.filter(i => selected[i._id])
    if (!toAdd.length) return
    setPhase('adding')
    const today = new Date().toISOString().split('T')[0]
    let added = 0
    for (const item of toAdd) {
      try {
        const res = await apiFetch('/api/items', {
          method: 'POST',
          body: JSON.stringify({
            name: item.name,
            quantity: parseFloat(item.quantity) || 1,
            unit: item.unit,
            category: item.category,
            storage_location: item.storage_location,
            expiration_date: item.expiration_date || null,
            purchased_date: today
          })
        })
        if (res.ok) added++
      } catch (e) { /* skip failed items */ }
    }
    onImportComplete()
    onClose()
  }

  const selectedCount = Object.values(selected).filter(Boolean).length

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={phase === 'scanning' || phase === 'adding' ? undefined : onClose} />
      <div className="relative bg-white rounded-t-3xl shadow-lift animate-slide-up max-h-[92vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900">📷 Scan Groceries</h2>
            {phase === 'review' && (
              <p className="text-xs text-gray-400 mt-0.5">Review and edit before adding</p>
            )}
          </div>
          {phase !== 'scanning' && phase !== 'adding' && (
            <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="overflow-y-auto scroll-container flex-1 px-5 py-4">

          {/* Upload phase */}
          {phase === 'upload' && (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              {!preview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 active:bg-cream transition-colors">
                  <span className="text-4xl">📷</span>
                  <div className="text-center">
                    <p className="font-semibold text-gray-700">Take or upload a photo</p>
                    <p className="text-xs text-gray-400 mt-1">Groceries, pantry shelves, receipt</p>
                  </div>
                </button>
              ) : (
                <div className="relative">
                  <img src={preview} alt="Preview" className="w-full rounded-2xl object-cover max-h-64" />
                  <button
                    onClick={() => { setPreview(null); setImageData(null) }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white text-xs">
                    ✕
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden" />
              <p className="text-xs text-gray-400 text-center">
                Works best with clear photos of labels or a spread-out haul
              </p>
            </div>
          )}

          {/* Scanning phase */}
          {phase === 'scanning' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="text-5xl animate-bounce">🔍</div>
              <p className="font-semibold text-gray-700">Scanning your photo…</p>
              <p className="text-xs text-gray-400">Identifying items, this takes a few seconds</p>
            </div>
          )}

          {/* Adding phase */}
          {phase === 'adding' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="text-5xl animate-bounce">🥬</div>
              <p className="font-semibold text-gray-700">Adding to inventory…</p>
            </div>
          )}

          {/* Review phase */}
          {phase === 'review' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-500">{scannedItems.length} items detected</p>
                <button
                  onClick={() => {
                    const allSelected = scannedItems.every(i => selected[i._id])
                    const newSel = {}
                    scannedItems.forEach(i => { newSel[i._id] = !allSelected })
                    setSelected(newSel)
                  }}
                  className="text-xs text-forest font-semibold">
                  {scannedItems.every(i => selected[i._id]) ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              {scannedItems.map(item => (
                <div key={item._id}
                  className={`rounded-2xl border transition-all p-3 ${selected[item._id] ? 'border-forest/30 bg-forest/5' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => setSelected(prev => ({ ...prev, [item._id]: !prev[item._id] }))}
                      className={`mt-1 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                        ${selected[item._id] ? 'bg-forest border-forest' : 'border-gray-300'}`}>
                      {selected[item._id] && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                          <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 space-y-2">
                      {/* Name */}
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => updateItem(item._id, 'name', e.target.value)}
                        className="input-field text-sm font-semibold py-1.5" />

                      {/* Qty + Unit + Location */}
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.quantity}
                          onChange={e => updateItem(item._id, 'quantity', e.target.value)}
                          className="input-field text-sm py-1.5 w-16 text-center" />
                        <select
                          value={item.unit}
                          onChange={e => updateItem(item._id, 'unit', e.target.value)}
                          className="input-field text-sm py-1.5 flex-1">
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <select
                          value={item.storage_location}
                          onChange={e => updateItem(item._id, 'storage_location', e.target.value)}
                          className="input-field text-sm py-1.5 flex-1">
                          {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>

                      {/* Category */}
                      <select
                        value={item.category}
                        onChange={e => updateItem(item._id, 'category', e.target.value)}
                        className="input-field text-sm py-1.5 w-full">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>

                      {/* Expiry date if set */}
                      {item.expiration_date && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">Expires:</span>
                          <input
                            type="date"
                            value={item.expiration_date}
                            onChange={e => updateItem(item._id, 'expiration_date', e.target.value || null)}
                            className="input-field text-xs py-1 flex-1" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Scan another */}
              <button
                onClick={() => { setPhase('upload'); setPreview(null); setImageData(null) }}
                className="w-full py-3 bg-cream text-gray-600 rounded-2xl font-semibold text-sm mt-2">
                📷 Scan another photo
              </button>
            </div>
          )}
        </div>

        {/* Footer button */}
        <div className="px-5 py-4 border-t border-gray-100">
          {phase === 'upload' && (
            <button
              onClick={preview ? handleScan : () => fileInputRef.current?.click()}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all
                ${preview ? 'bg-forest text-white shadow-md active:scale-98' : 'bg-gray-100 text-gray-400'}`}>
              {preview ? '✨ Identify Items' : '📷 Choose Photo'}
            </button>
          )}
          {phase === 'review' && (
            <button
              onClick={handleAddAll}
              disabled={selectedCount === 0}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all
                ${selectedCount > 0 ? 'bg-forest text-white shadow-md active:scale-98' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
              Add {selectedCount} item{selectedCount !== 1 ? 's' : ''} to Inventory
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
