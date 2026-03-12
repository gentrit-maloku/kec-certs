import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import kecLogo from '../../assets/KEC_logo_stacked.svg'

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-5%] w-64 h-64 bg-blue-100/50 rounded-3xl rotate-12 -z-10 border border-blue-200/30" />
      <div className="absolute top-[10%] left-[20%] w-48 h-48 bg-blue-50/40 rounded-3xl -rotate-6 -z-10 border border-blue-100/20" />
      <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 bg-blue-100/30 rounded-3xl -rotate-12 -z-10 border border-blue-200/20 border-dashed" />
      <div className="absolute bottom-[10%] right-[15%] w-40 h-40 bg-blue-50/50 rounded-3xl rotate-6 -z-10 border border-blue-100/30" />

      <div className="bg-white w-full max-w-[480px] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-10 py-14 z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <img src={kecLogo} alt="KEC Logo" className="h-44 w-auto mb-6" />
          <h2 className="text-base font-semibold text-slate-500">Please sign-in to your account</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-2">Email</label>
            <input
              type="email"
              required
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#00a0e3] focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:border-[#00a0e3] focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 accent-[#00a0e3]"
              />
              <span className="text-slate-500 font-medium group-hover:text-slate-700">Remember me</span>
            </label>
            <a href="#" className="text-[#00a0e3] font-bold hover:underline">Forgot password?</a>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00a0e3] hover:bg-[#008cc7] text-white py-4 rounded-xl font-bold text-base shadow-[0_4px_15px_rgba(0,160,227,0.3)] transition-all active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
