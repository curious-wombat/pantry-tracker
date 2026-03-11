import { useState, useMemo } from 'react'
import ItemCard from './ItemCard'
import ImportModal from './ImportModal'

const LOCATION_CONFIG = {
  pantry: { label: 'Pantry', emoji: '🫙', color: 'bg-amber/20 text-amber-dark border-amber/30' },
  fridge: { label: 'Fridge', emoji: '🥗', color: 'bg-frost/20 text-frost-dark border-frost/30' },
  freezer: { label: 'Freezer', emoji: '🧊', color: 'bg-blue-100 text-blue-600 border-blue-200' }
}

export default function InventoryView({ items, location, setLocation, onUse, onEdit, onDelete, onAdd, onAddToGrocery, groceryLists, onImportComplete }) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('category')
  const [showImport, setShowImport] = useState(false)

  const locationItems = useMemo(() => {
    let filtered = items.filter(i => i.storage_location === location)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    }
    if (sortBy === 'category') filtered.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
    else if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === 'low') filtered.sort((a, b) => (a.quantity - a.low_stock_threshold) - (b.quantity - b.low_stock_threshold))
    return filtered
  }, [items, location, search, sortBy])

  const grouped = useMemo(() => {
    if (sortBy !== 'category') return { All: locationItems }
    return locationItems.reduce((acc, item) => {
      const cat = item.category || 'General'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    }, {})
  }, [locationItems, sortBy])

  const config = LOCATION_CONFIG[location]
  const isLow = locationItems.filter(i => i.commonly_used === 1 && i.quantity <= i.low_stock_threshold).length

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white px-5 pt-14 pb-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl font-bold text-gray-900">{config.emoji} {config.label}</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowImport(true)}
              className="px-3 py-2 bg-cream-dark text-gray-600 text-xs font-bold rounded-xl active:scale-95 transition-transform">
              📥 Import
            </button>
            <button onClick={() => onAdd(location)}
              className="w-10 h-10 bg-forest rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {Object.entries(LOCATION_CONFIG).map(([loc, cfg]) => {
            const count = items.filter(i => i.storage_location === loc).length
            return (
              <button key={loc} onClick={() => setLocation(loc)}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all border
                  ${location === loc ? cfg.color + ' shadow-sm' : 'bg-cream text-gray-500 border-transparent'}`}>
                {cfg.emoji} {cfg.label}
                <span className={`ml-1.5 text-xs ${location === loc ? 'opacity-70' : 'opacity-50'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input type="text" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10 pr-4 py-2.5 text-sm" />
        </div>
      </div>

      {isLow > 0 && (
        <div className="mx-4 mt-3 px-4 py-2.5 bg-terra/10 border border-terra/20 rounded-xl flex items-center gap-2">
          <span className="text-terra text-lg">⚠️</span>
          <p className="text-terra text-sm font-medium">{isLow} item{isLow > 1 ? 's' : ''} running low</p>
        </div>
      )}

      <div className="flex gap-2 px-4 mt-3">
        {[['category', 'By Category'], ['name', 'A–Z'], ['low', 'Low Stock']].map(([val, label]) => (
          <button key={val} onClick={() => setSortBy(val)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all
              ${sortBy === val ? 'bg-forest text-white' : 'bg-cream-dark text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scroll-container px-4 pt-3 pb-4 space-y-5">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-6xl mb-4">{config.emoji}</div>
            <p className="text-gray-500 font-medium">Your {config.label.toLowerCase()} is empty</p>
            <p className="text-gray-400 text-sm mt-1">Tap + to add items or 📥 Import to bulk upload</p>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} className="animate-fade-in">
              {sortBy === 'category' && <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{cat}</h3>}
              <div className="space-y-2">
                {catItems.map(item => (
                  <ItemCard key={item.id} item={item} onUse={onUse} onEdit={onEdit} onDelete={onDelete}
                    onAddToGrocery={onAddToGrocery} groceryLists={groceryLists} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImportComplete={() => { onImportComplete(); setShowImport(false) }}
        />
      )}
    </div>
  )
}
