import { useState, useEffect } from 'react'

const UNITS = ['item', 'oz', 'lb', 'kg', 'g', 'ml', 'L', 'cup', 'tbsp', 'tsp', 'can', 'box', 'bag', 'bunch', 'bottle', 'pack', 'slice']
const CATEGORIES = ['Produce', 'Protein', 'Dairy', 'Grains', 'Pantry Staples', 'Snacks', 'Frozen', 'Condiments', 'Beverages', 'Other']
const LOCATIONS = [
  { value: 'pantry', label: '🫙 Pantry' },
  { value: 'fridge', label: '🥗 Fridge' },
  { value: 'freezer', label: '🧊 Freezer' }
]

export default function AddItemModal({ item, onSave, onClose }) {
  const isEdit = !!(item?.id)

  const [form, setForm] = useState({
    name: '',
    quantity: 1,
    unit: 'item',
    category: 'Pantry Staples',
    storage_location: 'pantry',
    commonly_used: false,
    low_stock_threshold: 1
  })

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        quantity: item.quantity ?? 1,
        unit: item.unit || 'item',
        category: item.category || 'Pantry Staples',
        storage_location: item.storage_location || 'pantry',
        commonly_used: item.commonly_used === 1 || item.commonly_used === true,
        low_stock_threshold: item.low_stock_threshold ?? 1,
        ...(item.id ? { id: item.id } : {})
      })
    }
  }, [item])

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = () => {
    if (!form.name.trim()) return
    onSave(form)
  }

  // Prevent background scroll
  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-t-3xl shadow-lift animate-slide-up max-h-[90vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-gray-100">
          <h2 className="font-display text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Item' : 'Add Item'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto scroll-container px-5 py-4 space-y-4 flex-1">
          {/* Name */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Item Name *</label>
            <input
              type="text"
              placeholder="e.g. Chicken breast"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              autoFocus
              className="input-field"
            />
          </div>

          {/* Quantity + Unit */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Quantity</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.quantity}
                onChange={e => set('quantity', parseFloat(e.target.value) || 0)}
                className="input-field"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Unit</label>
              <select value={form.unit} onChange={e => set('unit', e.target.value)} className="input-field">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Storage Location */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Storage Location</label>
            <div className="flex gap-2">
              {LOCATIONS.map(loc => (
                <button
                  key={loc.value}
                  type="button"
                  onClick={() => set('storage_location', loc.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border
                    ${form.storage_location === loc.value
                      ? 'bg-forest text-white border-forest shadow-sm'
                      : 'bg-cream text-gray-600 border-transparent'}`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Commonly Used */}
          <div className="flex items-center justify-between bg-cream rounded-xl px-4 py-3">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Commonly Used ★</p>
              <p className="text-xs text-gray-400 mt-0.5">Auto-add to grocery list when low</p>
            </div>
            <button
              type="button"
              onClick={() => set('commonly_used', !form.commonly_used)}
              className={`w-12 h-6 rounded-full transition-all relative ${form.commonly_used ? 'bg-forest' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all
                ${form.commonly_used ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Low stock threshold (only if commonly used) */}
          {form.commonly_used && (
            <div className="animate-fade-in">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Low Stock Alert When Below
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.low_stock_threshold}
onChange={e => set('low_stock_threshold', e.target.value)}
onBlur={e => set('low_stock_threshold', parseFloat(e.target.value) || 1)}
                  className="input-field flex-1"
                />
                <span className="text-gray-500 text-sm font-medium whitespace-nowrap">{form.unit}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim()}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all
              ${form.name.trim()
                ? 'bg-forest text-white shadow-md active:scale-98'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            {isEdit ? 'Save Changes' : 'Add to ' + form.storage_location.charAt(0).toUpperCase() + form.storage_location.slice(1)}
          </button>
        </div>
      </div>
    </div>
  )
}
