import { useCompany } from './useCompany'

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
  .party-detail { font-size:12px; color:#666; margin-top:2px; white-space:pre-line; }
  .bank-section { margin-top:24px; padding:12px 14px; background:#f8f8fb; border-radius:6px; border:1px solid #e0e4f0; }
  .bank-label { font-size:10px; text-transform:uppercase; letter-spacing:0.08em; color:#999; font-weight:600; margin-bottom:6px; }
  .bank-row { display:flex; flex-wrap:wrap; gap:8px 24px; font-size:12px; color:#333; }
  .footer { margin-top:48px; border-top:1px solid #eee; padding-top:16px; color:#aaa; font-size:11px; text-align:center; }
  @media print { .no-print { display:none; } body { padding:24px; } }
  @page { margin: 0; }
`

export function useInvoice() {
  function generateInvoice(
    items: { job: string; sellingPrice: number }[],
    business: string,
    customer: string,
    invoiceNo: string,
    date: string,
    showPaymentDetails = true,
  ) {
    const biz        = escHtml(business || 'My 3D Print Shop')
    const cust       = escHtml(customer || 'Customer')
    const grandTotal = items.reduce((sum, item) => sum + item.sellingPrice, 0)
    const rows       = items
      .map(item => `<tr><td>${escHtml(item.job)}</td><td class="amount">£${item.sellingPrice.toFixed(2)}</td></tr>`)
      .join('')

    const { address, email, phone, bankName, accountName, sortCode, accountNumber } = useCompany()
    const addr    = address.value.trim()
    const eml     = email.value.trim()
    const ph      = phone.value.trim()
    const bnk     = bankName.value.trim()
    const accName = accountName.value.trim()
    const sc      = sortCode.value.trim()
    const accNo   = accountNumber.value.trim()
    const hasBankDetails = bnk || accNo

    const addrHtml    = addr    ? `<div class="party-detail">${escHtml(addr)}</div>` : ''
    const emailHtml   = eml     ? `<div class="party-detail">${escHtml(eml)}</div>` : ''
    const phoneHtml   = ph      ? `<div class="party-detail">${escHtml(ph)}</div>` : ''
    const bankSection = (hasBankDetails && showPaymentDetails) ? `
  <div class="bank-section">
    <div class="bank-label">Payment Details</div>
    <div class="bank-row">
      ${bnk     ? `<span><strong>Bank:</strong> ${escHtml(bnk)}</span>` : ''}
      ${accName ? `<span><strong>Account name:</strong> ${escHtml(accName)}</span>` : ''}
      ${sc      ? `<span><strong>Sort code:</strong> ${escHtml(sc)}</span>` : ''}
      ${accNo   ? `<span><strong>Account no:</strong> ${escHtml(accNo)}</span>` : ''}
    </div>
  </div>` : ''

    const win = window.open('', '_blank')
    if (!win) return

    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${escHtml(invoiceNo)}</title>
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
      <p>${escHtml(invoiceNo)}</p>
      <p>${date}</p>
    </div>
  </div>
  <div class="parties">
    <div class="party"><h3>From</h3><p>${biz}</p>${addrHtml}${emailHtml}${phoneHtml}</div>
    <div class="party"><h3>Bill To</h3><p>${cust}</p></div>
  </div>
  <table>
    <thead><tr><th>Description</th><th class="amount">&pound; Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <table class="totals">
    <tr class="grand"><td class="lbl">Total Due</td><td class="val">&pound;${grandTotal.toFixed(2)}</td></tr>
  </table>
  ${bankSection}
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

  function generateQuote(
    items: { job: string; sellingPrice: number }[],
    business: string,
    customer: string,
    quoteNo: string,
    date: string,
  ) {
    const biz        = escHtml(business || 'My 3D Print Shop')
    const cust       = escHtml(customer || 'Customer')
    const grandTotal = items.reduce((sum, item) => sum + item.sellingPrice, 0)
    const rows       = items
      .map(item => `<tr><td>${escHtml(item.job)}</td><td class="amount">£${item.sellingPrice.toFixed(2)}</td></tr>`)
      .join('')

    const { address, email, phone } = useCompany()
    const addr  = address.value.trim()
    const eml   = email.value.trim()
    const ph    = phone.value.trim()
    const addrHtml  = addr ? `<div class="party-detail">${escHtml(addr)}</div>` : ''
    const emailHtml = eml  ? `<div class="party-detail">${escHtml(eml)}</div>` : ''
    const phoneHtml = ph   ? `<div class="party-detail">${escHtml(ph)}</div>` : ''

    const QUOTE_STYLES = INVOICE_STYLES.replace('#e94560', '#4a90d9').replace('#e94560', '#4a90d9')

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${escHtml(quoteNo)}</title>
  <style>${QUOTE_STYLES}</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="biz-name">${biz}</div>
      <div class="biz-sub">3D Printing Services</div>
    </div>
    <div class="inv-meta">
      <h2>QUOTE</h2>
      <p>${escHtml(quoteNo)}</p>
      <p>${date}</p>
    </div>
  </div>
  <div class="parties">
    <div class="party"><h3>From</h3><p>${biz}</p>${addrHtml}${emailHtml}${phoneHtml}</div>
    <div class="party"><h3>Quoted For</h3><p>${cust}</p></div>
  </div>
  <table>
    <thead><tr><th>Description</th><th class="amount">&pound; Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <table class="totals">
    <tr class="grand"><td class="lbl">Quote Total</td><td class="val">&pound;${grandTotal.toFixed(2)}</td></tr>
  </table>
  <div class="footer">This is a quote only — no payment is due until the work is confirmed.</div>
  <br/>
  <div class="no-print" style="text-align:center;">
    <button onclick="window.print()" style="padding:12px 32px;background:#4a90d9;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>`)
    win.document.close()
  }

  return { generateInvoice, generateQuote }
}
