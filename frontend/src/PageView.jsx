import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { fetchPage } from './api'
import BlockEditor from './BlockEditor'

export default function PageView() {
  const { id } = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  if (loading) return <div style={{ padding: 24 }}>Загрузка...</div>
  if (error) return <div style={{ padding: 24, color: '#e57373' }}>{error}</div>
  if (!page) return null

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <header style={{ marginBottom: 24 }}>
        <span style={{ fontSize: 40, marginRight: 12 }}>{page.icon || '📄'}</span>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>{page.title || 'Без названия'}</h1>
      </header>
      <section style={{ minHeight: 200 }}>
        <BlockEditor pageId={page.id} blocks={page.blocks ?? []} onBlocksChange={loadPage} />
      </section>
    </div>
  )
}
