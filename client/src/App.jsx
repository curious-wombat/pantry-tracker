import { useState, useEffect, useCallback } from 'react'
import Navigation from './components/Navigation'
import InventoryView from './components/InventoryView'
import GroceryList from './components/GroceryList'
import MealSuggestions from './components/MealSuggestions'
import AddItemModal from './components/AddItemModal'

export default function App() {
  const [activeTab, setActiveTab] = useState('inventory')
  const [inventoryLocation, setInventoryLocation] = useState('pantry')
  const [items, setItems] = useState([])
  const [groceryItems, setGroceryItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/items')
    if (res.ok) setItems(await res.json())
  }, [])

  const fetchGrocery = useCallback(async () => {
    const res = await fetch('/api/grocery')
    if (res.ok) setGroceryItems(await res.json())
  }, [])

  useEffect(() => {
    Promise.all([fetchItems(), fetchGrocery()]).finally(() => setLoading(false))
  }, [fetchItems, fetchGrocery])

  // ── Item CRUD ──────────────────────────────────────────────
  const saveItem = async (data) => {
    const isEdit = !!data.id
    const url = isEdit ? `/api/items/${data.id}` : '/api/items'
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (res.ok) {
      await fetchItems()
      showToast(isEdit ? 'Item updated' : 'Item added')
      setShowAddModal(false)
      setEditingItem(null)
    }
  }

  const deleteItem = async (id) => {
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
    showToast('Item removed')
  }

  const useItem = async (id) => {
    const res = await fetch(`/api/items/${id}/use`, { method: 'POST' })
    if (res.ok) {
      const updated = await res.json()
      setItems(prev => prev.map(i => i.id === id ? updated : i))
      if (updated.isLow) showToast(`${updated.name} is running low!`, 'warning')
    }
  }

  // ── Grocery CRUD ───────────────────────────────────────────
  const addGroceryItem = async (data) => {
    const res = await fetch('/api/grocery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (res.ok) { await fetchGrocery(); showToast('Added to grocery list') }
  }

  const toggleGroceryItem = async (id, checked) => {
    const res = await fetch(`/api/grocery/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked })
    })
    if (res.ok) setGroceryItems(prev => prev.map(i => i.id === id ? { ...i, checked: checked ? 1 : 0 } : i))
  }

  const deleteGroceryItem = async (id) => {
    await fetch(`/api/grocery/${id}`, { method: 'DELETE' })
    setGroceryItems(prev => prev.filter(i => i.id !== id))
  }

  const generateGroceryList = async () => {
    const res = await fetch('/api/grocery/generate', { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      await fetchGrocery()
      showToast(data.added > 0 ? `Added ${data.added} low-stock items` : 'No low-stock items found', data.added > 0 ? 'success' : 'info')
    }
  }

  const restockGroceryItem = async (id) => {
    await fetch(`/api/grocery/${id}/restock`, { method: 'POST' })
    await Promise.all([fetchItems(), fetchGrocery()])
    showToast('Restocked to inventory!')
  }

  const clearCheckedGrocery = async () => {
    await fetch('/api/grocery/checked/all', { method: 'DELETE' })
    setGroceryItems(prev => prev.filter(i => !i.checked))
    showToast('Cleared checked items')
  }

  const openEdit = (item) => { setEditingItem(item); setShowAddModal(true) }
  const openAdd = (location) => {
    setEditingItem({ storage_location: location || inventoryLocation })
    setShowAddModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-4">🥬</div>
          <p className="text-sage font-body font-medium">Loading your pantry…</p>
        </div>
      </div>
    )
  }

  const lowStockCount = items.filter(i => i.commonly_used && i.quantity <= i.low_stock_threshold).length

  return (
    <div className="min-h-screen bg-cream font-body">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up
          px-5 py-3 rounded-2xl shadow-lift text-white text-sm font-semibold
          ${toast.type === 'warning' ? 'bg-terra' : toast.type === 'info' ? 'bg-sage' : 'bg-forest'}`}>
          {toast.message}
        </div>
      )}

      {/* Main Content */}
      <main className="pb-safe">
        {activeTab === 'inventory' && (
          <InventoryView
            items={items}
            location={inventoryLocation}
            setLocation={setInventoryLocation}
            onUse={useItem}
            onEdit={openEdit}
            onDelete={deleteItem}
            onAdd={openAdd}
            lowStockCount={lowStockCount}
          />
        )}
        {activeTab === 'grocery' && (
          <GroceryList
            items={groceryItems}
            onAdd={addGroceryItem}
            onToggle={toggleGroceryItem}
            onDelete={deleteGroceryItem}
            onGenerate={generateGroceryList}
            onRestock={restockGroceryItem}
            onClearChecked={clearCheckedGrocery}
          />
        )}
        {activeTab === 'meals' && (
          <MealSuggestions items={items} />
        )}
      </main>

      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        groceryCount={groceryItems.filter(i => !i.checked).length}
        lowStockCount={lowStockCount}
      />

      {showAddModal && (
        <AddItemModal
          item={editingItem}
          onSave={saveItem}
          onClose={() => { setShowAddModal(false); setEditingItem(null) }}
        />
      )}
    </div>
  )
}
