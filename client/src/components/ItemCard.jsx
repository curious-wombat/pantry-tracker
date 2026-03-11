import { useState, useRef } from 'react'

const today = () => new Date().toISOString().split('T')[0]

const expirationStatus = (dateStr) => {
  if (!dateStr) return null
  const now = new Date(); now.setHours(0,0,0,0)
  const exp = new Date(dateStr + 'T00:00:00')
  const days = Math.round((exp - now) / 86400000)
  if (days < 0) return { label: 'Expired', color: 'bg-red-100 text-red-600', urgent: true }
  if (days === 0) return { label: 'Expires today', color: 'bg-red-100 text-red-600', urgent: true }
  if (days === 1) return { label: 'Exp tomorrow', color: 'bg-terra/15 text-terra', urgent: true }
  if (days <= 3) return { label: `Exp in ${days}d`, color: 'bg-terra/15 text-terra', urgent: false }
  return { label: `Exp ${exp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, color: 'bg-gray-100 text-gray-500', urgent: false }
}

export default function ItemCard({ item, onUse, onIncrement, onEdit, onDelete, onAddToGrocery, groceryLists = [], showLocation = false }) {
  const [showActions, setShowActions] = useState(false)
  const [showListPicker, setShowListPicker] = useState(false)
  const [pressing, setPressing] = useState(false)
  const pressTimer = useRef(null)

  const isLow = item.commonly_used === 1 && item.quantity < item.low_stock_threshold
  const isEmpty = item.quantity <= 0
  const expStatus = expirationStatus(item.expiration_date)

  const handlePressStart = () => {
    pressTimer.current = setTimeout(() => setShowActions(true), 400)
    setPressing(true)
  }
  const handlePressEnd = () => { clearTimeout(pressTimer.current); setPressing(false) }
  const handleUse = (e) => { e.stopPropagation(); if (!isEmpty) onUse(item.id) }

  const handleAddToGrocery = (e) => {
    e.stopPropagation()
    if (groceryLists.length <= 1) {
      onAddToGrocery(item.id, groceryLists[0]?.id ?? null)
    } else {
      setShowListPicker(true)
    }
  }

  return (
    <>
      {(showActions || showListPicker) && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => { setShowActions(false); setShowListPicker(false) }} />
      )}

      <div className={`relative bg-white rounded-2xl shadow-card overflow-hidden transition-all duration-150
        ${pressing ? 'scale-[0.98]' : 'scale-100'}
        ${isEmpty ? 'opacity-50' : ''}
        ${showActions || showListPicker ? 'z-50 shadow-lift' : 'z-0'}`}>

        {isLow && !isEmpty && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-terra to-amber" />}
        {expStatus?.urgent && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 to-red-500" />}

        <div className="flex items-center gap-3 p-4"
          onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
          onMouseDown={handlePressStart} onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd}>

          <div className={`min-w-[52px] h-12 rounded-xl flex flex-col items-center justify-center
            ${isEmpty ? 'bg-gray-100' : isLow ? 'bg-terra/10' : 'bg-forest/10'}`}>
            <span className={`text-lg font-bold leading-tight
              ${isEmpty ? 'text-gray-400' : isLow ? 'text-terra' : 'text-forest'}`}>
              {item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(1)}
            </span>
            <span className="text-[9px] font-medium text-gray-400 leading-tight">{item.unit}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 truncate">{item.name}</p>
              {item.commonly_used === 1 && <span className="text-amber text-xs">★</span>}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400">{item.category}</span>
              {isLow && <span className="tag bg-terra/10 text-terra">Low stock</span>}
              {isEmpty && <span className="tag bg-gray-100 text-gray-500">Out</span>}
              {expStatus && <span className={`tag ${expStatus.color}`}>{expStatus.label}</span>}
              {showLocation && <span className="tag bg-blue-50 text-blue-500 capitalize">{item.storage_location}</span>}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Add to grocery list button */}
            <button onClick={handleAddToGrocery}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber/10 text-amber-dark active:bg-amber/30 transition-all active:scale-90">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h13" />
                <circle cx="9" cy="21" r="1" fill="currentColor" /><circle cx="20" cy="21" r="1" fill="currentColor" />
              </svg>
            </button>

            {/* Use one (−) and add one (+) buttons */}
            <button onClick={handleUse} disabled={isEmpty}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90
                ${isEmpty ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-forest/10 text-forest active:bg-forest active:text-white'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
              </svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onIncrement(item.id) }}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-forest/10 text-forest active:bg-forest active:text-white transition-all active:scale-90">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* List picker */}
        {showListPicker && (
          <div className="border-t border-gray-100 p-3 animate-fade-in">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Add to which list?</p>
            <div className="flex flex-wrap gap-2">
              {groceryLists.map(list => (
                <button key={list.id}
                  onClick={() => { onAddToGrocery(item.id, list.id); setShowListPicker(false) }}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
                  style={{ backgroundColor: list.color }}>
                  {list.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Long press actions */}
        {showActions && !showListPicker && (
          <div className="flex border-t border-gray-100 animate-fade-in">
            <button onClick={() => { onEdit(item); setShowActions(false) }}
              className="flex-1 py-3 text-sm font-semibold text-forest bg-forest/5 flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Edit
            </button>
            <div className="w-px bg-gray-100" />
            <button onClick={() => { onDelete(item.id); setShowActions(false) }}
              className="flex-1 py-3 text-sm font-semibold text-red-500 bg-red-50 flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                <path d="M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>
    </>
  )
}
