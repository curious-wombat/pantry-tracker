import { useState } from 'react'

const LOCATIONS = ['pantry', 'fridge', 'freezer']

export default function GroceryList({ items, onAdd, onToggle, onDelete, onGenerate, onRestock, onClearChecked }) {
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit: 'item', storage_location: 'pantry' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [restocking, setRestocking] = useState(null)

  const unchecked = items.filter(i => !i.checked)
  const checked = items.filter(i => i.checked)

  const handleAdd = () => {
    if (!newItem.name.trim()) return
    onAdd(newItem)
    setNewItem({ name: '', quantity: 1, unit: 'item', storage_location: 'pantry' })
    setShowAddForm(false)
  }

  const handleRestock = async (id) => {
    setRestocking(id)
    await onRestock(id)
    setRestocking(null)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl font-bold text-gray-900">🛒 Grocery List</h1>
          <div className="flex gap-2">
            <button
              onClick={onGenerate}
              className="px-3 py-2 bg-forest/10 text-forest text-xs font-bold rounded-xl active:scale-95 transition-transform"
            >
              ⚡ Auto-fill
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-10 h-10 bg-forest rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex gap-4 text-sm">
          <span className="text-gray-500">{unchecked.length} <span className="font-semibold text-gray-900">remaining</span></span>
          {checked.length > 0 && <span className="text-gray-500">{checked.length} <span className="font-semibold text-forest">done</span></span>}
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mx-4 mt-3 bg-white rounded-2xl shadow-card p-4 animate-slide-up">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Add Item</p>
          <input
            type="text"
            placeholder="Item name"
            value={newItem.name}
            onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            autoFocus
            className="input-field mb-2"
          />
          <div className="flex gap-2 mb-3">
            <input
              type="number" min="0.5" step="0.5"
              value={newItem.quantity}
              onChange={e => setNewItem(p => ({ ...p, quantity: parseFloat(e.target.value) || 1 }))}
              className="input-field w-20 text-center"
            />
            <input
              type="text" placeholder="unit"
              value={newItem.unit}
              onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))}
              className="input-field flex-1"
            />
            <select
              value={newItem.storage_location}
              onChange={e => setNewItem(p => ({ ...p, storage_location: e.target.value }))}
              className="input-field flex-1 text-sm"
            >
              {LOCATIONS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm">Cancel</button>
            <button onClick={handleAdd} disabled={!newItem.name.trim()} className="flex-1 py-2.5 bg-forest text-white rounded-xl font-semibold text-sm disabled:opacity-40">Add</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto scroll-container px-4 pt-3 pb-4">
        {items.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-gray-500 font-medium">Your grocery list is empty</p>
            <p className="text-gray-400 text-sm mt-1">Tap ⚡ Auto-fill to add low-stock items</p>
          </div>
        ) : (
          <>
            {/* Unchecked items */}
            {unchecked.length > 0 && (
              <div className="space-y-2 mb-4">
                {unchecked.map(item => (
                  <GroceryItem
                    key={item.id}
                    item={item}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onRestock={handleRestock}
                    restocking={restocking === item.id}
                  />
                ))}
              </div>
            )}

            {/* Checked items */}
            {checked.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Checked ({checked.length})</p>
                  <button onClick={onClearChecked} className="text-xs text-red-400 font-semibold">Clear all</button>
                </div>
                <div className="space-y-2">
                  {checked.map(item => (
                    <GroceryItem
                      key={item.id}
                      item={item}
                      onToggle={onToggle}
                      onDelete={onDelete}
                      onRestock={handleRestock}
                      restocking={restocking === item.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function GroceryItem({ item, onToggle, onDelete, onRestock, restocking }) {
  return (
    <div className={`bg-white rounded-2xl shadow-card flex items-center gap-3 px-4 py-3 transition-opacity
      ${item.checked ? 'opacity-60' : 'opacity-100'}`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id, !item.checked)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
          ${item.checked ? 'bg-forest border-forest' : 'border-gray-300'}`}
      >
        {item.checked && (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3.5 h-3.5">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {item.name}
        </p>
        <p className="text-xs text-gray-400">
          {item.quantity} {item.unit} · {item.storage_location}
          {item.is_auto_generated ? ' · ⚡ auto' : ''}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {item.checked && (
          <button
            onClick={() => onRestock(item.id)}
            disabled={restocking}
            className="text-xs font-bold px-2.5 py-1.5 bg-forest/10 text-forest rounded-lg active:scale-95 transition-transform disabled:opacity-50"
          >
            {restocking ? '…' : '↑ Stock'}
          </button>
        )}
        <button
          onClick={() => onDelete(item.id)}
          className="w-7 h-7 flex items-center justify-center text-gray-300 active:text-red-400 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
