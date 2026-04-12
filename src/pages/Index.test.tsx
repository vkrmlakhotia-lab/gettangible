import { render } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '@/context/AuthContext'
const { default: Index } = await import('@/pages/Index')

describe('Index routing', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    localStorage.clear()
    vi.useFakeTimers()
    vi.spyOn(HTMLVideoElement.prototype, 'play').mockImplementation(() => Promise.resolve())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('routes to /onboarding when unauthenticated and no prior sign-in', async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      session: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    render(<Index />)
    await vi.runAllTimersAsync()
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding', { replace: true })
  })

  it('routes to /home when unauthenticated but hasSignedInBefore is set', async () => {
    localStorage.setItem('hasSignedInBefore', 'true')
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      session: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    render(<Index />)
    await vi.runAllTimersAsync()
    expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true })
  })

  it('routes to /home when authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'abc' } as any,
      session: {} as any,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    render(<Index />)
    await vi.runAllTimersAsync()
    expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true })
  })
})
