import type { BuiltReport } from './report-builders';

function escapeCsvCell(value: string | number): string {
  const raw = String(value ?? '');
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

/** UTF-8 CSV download labelled as Excel-compatible export. */
export function exportReportCsv(
  report: BuiltReport,
  columnLabels: Record<string, string>,
  filenameBase: string,
): void {
  const header = report.columns.map((col) => escapeCsvCell(columnLabels[col.key] ?? col.key));
  const lines = [
    header.join(','),
    ...report.rows.map((row) =>
      report.columns.map((col) => escapeCsvCell(row[col.key] ?? '')).join(','),
    ),
  ];
  // BOM helps Excel recognise UTF-8
  const csv = `\uFEFF${lines.join('\n')}`;
  downloadBlob(
    `${filenameBase}.csv`,
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
  );
}

/** Printable HTML blob + optional window.print for lightweight PDF export. */
export function exportReportPdf(
  report: BuiltReport,
  options: {
    title: string;
    columnLabels: Record<string, string>;
    summaryLabel: string;
    sessionsLabel: string;
    hoursLabel: string;
    kmLabel: string;
    generatedLabel: string;
    filenameBase: string;
  },
): void {
  const rowsHtml = report.rows
    .map((row) => {
      const cells = report.columns
        .map((col) => `<td>${escapeHtml(String(row[col.key] ?? ''))}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const headersHtml = report.columns
    .map((col) => `<th>${escapeHtml(options.columnLabels[col.key] ?? col.key)}</th>`)
    .join('');

  const hours = (report.summary.workingDurationMs / 3_600_000).toFixed(2);
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(options.title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; color: #111; }
    h1 { font-size: 20px; margin: 0 0 8px; }
    .meta { color: #555; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #f3f3f3; }
    @media print {
      body { margin: 12mm; }
      a { display: none; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(options.title)}</h1>
  <p class="meta">${escapeHtml(options.generatedLabel)}: ${escapeHtml(report.generatedAt)}</p>
  <p class="meta">${escapeHtml(options.summaryLabel)} —
    ${escapeHtml(options.sessionsLabel)}: ${report.summary.sessions};
    ${escapeHtml(options.hoursLabel)}: ${hours};
    ${escapeHtml(options.kmLabel)}: ${report.summary.totalKm}
  </p>
  <table>
    <thead><tr>${headersHtml}</tr></thead>
    <tbody>${rowsHtml || `<tr><td colspan="${report.columns.length}">—</td></tr>`}</tbody>
  </table>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (!printWindow) {
    downloadBlob(`${options.filenameBase}.html`, blob);
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
