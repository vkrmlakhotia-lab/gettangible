export interface PostcodeResult {
  postcode: string
  line1: string
  city: string
  countryCode: 'GB'
}

export async function lookupPostcode(postcode: string): Promise<PostcodeResult> {
  const cleaned = postcode.replace(/\s+/g, '').toUpperCase()
  const res = await fetch(`https://api.postcodes.io/postcodes/${cleaned}`)
  if (!res.ok) throw new Error('Postcode not found')
  const { result } = await res.json()
  return {
    postcode: result.postcode,
    line1: [result.thoroughfare, result.post_town].filter(Boolean).join(', ') || result.admin_district,
    city: result.admin_district,
    countryCode: 'GB',
  }
}
