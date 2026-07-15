import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  BRAND_NAME,
  BRAND_TAGLINE,
  TRUST_SYNOPSIS,
  bytesToBase64,
  loadBrandLogo,
} from './brand'
import {
  type ExportDocument,
  type ExportTableRow,
  type SummaryGroup,
  exportFilename,
} from './export-data'

const PDF_MARGIN = 14
const PDF_LOGO_SIZE = 14 // mm
const PDF_SUMMARY_FONT = 10
const PDF_TABLE_FONT = 9
const PDF_TABLE_FONT_WIDE = 8
const PDF_CAPTION_FONT = 10

/** jsPDF built-in fonts are Latin-1 only. */
function pdfText(text: string): string {
  return text
    .replace(/→/g, '->')
    .replace(/—/g, '-')
    .replace(/[^\x00-\xFF]/g, '')
}

function pdfColumnWidths(columnCount: number, tableWidth: number): Record<number, { cellWidth: number }> {
  const widthsByCount: Record<number, number[]> = {
    2: [0.38, 0.62],
    4: [0.08, 0.3, 0.3, 0.32],
    5: [0.07, 0.23, 0.23, 0.23, 0.24],
    6: [0.06, 0.18, 0.14, 0.14, 0.2, 0.28],
  }
  const ratios = widthsByCount[columnCount] ?? Array.from({ length: columnCount }, () => 1 / columnCount)
  return Object.fromEntries(ratios.map((ratio, index) => [index, { cellWidth: tableWidth * ratio }]))
}

