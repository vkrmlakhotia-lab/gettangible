import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBooks } from '@/context/BookContext'
import { ChevronLeft, MapPin, Package } from 'lucide-react'
import StripePaymentSheet from '@/components/StripePaymentSheet'

const PRICE_PER_PAGE = 1.20
const DELIVERY = 4.99

const Checkout = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { projects, setCurrentProject, currentProject, markOrdered } = useBooks()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [ordered, setOrdered] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [paymentOpen, setPaymentOpen] = useState(false)

  useEffect(() => {
    if (id) setCurrentProject(id)
  }, [id])

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  const pageCount = currentProject.pages.length
  const subtotal = pageCount * PRICE_PER_PAGE
  const total = subtotal + DELIVERY
  const amountPence = Math.round(total * 100)

  const handleOrder = () => {
    if (!name || !address) return
    setPaymentOpen(true)
  }

  const handlePaymentSuccess = async () => {
    setPaymentOpen(false)
    setOrdering(true)
    try {
      const num = await markOrdered(currentProject.id)
      setOrderNumber(num || `T-${Date.now().toString().slice(-6)}`)
      setOrdered(true)
    } catch (err) {
      console.error(err)
    } finally {
      setOrdering(false)
    }
  }

  if (ordered) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-6">
        <div className="w-16 h-16 bg-[#90be6d]/20 rounded-full flex items-center justify-center">
          <Package className="w-8 h-8 text-[#90be6d]" />
        </div>
        <div className="text-center">
          <p className="text-[22px] font-bold text-foreground">Order placed!</p>
          <p className="text-[14px] text-muted-foreground mt-1">Order #{orderNumber}</p>
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

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="flex items-center gap-3 px-4 pt-14 pb-4 border-b border-border">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-[17px] font-semibold">Checkout</h1>
      </header>

      <div className="px-4 pt-5 space-y-5">
        {/* Order summary */}
        <div className="bg-card border border-border rounded-[14px] p-4">
          <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Order Summary</p>
          <div className="flex justify-between text-[14px] text-foreground mb-2">
            <span>{currentProject.title}</span>
            <span>{pageCount} pages</span>
          </div>
          <div className="flex justify-between text-[13px] text-muted-foreground mb-1">
            <span>Pages ({pageCount} × £{PRICE_PER_PAGE.toFixed(2)})</span>
            <span>£{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[13px] text-muted-foreground mb-3">
            <span>Delivery</span>
            <span>£{DELIVERY.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[15px] font-semibold text-foreground border-t border-border pt-3">
            <span>Total</span>
            <span>£{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Delivery details */}
        <div className="bg-card border border-border rounded-[14px] p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Delivery Details</p>
          </div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Full name"
            className="w-full bg-background border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
          />
          <textarea
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Delivery address"
            rows={3}
            className="w-full bg-background border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary resize-none"
          />
        </div>
      </div>

      {/* Pay button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-background border-t border-border">
        <button
          onClick={handleOrder}
          disabled={!name || !address || ordering}
          className="w-full bg-primary disabled:opacity-40 text-white rounded-[16px] py-4 text-[16px] font-semibold"
        >
          {ordering ? 'Placing order…' : `Pay · £${total.toFixed(2)}`}
        </button>
      </div>

      <StripePaymentSheet
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        amountPence={amountPence}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}

export default Checkout
