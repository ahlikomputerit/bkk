export const generateLaporanPDF = (
  title: string,
  data: any[] = [],
  headers: string[] = [],
  columns: (string | ((row: any) => any))[] = []
) => {
  // Build table rows (array of arrays of strings)
  const tableRows = data.map((row) =>
    columns.map((col) => {
      try {
        if (typeof col === 'function') return String(col(row) ?? '')
        const value = (col as string)
          .split('.')</p> .reduce((acc: any, k: string) => (acc ? acc[k] : undefined), row)
        return String(value ?? '')
      } catch {
        return ''
      }
    })
  )

  const escapedHeaders = headers.map((h) => escapeHtml(String(h)))
  const bodyRowsHtml = tableRows
    .map(
      (r) =>
        `<tr>${r.map((c) => `<td>${escapeHtml(String(c))}</td>`).join('')}</tr>`
    )
    .join('')

  const html = `<!doctype html>
  <html lang="id">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>${escapeHtml(title)}</title>
      <style>
        :root { color-scheme: light dark; }
        body { font-family: Arial, Helvetica, sans-serif; color: #222; padding: 16px; }
        h1 { font-size: 18px; margin: 0 0 8px 0; }
        .meta { margin-top: 4px; font-size: 12px; color: #444; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; page-break-inside: avoid; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; vertical-align: top; }
        th { background: #f6f6f6; text-align: left; }
        @media print {
          body { padding: 8mm; }
          table { page-break-after: auto; }
          tr    { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">Dicetak: ${new Date().toLocaleString()}</div>
      <table>
        <thead>
          <tr>${escapedHeaders.map((h) => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${bodyRowsHtml || `<tr><td colspan="${Math.max(1, headers.length)}">Tidak ada data</td></tr>`}
        </tbody>
      </table>
    </body>
  </html>`

  // Open new window and write HTML
  const win = window.open('', '_blank')
  if (!win) {
    // Pop-up diblokir
    // Kembali object no-op agar pemanggil tidak error
    // Pengguna diinstruksikan untuk mengizinkan pop-up.
    // (UI pemanggil bisa menampilkan toast/alert)
    return {
      save: (_delay = 250) => {
        alert('Pop-up diblokir. Izinkan pop-up untuk export/print laporan.')
      },
      close: () => {},
    }
  }

  win.document.open()
  win.document.write(html)
  win.document.close()

  // Return handler untuk memicu print (diberi delay agar resource stabil)
  return {
    save: (delay = 250) => {
      setTimeout(() => {
        try {
          win.focus()
          win.print()
        } catch (e) {
          // ignore printing errors (e.g., cross-origin restrictions)
          // caller can show fallback message
        }
      }, delay)
    },
    // optional helper to programmatically close the print window
    close: () => {
      try {
        win.close()
      } catch {
        // ignore
      }
    },
  }
}

function escapeHtml(str: string) {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return String(str).replace(/[&<>"']/g, (m) => map[m])
}

export default generateLaporanPDF
