import { useState, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const LIST_COLORS = ['#2D6A4F', '#457B9D', '#E07B39', '#9B5DE5', '#E63946', '#2A9D8F', '#E9C46A']

export default function GroceryList({ items, lists, onAdd, onUpdate, onDelete, onGenerate, onRestock, onClearChecked, onCreateList, onUpdateList, onDeleteList }) {
  const [activeListId, setActiveListId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showListManager, setShowListManager] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit: 'item', storage_location: 'pantry' })
  const [restocking, setRestocking] = useState(null)
  const [dragActiveId, setDragActiveId] = useState(null)
  const [editingList, setEditingList] = useState(null)
  const [newListName, setNewListName] = useState('')
  const [newListColor, setNewListColor] = useState(LIST_COLORS[0])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  )

  const currentListId = activeListId ?? lists[0]?.id ?? null
  const currentList = lists.find(l => l.id === currentListId)

  const listItems = useMemo(() => items.filter(i => i.list_id === currentListId), [items, currentListId])
  const unchecked = listItems.filter(i => !i.checked).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const checked = listItems.filter(i => i.checked)

  const handleAdd = () => {
    if (!newItem.name.trim()) return
    onAdd({ ...newItem, list_id: currentListId })
    setNewItem({ name: '', quantity: 1, unit: 'item', storage_location: 'pantry' })
    setShowAddForm(false)
  }

  const handleRestock = async (id) => {
    setRestocking(id)
    await onRestock(id)
    setRestocking(null)
  }

  const handleDragEnd = ({ active, over }) => {
    setDragActiveId(null)
    if (!over || active.id === over.id) return
    const oldIndex = unchecked.findIndex(i => i.id === active.id)
    const newIndex = unchecked.findIndex(i => i.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(unchecked, oldIndex, newIndex)
      reordered.forEach((item, idx) => onUpdate(item.id, { sort_order: idx }))
    }
  }

  const dragActiveItem = dragActiveId ? items.find(i => i.id === dragActiveId) : null

  const handleCreateList = () => {
    if (!newListName.trim()) return
    onCreateList(newListName.trim(), newListColor)
    setNewListName('')
    setNewListColor(LIST_COLORS[0])
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter}
      onDragStart={({ active }) => setDragActiveId(active.id)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragActiveId(null)}>

      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="bg-white px-5 pt-14 pb-3 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-2xl font-bold text-gray-900">🛒 Grocery</h1>
            <div className="flex gap-2">
              <button onClick={onGenerate} className="px-3 py-2 bg-forest/10 text-forest text-xs font-bold rounded-xl active:scale-95 transition-transform">
                ⚡ Auto-fill
              </button>
              <button onClick={() => setShowListManager(!showListManager)} className="px-3 py-2 bg-cream-dark text-gray-600 text-xs font-bold rounded-xl active:scale-95 transition-transform">
                ✏️ Lists
              </button>
              <button onClick={() => setShowAddForm(!showAddForm)}
                className="w-10 h-10 bg-forest rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                  <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                  <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* List tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {lists.map(list => {
              const count = items.filter(i => i.list_id === list.id && !i.checked).length
              const isActive = list.id === currentListId
              return (
                <button key={list.id} onClick={() => setActiveListId(list.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all`}
                  style={isActive ? { backgroundColor: list.color, color: 'white' } : { backgroundColor: '#EDE9E0', color: '#6B7280' }}>
                  {list.name}
                  {count > 0 && <span className={`ml-1.5 text-xs opacity-75`}>{count}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="mx-4 mt-3 bg-white rounded-2xl shadow-card p-4 animate-slide-up">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Add to {currentList?.name}
            </p>
            <input type="text" placeholder="Item name" value={newItem.name}
              onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus className="input-field mb-2 text-sm" />
            <div className="flex gap-2 mb-3">
              <input type="number" min="0.5" step="0.5" value={newItem.quantity}
                onChange={e => setNewItem(p => ({ ...p, quantity: parseFloat(e.target.value) || 1 }))}
                className="input-field w-16 text-center text-sm" />
              <input type="text" placeholder="unit" value={newItem.unit}
                onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))}
                className="input-field flex-1 text-sm" />
              <select value={newItem.storage_location}
                onChange={e => setNewItem(p => ({ ...p, storage_location: e.target.value }))}
                className="input-field flex-1 text-sm">
                {['pantry', 'fridge', 'freezer'].map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm">Cancel</button>
              <button onClick={handleAdd} disabled={!newItem.name.trim()} className="flex-1 py-2.5 bg-forest text-white rounded-xl font-semibold text-sm disabled:opacity-40">Add</button>
            </div>
          </div>
        )}

        {/* List manager */}
        {showListManager && (
          <div className="mx-4 mt-3 bg-white rounded-2xl shadow-card p-4 animate-slide-up space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Manage Lists</p>
            {lists.map(list => (
              <div key={list.id} className="flex items-center gap-2">
                {editingList === list.id ? (
                  <>
                    <input type="text" defaultValue={list.name} id={`edit-list-${list.id}`} className="input-field flex-1 text-sm py-2" />
                    <button onClick={() => {
                      const val = document.getElementById(`edit-list-${list.id}`).value
                      if (val.trim()) onUpdateList(list.id, { name: val.trim(), color: list.color })
                      setEditingList(null)
                    }} className="text-forest font-bold text-sm px-3 py-2 bg-forest/10 rounded-xl">Save</button>
                    <button onClick={() => setEditingList(null)} className="text-gray-400 px-2">✕</button>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: list.color }} />
                    <span className="flex-1 text-sm font-medium text-gray-800">{list.name}</span>
                    <button onClick={() => setEditingList(list.id)} className="text-gray-400 text-xs px-2 py-1">✏️</button>
                    <button onClick={() => onDeleteList(list.id)} className="text-red-400 text-xs px-2 py-1">🗑</button>
                  </>
                )}
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">New List</p>
              <input type="text" placeholder="List name" value={newListName}
                onChange={e => setNewListName(e.target.value)} className="input-field text-sm" />
              <div className="flex gap-2">
                {LIST_COLORS.map(c => (
                  <button key={c} onClick={() => setNewListColor(c)}
                    className={`w-7 h-7 rounded-full transition-all ${newListColor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <button onClick={handleCreateList} disabled={!newListName.trim()}
                className="w-full py-2.5 bg-forest text-white rounded-xl font-semibold text-sm disabled:opacity-40">
                Create List
              </button>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto scroll-container px-4 pt-3 pb-4">
          {listItems.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="text-5xl mb-3">🛒</div>
              <p className="text-gray-500 font-medium">{currentList?.name || 'This list'} is empty</p>
              <p className="text-gray-400 text-sm mt-1">Tap + to add, or ⚡ to auto-fill low-stock items</p>
            </div>
          ) : (
            <>
              {unchecked.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                    {unchecked.length} to get
                  </p>
                  <SortableContext items={unchecked.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {unchecked.map(item => (
                        <SortableGroceryItem key={item.id} item={item} lists={lists}
                          currentListId={currentListId}
                          onToggle={(id, val) => onUpdate(id, { checked: val })}
                          onDelete={onDelete} onRestock={handleRestock}
                          onMoveToList={(id, listId) => onUpdate(id, { list_id: listId })}
                          onEdit={(id, data) => onUpdate(id, data)}
                          restocking={restocking === item.id} />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )}

              {checked.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Done ({checked.length})</p>
                    <button onClick={() => onClearChecked(currentListId)} className="text-xs text-red-400 font-semibold">Clear all</button>
                  </div>
                  <div className="space-y-2">
                    {checked.map(item => (
                      <SortableGroceryItem key={item.id} item={item} lists={lists}
                        currentListId={currentListId}
                        onToggle={(id, val) => onUpdate(id, { checked: val })}
                        onDelete={onDelete} onRestock={handleRestock}
                        onMoveToList={(id, listId) => onUpdate(id, { list_id: listId })}
                        onEdit={(id, data) => onUpdate(id, data)}
                        restocking={restocking === item.id} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <DragOverlay>
        {dragActiveItem && (
          <div className="bg-white rounded-2xl shadow-lift px-4 py-3 opacity-95 border border-gray-100">
            <p className="font-semibold text-gray-900 text-sm">{dragActiveItem.name}</p>
            <p className="text-xs text-gray-400">{dragActiveItem.quantity} {dragActiveItem.unit}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

function GroceryEditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    storage_location: item.storage_location
  })
  const UNITS = ['item', 'serving', 'oz', 'lb', 'kg', 'g', 'ml', 'L', 'cup', 'tbsp', 'tsp', 'can', 'box', 'bag', 'bunch', 'bottle', 'pack', 'slice']

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl shadow-lift animate-slide-up">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-gray-100">
          <h2 className="font-display text-xl font-bold text-gray-900">Edit Item</h2>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Name</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus className="input-field" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Quantity</label>
              <input type="number" min="0" step="0.5" value={form.quantity}
                onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                onBlur={e => setForm(p => ({ ...p, quantity: parseFloat(e.target.value) || 1 }))}
                className="input-field" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Unit</label>
              <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} className="input-field">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Storage Location</label>
            <div className="flex gap-2">
              {['pantry', 'fridge', 'freezer'].map(loc => (
                <button key={loc} type="button" onClick={() => setForm(p => ({ ...p, storage_location: loc }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border
                    ${form.storage_location === loc ? 'bg-forest text-white border-forest' : 'bg-cream text-gray-600 border-transparent'}`}>
                  {loc.charAt(0).toUpperCase() + loc.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-100">
          <button onClick={() => onSave(form)} disabled={!form.name.trim()}
            className="w-full py-4 bg-forest text-white rounded-2xl font-bold text-base shadow-md disabled:opacity-40">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

function SortableGroceryItem({ item, lists, currentListId, onToggle, onDelete, onRestock, onMoveToList, onEdit, restocking }) {
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }

  const otherLists = lists.filter(l => String(l.id) !== String(currentListId))

  return (
    <>
      <div ref={setNodeRef} style={style}
        className={`bg-white rounded-2xl shadow-card overflow-visible transition-opacity ${item.checked === 1 ? 'opacity-60' : ''}`}>
        <div className="flex items-center gap-2 px-3 py-3">
          {/* Drag handle */}
          <div {...attributes} {...listeners}
            className="text-gray-200 cursor-grab active:cursor-grabbing touch-none flex-shrink-0 p-1">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
              <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
            </svg>
          </div>

          {/* Checkbox */}
          <button onClick={() => onToggle(item.id, !item.checked)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
              ${item.checked === 1 ? 'bg-forest border-forest' : 'border-gray-300'}`}>
            {item.checked === 1 && (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3.5 h-3.5">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {/* Info — tap to edit */}
          <div className="flex-1 min-w-0" onClick={() => setShowEdit(true)}>
            <p className={`font-semibold text-sm ${item.checked === 1 ? 'line-through text-gray-400' : 'text-gray-900'}`}>{item.name}</p>
            <p className="text-xs text-gray-400">{item.quantity} {item.unit} · {item.storage_location}{item.is_auto_generated === 1 ? ' · ⚡' : ''}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {otherLists.length > 0 && (
              <div className="relative">
                <button onClick={() => setShowMoveMenu(!showMoveMenu)}
                  className="text-xs font-bold px-2 py-1.5 bg-cream-dark text-gray-500 rounded-lg active:scale-95 transition-transform">
                  ↗
                </button>
                {showMoveMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMoveMenu(false)} />
                    <div className="absolute right-0 bottom-full mb-1 bg-white rounded-xl shadow-lift p-2 z-50 min-w-[150px]">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">Move to</p>
                      {otherLists.map(list => (
                        <button key={list.id} onClick={() => { onMoveToList(item.id, list.id); setShowMoveMenu(false) }}
                          className="w-full text-left px-2 py-2 text-sm font-medium hover:bg-cream rounded-lg flex items-center gap-2 transition-colors">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: list.color }} />
                          {list.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {item.checked === 1 && (
              <button onClick={() => onRestock(item.id)} disabled={restocking}
                className="text-xs font-bold px-2.5 py-1.5 bg-forest/10 text-forest rounded-lg active:scale-95 transition-transform disabled:opacity-50">
                {restocking ? '…' : '↑ Stock'}
              </button>
            )}

            <button onClick={() => onDelete(item.id)}
              className="w-7 h-7 flex items-center justify-center text-gray-300 active:text-red-400 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showEdit && (
        <GroceryEditModal
          item={item}
          onSave={(data) => { onEdit(item.id, data); setShowEdit(false) }}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  )
}
