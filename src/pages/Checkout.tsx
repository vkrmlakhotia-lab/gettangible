import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBooks } from '@/context/BookContext'
import { supabase } from '@/lib/supabase'
import { lookupPostcode } from '@/lib/postcodes'
import { renderBookToPdf } from '@/lib/renderBook'
import { ChevronLeft, MapPin, Package, Search, Loader2 } from 'lucide-react'

type CheckoutState = 'idle' | 'rendering' | 'uploading' | 'submitting' | 'success' | 'error'

const BASE_PRICE = 18.28
const PER_PAGE = 0.33
const SHIPPING = 14.80
const BASE_PAGES = 24

function estimatePrice(pageCount: number): number {
  const extra = Math.max(0, pageCount - BASE_PAGES)
  return BASE_PRICE + extra * PER_PAGE + SHIPPING
}

const Checkout = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { projects, setCurrentProject, currentProject, orderPlaced } = useBooks()

  const [name, setName] = useState('')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [city, setCity] = useState('')
  const [postcode, setPostcode] = useState('')
  const [postcodeInput, setPostcodeInput] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState('')

  const [stage, setStage] = useState<CheckoutState>('idle')
  const [renderProgress, setRenderProgress] = useState({ done: 0, total: 0 })
  const [prodigiOrderId, setProdigiOrderId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (id) setCurrentProject(id)
  }, [id, projects])

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  const pageCount = currentProject.pages.length
  const estimatedTotal = estimatePrice(pageCount)
  const canOrder = name && line1 && city && postcode && stage === 'idle'

  const handlePostcodeLookup = async () => {
    if (!postcodeInput.trim()) return
    setLookingUp(true)
    setLookupError('')
    try {
      const result = await lookupPostcode(postcodeInput)
      setPostcode(result.postcode)
      setLine1(result.line1)
      setCity(result.city)
    } catch {
      setLookupError('Postcode not found. Please check and try again.')
    } finally {
      setLookingUp(false)
    }
  }

  const handleOrder = async () => {
    if (!canOrder) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      setStage('rendering')
      setRenderProgress({ done: 0, total: pageCount })
      const pdfBlob = await renderBookToPdf(
        currentProject.pages,
        currentProject.title,
        (done, total) => setRenderProgress({ done, total })
      )

      setStage('uploading')
      const pdfPath = `${session.user.id}/${currentProject.id}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(pdfPath, pdfBlob, { contentType: 'application/pdf', upsert: true })
      if (uploadError) throw new Error('Upload failed')

      const { data: urlData } = await supabase.storage
        .from('pdfs')
        .createSignedUrl(pdfPath, 60 * 60 * 24 * 365 * 10)
      if (!urlData?.signedUrl) throw new Error('Failed to get PDF URL')

      setStage('submitting')
      const { data, error: fnError } = await supabase.functions.invoke('submit-order', {
        body: {
          bookId: currentProject.id,
          bookTitle: currentProject.title,
          pdfUrl: urlData.signedUrl,
          pageCount,
          shipping: { name, line1, line2, city, postcode, countryCode: 'GB' },
        },
      })

      if (fnError || data?.error) {
        throw new Error(data?.error || 'Order submission failed')
      }

      orderPlaced(currentProject.id)
      setProdigiOrderId(data.prodigiOrderId)
      setStage('success')
    } catch (err: unknown) {
      console.error(err)
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong')
      setStage('error')
    }
  }

  if (stage === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Package className="w-8 h-8 text-green-600" />
        </div>
        <div className="text-center">
          <p className="text-[22px] font-bold text-foreground">Order placed!</p>
          <p className="text-[13px] text-muted-foreground mt-1">{prodigiOrderId}</p>
          <p className="text-[13px] text-muted-foreground mt-3">
            Estimated delivery in 5–7 working days
          </p>
        </div>
        <button
          onClick={() => navigate('/home')}
          className="w-full bg-primary text-white rounded-[16px] py-4 text-[16px] font-semibold"
        >
          Back to Home
        </button>
      </div>
    )
  }

  if (stage === 'rendering' || stage === 'uploading' || stage === 'submitting') {
    const message =
      stage === 'rendering'
        ? `Preparing your book… ${renderProgress.done}/${renderProgress.total} pages`
        : stage === 'uploading'
        ? 'Uploading your book…'
        : 'Placing order…'

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-6">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-[16px] text-foreground font-medium text-center">{message}</p>
        {stage === 'rendering' && renderProgress.total > 0 && (
          <div className="w-full max-w-xs bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(renderProgress.done / renderProgress.total) * 100}%` }}
            />
          </div>
        )}
        <p className="text-[12px] text-muted-foreground text-center">
          Please keep this screen open
        </p>
      </div>
    )
  }

  if (stage === 'error') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <Package className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-[18px] font-bold text-foreground">Order failed</p>
          <p className="text-[13px] text-muted-foreground mt-2">{errorMessage}</p>
        </div>
        <button
          onClick={() => setStage('idle')}
          className="w-full bg-primary text-white rounded-[16px] py-4 text-[16px] font-semibold"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="flex items-center gap-3 px-4 pt-14 pb-4 border-b border-border">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-[17px] font-semibold">Checkout</h1>
      </header>

      <div className="px-4 pt-5 space-y-5">
        <div className="bg-card border border-border rounded-[14px] p-4">
          <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Order Summary
          </p>
          <div className="flex justify-between text-[14px] text-foreground mb-2">
            <span>{currentProject.title}</span>
            <span>{pageCount} pages</span>
          </div>
          <div className="flex justify-between text-[13px] text-muted-foreground mb-1">
            <span>Print (A4 hardcover, gloss)</span>
            <span>£{(estimatedTotal - SHIPPING).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[13px] text-muted-foreground mb-3">
            <span>Delivery (5–7 working days)</span>
            <span>£{SHIPPING.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[15px] font-semibold text-foreground border-t border-border pt-3">
            <span>Estimated Total</span>
            <span>£{estimatedTotal.toFixed(2)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Final price confirmed at print time · incl. VAT
          </p>
        </div>

        <div className="bg-card border border-border rounded-[14px] p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Delivery Details
            </p>
          </div>

          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Full name"
            className="w-full bg-background border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
          />

          <div className="flex gap-2">
            <input
              value={postcodeInput}
              onChange={e => setPostcodeInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handlePostcodeLookup()}
              placeholder="Postcode"
              className="flex-1 bg-background border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary uppercase"
            />
            <button
              onClick={handlePostcodeLookup}
              disabled={lookingUp || !postcodeInput.trim()}
              className="flex items-center gap-1.5 bg-primary disabled:opacity-40 text-white rounded-[10px] px-4 py-2.5 text-[14px] font-medium"
            >
              {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Find
            </button>
          </div>
          {lookupError && (
            <p className="text-[12px] text-red-500">{lookupError}</p>
          )}

          {line1 && (
            <>
              <input
                value={line1}
                onChange={e => setLine1(e.target.value)}
                placeholder="Address line 1"
                className="w-full bg-background border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
              <input
                value={line2}
                onChange={e => setLine2(e.target.value)}
                placeholder="Address line 2 (optional)"
                className="w-full bg-background border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Town / city"
                  className="flex-1 bg-background border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
                <input
                  value={postcode}
                  onChange={e => setPostcode(e.target.value.toUpperCase())}
                  placeholder="Postcode"
                  className="w-[120px] bg-background border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary uppercase"
                />
              </div>
              <input
                value="United Kingdom"
                readOnly
                className="w-full bg-muted border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-muted-foreground cursor-not-allowed"
              />
            </>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-background border-t border-border">
        <button
          onClick={handleOrder}
          disabled={!canOrder}
          className="w-full bg-primary disabled:opacity-40 text-white rounded-[16px] py-4 text-[16px] font-semibold"
        >
          Place Order · £{estimatedTotal.toFixed(2)}
        </button>
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          Estimated price · confirmed at print time
        </p>
      </div>
    </div>
  )
}

export default Checkout
