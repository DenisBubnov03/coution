import { useState, useEffect } from 'react'
import { Outlet, useNavigate, NavLink, useParams } from 'react-router-dom'
import { fetchPages, createPage, logout } from './api'

function PageTreeItem({ page, depth = 0, onCreateSub, creatingId }) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = page.children?.length > 0
  const isCreating = creatingId === page.id

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: 2,
              fontSize: 10,
            }}
          >
            {expanded ? '▼' : '▶'}
          </button>
        ) : (
          <span style={{ width: 14 }} />
        )}
        <NavLink
          to={`/page/${page.id}`}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            borderRadius: 6,
            color: isActive ? '#fff' : '#bbb',
            background: isActive ? '#333' : 'transparent',
            textDecoration: 'none',
            fontSize: 14,
            overflow: 'hidden',
          })}
        >
          <span>{page.icon || '📄'}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {page.title || 'Без названия'}
          </span>
        </NavLink>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onCreateSub(page.id) }}
          disabled={isCreating}
          title="Добавить подстраницу"
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            cursor: isCreating ? 'wait' : 'pointer',
            padding: 2,
            fontSize: 14,
            opacity: isCreating ? 0.5 : 1,
          }}
        >
          +
        </button>
      </div>
      {expanded && hasChildren && (
        <div style={{ marginBottom: 4 }}>
          {page.children.map((c) => (
            <PageTreeItem
              key={c.id}
              page={c}
              depth={depth + 1}
              onCreateSub={onCreateSub}
              creatingId={creatingId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Layout({ user, onLogout }) {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [creatingParentId, setCreatingParentId] = useState(null)
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
    createPage({ title: 'Новая страница', parent_id: null })
      .then((p) => {
        loadPages()
        navigate(`/page/${p.id}`)
      })
      .catch((e) => setError(e.message))
      .finally(() => { setCreating(false); setCreatingParentId(null) })
  }

  const handleCreateSubPage = (parentId) => {
    setCreatingParentId(parentId)
    createPage({ title: 'Новая страница', parent_id: parentId })
      .then((p) => {
        loadPages()
        navigate(`/page/${p.id}`)
      })
      .catch((e) => setError(e.message))
      .finally(() => { setCreating(false); setCreatingParentId(null) })
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
              <PageTreeItem
                key={p.id}
                page={p}
                depth={0}
                onCreateSub={handleCreateSubPage}
                creatingId={creatingParentId}
              />
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
