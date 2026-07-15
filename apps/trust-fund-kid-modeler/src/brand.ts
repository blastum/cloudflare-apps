export const BRAND_NAME = 'Smirking Cat Software'
export const BRAND_TAGLINE = 'Separate-share Crummey funding model'

export const TRUST_SYNOPSIS =
  'Use a trust to create a brokerage and a Trump account for your child.'

/** Shared trust description — web hero, browser print, and PDF. */
export const TRUST_ATTRIBUTES = [
  'Separate-share irrevocable trust with Crummey withdrawal provisions',
  'Utilizes the annual gift tax exclusion',
  'Funds the Trump account maximally through age 17',
  'Funds a brokerage account strictly for making Trump account contributions.',
  'Brokerage sub-account for post-18 trustee discretion',
  'Annual exclusion gifting with inflation-indexed waterfall',
  'Extensible to multiple beneficiaries, each with a dedicated separate share',
] as const

export const TRUST_WEB_ATTRIBUTES = [
  ...TRUST_ATTRIBUTES,
  'All calculations run in your browser',
] as const

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
