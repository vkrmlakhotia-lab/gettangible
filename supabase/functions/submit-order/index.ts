import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PRODIGI_API_KEY = Deno.env.get('PRODIGI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShippingAddress {
  name: string
  line1: string
  line2?: string
  city: string
  postcode: string
  countryCode: string
}

interface SubmitOrderBody {
  bookId: string
  bookTitle: string
  pdfUrl: string
  pageCount: number
  shipping: ShippingAddress
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const body: SubmitOrderBody = await req.json()
  const { bookId, bookTitle, pdfUrl, pageCount, shipping } = body

  const prodigiRes = await fetch('https://api.prodigi.com/v4.0/orders', {
    method: 'POST',
    headers: {
      'X-API-Key': PRODIGI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shippingMethod: 'Budget',
      recipient: {
        name: shipping.name,
        address: {
          line1: shipping.line1,
          line2: shipping.line2 || undefined,
          postalOrZipCode: shipping.postcode,
          townOrCity: shipping.city,
          countryCode: shipping.countryCode,
        },
      },
      items: [{
        merchantReference: bookId,
        sku: 'BOOK-FE-A4-L-HARD-G',
        copies: 1,
        sizing: 'fillPrintArea',
        assets: [{
          printArea: 'default',
          url: pdfUrl,
        }],
      }],
    }),
  })

  const prodigiData = await prodigiRes.json()

  if (prodigiData.outcome !== 'Created') {
    console.error('Prodigi error:', JSON.stringify(prodigiData))
    return new Response(
      JSON.stringify({ error: 'Order rejected by Prodigi', detail: prodigiData }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const prodigiOrderId: string = prodigiData.order.id

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: user.id,
      book_id: bookId,
      book_title: bookTitle,
      page_count: pageCount,
      price_per_page: 0,
      delivery_fee: 0,
      total: 0,
      status: 'processing',
      prodigi_order_id: prodigiOrderId,
      pdf_url: pdfUrl,
      shipping_name: shipping.name,
      shipping_address: shipping,
    })
    .select('id')
    .single()

  if (orderError) {
    console.error('DB error:', orderError)
  }

  await supabaseAdmin
    .from('book_projects')
    .update({ status: 'ordered', ordered_at: new Date().toISOString() })
    .eq('id', bookId)

  return new Response(
    JSON.stringify({ orderId: order?.id, prodigiOrderId }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
