const express = require('express')
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs')
const { join } = require('path')

const app = express()
app.use(express.json())

const DATA_DIR = process.env.DATA_DIR || '/data'
const INVOICES_FILE = join(DATA_DIR, 'invoices.json')

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}

function readInvoices() {
  if (!existsSync(INVOICES_FILE)) return []
  try {
    return JSON.parse(readFileSync(INVOICES_FILE, 'utf8'))
  } catch {
    return []
  }
}

function writeInvoices(invoices) {
  writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2))
}

function nextInvoiceNo() {
  const invoices = readInvoices()
  const max = invoices.reduce((highest, inv) => {
    const num = parseInt((inv.invoiceNo || '').replace('INV-', ''), 10)
    return isNaN(num) ? highest : Math.max(highest, num)
  }, 0)
  return 'INV-' + String(max + 1).padStart(5, '0')
}

app.get('/api/invoices', (_req, res) => {
  res.json(readInvoices())
})

app.delete('/api/invoices/:invoiceNo', (req, res) => {
  const invoices = readInvoices().filter(i => i.invoiceNo !== req.params.invoiceNo)
  writeInvoices(invoices)
  res.json({ ok: true })
})

app.post('/api/invoices', (req, res) => {
  const invoiceNo = nextInvoiceNo()
  const date      = new Date().toLocaleDateString('en-GB')
  const invoice   = { ...req.body, invoiceNo, date, savedAt: new Date().toISOString() }
  const invoices  = readInvoices()
  invoices.unshift(invoice)
  writeInvoices(invoices)
  res.json({ ok: true, invoiceNo, date })
})

// Settings persistence
const SETTINGS_FILE = join(DATA_DIR, 'settings.json')

app.get('/api/settings', (_req, res) => {
  if (!existsSync(SETTINGS_FILE)) return res.json({})
  try { res.json(JSON.parse(readFileSync(SETTINGS_FILE, 'utf8'))) }
  catch { res.json({}) }
})

app.put('/api/settings', (req, res) => {
  writeFileSync(SETTINGS_FILE, JSON.stringify(req.body, null, 2))
  res.json({ ok: true })
})

// Serve built Vue app
app.use(express.static(join(__dirname, 'dist')))
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 80
app.listen(PORT, () => console.log(`3D Print Calc running on port ${PORT}`))
