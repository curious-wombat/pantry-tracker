import { useState, useEffect } from 'react'
import { apiFetch } from '../api'

const UNITS = ['each', 'serving', 'oz', 'lb', 'can', 'jar', 'bag', 'bunch', 'bottle', 'pack', 'container']
const CATEGORIES = ['Produce', 'Protein', 'Dairy', 'Grains', 'Pantry Staples', 'Spices', 'Leftovers', 'Snacks', 'Frozen', 'Condiments', 'Beverages', 'Other']
const LOCATIONS = [
  { value: 'pantry', label: '🫙 Pantry' },
  { value: 'fridge', label: '🥗 Fridge' },
  { value: 'freezer', label: '🧊 Freezer' }
]

const addDays = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export default function AddItemModal({ item, groceryLists = [], onSave, onClose, groceryMode = false, groceryListName = '' }) {
  const isEdit = !!(item?.id)
  const [suggesting, setSuggesting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    quantity: 1,
    unit: 'each',
    category: 'Pantry Staples',
    storage_location: 'pantry',
    commonly_used: false,
    low_stock_threshold: 1,
    preferred_list_id: null,
    expiration_date: null,
    purchased_date: null
  })

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        quantity: item.quantity ?? 1,
        unit: item.unit || 'each',
        category: item.category || 'Pantry Staples',
        storage_location: item.storage_location || 'pantry',
        commonly_used: item.commonly_used === 1 || item.commonly_used === true,
        low_stock_threshold: item.low_stock_threshold ?? 1,
        preferred_list_id: item.preferred_list_id ?? null,
        expiration_date: item.expiration_date ?? null,
        purchased_date: item.purchased_date ?? null,
        ...(item.id ? { id: item.id } : {})
      })
    }
  }, [item])

  const handleNameBlur = async () => {
    if (isEdit || !form.name.trim() || form.name.trim().length < 2) return
    setSuggesting(true)
    try {
      const res = await apiFetch(`/api/items/suggest?name=${encodeURIComponent(form.name.trim())}`)
      if (res.ok) {
        const { category, storage_location, unit, quantity } = await res.json()
        setForm(prev => ({
          ...prev,
          ...(category ? { category } : {}),
          ...(storage_location ? { storage_location } : {}),
          ...(unit ? { unit } : {}),
          ...(quantity ? { quantity } : {})
        }))
      }
    } catch (e) { /* silent fail */ }
    finally { setSuggesting(false) }
  }

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleCategoryChange = (cat) => {
    set('category', cat)
    if (cat === 'Leftovers' && form.storage_location === 'fridge' && !form.expiration_date) {
      set('expiration_date', addDays(4))
    }
  }

  const handleLocationChange = (loc) => {
    set('storage_location', loc)
    if (form.category === 'Leftovers' && loc === 'fridge' && !form.expiration_date) {
      set('expiration_date', addDays(4))
    }
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return
    onSave(form)
  }

  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [])

  const showExpiration = !groceryMode && (form.storage_location === 'fridge' || form.storage_location === 'freezer' || form.expiration_date)

  const title = groceryMode
    ? `Add to ${groceryListName || 'Grocery'}`
    : isEdit ? 'Edit Item' : 'Add Item'

  const submitLabel = groceryMode
    ? `Add to ${groceryListName || 'Grocery'}`
    : isEdit ? 'Save Changes' : 'Add to ' + form.storage_location.charAt(0).toUpperCase() + form.storage_location.slice(1)

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl shadow-lift animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-gray-100">
          <h2 className="font-display text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto scroll-container px-5 py-4 space-y-4 flex-1">
          {/* Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Item Name *</label>
              {suggesting && <span className="text-xs text-forest font-medium animate-pulse">✨ Suggesting...</span>}
            </div>
            <input type="text" placeholder="e.g. Chicken breast" value={form.name}
              onChange={e => set('name', e.target.value)}
              onBlur={handleNameBlur}
              autoFocus className="input-field" />
          </div>

          {/* Quantity + Unit */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Quantity</label>
              <input type="number" min="0" step="0.5" value={form.quantity}
                onChange={e => set('quantity', e.target.value)}
                onBlur={e => set('quantity', parseFloat(e.target.value) || 0)}
                className="input-field" />
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
                <button key={loc.value} type="button" onClick={() => handleLocationChange(loc.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border
                    ${form.storage_location === loc.value ? 'bg-forest text-white border-forest shadow-sm' : 'bg-cream text-gray-600 border-transparent'}`}>
                  {loc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category — inventory only */}
          {!groceryMode && (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Category</label>
              <select value={form.category} onChange={e => handleCategoryChange(e.target.value)} className="input-field">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* Expiration — inventory only */}
          {showExpiration && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Expiration Date {form.category === 'Leftovers' ? '🍱' : ''}
                </label>
                {form.expiration_date && (
                  <button onClick={() => set('expiration_date', null)} className="text-xs text-gray-400 font-medium">Clear</button>
                )}
              </div>
              <input type="date" value={form.expiration_date || ''}
                onChange={e => set('expiration_date', e.target.value || null)}
                className="input-field" />
              {form.category === 'Leftovers' && !form.expiration_date && (
                <button onClick={() => set('expiration_date', addDays(4))}
                  className="mt-1.5 text-xs text-forest font-semibold">
                  + Set to 4 days from now
                </button>
              )}
            </div>
          )}

          {/* Purchase Date — inventory only */}
          {!groceryMode && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Purchase Date</label>
                {form.purchased_date && (
                  <button onClick={() => set('purchased_date', null)} className="text-xs text-gray-400 font-medium">Clear</button>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <input type="date" value={form.purchased_date || ''}
                  onChange={e => set('purchased_date', e.target.value || null)}
                  className="input-field flex-1" />
                {!form.purchased_date && (
                  <button onClick={() => set('purchased_date', new Date().toISOString().split('T')[0])}
                    className="text-xs text-forest font-semibold whitespace-nowrap">
                    Today
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Commonly Used — inventory only */}
          {!groceryMode && (
            <>
              <div className="flex items-center justify-between bg-cream rounded-xl px-4 py-3">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Commonly Used ★</p>
                  <p className="text-xs text-gray-400 mt-0.5">Auto-add to grocery list when low</p>
                </div>
                <button type="button" onClick={() => set('commonly_used', !form.commonly_used)}
                  className={`w-12 h-6 rounded-full transition-all relative ${form.commonly_used ? 'bg-forest' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.commonly_used ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>

              {form.commonly_used && (
                <div className="space-y-3 animate-fade-in">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Low Stock Alert When Below</label>
                    <div className="flex items-center gap-3">
                      <input type="number" min="0" step="0.5" value={form.low_stock_threshold}
                        onChange={e => set('low_stock_threshold', e.target.value)}
                        onBlur={e => set('low_stock_threshold', parseFloat(e.target.value) || 1)}
                        className="input-field flex-1" />
                      <span className="text-gray-500 text-sm font-medium whitespace-nowrap">{form.unit}</span>
                    </div>
                  </div>

                  {groceryLists.length > 0 && (
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Usually Buy At</label>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => set('preferred_list_id', null)}
                          className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all border
                            ${form.preferred_list_id === null ? 'bg-forest text-white border-forest' : 'bg-cream text-gray-600 border-transparent'}`}>
                          Any
                        </button>
                        {groceryLists.map(list => (
                          <button key={list.id} type="button" onClick={() => set('preferred_list_id', list.id)}
                            className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all border
                              ${form.preferred_list_id === list.id ? 'text-white border-transparent' : 'bg-cream text-gray-600 border-transparent'}`}
                            style={form.preferred_list_id === list.id ? { backgroundColor: list.color } : {}}>
                            {list.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <button onClick={handleSubmit} disabled={!form.name.trim()}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all
              ${form.name.trim() ? 'bg-forest text-white shadow-md active:scale-98' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
