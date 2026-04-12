import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockSignIn = vi.fn()

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}))

// Import AFTER mock is set up
const { default: SignInSheet } = await import('@/components/SignInSheet')

describe('SignInSheet', () => {
  beforeEach(() => {
    mockSignIn.mockClear()
    mockSignIn.mockResolvedValue(undefined)
  })

  it('renders nothing when isOpen is false', () => {
    render(<SignInSheet isOpen={false} onClose={() => {}} />)
    expect(screen.queryByText('Welcome to Tangible')).not.toBeInTheDocument()
  })

  it('renders sign-in content when isOpen is true', () => {
    render(<SignInSheet isOpen={true} onClose={() => {}} />)
    expect(screen.getByText('Welcome to Tangible')).toBeInTheDocument()
    expect(screen.getByText('Sign in to save your progress')).toBeInTheDocument()
    expect(screen.getByText('Continue with Apple')).toBeInTheDocument()
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('calls signIn with apple when Apple button is clicked', () => {
    render(<SignInSheet isOpen={true} onClose={() => {}} />)
    fireEvent.click(screen.getByText('Continue with Apple'))
    expect(mockSignIn).toHaveBeenCalledWith('apple')
  })

  it('calls signIn with google when Google button is clicked', () => {
    render(<SignInSheet isOpen={true} onClose={() => {}} />)
    fireEvent.click(screen.getByText('Continue with Google'))
    expect(mockSignIn).toHaveBeenCalledWith('google')
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<SignInSheet isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('signin-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows loading text on Apple button after click', async () => {
    mockSignIn.mockResolvedValue(undefined)
    render(<SignInSheet isOpen={true} onClose={() => {}} />)
    fireEvent.click(screen.getByText('Continue with Apple'))
    expect(screen.getByText('Opening Apple Sign In...')).toBeInTheDocument()
  })

  it('shows loading text on Google button after click', async () => {
    mockSignIn.mockResolvedValue(undefined)
    render(<SignInSheet isOpen={true} onClose={() => {}} />)
    fireEvent.click(screen.getByText('Continue with Google'))
    expect(screen.getByText('Opening Google Sign In...')).toBeInTheDocument()
  })
})
