const API = '/api'

function getToken() {
  return localStorage.getItem('coution_token')
}

export async function login(username, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || res.statusText || 'Ошибка входа')
  }
  const data = await res.json()
  localStorage.setItem('coution_token', data.token)
  localStorage.setItem('coution_user', JSON.stringify(data.user))
  return data
}

export async function me() {
  const token = getToken()
  if (!token) return null
  const res = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

export function logout() {
  localStorage.removeItem('coution_token')
  localStorage.removeItem('coution_user')
}

export async function fetchPages(parentId = null) {
  const token = getToken()
  if (!token) throw new Error('Не авторизован')
  const q = parentId != null ? `?parent_id=${parentId}` : ''
  const res = await fetch(`${API}/kb/pages${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка загрузки страниц')
  return res.json()
}

export async function fetchPage(id) {
  const token = getToken()
  if (!token) throw new Error('Не авторизован')
  const res = await fetch(`${API}/kb/pages/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Страница не найдена')
  return res.json()
}

export async function createBlock(pageId, { type = 'text', content = '', props = null, position = 0 }) {
  const token = getToken()
  if (!token) throw new Error('Не авторизован')
  const res = await fetch(`${API}/kb/pages/${pageId}/blocks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type, content, props, position }),
  })
  if (!res.ok) throw new Error('Ошибка создания блока')
  return res.json()
}

export async function updateBlock(blockId, { type, content, props, position }) {
  const token = getToken()
  if (!token) throw new Error('Не авторизован')
  const body = {}
  if (type !== undefined) body.type = type
  if (content !== undefined) body.content = content
  if (props !== undefined) body.props = props
  if (position !== undefined) body.position = position
  const res = await fetch(`${API}/kb/blocks/${blockId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Ошибка сохранения')
  return res.json()
}

export async function deleteBlock(blockId) {
  const token = getToken()
  if (!token) throw new Error('Не авторизован')
  const res = await fetch(`${API}/kb/blocks/${blockId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка удаления')
  return res.json()
}

export async function createPage({ title = 'Без названия', icon = null, parent_id = null }) {
  const token = getToken()
  if (!token) throw new Error('Не авторизован')
  const res = await fetch(`${API}/kb/pages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, icon, parent_id: parent_id || null }),
  })
  if (!res.ok) throw new Error('Ошибка создания')
  return res.json()
}

export async function updatePage(pageId, { title, icon, parent_id }) {
  const token = getToken()
  if (!token) throw new Error('Не авторизован')
  const body = {}
  if (title !== undefined) body.title = title
  if (icon !== undefined) body.icon = icon
  if (parent_id !== undefined) body.parent_id = parent_id || null
  const res = await fetch(`${API}/kb/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Ошибка сохранения страницы')
  return res.json()
}
