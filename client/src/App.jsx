import { useState, useEffect, useCallback } from 'react'
import { apiFetch, getHouseholdCode, setHouseholdCode } from './api'
import HouseholdSetup from './components/HouseholdSetup'
import Navigation from './components/Navigation'
import InventoryView from './components/InventoryView'
import GroceryList from './components/GroceryList'
import MealSuggestions from './components/MealSuggestions'
import AddItemModal from './components/AddItemModal'

export default function App() {
  const [householdCode, setHousehold] = useState(getHouseholdCode())
  const [isSwitching, setIsSwitching] = useState(false)
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
    const res = await apiFetch('/api/items')
    if (res.ok) setItems(await res.json())
  }, [])

  const fetchGrocery = useCallback(async () => {
    const res = await apiFetch('/api/grocery')
    if (res.ok) setGroceryItems(await res.json())
  }, [])

  const fetchLists = useCallback(async () => {
    const res = await apiFetch('/api/lists')
    if (res.ok) setGroceryLists(await res.json())
  }, [])

  useEffect(() => {
    if (!householdCode) return
    setLoading(true)
    // Clean up any orphaned grocery items first
    apiFetch('/api/grocery/orphans', { method: 'DELETE' })
    Promise.all([fetchItems(), fetchGrocery(), fetchLists()]).finally(() => setLoading(false))
  }, [householdCode, fetchItems, fetchGrocery, fetchLists])

  const handleSwitchHousehold = () => setIsSwitching(true)

  const handleHouseholdComplete = (code) => {
    setHousehold(code)
    setIsSwitching(false)
    setItems([]); setGroceryItems([]); setGroceryLists([])
  }

  // Item CRUD
  const saveItem = async (data) => {
    const isEdit = !!data.id
    const res = await apiFetch(isEdit ? `/api/items/${data.id}` : '/api/items', {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify(data)
    })
    if (res.ok) {
      await fetchItems()
      showToast(isEdit ? 'Item updated' : 'Item added')
      if (data.storage_location) setInventoryLocation(data.storage_location)
      setShowAddModal(false); setEditingItem(null)
    }
  }

  const deleteItem = async (id) => {
    await apiFetch(`/api/items/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
    showToast('Item removed')
  }

  const useItem = async (id) => {
    const res = await apiFetch(`/api/items/${id}/use`, { method: 'POST' })
    if (res.ok) {
      const updated = await res.json()
      setItems(prev => prev.map(i => i.id === id ? updated : i))
      if (updated.isLow) showToast(`${updated.name} is running low!`, 'warning')
    }
  }

  const incrementItem = async (id) => {
    const res = await apiFetch(`/api/items/${id}/increment`, { method: 'POST' })
    if (res.ok) {
      const updated = await res.json()
      setItems(prev => prev.map(i => i.id === id ? updated : i))
    }
  }

  const addToGroceryList = async (itemId, listId) => {
    const res = await apiFetch('/api/grocery/add-from-inventory', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, list_id: listId })
    })
    if (res.ok) { await fetchGrocery(); showToast('Added to grocery list!') }
    else if (res.status === 409) showToast('Already on grocery list', 'info')
  }

  // Grocery CRUD
  const addGroceryItem = async (data) => {
    const res = await apiFetch('/api/grocery', { method: 'POST', body: JSON.stringify(data) })
    if (res.ok) { await fetchGrocery(); showToast('Added to grocery list') }
  }

  const updateGroceryItem = async (id, data) => {
    const res = await apiFetch(`/api/grocery/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    if (res.ok) {
      const updated = await res.json()
      setGroceryItems(prev => prev.map(i => i.id === id ? updated : i))
    }
  }

  const deleteGroceryItem = async (id) => {
    await apiFetch(`/api/grocery/${id}`, { method: 'DELETE' })
    setGroceryItems(prev => prev.filter(i => i.id !== id))
  }

  const generateGroceryList = async () => {
    const res = await apiFetch('/api/grocery/generate', { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      await fetchGrocery()
      showToast(data.added > 0 ? `Added ${data.added} low-stock items` : 'No low-stock items found', data.added > 0 ? 'success' : 'info')
    }
  }

  const [pendingRestock, setPendingRestock] = useState(null) // { groceryItem, possibleMatch }

  const restockGroceryItem = async (id, options = {}) => {
    const res = await apiFetch(`/api/grocery/${id}/restock`, { method: 'POST', body: JSON.stringify(options) })
    if (!res.ok) return
    const data = await res.json()
    if (data.needsConfirmation) {
      setPendingRestock({ groceryItem: data.groceryItem, possibleMatch: data.possibleMatch })
      return
    }
    await Promise.all([fetchItems(), fetchGrocery()])
    showToast('Restocked to inventory!')
  }

  const confirmMergeRestock = async (mergeWithId) => {
    if (!pendingRestock) return
    const id = pendingRestock.groceryItem.id
    setPendingRestock(null)
    await restockGroceryItem(id, mergeWithId ? { merge_with_id: mergeWithId } : { force_new: true })
  }

  const restockAllChecked = async (listId) => {
    const res = await apiFetch('/api/grocery/restock/all', { method: 'POST', body: JSON.stringify({ list_id: listId }) })
    if (res.ok) {
      const data = await res.json()
      await Promise.all([fetchItems(), fetchGrocery()])
      showToast(`Restocked ${data.restocked} item${data.restocked !== 1 ? 's' : ''} to inventory!`)
    }
  }

  const clearCheckedGrocery = async (listId) => {
    const url = listId ? `/api/grocery/checked/all?list_id=${listId}` : '/api/grocery/checked/all'
    await apiFetch(url, { method: 'DELETE' })
    setGroceryItems(prev => listId ? prev.filter(i => !(i.checked && i.list_id === listId)) : prev.filter(i => !i.checked))
    showToast('Cleared checked items')
  }

  // List CRUD
  const createList = async (name, color) => {
    const res = await apiFetch('/api/lists', { method: 'POST', body: JSON.stringify({ name, color }) })
    if (res.ok) { await fetchLists(); showToast('List created') }
  }

  const updateList = async (id, data) => {
    const res = await apiFetch(`/api/lists/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    if (res.ok) { await fetchLists(); showToast('List updated') }
  }

  const deleteList = async (id) => {
    const res = await apiFetch(`/api/lists/${id}`, { method: 'DELETE' })
    if (res.ok) { await Promise.all([fetchLists(), fetchGrocery()]); showToast('List deleted') }
    else showToast('Cannot delete the last list', 'warning')
  }

  const openEdit = (item) => { setEditingItem(item); setShowAddModal(true) }
  const openAdd = (location) => {
    setEditingItem({ storage_location: location || inventoryLocation })
    setShowAddModal(true)
  }

  const lowStockCount = items.filter(i => i.commonly_used === 1 && i.quantity < i.low_stock_threshold).length

  const today = new Date(); today.setHours(0,0,0,0)
  const threeDays = new Date(today); threeDays.setDate(today.getDate() + 3)
  const expiringSoonCount = items.filter(i => {
    if (!i.expiration_date) return false
    const exp = new Date(i.expiration_date); exp.setHours(0,0,0,0)
    return exp <= threeDays
  }).length

  if (!householdCode || isSwitching) return (
    <HouseholdSetup
      onComplete={handleHouseholdComplete}
      isSwitching={isSwitching}
      currentCode={householdCode}
    />
  )

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
            onIncrement={incrementItem}
            onEdit={openEdit}
            onDelete={deleteItem}
            onAdd={openAdd}
            onAddToGrocery={addToGroceryList}
            groceryLists={groceryLists}
            lowStockCount={lowStockCount}
            expiringSoonCount={expiringSoonCount}
            onImportComplete={fetchItems}
            householdCode={householdCode}
            onSwitchHousehold={handleSwitchHousehold}
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
            onRestockAll={restockAllChecked}
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
        groceryCount={groceryItems.filter(i => !i.checked && i.list_id).length}
        lowStockCount={lowStockCount}
        expiringSoonCount={expiringSoonCount}
      />

      {showAddModal && (
        <AddItemModal
          item={editingItem}
          groceryLists={groceryLists}
          onSave={saveItem}
          onClose={() => { setShowAddModal(false); setEditingItem(null) }}
        />
      )}

      {pendingRestock && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPendingRestock(null)} />
          <div className="relative bg-white rounded-t-3xl shadow-lift w-full max-w-lg p-6 animate-slide-up">
            <div className="flex justify-center mb-1"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
            <h3 className="font-display text-lg font-bold text-gray-900 mt-3 mb-1">Already in inventory?</h3>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-semibold text-gray-800">{pendingRestock.groceryItem.name}</span> looks like it might match{' '}
              <span className="font-semibold text-gray-800">{pendingRestock.possibleMatch.name}</span>{' '}
              ({pendingRestock.possibleMatch.quantity} {pendingRestock.possibleMatch.unit} in {pendingRestock.possibleMatch.storage_location}).
            </p>
            <div className="space-y-2">
              <button onClick={() => confirmMergeRestock(pendingRestock.possibleMatch.id)}
                className="w-full py-3.5 bg-forest text-white rounded-2xl font-bold text-sm">
                ＋ Add to existing ({pendingRestock.possibleMatch.quantity + pendingRestock.groceryItem.quantity} {pendingRestock.possibleMatch.unit} total)
              </button>
              <button onClick={() => confirmMergeRestock(null)}
                className="w-full py-3.5 bg-cream text-gray-700 rounded-2xl font-semibold text-sm">
                Create separate entry
              </button>
              <button onClick={() => setPendingRestock(null)}
                className="w-full py-3 text-gray-400 text-sm font-medium">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
