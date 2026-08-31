import { downloadPdfReport as downloadSharedPdf } from '../../../shared/pdf'
import { BRAND_NAME, BRAND_TAGLINE, TRUST_SYNOPSIS, loadBrandLogo } from './brand'
import { exportFilename, type ExportDocument } from './export-data'

export async function downloadPdfReport(documentData: ExportDocument): Promise<void> {
  await downloadSharedPdf(documentData, {
    brand: {
      name: BRAND_NAME,
      tagline: BRAND_TAGLINE,
      synopsis: TRUST_SYNOPSIS,
      loadLogo: loadBrandLogo,
    },
    filename: `${exportFilename()}.pdf`,
  })
}
