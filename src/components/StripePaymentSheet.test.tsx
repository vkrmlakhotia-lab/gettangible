import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import StripePaymentSheet from './StripePaymentSheet'

// Mock Stripe entirely — we test our component logic, not Stripe's
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => ({ confirmPayment: vi.fn().mockResolvedValue({ error: null }) }),
  useElements: () => ({}),
}))

vi.mock('@/lib/stripe', () => ({
  stripePromise: Promise.resolve(null),
}))

// Mock fetch for PaymentIntent creation
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ client_secret: 'pi_test_secret_123' }),
  }) as unknown as typeof fetch
})

describe('StripePaymentSheet', () => {
  it('renders nothing when closed', () => {
    render(
      <StripePaymentSheet
        open={false}
        onOpenChange={() => {}}
        amountPence={3599}
        onSuccess={() => {}}
      />
    )
    expect(screen.queryByTestId('stripe-elements')).toBeNull()
  })

  it('renders pay button text when open with client secret loaded', async () => {
    render(
      <StripePaymentSheet
        open={true}
        onOpenChange={() => {}}
        amountPence={3599}
        onSuccess={() => {}}
      />
    )
    // The drawer header "Payment" should be present
    // We use findByText (async) because the drawer content may render after state updates
    const heading = await screen.findByText('Payment')
    expect(heading).toBeDefined()
  })
})
