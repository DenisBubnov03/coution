import { useState, useEffect } from 'react'
import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { fetchPages, createPage, logout } from './api'

export default function Layout({ user, onLogout }) {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  const loadPages = () => {
    setLoading(true)
    setError('')
    fetchPages()
      .then(setPages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPages()
  }, [])

  const handleNewPage = () => {
    setCreating(true)
    createPage({ title: 'Новая страница' })
      .then((p) => {
        loadPages()
        navigate(`/page/${p.id}`)
      })
      .catch((e) => setError(e.message))
      .finally(() => setCreating(false))
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 260,
        background: '#252525',
        borderRight: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '16px 12px',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 600 }}>Coution</span>
          <button
            onClick={() => { logout(); onLogout(); }}
            style={{
              background: 'transparent',
              border: '1px solid #555',
              color: '#aaa',
              padding: '6px 10px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Выйти
          </button>
        </div>
        <div style={{ padding: 8 }}>
          <button
            onClick={handleNewPage}
            disabled={creating}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#333',
              border: '1px dashed #555',
              borderRadius: 6,
              color: '#aaa',
              cursor: creating ? 'not-allowed' : 'pointer',
              fontSize: 13,
            }}
          >
            + Новая страница
          </button>
        </div>
        {error && <p style={{ padding: 8, color: '#e57373', fontSize: 12 }}>{error}</p>}
        <nav style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          {loading ? (
            <div style={{ color: '#666', fontSize: 13 }}>Загрузка...</div>
          ) : (
            pages.map((p) => (
              <NavLink
                key={p.id}
                to={`/page/${p.id}`}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 6,
                  color: isActive ? '#fff' : '#bbb',
                  background: isActive ? '#333' : 'transparent',
                  textDecoration: 'none',
                  fontSize: 14,
                  marginBottom: 2,
                })}
              >
                <span>{p.icon || '📄'}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.title || 'Без названия'}
                </span>
              </NavLink>
            ))
          )}
        </nav>
        <div style={{ padding: 8, borderTop: '1px solid #333', fontSize: 12, color: '#666' }}>
          {user?.full_name}
        </div>
      </aside>
      <main style={{ flex: 1, overflow: 'auto', background: '#1a1a1a' }}>
        <Outlet />
      </main>
    </div>
  )
}
