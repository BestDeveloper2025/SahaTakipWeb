import { type FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './LoginPage.css'

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { from?: string } | undefined
  const from =
    state?.from && state.from !== '/login' ? state.from : '/'

  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(userName.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Saha Takip</h1>
        <p className="login-subtitle">Yönetici girişi</p>
        <p className="login-note">
          Bu panel yalnızca yöneticiler içindir. Personel hesapları ile giriş
          yapılamaz.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            Kullanıcı adı
            <input
              className="login-input"
              type="text"
              name="userName"
              autoComplete="username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              disabled={loading}
            />
          </label>
          <label className="login-label">
            Şifre
            <input
              className="login-input"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </label>

          {error ? (
            <div className="login-error" role="alert">
              {error}
            </div>
          ) : null}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
          </button>
        </form>
      </div>
    </div>
  )
}
