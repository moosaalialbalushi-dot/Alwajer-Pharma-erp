// exportUtils.ts
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data?.length) return;

  const headers = Object.keys(data[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return /[,"\n\r]/.test(s) ? `"${s}"` : s;
  };

  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => escape(row[h])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `${filename}_${new Date().toISOString().slice(0, 10)}.csv`,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
