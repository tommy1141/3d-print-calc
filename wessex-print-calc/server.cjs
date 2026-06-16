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

app.patch('/api/invoices/:invoiceNo', (req, res) => {
  const invoices = readInvoices()
  const inv = invoices.find(i => i.invoiceNo === req.params.invoiceNo)
  if (!inv) return res.status(404).json({ error: 'Not found' })
  inv.paid = req.body.paid
  writeInvoices(invoices)
  res.json({ ok: true, paid: inv.paid })
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

// ── Quotes ────────────────────────────────────────────────────────
const QUOTES_FILE = join(DATA_DIR, 'quotes.json')

function readQuotes() {
  if (!existsSync(QUOTES_FILE)) return []
  try { return JSON.parse(readFileSync(QUOTES_FILE, 'utf8')) } catch { return [] }
}
function writeQuotes(quotes) {
  writeFileSync(QUOTES_FILE, JSON.stringify(quotes, null, 2))
}
function nextQuoteNo() {
  const quotes = readQuotes()
  const max = quotes.reduce((h, q) => {
    const n = parseInt((q.quoteNo || '').replace('QUO-', ''), 10)
    return isNaN(n) ? h : Math.max(h, n)
  }, 0)
  return 'QUO-' + String(max + 1).padStart(5, '0')
}

app.get('/api/quotes', (_req, res) => res.json(readQuotes()))

app.post('/api/quotes', (req, res) => {
  const quoteNo = nextQuoteNo()
  const date    = new Date().toLocaleDateString('en-GB')
  const quote   = { ...req.body, quoteNo, date, savedAt: new Date().toISOString(), status: 'pending' }
  const quotes  = readQuotes()
  quotes.unshift(quote)
  writeQuotes(quotes)
  res.json({ ok: true, quoteNo, date })
})

app.patch('/api/quotes/:quoteNo', (req, res) => {
  const quotes = readQuotes()
  const q = quotes.find(q => q.quoteNo === req.params.quoteNo)
  if (!q) return res.status(404).json({ error: 'Not found' })
  Object.assign(q, req.body)
  writeQuotes(quotes)
  res.json({ ok: true })
})

app.delete('/api/quotes/:quoteNo', (req, res) => {
  writeQuotes(readQuotes().filter(q => q.quoteNo !== req.params.quoteNo))
  res.json({ ok: true })
})

// ── Delivery Notes ────────────────────────────────────────────────
const DELIVERY_NOTES_FILE = join(DATA_DIR, 'delivery-notes.json')

function readDeliveryNotes() {
  if (!existsSync(DELIVERY_NOTES_FILE)) return []
  try { return JSON.parse(readFileSync(DELIVERY_NOTES_FILE, 'utf8')) } catch { return [] }
}
function writeDeliveryNotes(notes) {
  writeFileSync(DELIVERY_NOTES_FILE, JSON.stringify(notes, null, 2))
}
function nextDeliveryNo() {
  const notes = readDeliveryNotes()
  const max = notes.reduce((h, n) => {
    const num = parseInt((n.deliveryNo || '').replace('DN-', ''), 10)
    return isNaN(num) ? h : Math.max(h, num)
  }, 0)
  return 'DN-' + String(max + 1).padStart(5, '0')
}

app.get('/api/delivery-notes', (_req, res) => res.json(readDeliveryNotes()))

app.post('/api/delivery-notes', (req, res) => {
  const deliveryNo = nextDeliveryNo()
  const date       = new Date().toLocaleDateString('en-GB')
  const dn         = { ...req.body, deliveryNo, date, savedAt: new Date().toISOString() }
  const notes      = readDeliveryNotes()
  notes.unshift(dn)
  writeDeliveryNotes(notes)
  // Atomically link the source quote to this DN
  if (req.body.quoteNo) {
    const quotes = readQuotes()
    const q = quotes.find(q => q.quoteNo === req.body.quoteNo)
    if (q) { q.convertedToDelivery = deliveryNo; writeQuotes(quotes) }
  }
  res.json({ ok: true, deliveryNo, date })
})

app.delete('/api/delivery-notes/:deliveryNo', (req, res) => {
  writeDeliveryNotes(readDeliveryNotes().filter(n => n.deliveryNo !== req.params.deliveryNo))
  res.json({ ok: true })
})

app.post('/api/delivery-notes/:deliveryNo/convert', (req, res) => {
  const notes = readDeliveryNotes()
  const dn = notes.find(n => n.deliveryNo === req.params.deliveryNo)
  if (!dn) return res.status(404).json({ error: 'Not found' })
  const invoiceNo = nextInvoiceNo()
  const date      = new Date().toLocaleDateString('en-GB')
  const invoice   = { ...dn, invoiceNo, date, savedAt: new Date().toISOString(), paid: false }
  delete invoice.convertedToInvoice
  const invoices = readInvoices()
  invoices.unshift(invoice)
  writeInvoices(invoices)
  dn.convertedToInvoice = invoiceNo
  writeDeliveryNotes(notes)
  res.json({ ok: true, invoiceNo, date })
})

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
