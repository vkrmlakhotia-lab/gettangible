import { useEffect, useState } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { stripePromise } from '@/lib/stripe'

// ─── Inner form — rendered inside <Elements> ─────────────────────────────────
function PaymentForm({
  amountPence,
  onSuccess,
  onClose,
}: {
  amountPence: number
  onSuccess: () => void
  onClose: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePay = async () => {
    if (!stripe || !elements) return
    setPaying(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.')
      setPaying(false)
    } else {
      setPaying(false)
      onSuccess()
    }
  }

  const pounds = (amountPence / 100).toFixed(2)

  return (
    <div className="px-4 pb-8 space-y-5">
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <p className="text-[13px] text-red-500 text-center">{error}</p>
      )}

      <button
        onClick={handlePay}
        disabled={!stripe || paying}
        className="w-full bg-[#f8961e] disabled:opacity-40 text-white rounded-[16px] py-4 text-[16px] font-semibold"
      >
        {paying ? 'Processing…' : `Pay · £${pounds}`}
      </button>

      <button
        onClick={onClose}
        className="w-full text-[14px] text-muted-foreground py-2"
      >
        Cancel
      </button>
    </div>
  )
}

// ─── Shell — creates PaymentIntent and wraps in Elements ─────────────────────
interface StripePaymentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amountPence: number
  onSuccess: () => void
}

export default function StripePaymentSheet({
  open,
  onOpenChange,
  amountPence,
  onSuccess,
}: StripePaymentSheetProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setClientSecret(null)
      setLoadError(null)
      return
    }

    // TEST MODE ONLY: creates PaymentIntent directly from browser.
    // Replace with a Supabase Edge Function call before going live.
    const secretKey = import.meta.env.VITE_STRIPE_SECRET_KEY

    fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(amountPence),
        currency: 'gbp',
        'automatic_payment_methods[enabled]': 'true',
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error.message)
        setClientSecret(data.client_secret)
      })
      .catch((err: Error) => setLoadError(err.message ?? 'Could not initialise payment. Please try again.'))
  }, [open])

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-[17px] font-semibold text-foreground text-center">
            Payment
          </DrawerTitle>
        </DrawerHeader>

        {loadError && (
          <p className="text-[13px] text-red-500 text-center px-4 pb-8">{loadError}</p>
        )}

        {!clientSecret && !loadError && (
          <p className="text-[13px] text-muted-foreground text-center px-4 pb-8">
            Loading payment details…
          </p>
        )}

        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#f8961e',
                  colorBackground: '#ffffff',
                  colorText: '#577590',
                  borderRadius: '10px',
                },
              },
            }}
          >
            <PaymentForm
              amountPence={amountPence}
              onSuccess={onSuccess}
              onClose={() => onOpenChange(false)}
            />
          </Elements>
        )}
      </DrawerContent>
    </Drawer>
  )
}
