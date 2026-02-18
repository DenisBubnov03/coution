import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './Login'
import Layout from './Layout'
import PageView from './PageView'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('coution_token')}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  const onLogin = (u) => setUser(u)
  const onLogout = () => {
    localStorage.removeItem('coution_token')
    localStorage.removeItem('coution_user')
    setUser(null)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        Загрузка...
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={onLogin} />} />
        <Route path="/" element={user ? <Layout user={user} onLogout={onLogout} /> : <Navigate to="/login" />}>
          <Route index element={<div style={{ padding: 24 }}>Выбери страницу слева или создай новую</div>} />
          <Route path="page/:id" element={<PageView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
