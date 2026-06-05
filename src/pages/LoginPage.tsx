import { type FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, type AuthRole } from '../auth/AuthContext'
import { homePathForRole, pathAfterLogin } from '../auth/roleRoutes'
import './LoginPage.css'

export function LoginPage() {
  const { isAuthenticated, role, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { from?: string } | undefined

  const [loginRole, setLoginRole] = useState<AuthRole>('admin')
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={homePathForRole(role)} replace />
  }

  function switchRole(next: AuthRole) {
    if (next === loginRole) return
    setLoginRole(next)
    setError(null)
    setUserName('')
    setPassword('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(userName.trim(), password, loginRole)
      navigate(pathAfterLogin(loginRole, state?.from), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = loginRole === 'admin'

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Saha Takip</h1>

        <div
          className="login-role-switch"
          role="tablist"
          aria-label="Giriş türü"
        >
          <button
            type="button"
            role="tab"
            className={`login-role-btn${isAdmin ? ' login-role-btn--active' : ''}`}
            aria-selected={isAdmin}
            onClick={() => switchRole('admin')}
            disabled={loading}
          >
            Yönetici
          </button>
          <button
            type="button"
            role="tab"
            className={`login-role-btn${!isAdmin ? ' login-role-btn--active' : ''}`}
            aria-selected={!isAdmin}
            onClick={() => switchRole('personnel')}
            disabled={loading}
          >
            Personel
          </button>
        </div>

        <p className="login-subtitle">
          {isAdmin ? 'Yönetici girişi' : 'Personel girişi'}
        </p>
        <p className="login-note">
          {isAdmin
            ? 'Yönetici kullanıcı adı ve şifreniz ile panele girin.'
            : 'TC kimlik numaranız ve şifreniz ile giriş yapın.'}
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            {isAdmin ? 'Kullanıcı adı' : 'TC kimlik no'}
            <input
              className="login-input"
              type="text"
              name="userName"
              autoComplete="username"
              inputMode={isAdmin ? 'text' : 'numeric'}
              maxLength={isAdmin ? undefined : 11}
              placeholder={isAdmin ? undefined : '11 haneli TC'}
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
