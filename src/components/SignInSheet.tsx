import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface SignInSheetProps {
  isOpen: boolean
  onClose: () => void
}

const SignInSheet = ({ isOpen, onClose }: SignInSheetProps) => {
  const { signIn } = useAuth()
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null)

  if (!isOpen) return null

  const handleSignIn = async (provider: 'apple' | 'google') => {
    setLoading(provider)
    try {
      await signIn(provider)
      // OAuth redirect takes over — no need to close manually
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        data-testid="signin-backdrop"
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl px-6 pt-8 pb-10 flex flex-col items-center gap-6 shadow-2xl">
        {/* Teal "T" logo */}
        <div className="w-16 h-16 rounded-2xl bg-[#43aa8b] flex items-center justify-center">
          <span className="text-white text-2xl font-semibold">T</span>
        </div>

        {/* Heading */}
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl font-semibold text-[#577590]">Welcome to Tangible</h2>
          <p className="text-sm text-[#333]">Sign in to save your progress</p>
        </div>

        {/* Auth buttons */}
        <div className="w-full space-y-2.5">
          <button
            onClick={() => handleSignIn('apple')}
            disabled={loading !== null}
            className="w-full py-3.5 rounded-xl bg-[#577590] text-white font-medium text-base flex items-center justify-center gap-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading === 'apple' ? (
              <span className="text-sm">Opening Apple Sign In...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </>
            )}
          </button>

          <button
            onClick={() => handleSignIn('google')}
            disabled={loading !== null}
            className="w-full py-3.5 rounded-xl bg-white border border-[#d9d9d9] text-[#577590] font-medium text-base flex items-center justify-center gap-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loading === 'google' ? (
              <span className="text-sm">Opening Google Sign In...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        {/* Legal */}
        <p className="text-[11px] text-[#333]/50 text-center leading-relaxed">
          By continuing you agree to our{' '}
          <span className="underline cursor-pointer">Terms of Service</span>
          {' '}and{' '}
          <span className="underline cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </>
  )
}

export default SignInSheet
