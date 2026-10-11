// Minimal, valid single-page PDF generator (ASCII only) so downloads are real
// PDF payloads without pulling in a heavy dependency.
export function createPdf(title: string, lines: string[]): string {
  const escape = (s: string) => s.replace(/([\\()])/g, '\\$1');
  const content = [
    'BT',
    '/F1 20 Tf',
    '72 748 Td',
    `(${escape(title)}) Tj`,
    'ET',
    'BT',
    '/F1 11 Tf',
    '72 716 Td',
    '16 TL',
    ...lines.slice(0, 44).map((l) => `(${escape(l)}) Tj T*`),
    'ET',
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const off of offsets) {
    pdf += `${off.toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}
