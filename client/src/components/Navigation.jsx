export default function Navigation({ activeTab, setActiveTab, groceryCount, lowStockCount }) {
  const tabs = [
    {
      id: 'inventory',
      label: 'Inventory',
      icon: (active) => (
        <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
          <line x1="12" y1="12" x2="12" y2="16" strokeLinecap="round" />
          <line x1="10" y1="14" x2="14" y2="14" strokeLinecap="round" />
        </svg>
      ),
      badge: lowStockCount
    },
    {
      id: 'grocery',
      label: 'Grocery',
      icon: (active) => (
        <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h13" />
          <circle cx="9" cy="21" r="1" fill="currentColor" />
          <circle cx="20" cy="21" r="1" fill="currentColor" />
        </svg>
      ),
      badge: groceryCount
    },
    {
      id: 'meals',
      label: 'Meal Ideas',
      icon: (active) => (
        <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8 2 5 5.5 5 9c0 2.4 1.1 4.5 2.8 5.9L9 21h6l1.2-6.1C17.9 13.5 19 11.4 19 9c0-3.5-3-7-7-7z" />
          <line x1="12" y1="9" x2="12" y2="15" strokeLinecap="round" />
        </svg>
      ),
      badge: null
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-40">
      <div className="flex items-stretch h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors duration-150
                ${active ? 'text-forest' : 'text-gray-400'}`}
            >
              <div className="relative">
                {tab.icon(active)}
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-terra text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold ${active ? 'text-forest' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-forest rounded-b-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
