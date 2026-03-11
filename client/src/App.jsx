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
  const [groceryLists, setGroceryLists] = useState([])
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

  const fetchLists = useCallback(async () => {
    const res = await fetch('/api/lists')
    if (res.ok) setGroceryLists(await res.json())
  }, [])

  useEffect(() => {
    Promise.all([fetchItems(), fetchGrocery(), fetchLists()]).finally(() => setLoading(false))
  }, [fetchItems, fetchGrocery, fetchLists])

  // Item CRUD
  const saveItem = async (data) => {
    const isEdit = !!data.id
    const res = await fetch(isEdit ? `/api/items/${data.id}` : '/api/items', {
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

  const addToGroceryList = async (itemId, listId) => {
    const res = await fetch('/api/grocery/add-from-inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, list_id: listId })
    })
    if (res.ok) {
      await fetchGrocery()
      showToast('Added to grocery list!')
    } else if (res.status === 409) {
      showToast('Already on grocery list', 'info')
    }
  }

  // Grocery CRUD
  const addGroceryItem = async (data) => {
    const res = await fetch('/api/grocery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (res.ok) { await fetchGrocery(); showToast('Added to grocery list') }
  }

  const updateGroceryItem = async (id, data) => {
    const res = await fetch(`/api/grocery/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (res.ok) {
      const updated = await res.json()
      setGroceryItems(prev => prev.map(i => i.id === id ? updated : i))
    }
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

  const clearCheckedGrocery = async (listId) => {
    const url = listId ? `/api/grocery/checked/all?list_id=${listId}` : '/api/grocery/checked/all'
    await fetch(url, { method: 'DELETE' })
    setGroceryItems(prev => listId ? prev.filter(i => !(i.checked && i.list_id === listId)) : prev.filter(i => !i.checked))
    showToast('Cleared checked items')
  }

  // List CRUD
  const createList = async (name, color) => {
    const res = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    })
    if (res.ok) { await fetchLists(); showToast('List created') }
  }

  const updateList = async (id, data) => {
    const res = await fetch(`/api/lists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (res.ok) { await fetchLists(); showToast('List updated') }
  }

  const deleteList = async (id) => {
    const res = await fetch(`/api/lists/${id}`, { method: 'DELETE' })
    if (res.ok) { await Promise.all([fetchLists(), fetchGrocery()]); showToast('List deleted') }
    else showToast('Cannot delete the last list', 'warning')
  }

  const openEdit = (item) => { setEditingItem(item); setShowAddModal(true) }
  const openAdd = (location) => {
    setEditingItem({ storage_location: location || inventoryLocation })
    setShowAddModal(true)
  }

  const lowStockCount = items.filter(i => i.commonly_used === 1 && i.quantity <= i.low_stock_threshold).length

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

  return (
    <div className="min-h-screen bg-cream font-body">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up
          px-5 py-3 rounded-2xl shadow-lift text-white text-sm font-semibold
          ${toast.type === 'warning' ? 'bg-terra' : toast.type === 'info' ? 'bg-sage' : 'bg-forest'}`}>
          {toast.message}
        </div>
      )}

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
            onAddToGrocery={addToGroceryList}
            groceryLists={groceryLists}
            lowStockCount={lowStockCount}
          />
        )}
        {activeTab === 'grocery' && (
          <GroceryList
            items={groceryItems}
            lists={groceryLists}
            onAdd={addGroceryItem}
            onUpdate={updateGroceryItem}
            onDelete={deleteGroceryItem}
            onGenerate={generateGroceryList}
            onRestock={restockGroceryItem}
            onClearChecked={clearCheckedGrocery}
            onCreateList={createList}
            onUpdateList={updateList}
            onDeleteList={deleteList}
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
          groceryLists={groceryLists}
          onSave={saveItem}
          onClose={() => { setShowAddModal(false); setEditingItem(null) }}
        />
      )}
    </div>
  )
}
