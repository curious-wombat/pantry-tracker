module.exports = (req, res, next) => {
  const raw = req.headers['x-household-code'] || ''
  const code = raw.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '')
  if (!code) return res.status(400).json({ error: 'Missing household code. Send X-Household-Code header.' })
  req.householdCode = code
  next()
}
