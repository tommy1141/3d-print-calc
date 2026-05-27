import type { InvItem } from '@/types'

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const INVOICE_STYLES = `
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Segoe UI',sans-serif; color:#1a1a2e; background:#fff; padding:48px; font-size:14px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; }
  .biz-name { font-size:24px; font-weight:700; color:#e94560; }
  .biz-sub  { color:#666; font-size:12px; margin-top:2px; }
  .inv-meta { text-align:right; }
  .inv-meta h2 { font-size:20px; font-weight:700; }
  .inv-meta p  { color:#666; font-size:12px; margin-top:2px; }
  .parties { display:flex; gap:40px; margin-bottom:36px; }
  .party h3 { font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#999; margin-bottom:6px; }
  .party p  { font-size:14px; font-weight:600; }
  table { width:100%; border-collapse:collapse; margin-bottom:24px; }
  thead tr { background:#1a1a2e; color:#fff; print-color-adjust:exact; -webkit-print-color-adjust:exact; }
  thead th { padding:10px 14px; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.06em; }
  tbody tr:nth-child(even) { background:#f5f7fb; print-color-adjust:exact; -webkit-print-color-adjust:exact; }
  tbody td { padding:10px 14px; border-bottom:1px solid #e8ecf2; }
  .amount { text-align:right; }
  .totals { margin-left:auto; width:260px; border-collapse:collapse; }
  .totals td { padding:7px 4px; }
  .totals .lbl { color:#555; }
  .totals .val { text-align:right; font-weight:600; }
  .totals .grand td { font-size:17px; font-weight:700; color:#e94560; border-top:2px solid #e94560; padding-top:10px; }
  .footer { margin-top:48px; border-top:1px solid #eee; padding-top:16px; color:#aaa; font-size:11px; text-align:center; }
  @media print { .no-print { display:none; } body { padding:24px; } }
  @page { margin: 0; }
`

export function useInvoice() {
  function generateInvoice(items: InvItem[], business: string, customer: string) {
    if (items.length === 0) {
      alert('Please add at least one item to the order first.')
      return
    }

    const biz        = escHtml(business || 'My 3D Print Shop')
    const cust       = escHtml(customer || 'Customer')
    const date       = new Date().toLocaleDateString('en-GB')
    const invoiceNo  = 'INV-' + Date.now().toString().slice(-6)
    const grandTotal = items.reduce((sum, item) => sum + item.sellingPrice, 0)
    const rows       = items
      .map(item => `<tr><td>${escHtml(item.job)}</td><td class="amount">£${item.sellingPrice.toFixed(2)}</td></tr>`)
      .join('')

    const win = window.open('', '_blank')
    if (!win) return

    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice ${invoiceNo}</title>
  <style>${INVOICE_STYLES}</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="biz-name">${biz}</div>
      <div class="biz-sub">3D Printing Services</div>
    </div>
    <div class="inv-meta">
      <h2>INVOICE</h2>
      <p>${invoiceNo}</p>
      <p>${date}</p>
    </div>
  </div>
  <div class="parties">
    <div class="party"><h3>From</h3><p>${biz}</p></div>
    <div class="party"><h3>Bill To</h3><p>${cust}</p></div>
  </div>
  <table>
    <thead><tr><th>Description</th><th class="amount">&pound; Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <table class="totals">
    <tr class="grand"><td class="lbl">Total Due</td><td class="val">&pound;${grandTotal.toFixed(2)}</td></tr>
  </table>
  <div class="footer">Thank you for your order!</div>
  <br/>
  <div class="no-print" style="text-align:center;">
    <button onclick="window.print()" style="padding:12px 32px;background:#e94560;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>`)
    win.document.close()
  }

  return { generateInvoice }
}
