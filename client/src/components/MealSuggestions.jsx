import { apiFetch } from '../api'
import { useState } from 'react'

const TAG_COLORS = {
  'high-protein': 'bg-forest/10 text-forest',
  'low-carb': 'bg-amber/20 text-amber-dark',
  'vegetarian': 'bg-sage/20 text-sage',
  'low-calorie': 'bg-frost/20 text-frost-dark',
  'quick': 'bg-terra/10 text-terra',
  default: 'bg-gray-100 text-gray-600'
}

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { id: 'lunch',     label: 'Lunch',     emoji: '🥗' },
  { id: 'dinner',    label: 'Dinner',    emoji: '🍽️' },
  { id: 'snack',     label: 'Snack',     emoji: '🍎' },
  { id: 'dessert',   label: 'Dessert',   emoji: '🍓' },
]

export default function MealSuggestions({ items }) {
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [mealType, setMealType] = useState('dinner')

  const availableItems = items.filter(i => i.quantity > 0)

  const fetchSuggestions = async (type = mealType) => {
    if (availableItems.length === 0) return
    setLoading(true)
    setError(null)
    setMeals([])
    setExpanded(null)

    try {
      const res = await apiFetch('/api/meals/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: availableItems, mealType: type })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to fetch suggestions')
      }
      const data = await res.json()
      setMeals(data.meals || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-4 sticky top-0 z-30 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">💡 Meal Ideas</h1>
        <p className="text-sm text-gray-400 mb-3">
          AI suggestions based on your {availableItems.length} available items
        </p>
        {/* Meal type selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {MEAL_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => {
                setMealType(type.id)
                if (meals.length > 0) fetchSuggestions(type.id)
              }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all
                ${mealType === type.id
                  ? 'bg-forest text-white shadow-sm'
                  : 'bg-cream-dark text-gray-500 active:scale-95'}`}
            >
              <span>{type.emoji}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-container px-4 pt-4 pb-4">
        {/* Dietary tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['High Protein', 'Low GI', 'Pre-diabetes Friendly', 'Vegetarian Options'].map(tag => (
            <span key={tag} className="tag bg-forest/10 text-forest text-xs">{tag}</span>
          ))}
        </div>

        {/* Generate button */}
        {meals.length === 0 && !loading && (
          <div className="text-center py-8 animate-fade-in">
            <div className="w-24 h-24 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="text-5xl">{MEAL_TYPES.find(t => t.id === mealType)?.emoji}</span>
            </div>
            <h3 className="font-display text-xl font-bold text-gray-900 mb-2">What's for {mealType}?</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
              Get personalized high-protein, low-carb {mealType} ideas based on what you have at home.
            </p>
            {availableItems.length === 0 ? (
              <p className="text-terra text-sm font-medium">Add items to your inventory first</p>
            ) : (
              <button
                onClick={() => fetchSuggestions(mealType)}
                className="btn-primary px-8 py-4 text-base shadow-lift"
              >
                ✨ Generate {MEAL_TYPES.find(t => t.id === mealType)?.label} Ideas
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 animate-fade-in">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-forest/20 border-t-forest rounded-full animate-spin" />
              <p className="text-gray-500 font-medium">Crafting meal ideas…</p>
              <p className="text-gray-400 text-sm">Checking what you have and what's healthy</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4 animate-fade-in">
            <p className="text-red-600 font-semibold text-sm mb-1">Couldn't generate suggestions</p>
            <p className="text-red-400 text-xs">{error}</p>
            <button onClick={fetchSuggestions} className="mt-3 text-sm font-bold text-forest">Try again →</button>
          </div>
        )}

        {/* Meal cards */}
        {meals.length > 0 && (
          <>
            <div className="space-y-3 mb-4">
              {meals.map((meal, idx) => (
                <MealCard
                  key={idx}
                  meal={meal}
                  isExpanded={expanded === idx}
                  onToggle={() => setExpanded(expanded === idx ? null : idx)}
                />
              ))}
            </div>
            <button
              onClick={() => fetchSuggestions(mealType)}
              className="w-full py-3 bg-cream-dark text-forest font-semibold rounded-2xl text-sm active:scale-95 transition-transform"
            >
              🔄 Regenerate {MEAL_TYPES.find(t => t.id === mealType)?.label} ideas
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function MealCard({ meal, isExpanded, onToggle }) {
  const tagColor = (tag) => {
    const key = tag.toLowerCase().replace(/\s+/g, '-')
    return TAG_COLORS[key] || TAG_COLORS.default
  }

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden animate-fade-in">
      <button onClick={onToggle} className="w-full text-left p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-display font-bold text-gray-900 text-lg leading-tight">{meal.name}</h3>
              {meal.isVegetarian && <span className="text-xs">🌱</span>}
            </div>
            <p className="text-gray-500 text-sm leading-snug">{meal.description}</p>
          </div>
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`w-5 h-5 text-gray-400 flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mt-3">
          <span className="tag bg-cream-dark text-gray-600">⏱ {meal.prepTime}</span>
          <span className="tag bg-cream-dark text-gray-600">🔥 {meal.calories}</span>
          <span className="tag bg-forest/10 text-forest">💪 {meal.protein}</span>
        </div>

        {/* Tags */}
        {meal.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {meal.tags.map(tag => (
              <span key={tag} className={`tag text-xs ${tagColor(tag)}`}>{tag}</span>
            ))}
          </div>
        )}
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-4 pt-3 pb-4 space-y-3 animate-fade-in">
          {/* Ingredients */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-bold text-forest uppercase tracking-wider mb-2">✅ You Have</p>
              <ul className="space-y-1">
                {meal.availableIngredients?.map(ing => (
                  <li key={ing} className="text-sm text-gray-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-forest/50 flex-shrink-0" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
            {meal.neededIngredients?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-terra uppercase tracking-wider mb-2">🛒 Need to Buy</p>
                <ul className="space-y-1">
                  {meal.neededIngredients.map(ing => (
                    <li key={ing} className="text-sm text-gray-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-terra/50 flex-shrink-0" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Instructions */}
          {meal.instructions && (
            <div className="bg-cream rounded-xl p-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">How to Make It</p>
              {Array.isArray(meal.instructions) ? (
                <ol className="space-y-1.5">
                  {meal.instructions.map((step, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-forest/15 text-forest text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed">{meal.instructions}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
