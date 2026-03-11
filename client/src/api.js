const getCode = () => localStorage.getItem('household_code') || ''

export const setHouseholdCode = (code) => {
  localStorage.setItem('household_code', code.trim().toLowerCase().replace(/[^a-z0-9-_]/g, ''))
}

export const getHouseholdCode = () => getCode()

export const apiFetch = (path, options = {}) => {
  const code = getCode()
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Household-Code': code,
      ...(options.headers || {})
    }
  })
}
