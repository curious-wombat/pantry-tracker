import { useState } from 'react'
import { setHouseholdCode } from '../api'

export default function HouseholdSetup({ onComplete, isSwitching = false, currentCode = '' }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const cleaned = code.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '')
    if (!cleaned || cleaned.length < 2) {
      setError('Code must be at least 2 characters (letters, numbers, hyphens)')
      return
    }
    setHouseholdCode(cleaned)
    await fetch('/api/lists/bootstrap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Household-Code': cleaned }
    })
    onComplete(cleaned)
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🥬</div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
            {isSwitching ? 'Switch Household' : 'Pantry Panda'}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {isSwitching
              ? <>Currently in <span className="font-semibold text-forest">{currentCode}</span>. Enter a code to switch.</>
              : <>Enter a household code to access your pantry.<br />Share the same code with housemates.</>
            }
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lift p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
              Household Code
            </label>
            <input
              type="text"
              placeholder={isSwitching ? 'Enter a code…' : 'e.g. test-house'}
              value={code}
              onChange={e => { setCode(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoFocus
              className="input-field text-lg font-semibold"
            />
            {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
            <p className="text-gray-400 text-xs mt-1.5">
              Letters, numbers, and hyphens only. Not case-sensitive.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!code.trim()}
            className="w-full py-4 bg-forest text-white rounded-2xl font-bold text-base shadow-md disabled:opacity-40 active:scale-98 transition-all">
            {isSwitching ? 'Switch →' : 'Enter Pantry →'}
          </button>

          {isSwitching && (
            <button onClick={() => onComplete(currentCode)}
              className="w-full py-3 text-gray-500 text-sm font-semibold rounded-2xl bg-cream active:scale-98 transition-all">
              Cancel — stay in {currentCode}
            </button>
          )}
        </div>

        {!isSwitching && (
          <p className="text-center text-gray-400 text-xs mt-6 leading-relaxed">
            New household? Just pick a code and go.<br />
            Existing household? Use the same code as your housemates.
          </p>
        )}
      </div>
    </div>
  )
}
