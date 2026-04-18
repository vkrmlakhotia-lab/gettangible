import { describe, it, expect, vi } from 'vitest'

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue({ id: 'mock-stripe' }),
}))

describe('stripe', () => {
  it('exports a stripePromise', async () => {
    vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_mock')
    const { stripePromise } = await import('./stripe')
    expect(stripePromise).toBeDefined()
    vi.unstubAllEnvs()
  })
})
