import { useState, useRef } from 'react'

export default function ItemCard({ item, onUse, onEdit, onDelete }) {
  const [showActions, setShowActions] = useState(false)
  const [pressing, setPressing] = useState(false)
  const pressTimer = useRef(null)

  const isLow = item.commonly_used && item.quantity <= item.low_stock_threshold
  const isEmpty = item.quantity <= 0

  const handlePressStart = () => {
    pressTimer.current = setTimeout(() => setShowActions(true), 400)
    setPressing(true)
  }

  const handlePressEnd = () => {
    clearTimeout(pressTimer.current)
    setPressing(false)
  }

  const handleUse = (e) => {
    e.stopPropagation()
    if (!isEmpty) onUse(item.id)
  }

  return (
    <>
      {showActions && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setShowActions(false)}
        />
      )}

      <div className={`relative bg-white rounded-2xl shadow-card overflow-hidden transition-all duration-150
        ${pressing ? 'scale-[0.98]' : 'scale-100'}
        ${isEmpty ? 'opacity-50' : ''}
        ${showActions ? 'z-50 shadow-lift' : 'z-0'}`}
      >
        {/* Low stock indicator bar */}
        {isLow && !isEmpty && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-terra to-amber" />
        )}

        <div
          className="flex items-center gap-3 p-4"
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
        >
          {/* Quantity badge */}
          <div className={`min-w-[52px] h-12 rounded-xl flex flex-col items-center justify-center
            ${isEmpty ? 'bg-gray-100' : isLow ? 'bg-terra/10' : 'bg-forest/10'}`}>
            <span className={`text-lg font-bold leading-tight
              ${isEmpty ? 'text-gray-400' : isLow ? 'text-terra' : 'text-forest'}`}>
              {item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(1)}
            </span>
            <span className="text-[9px] font-medium text-gray-400 leading-tight">{item.unit}</span>
          </div>

          {/* Item info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 truncate">{item.name}</p>
              {item.commonly_used === 1 && (
                <span className="text-amber text-xs">★</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400">{item.category}</span>
              {isLow && (
                <span className="tag bg-terra/10 text-terra">Low stock</span>
              )}
              {isEmpty && (
                <span className="tag bg-gray-100 text-gray-500">Out</span>
              )}
            </div>
          </div>

          {/* Use button */}
          <button
            onClick={handleUse}
            disabled={isEmpty}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90
              ${isEmpty
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-forest/10 text-forest active:bg-forest active:text-white'}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Actions panel (long press) */}
        {showActions && (
          <div className="flex border-t border-gray-100 animate-fade-in">
            <button
              onClick={() => { onEdit(item); setShowActions(false) }}
              className="flex-1 py-3 text-sm font-semibold text-forest bg-forest/5 flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Edit
            </button>
            <div className="w-px bg-gray-100" />
            <button
              onClick={() => { onDelete(item.id); setShowActions(false) }}
              className="flex-1 py-3 text-sm font-semibold text-red-500 bg-red-50 flex items-center justify-center gap-2"
            >
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