function addPdfHeading(doc: jsPDF, y: number, margin: number, title: string, options: { level?: 2 | 3 } = {}): number {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (y > pageHeight - margin - 16) {
    doc.addPage()
    y = margin
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(options.level === 3 ? 10 : 12)
  doc.setTextColor(0)
  doc.text(pdfText(title), margin, y)
  return y + (options.level === 3 ? 5 : 7)
}

function addPdfBrandHeader(doc: jsPDF, y: number, margin: number, logoBytes: Uint8Array | null): number {
  const textX = margin + (logoBytes ? PDF_LOGO_SIZE + 3 : 0)

  if (logoBytes) {
    doc.addImage(bytesToBase64(logoBytes), 'PNG', margin, y - 1, PDF_LOGO_SIZE, PDF_LOGO_SIZE)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text(pdfText(BRAND_NAME), textX, y + 5)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(80)
  doc.text(pdfText(BRAND_TAGLINE), textX, y + 10)
  doc.setTextColor(0)

  return y + PDF_LOGO_SIZE + 4
}

function addPdfBulletList(
  doc: jsPDF,
  y: number,
  margin: number,
  pageWidth: number,
  bullets: readonly string[],
): number {
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(40)

  const bulletIndent = 4
  const lineHeight = 4.2
  const maxWidth = pageWidth - margin * 2 - bulletIndent

  for (const bullet of bullets) {
    const lines = doc.splitTextToSize(pdfText(`- ${bullet}`), maxWidth)
    if (y + lines.length * lineHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
    doc.text(lines, margin + bulletIndent, y)
    y += lines.length * lineHeight + 1.5
  }

  doc.setTextColor(0)
  return y + 4
}

/** Split at span captions so milestone notes are full-width text, not a narrow first column. */
function splitExportRows(rows: ExportTableRow[]): { caption?: string; rows: string[][] }[] {
  const sections: { caption?: string; rows: string[][] }[] = [{ rows: [] }]
  for (const row of rows) {
    if (row.kind === 'span') {
      sections.push({ caption: row.text, rows: [] })
      continue
    }
    sections[sections.length - 1].rows.push(row.cells)
  }
  return sections.filter((section) => section.rows.length > 0 || section.caption)
}

function renderPdfTableChunk(
  doc: jsPDF,
  y: number,
  margin: number,
  headers: string[],
  rows: string[][],
  options: { fontSize: number; showHead: boolean },
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const tableWidth = pageWidth - margin * 2

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    tableWidth,
    head: options.showHead ? [headers.map(pdfText)] : [],
    body: rows.map((row) => row.map(pdfText)),
    styles: {
      fontSize: options.fontSize,
      cellPadding: 1.2,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      fillColor: [47, 119, 117],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: pdfColumnWidths(headers.length, tableWidth),
    didDrawPage: (data) => {
      if (data.pageNumber > 1 && data.cursor?.y) {
        data.cursor.y = Math.max(data.cursor.y, margin)
      }
    },
  })

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
}

function renderPdfCaption(doc: jsPDF, y: number, margin: number, pageWidth: number, caption: string): number {
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFont('helvetica', 'bolditalic')
  doc.setFontSize(PDF_CAPTION_FONT)
  doc.setTextColor(60)
  const lines = doc.splitTextToSize(pdfText(caption), pageWidth - margin * 2)
  if (y + lines.length * 4 > pageHeight - margin) {
    doc.addPage()
    y = margin
  }
  doc.text(lines, margin, y)
  doc.setTextColor(0)
  return y + lines.length * 4 + 3
}

function renderPdfTable(
  doc: jsPDF,
  y: number,
  margin: number,
  table: { headers: string[]; rows: ExportTableRow[] },
  options: { fontSize: number },
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const sections = splitExportRows(table.rows)

  for (const section of sections) {
    if (section.caption) {
      y = renderPdfCaption(doc, y, margin, pageWidth, section.caption)
    }
    if (section.rows.length === 0) continue
    y = renderPdfTableChunk(doc, y, margin, table.headers, section.rows, {
      fontSize: options.fontSize,
      showHead: true,
    })
  }

  return y
}

function addPdfFootnote(
  doc: jsPDF,
  y: number,
  margin: number,
  pageWidth: number,
  footnote: string,
): number {
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(80)
  const lines = doc.splitTextToSize(pdfText(footnote), pageWidth - margin * 2)
  const pageHeight = doc.internal.pageSize.getHeight()
  if (y + lines.length * 3.5 > pageHeight - margin) {
    doc.addPage()
    y = margin
  }
  doc.text(lines, margin, y)
  doc.setTextColor(0)
  return y + lines.length * 3.5 + 6
}

function renderPdfSummaryGroup(doc: jsPDF, y: number, margin: number, pageWidth: number, group: SummaryGroup): number {
  y = addPdfHeading(doc, y, margin, group.title)

  const sections = group.subsections ?? [{ title: '', items: group.items ?? [] }]
  for (const section of sections) {
    if (section.title) {
      y = addPdfHeading(doc, y, margin, section.title, { level: 3 })
    }
    y = renderPdfTable(
      doc,
      y,
      margin,
      {
        headers: ['Item', 'Value'],
        rows: section.items.map((row) => ({
          kind: 'data' as const,
          cells: [row.label, row.value],
        })),
      },
      { fontSize: PDF_SUMMARY_FONT },
    )
  }

  if (group.footnote) {
    y = addPdfFootnote(doc, y, margin, pageWidth, group.footnote)
  }

  return y
}

export async function downloadPdfReport(documentData: ExportDocument): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const logoBytes = await loadBrandLogo()
  let y = PDF_MARGIN

  y = addPdfBrandHeader(doc, y, PDF_MARGIN, logoBytes)
  y += 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(pdfText(documentData.title), PDF_MARGIN, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80)
  doc.text(pdfText(`Generated ${documentData.generatedAt}`), PDF_MARGIN, y)
  y += 5
  doc.text(pdfText(documentData.disclaimer), PDF_MARGIN, y)
  y += 8
  doc.setTextColor(0)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const synopsisLines = doc.splitTextToSize(pdfText(TRUST_SYNOPSIS), pageWidth - PDF_MARGIN * 2)
  doc.text(synopsisLines, PDF_MARGIN, y)
  y += synopsisLines.length * 4.5 + 6

  y = addPdfBulletList(doc, y, PDF_MARGIN, pageWidth, documentData.overviewBullets)

  if (documentData.warning) {
    y = addPdfHeading(doc, y, PDF_MARGIN, 'Warning')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const warningLines = doc.splitTextToSize(pdfText(documentData.warning), pageWidth - PDF_MARGIN * 2)
    doc.text(warningLines, PDF_MARGIN, y)
    y += warningLines.length * 4.5 + 6
  }

  y = addPdfHeading(doc, y, PDF_MARGIN, 'Summary')
  for (const group of documentData.summaryGroups) {
    if (group.title === 'Accounts') {
      doc.addPage()
      y = PDF_MARGIN
    }
    y = renderPdfSummaryGroup(doc, y, PDF_MARGIN, pageWidth, group)
  }

  y = addPdfHeading(doc, y, PDF_MARGIN, 'Calculations')

  for (const table of documentData.tables) {
    if (table.title === 'Trump account' || table.title === 'Brokerage') {
      doc.addPage()
      y = PDF_MARGIN
    }

    y = addPdfHeading(doc, y, PDF_MARGIN, table.title)
    y = renderPdfTable(
      doc,
      y,
      PDF_MARGIN,
      { headers: table.headers, rows: table.rows },
      { fontSize: table.headers.length >= 6 ? PDF_TABLE_FONT_WIDE : PDF_TABLE_FONT },
    )
    if (table.footnote) {
      y = addPdfFootnote(doc, y, PDF_MARGIN, pageWidth, table.footnote)
    }
  }

  doc.save(`${exportFilename()}.pdf`)
}
