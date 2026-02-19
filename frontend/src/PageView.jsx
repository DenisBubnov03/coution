import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchPage, updatePage } from './api'
import BlockEditor from './BlockEditor'

const EMOJI_PICKER = ['📄', '📋', '📌', '🎯', '✅', '📝', '💡', '🔥', '⭐', '📂', '📎', '🔔', '💬', '📢', '✨', '🏆', '📖', '📁', '🗂️', '📊']

export default function PageView() {
  const { id } = useParams()
  const [page, setPage] = useState(null)
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingIcon, setEditingIcon] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [iconInput, setIconInput] = useState('')

  const loadPage = useCallback(() => {
    if (!id) return
    fetchPage(id).then(setPage).catch((e) => setError(e.message))
  }, [id])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError('')
    fetchPage(id)
      .then(setPage)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!page) return
    const buildPath = async () => {
      const path = [{ id: page.id, title: page.title, icon: page.icon }]
      let current = page
      while (current?.parent_id) {
        try {
          const parent = await fetchPage(current.parent_id)
          path.unshift({ id: parent.id, title: parent.title, icon: parent.icon })
          current = parent
        } catch {
          break
        }
      }
      setBreadcrumbs(path)
    }
    buildPath()
  }, [page?.id, page?.parent_id])

  useEffect(() => {
    if (page) {
      setTitleInput(page.title || '')
      setIconInput(page.icon || '📄')
    }
  }, [page?.id])

  const handleSaveTitle = async () => {
    if (!page || titleInput === (page.title || '')) {
      setEditingTitle(false)
      return
    }
    try {
      await updatePage(page.id, { title: titleInput || 'Без названия' })
      setPage((p) => ({ ...p, title: titleInput || 'Без названия' }))
    } catch (e) {
      setError(e.message)
    }
    setEditingTitle(false)
  }

  const handleSaveIcon = async (icon) => {
    if (!page) return
    try {
      await updatePage(page.id, { icon: icon || null })
      setPage((p) => ({ ...p, icon: icon || null }))
    } catch (e) {
      setError(e.message)
    }
    setEditingIcon(false)
  }

  if (loading) return <div style={{ padding: 24 }}>Загрузка...</div>
  if (error) return <div style={{ padding: 24, color: '#e57373' }}>{error}</div>
  if (!page) return null

  return (
    <div style={{ maxWidth: 758, margin: '0 auto', padding: '24px 24px 24px 0' }}>
      {breadcrumbs.length > 0 && (
        <nav
          style={{
            marginBottom: 16,
            padding: '8px 0',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 4,
            fontSize: 13,
            color: '#888',
          }}
        >
          {breadcrumbs.map((p, i) => (
            <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {i > 0 && <span style={{ margin: '0 4px' }}>/</span>}
              <Link
                to={`/page/${p.id}`}
                style={{
                  color: i === breadcrumbs.length - 1 ? '#e0e0e0' : '#888',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{p.icon || '📄'}</span>
                <span>{(p.title || 'Без названия').slice(0, i === breadcrumbs.length - 1 ? 40 : 30)}{((p.title?.length ?? 0) > (i === breadcrumbs.length - 1 ? 40 : 30) ? '…' : '')}</span>
              </Link>
            </span>
          ))}
        </nav>
      )}
      <header style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {editingIcon ? (
          <div
            style={{
              background: '#252525',
              border: '1px solid #444',
              borderRadius: 8,
              padding: 8,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              maxWidth: 200,
              position: 'relative',
              zIndex: 10,
            }}
          >
            {EMOJI_PICKER.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => handleSaveIcon(e)}
                style={{ fontSize: 20, cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}
              >
                {e}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setEditingIcon(false)}
              style={{ fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer', width: '100%', marginTop: 4 }}
            >
              Закрыть
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingIcon(true)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 40,
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
          >
            {page.icon || '📄'}
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              autoFocus
              style={{
                width: '100%',
                fontSize: 28,
                fontWeight: 700,
                background: '#252525',
                border: '1px solid #444',
                borderRadius: 6,
                color: '#e0e0e0',
                padding: '8px 12px',
                outline: 'none',
              }}
            />
          ) : (
            <h1
              onClick={() => setEditingTitle(true)}
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 0',
                borderRadius: 4,
              }}
              title="Нажми для редактирования"
            >
              {page.title || 'Без названия'}
            </h1>
          )}
        </div>
      </header>
      <section style={{ minHeight: 200, paddingLeft: 56 }}>
        <BlockEditor pageId={page.id} blocks={page.blocks ?? []} onBlocksChange={loadPage} />
      </section>
    </div>
  )
}
