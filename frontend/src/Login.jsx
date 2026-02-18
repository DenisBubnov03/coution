import { useState } from 'react'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Ошибка входа')
      localStorage.setItem('coution_token', data.token)
      localStorage.setItem('coution_user', JSON.stringify(data.user))
      onLogin(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a1a1a',
    }}>
      <form onSubmit={submit} style={{
        width: 320,
        padding: 32,
        background: '#252525',
        borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 24 }}>Coution</h1>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#999' }}>Логин (tg-ник)</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
            required
            autoComplete="username"
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
            }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#999' }}>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
            }}
          />
        </div>
        {error && <p style={{ color: '#e57373', marginBottom: 16, fontSize: 14 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            background: '#4a9eff',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
