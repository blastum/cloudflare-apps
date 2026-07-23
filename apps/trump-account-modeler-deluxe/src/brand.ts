export const BRAND_NAME = 'Smirking Cat Software'
export const BRAND_TAGLINE = 'What will they do with all that money?'

export const APP_SYNOPSIS =
  'Prefund a brokerage with the lump sum that pays every Trump contribution and ends at zero, then project the Trump account through age 18 and long-term IRA growth.'

const LOGO_URL = '/public/images/smirk-cat.png'

let logoPromise: Promise<Uint8Array | null> | undefined

export async function loadBrandLogo(): Promise<Uint8Array | null> {
  if (!logoPromise) {
    logoPromise = fetch(LOGO_URL)
      .then(async (response) => (response.ok ? new Uint8Array(await response.arrayBuffer()) : null))
      .catch(() => null)
  }
  return logoPromise
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 8192
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}
