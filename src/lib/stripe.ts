import { loadStripe } from '@stripe/stripe-js'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error('Missing VITE_STRIPE_PUBLISHABLE_KEY')
}

export const stripePromise = loadStripe(publishableKey)
