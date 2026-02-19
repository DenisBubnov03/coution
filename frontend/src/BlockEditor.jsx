import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBlock, updateBlock, deleteBlock, createPage, fetchPage } from './api'

const BLOCK_TYPES = [
  { type: 'text', label: 'Текст' },
  { type: 'heading1', label: 'Заголовок 1' },
  { type: 'heading2', label: 'Заголовок 2' },
  { type: 'heading3', label: 'Заголовок 3' },
  { type: 'callout', label: 'Callout' },
  { type: 'toggle', label: 'Toggle' },
  { type: 'page', label: 'Страница' },
  { type: 'bulleted_list', label: 'Маркированный список' },
  { type: 'numbered_list', label: 'Нумерованный список' },
  { type: 'to_do', label: 'Чекбокс' },
  { type: 'code', label: 'Код' },
  { type: 'quote', label: 'Цитата' },
]

const EMOJI_PICKER = ['🎯', '💡', '📌', '⚠️', '📝', '✅', '❌', '🔴', '🟢', '🟡', '📎', '📂', '🔥', '⭐', '💬', '📋', '🔔', '📢', '✨', '🏆']

// Notion-style: default, gray, brown, orange, yellow, green, blue, purple, pink, red
const TEXT_COLORS = [
  { name: 'Без цвета', value: null },
  { name: 'Серый', value: '#9b9a97' },
  { name: 'Коричневый', value: '#64473a' },
  { name: 'Оранжевый', value: '#d9730d' },
  { name: 'Жёлтый', value: '#cb912f' },
  { name: 'Зелёный', value: '#448361' },
  { name: 'Синий', value: '#337ea9' },
  { name: 'Фиолетовый', value: '#9065b0' },
  { name: 'Розовый', value: '#c14c8a' },
  { name: 'Красный', value: '#e03e3e' },
]
const BG_COLORS = [
  { name: 'Без фона', value: null },
  { name: 'Серый', value: '#373737' },
  { name: 'Коричневый', value: '#3d2d2a' },
  { name: 'Оранжевый', value: '#3d3020' },
  { name: 'Жёлтый', value: '#3d3520' },
  { name: 'Зелёный', value: '#1e3a2f' },
  { name: 'Синий', value: '#1e2d3a' },
  { name: 'Фиолетовый', value: '#2d2433' },
  { name: 'Розовый', value: '#3d2a32' },
  { name: 'Красный', value: '#3d2525' },
]

function BlockItem({
  block,
  pageId,
  onUpdate,
  onDelete,
  onAddBelow,
  onDuplicate,
  onReorder,
  onSelectPageType,
  dragState,
  onDragStart,
  onDragOver,
  onDragEnd,
  openTypeMenuBlockId,
  onClearOpenTypeMenu,
}) {
  const [content, setContent] = useState(block.content || '')
  const [showMenu, setShowMenu] = useState(false)
  const [showHandleMenu, setShowHandleMenu] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showColorSubmenu, setShowColorSubmenu] = useState(false)
  const [localType, setLocalType] = useState(block.type)
  const [editing, setEditing] = useState(false)
  const [blockFocused, setBlockFocused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const normProps = (p) => (p != null && typeof p === 'object' && !Array.isArray(p) ? p : {})
  const [props, setProps] = useState(() => normProps(block.props))
  const inputRef = useRef(null)
  const calloutInputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!showMenu) return
    const close = () => setShowMenu(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showMenu])
  useEffect(() => {
    if (!showHandleMenu) return
    const close = () => setShowHandleMenu(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showHandleMenu])
  useEffect(() => {
    if (!showEmojiPicker) return
    const close = () => setShowEmojiPicker(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showEmojiPicker])
  useEffect(() => {
    if (!showColorSubmenu) return
    const close = () => setShowColorSubmenu(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showColorSubmenu])
  useEffect(() => {
    setContent(block.content || '')
    setLocalType(block.type)
    setProps(normProps(block.props))
  }, [block.id, block.type, block.content, block.props])

  useEffect(() => {
    if (openTypeMenuBlockId === block.id) {
      setShowMenu(true)
      onClearOpenTypeMenu?.()
    }
  }, [openTypeMenuBlockId, block.id, onClearOpenTypeMenu])

  useEffect(() => {
    const unchanged = content === (block.content || '') && localType === block.type
      && JSON.stringify(props) === JSON.stringify(block.props || {})
    if (unchanged) return
    // Для page-блоков не затираем page_id — сохраняем из block.props
    const propsToSend = localType === 'page' && block.props?.page_id
      ? { ...(block.props || {}), ...props }
      : props
    const t = setTimeout(() => onUpdate(block.id, { content, type: localType, props: propsToSend }), 500)
    return () => clearTimeout(t)
  }, [content, localType, props, block.id, block.content, block.type, block.props, onUpdate])

  const handleKeyDown = (e) => {
    if (e.key === '/') {
      setShowMenu(true)
      e.preventDefault()
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      if (localType === 'callout' || localType === 'code' || localType === 'quote') return
      e.preventDefault()
      onAddBelow(block.position + 1, { openTypeMenu: false })
      return
    }
    if (e.key === 'Backspace' && content === '') {
      e.preventDefault()
      onDelete(block.id)
      return
    }
  }

  const isCode = localType === 'code'
  const isList = localType === 'bulleted_list' || localType === 'numbered_list'
  const isTodo = localType === 'to_do'
  const isQuote = localType === 'quote'
  const isCallout = localType === 'callout'
  const isToggle = localType === 'toggle'
  const isPageBlock = localType === 'page'
  const isHeading = localType.startsWith('heading')
  const headingLevel = localType === 'heading1' ? 1 : localType === 'heading2' ? 2 : 3
  const listLines = (content || '').split('\n').filter(Boolean)
  const showListView = isList && !editing && listLines.length > 0

  const inputStyle = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#e0e0e0',
    fontSize: isHeading ? (4 - headingLevel) * 4 + 12 : 15,
    fontWeight: isHeading ? 600 : 400,
    fontFamily: isCode ? 'monospace' : 'inherit',
    margin: '4px 0',
    padding: '6px 0',
    resize: 'none',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  }
  if (isQuote) {
    inputStyle.borderLeft = '4px solid #444'
    inputStyle.paddingLeft = 16
  }
  if (props.text_color) inputStyle.color = props.text_color

  const ListTag = localType === 'numbered_list' ? 'ol' : 'ul'
  const listStyle = {
    margin: '6px 0',
    paddingLeft: 24,
    ...inputStyle,
  }

  const lastUsedBg = props._last_bg != null ? BG_COLORS.find((c) => c.value === props._last_bg) : null
  const lastUsedText = props._last_text != null ? TEXT_COLORS.find((c) => c.value === props._last_text) : null

  return (
    <div
      className="kb-block-wrap"
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 4,
        marginBottom: 4,
        marginLeft: -56,
        minHeight: 32,
        opacity: dragState?.draggingId === block.id ? 0.5 : 1,
        outline: dragState?.overId === block.id ? '2px solid #4a9eff' : 'none',
        borderRadius: 4,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDragOver={onDragOver ? (e) => onDragOver(e, block) : undefined}
      onDrop={onReorder ? (e) => onReorder(e, block) : undefined}
    >
      <div
        className="kb-block-handle"
        style={{
          flexShrink: 0,
          width: 52,
          minHeight: 28,
          paddingTop: 7,
          cursor: 'grab',
          color: '#888',
          position: 'relative',
          opacity: hovered || showHandleMenu ? 1 : 0,
          pointerEvents: hovered || showHandleMenu ? 'auto' : 'none',
          transition: 'opacity 0.15s',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAddBelow(block.position + 1) }}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            padding: 0,
            fontSize: 20,
            lineHeight: 1,
            width: 26,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Добавить блок"
        >
          +
        </button>
        <span
          draggable
          onDragStart={(e) => onDragStart(e, block)}
          onDragEnd={onDragEnd}
          onClick={(e) => { e.stopPropagation(); setShowHandleMenu((v) => !v) }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ userSelect: 'none', fontSize: 20, lineHeight: 1, cursor: 'grab', minWidth: 22 }}
          title="Перетащить или нажми для меню"
        >
          ⋮⋮
        </span>
        {showHandleMenu && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              left: 0,
              top: '100%',
              marginTop: 4,
              background: '#252525',
              border: '1px solid #444',
              borderRadius: 8,
              padding: 6,
              zIndex: 100,
              minWidth: 180,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              display: 'flex',
            }}
          >
            <div>
              <button type="button" onClick={() => { setShowHandleMenu(false); setShowMenu(true) }} style={btnStyle}>Сменить тип</button>
              <button type="button" onClick={() => setShowColorSubmenu((v) => !v)} style={btnStyle}>Цвет</button>
              <button type="button" onClick={() => { setShowHandleMenu(false); onDuplicate(block) }} style={btnStyle}>Дублировать</button>
              <button type="button" onClick={() => { setShowHandleMenu(false); onDelete(block.id) }} style={{ ...btnStyle, color: '#e57373' }}>Удалить</button>
            </div>
            {showColorSubmenu && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                style={{
                  marginLeft: 4,
                  paddingLeft: 8,
                  borderLeft: '1px solid #444',
                  minWidth: 160,
                }}
              >
                <div style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>Цвет текста</div>
                {lastUsedText && (
                  <button
                    type="button"
                    onClick={() => {
                      const p = { ...props, text_color: lastUsedText.value, _last_text: lastUsedText.value }
                      setProps(p)
                      onUpdate(block.id, { props: p })
                      setShowColorSubmenu(false)
                      setShowHandleMenu(false)
                    }}
                    style={{ ...btnStyle, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span style={{ width: 14, height: 14, borderRadius: 2, background: lastUsedText.value || '#333' }} />
                    {lastUsedText.name}
                  </button>
                )}
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      const p = { ...props, text_color: c.value || undefined, _last_text: c.value || undefined }
                      setProps(p)
                      onUpdate(block.id, { props: p })
                      setShowColorSubmenu(false)
                      setShowHandleMenu(false)
                    }}
                    style={{ ...btnStyle, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span style={{ color: c.value || '#e0e0e0', fontWeight: 600 }}>A</span>
                    {c.name}
                  </button>
                ))}
                <div style={{ color: '#888', fontSize: 11, marginTop: 8, marginBottom: 4 }}>Цвет фона</div>
                {lastUsedBg && (
                  <button
                    type="button"
                    onClick={() => {
                      const p = { ...props, bg_color: lastUsedBg.value, _last_bg: lastUsedBg.value }
                      setProps(p)
                      onUpdate(block.id, { props: p })
                      setShowColorSubmenu(false)
                      setShowHandleMenu(false)
                    }}
                    style={{ ...btnStyle, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span style={{ width: 14, height: 14, borderRadius: 2, background: lastUsedBg.value || '#333' }} />
                    {lastUsedBg.name}
                  </button>
                )}
                {BG_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      const p = { ...props, bg_color: c.value || undefined, _last_bg: c.value || undefined }
                      setProps(p)
                      onUpdate(block.id, { props: p })
                      setShowColorSubmenu(false)
                      setShowHandleMenu(false)
                    }}
                    style={{ ...btnStyle, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span style={{ width: 14, height: 14, borderRadius: 2, background: c.value || '#1a1a1a' }} />
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          width: '100%',
          boxSizing: 'border-box',
          ...(props.bg_color || props.text_color
            ? {
                background: props.bg_color || 'transparent',
                color: props.text_color || '#e0e0e0',
                borderRadius: 6,
                padding: props.bg_color ? '8px 12px' : 0,
              }
            : {}),
        }}
        onClick={() => setShowHandleMenu(false)}
        onMouseEnter={() => setShowHandleMenu(false)}
      >
        {showMenu && (
          <div
            className="kb-type-menu"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={typeMenuStyle}
          >
            {BLOCK_TYPES.map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={async () => {
                  setShowMenu(false)
                  if (t.type === 'page' && onSelectPageType) {
                    await onSelectPageType(block)
                    setLocalType('page')
                  } else {
                    setLocalType(t.type)
                    onUpdate(block.id, { type: t.type })
                  }
                }}
                style={{
                  ...btnStyle,
                  color: localType === t.type ? '#4a9eff' : '#e0e0e0',
                }}
              >
                {t.label}
              </button>
            ))}
            <button type="button" onClick={() => setShowMenu(false)} style={{ ...btnStyle, marginTop: 8, color: '#999' }}>
              Закрыть
            </button>
          </div>
        )}

        {isCallout ? (
          <CalloutBlock
            content={content}
            setContent={setContent}
            props={props}
            setProps={setProps}
            onUpdate={(p) => onUpdate(block.id, { props: p })}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={setShowEmojiPicker}
            handleKeyDown={handleKeyDown}
            inputStyle={inputStyle}
            inputRef={calloutInputRef}
          />
        ) : isTodo ? (
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={content.startsWith('[x]')}
              onChange={(e) => {
                const text = content.replace(/^\[[ x]\]\s*/, '')
                setContent(e.target.checked ? '[x] ' + text : '[ ] ' + text)
              }}
              style={{ marginTop: 16 }}
            />
            <textarea
              ref={inputRef}
              value={content.replace(/^\[[ x]\]\s*/, '')}
              onChange={(e) => setContent((content.startsWith('[x]') ? '[x] ' : '[ ] ') + e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setEditing(true)}
              placeholder="Задача"
              rows={Math.max(1, Math.min(10, (content.replace(/^\[[ x]\]\s*/, '').split('\n').length)))}
              style={{ ...inputStyle, flex: 1 }}
            />
          </label>
        ) : showListView ? (
          <div
            style={listStyle}
            onClick={() => setEditing(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(true)}
          >
            <ListTag style={{ margin: 0 }}>
              {listLines.map((line, i) => (
                <li key={i} style={{ marginBottom: 2 }}>{line}</li>
              ))}
            </ListTag>
          </div>
        ) : isPageBlock ? (
          <PageBlock
            block={block}
            pageId={pageId}
            props={block.props?.page_id ? (block.props || {}) : props}
            onUpdate={onUpdate}
            navigate={navigate}
          />
        ) : isToggle ? (
          <ToggleBlock
            content={content}
            setContent={setContent}
            props={props}
            setProps={setProps}
            onUpdate={(p) => onUpdate(block.id, { props: p })}
            blockId={block.id}
            handleKeyDown={handleKeyDown}
            inputStyle={inputStyle}
            pageId={pageId}
          />
        ) : (
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { setEditing(true); setBlockFocused(true) }}
            onBlur={() => { setEditing(false); setBlockFocused(false) }}
            placeholder={blockFocused ? 'Нажми "/" для вызова меню' : ''}
            rows={isCode ? Math.max(5, (content || '').split('\n').length) : Math.max(1, Math.min(15, (content || '').split('\n').length))}
            style={inputStyle}
          />
        )}
      </div>
    </div>
  )
}

const CALLOUT_FORM = {
  borderRadius: 8,
  borderLeft: undefined,
  border: undefined,
  paddingVertical: 12,
  initialRows: 1,
}

function CalloutBlock({
  content, setContent, props, setProps, onUpdate,
  showEmojiPicker, setShowEmojiPicker,
  handleKeyDown, inputStyle, inputRef,
}) {
  const bg = props.bg_color || '#1e3a2f'
  const textC = props.text_color || '#ffffff'
  const emoji = props.emoji || '🎯'
  const form = {
    borderRadius: props.border_radius ?? CALLOUT_FORM.borderRadius,
    ...(props.border_left != null && { borderLeft: props.border_left }),
    ...(CALLOUT_FORM.border != null && { border: CALLOUT_FORM.border }),
  }
  return (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        background: bg,
        color: textC,
        borderRadius: form.borderRadius,
        ...(form.borderLeft != null && { borderLeft: form.borderLeft }),
        ...(form.border != null && { border: form.border }),
        padding: `${CALLOUT_FORM.paddingVertical}px 16px`,
        margin: '4px 0',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(true) }}
        onKeyDown={(e) => e.key === 'Enter' && setShowEmojiPicker(true)}
        style={{ fontSize: 16.8, cursor: 'pointer', flexShrink: 0,paddingTop: '10px', position: 'relative' }}
      >
        {emoji}
        {showEmojiPicker && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: 0,
            top: 28,
            background: '#252525',
            border: '1px solid #444',
            borderRadius: 8,
            padding: 8,
            zIndex: 1000,
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 4,
            width: 'max-content',
          }}
        >
          {EMOJI_PICKER.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                const p = { ...props, emoji: e }
                setProps(p)
                onUpdate(p)
                setShowEmojiPicker(false)
              }}
              style={{ fontSize: 20, cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}
            >
              {e}
            </button>
          ))}
        </div>
        )}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          
//           placeholder="Цель: ... (Enter — новая строка. - пункт, 1. пункт, [ ] задача)"
          rows={Math.max(CALLOUT_FORM.initialRows, Math.min(15, (content || '').split('\n').length))}
          style={{
            ...inputStyle,
            color: textC,
            paddingTop: '8px',
            background: 'transparent',
          }}
        />
      </div>
    </div>
  )
}

function PageBlock({ block, pageId: currentPageId, props, onUpdate, navigate }) {
  const linkedPageId = props.page_id
  const [linkedPage, setLinkedPage] = useState(null)

  useEffect(() => {
    if (!linkedPageId) return
    let cancelled = false
    fetchPage(linkedPageId)
      .then((p) => { if (!cancelled) setLinkedPage(p) })
      .catch(() => { if (!cancelled) setLinkedPage(null) })
    return () => { cancelled = true }
  }, [linkedPageId])

  const title = linkedPage?.title ?? block.content ?? 'Страница'
  const emoji = linkedPage?.icon ?? props.emoji ?? '📄'

  // Нет page_id — просто текст (страница должна быть создана при выборе типа в меню)
  if (!linkedPageId) {
    return (
      <span style={{ padding: '8px 0', color: '#888', fontSize: 14 }} onMouseDown={(e) => e.stopPropagation()}>
        📄 Страница
      </span>
    )
  }

  // Гиперссылка: эмодзи + название, клик — переход
  return (
    <a
      href={`/page/${linkedPageId}`}
      onClick={(e) => { e.preventDefault(); navigate(`/page/${linkedPageId}`) }}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 0',
        color: '#4a9eff',
        cursor: 'pointer',
        fontSize: 14,
        textDecoration: 'none',
      }}
    >
      <span>{emoji}</span>
      <span>{title || 'Без названия'}</span>
    </a>
  )
}

const TOGGLE_LINE_HEIGHT = 24
const TOGGLE_CHEVRON_WIDTH = 20
const TOGGLE_GAP = 8

function NestedBlockItem({
  child,
  inputStyle,
  onUpdate,
  onDelete,
  onAddBelow,
  onDuplicate,
  handleKeyDown,
  dragState,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const [content, setContent] = useState(child.content || '')
  const [localType, setLocalType] = useState(child.type || 'text')
  const [hovered, setHovered] = useState(false)
  const [showHandleMenu, setShowHandleMenu] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const calloutInputRef = useRef(null)

  useEffect(() => {
    setContent(child.content || '')
    setLocalType(child.type || 'text')
  }, [child.id, child.content, child.type])

  const persist = useCallback((data) => {
    onUpdate(child.id, data)
  }, [child.id, onUpdate])

  useEffect(() => {
    if (content === (child.content || '')) return
    const t = setTimeout(() => persist({ content }), 400)
    return () => clearTimeout(t)
  }, [content, child.content, persist])

  const onKeyDown = (e) => {
    if (e.key === '/') return
    if (e.key === 'Enter' && !e.shiftKey) {
      if (localType === 'callout' || localType === 'code' || localType === 'quote') return
      e.preventDefault()
      onAddBelow(child.position + 1)
      return
    }
    if (e.key === 'Backspace' && content === '') {
      e.preventDefault()
      onDelete(child.id)
      return
    }
    handleKeyDown?.(e)
  }

  const isHeading = localType.startsWith('heading')
  const headingLevel = localType === 'heading1' ? 1 : localType === 'heading2' ? 2 : 3
  const baseInputStyle = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#e0e0e0',
    fontSize: isHeading ? (4 - headingLevel) * 4 + 12 : 15,
    fontWeight: isHeading ? 600 : 400,
    fontFamily: 'inherit',
    margin: '4px 0',
    padding: '6px 0',
    resize: 'none',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    ...inputStyle,
  }

  const isDragging = dragState?.draggingId === child.id
  const isOver = dragState?.overId === child.id

  const HANDLE_OFFSET_UNDER_CHEVRON = 52 - 78

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 4,
        marginBottom: 4,
        minHeight: 32,
        marginLeft: HANDLE_OFFSET_UNDER_CHEVRON,
        opacity: isDragging ? 0.5 : 1,
        outline: isOver ? '2px solid #4a9eff' : 'none',
        borderRadius: 4,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDragOver={onDragOver ? (e) => onDragOver(e, child) : undefined}
      onDrop={onDrop ? (e) => onDrop(e, child) : undefined}
    >
      <div
        style={{
          flexShrink: 0,
          width: 52,
          minHeight: 28,
          paddingTop: 7,
          color: '#888',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          opacity: hovered || showHandleMenu ? 1 : 0,
          transition: 'opacity 0.15s',
        }}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAddBelow(child.position + 1) }}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            padding: 0,
            fontSize: 20,
            lineHeight: 1,
            width: 26,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Добавить блок"
        >
          +
        </button>
        <span
          draggable
          onDragStart={(e) => onDragStart(e, child)}
          onDragEnd={onDragEnd}
          onClick={(e) => { e.stopPropagation(); setShowHandleMenu((v) => !v) }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ userSelect: 'none', fontSize: 20, lineHeight: 1, cursor: 'grab', minWidth: 22 }}
          title="Перетащить или нажми для меню"
        >
          ⋮⋮
        </span>
        {showHandleMenu && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              left: 0,
              top: '100%',
              marginTop: 4,
              background: '#252525',
              border: '1px solid #444',
              borderRadius: 8,
              padding: 6,
              zIndex: 100,
              minWidth: 180,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>Тип</div>
            {BLOCK_TYPES.filter((t) => !['page', 'toggle'].includes(t.type)).map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => {
                  setShowHandleMenu(false)
                  setLocalType(t.type)
                  persist({ type: t.type })
                }}
                style={{
                  ...btnStyle,
                  color: localType === t.type ? '#4a9eff' : '#e0e0e0',
                }}
              >
                {t.label}
              </button>
            ))}
            <button type="button" onClick={() => { setShowHandleMenu(false); onDuplicate(child.id) }} style={btnStyle}>Дублировать</button>
            <button type="button" onClick={() => { setShowHandleMenu(false); onDelete(child.id) }} style={{ ...btnStyle, color: '#e57373' }}>Удалить</button>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }} onMouseEnter={() => setShowHandleMenu(false)}>
        {localType === 'callout' ? (
          <div style={{ width: '100%', minWidth: 200 }}>
            <CalloutBlock
              content={content}
              setContent={setContent}
              props={child.props || {}}
              setProps={(p) => persist({ props: p })}
              onUpdate={(p) => persist({ props: p })}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
              handleKeyDown={onKeyDown}
              inputStyle={baseInputStyle}
              inputRef={calloutInputRef}
            />
          </div>
        ) : localType === 'to_do' ? (
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', margin: '4px 0' }}>
            <input
              type="checkbox"
              checked={content.startsWith('[x]')}
              onChange={(e) => {
                const text = content.replace(/^\[[ x]\]\s*/, '')
                setContent(e.target.checked ? '[x] ' + text : '[ ] ' + text)
              }}
              style={{ marginTop: 12 }}
            />
            <textarea
              value={content.replace(/^\[[ x]\]\s*/, '')}
              onChange={(e) => setContent((content.startsWith('[x]') ? '[x] ' : '[ ] ') + e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Задача"
              rows={Math.max(1, Math.min(10, (content.replace(/^\[[ x]\]\s*/, '').split('\n').length)))}
              style={{ ...baseInputStyle, flex: 1,paddingTop: '4px', }}
            />
          </label>
        ) : localType === 'code' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Код"
            rows={Math.max(5, (content || '').split('\n').length)}
            style={{ ...baseInputStyle, fontFamily: 'monospace' }}
          />
        ) : localType === 'quote' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Цитата"
            rows={Math.max(1, Math.min(15, (content || '').split('\n').length))}
            style={{ ...baseInputStyle, borderLeft: '4px solid #444', paddingLeft: 16 }}
          />
        ) : localType === 'bulleted_list' || localType === 'numbered_list' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={localType === 'numbered_list' ? '1. пункт' : '• пункт'}
            rows={Math.max(1, Math.min(15, (content || '').split('\n').length))}
            style={{ ...baseInputStyle, margin: '6px 0', paddingLeft: 24 }}
          />
        ) : localType === 'heading1' || localType === 'heading2' || localType === 'heading3' ? (
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={localType === 'heading1' ? 'Заголовок 1' : localType === 'heading2' ? 'Заголовок 2' : 'Заголовок 3'}
            style={{ ...baseInputStyle, margin: '4px 0', padding: '6px 0' }}
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Текст или / для типа"
            rows={Math.max(1, Math.min(15, (content || '').split('\n').length))}
            style={baseInputStyle}
          />
        )}
      </div>
    </div>
  )
}

function ToggleBlock({ content, setContent, props, setProps, onUpdate, blockId, handleKeyDown, inputStyle, pageId }) {
  const safeProps = (props != null && typeof props === 'object' && !Array.isArray(props)) ? props : {}
  const collapsed = safeProps.collapsed !== false
  const lines = (content || '').split('\n')
  const summaryRaw = lines[0] || ''
  const summary = summaryRaw.trim()
  const hasTitle = summary.length > 0
  const bodyLines = lines.slice(1)
  const children = (safeProps.children || []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const hasMigratedRef = useRef(false)
  useEffect(() => {
    if (hasMigratedRef.current || children.length > 0 || bodyLines.length === 0) return
    hasMigratedRef.current = true
    const migrated = [{ id: 'n-' + Date.now(), type: 'text', content: bodyLines.join('\n'), position: 0, props: {} }]
    const newProps = { ...safeProps, children: migrated }
    setProps(newProps)
    // Сохранение уйдёт через debounce в BlockItem
  }, [children.length, bodyLines.length, setProps, blockId])

  const [nestedDragState, setNestedDragState] = useState({ draggingId: null, overId: null })

  const setChildren = useCallback((newChildren) => {
    const withPosition = newChildren.map((c, i) => ({ ...c, position: i }))
    const newProps = { ...safeProps, children: withPosition }
    setProps(newProps)
    // Сохранение уйдёт одним запросом через debounce в BlockItem
  }, [safeProps, setProps, blockId])

  const updateChild = useCallback((childId, data) => {
    const newChildren = children.map((c) => (c.id === childId ? { ...c, ...data } : c))
    setChildren(newChildren)
  }, [children, setChildren])

  const deleteChild = useCallback((childId) => {
    setChildren(children.filter((c) => c.id !== childId))
  }, [children, setChildren])

  const addChildBelow = useCallback((index) => {
    const newChild = { id: 'n-' + Date.now(), type: 'text', content: '', position: index, props: {} }
    const newChildren = [...children.slice(0, index), newChild, ...children.slice(index)].map((c, i) => ({ ...c, position: i }))
    setChildren(newChildren)
  }, [children, setChildren])

  const duplicateChild = useCallback((childId) => {
    const idx = children.findIndex((c) => c.id === childId)
    if (idx === -1) return
    const copy = { ...children[idx], id: 'n-' + Date.now(), position: idx + 1 }
    const newChildren = [...children.slice(0, idx + 1), copy, ...children.slice(idx + 1)].map((c, i) => ({ ...c, position: i }))
    setChildren(newChildren)
  }, [children, setChildren])

  const onNestedDragStart = useCallback((e, child) => {
    setNestedDragState({ draggingId: child.id, overId: null })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(child.id))
  }, [])

  const onNestedDragOver = useCallback((e, overChild) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setNestedDragState((s) => (s.draggingId ? { ...s, overId: overChild.id } : s))
  }, [])

  const onNestedDragEnd = useCallback(() => {
    setNestedDragState({ draggingId: null, overId: null })
  }, [])

  const onNestedDrop = useCallback((e, overChild) => {
    e.preventDefault()
    e.stopPropagation()
    const draggingId = e.dataTransfer.getData('text/plain')
    if (!draggingId || draggingId === String(overChild.id)) return
    const fromIndex = children.findIndex((c) => String(c.id) === draggingId)
    const toIndex = children.findIndex((c) => c.id === overChild.id)
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return
    const reordered = [...children]
    const [moved] = reordered.splice(fromIndex, 1)
    const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex
    reordered.splice(insertIndex, 0, moved)
    setChildren(reordered.map((c, i) => ({ ...c, position: i })))
    setNestedDragState({ draggingId: null, overId: null })
  }, [children, setChildren])

  const ensuredOneRowRef = useRef(false)
  useEffect(() => {
    if (collapsed) {
      ensuredOneRowRef.current = false
      return
    }
    if (children.length > 0) return
    if (ensuredOneRowRef.current) return
    ensuredOneRowRef.current = true
    addChildBelow(0)
  }, [collapsed, children.length, addChildBelow])

  const chevronStyle = {
    color: '#888',
    fontSize: 14,
    width: TOGGLE_CHEVRON_WIDTH,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'translateY(2px)',
    height: TOGGLE_LINE_HEIGHT,
    cursor: 'pointer',
  }

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      {/* Первая строка: ▼ и заголовок. Обёртка с paddingTop выравнивает с хендлом; внутренняя строка — центрирование ▼ и текста. */}
      <div style={{ paddingTop: 7 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: TOGGLE_GAP,
            height: TOGGLE_LINE_HEIGHT,
            minHeight: TOGGLE_LINE_HEIGHT,
          }}
        >
          <span
            style={chevronStyle}
          onClick={(e) => {
            e.stopPropagation()
            const p = { ...safeProps, collapsed: !collapsed }
            setProps(p)
            // Сохранение уйдёт одним запросом через debounce в BlockItem
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title={collapsed ? 'Развернуть' : 'Свернуть'}
        >
          {collapsed ? '▶' : '▼'}
        </span>
        <input
          type="text"
          value={summaryRaw}
          onChange={(e) => {
            const rest = lines.slice(1).join('\n')
            setContent(e.target.value + (rest ? '\n' + rest : ''))
          }}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="Toggle"
          style={{
            flex: 1,
            minWidth: 0,
            height: TOGGLE_LINE_HEIGHT,
            lineHeight: `${TOGGLE_LINE_HEIGHT}px`,
            transform: 'translateY(2px)',
            padding: '0 4px',
            margin: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: hasTitle ? '#e0e0e0' : '#666',
            fontSize: inputStyle.fontSize ?? 15,
            fontFamily: inputStyle.fontFamily ?? 'inherit',
            boxSizing: 'border-box',
            verticalAlign: 'middle',
          }}
        />
        </div>
      </div>

      {/* Развёрнутое содержимое: вложенные блоки (хендл на уровне ▼). При развороте создаётся одна строка. */}
      {!collapsed && (
        <div style={{ marginTop: 4 }}>
          {children.map((child) => (
            <NestedBlockItem
              key={child.id}
              child={child}
              inputStyle={inputStyle}
              onUpdate={updateChild}
              onDelete={deleteChild}
              onAddBelow={addChildBelow}
              onDuplicate={duplicateChild}
              handleKeyDown={handleKeyDown}
              dragState={nestedDragState}
              onDragStart={onNestedDragStart}
              onDragOver={onNestedDragOver}
              onDrop={onNestedDrop}
              onDragEnd={onNestedDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const btnStyle = {
  display: 'block',
  width: '100%',
  padding: '8px 12px',
  background: 'transparent',
  border: 'none',
  color: '#e0e0e0',
  textAlign: 'left',
  cursor: 'pointer',
  borderRadius: 4,
  fontSize: 14,
}
const typeMenuStyle = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: '#252525',
  border: '1px solid #444',
  borderRadius: 8,
  padding: 8,
  zIndex: 1000,
  minWidth: 200,
  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
}

export default function BlockEditor({ pageId, blocks: initialBlocks, onBlocksChange }) {
  const [blocks, setBlocks] = useState(initialBlocks || [])
  const [dragState, setDragState] = useState({ draggingId: null, overId: null })
  const [openTypeMenuBlockId, setOpenTypeMenuBlockId] = useState(null)

  const normalizeBlockProps = useCallback((b) => {
    const p = b.props
    const safeProps = (p != null && typeof p === 'object' && !Array.isArray(p)) ? p : {}
    return { ...b, props: safeProps }
  }, [])

  // При смене страницы или при новом списке блоков с сервера (в т.ч. после возврата) — подставляем блоки
  const blocksKey = initialBlocks?.map((b) => `${b.id}:${(b.props?.page_id ?? '')}`).join('|') ?? ''
  useEffect(() => {
    setBlocks((initialBlocks || []).map(normalizeBlockProps))
  }, [pageId, blocksKey, normalizeBlockProps])

  const handleUpdate = useCallback(async (blockId, patch) => {
    const updated = await updateBlock(blockId, patch)
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, ...updated } : b)))
    onBlocksChange?.()
  }, [onBlocksChange])

  const handleDelete = useCallback(async (blockId) => {
    await deleteBlock(blockId)
    setBlocks((prev) => prev.filter((b) => b.id !== blockId))
    onBlocksChange?.()
  }, [onBlocksChange])

  const handleAddBelow = useCallback(async (position, options = {}) => {
    const newBlock = await createBlock(pageId, { type: 'text', content: '', position })
    setBlocks((prev) => [...prev, newBlock].sort((a, b) => a.position - b.position))
    if (options.openTypeMenu !== false) setOpenTypeMenuBlockId(newBlock.id)
    onBlocksChange?.()
  }, [pageId, onBlocksChange])

  const handleDuplicate = useCallback(async (block) => {
    const newBlock = await createBlock(pageId, {
      type: block.type,
      content: block.content || '',
      props: block.props || null,
      position: block.position + 1,
    })
    setBlocks((prev) => [...prev, newBlock].sort((a, b) => a.position - b.position))
    onBlocksChange?.()
  }, [pageId, onBlocksChange])

  const handleSelectPageType = useCallback(async (block) => {
    const p = await createPage({ title: 'Страница', parent_id: pageId, icon: '📄' })
    const newProps = { ...(block.props || {}), page_id: p.id, emoji: '📄' }
    await updateBlock(block.id, { type: 'page', content: 'Страница', props: newProps })
    setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, type: 'page', content: 'Страница', props: newProps } : b)))
    onBlocksChange?.()
  }, [pageId, onBlocksChange])

  const handleDragStart = useCallback((e, block) => {
    setDragState({ draggingId: block.id, overId: null })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(block.id))
  }, [])

  const handleDragOver = useCallback((e, overBlock) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragState((s) => (s.draggingId ? { ...s, overId: overBlock.id } : s))
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragState({ draggingId: null, overId: null })
  }, [])

  const handleDrop = useCallback(async (e, overBlock) => {
    e.preventDefault()
    e.stopPropagation()
    const draggingId = e.dataTransfer.getData('text/plain')
    if (!draggingId || draggingId === String(overBlock.id)) return
    const sorted = [...blocks].sort((a, b) => a.position - b.position)
    const fromIndex = sorted.findIndex((b) => String(b.id) === draggingId)
    const toIndex = sorted.findIndex((b) => b.id === overBlock.id)
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return
    const [moved] = sorted.splice(fromIndex, 1)
    const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex
    sorted.splice(insertIndex, 0, moved)
    const reordered = sorted.map((b, i) => ({ ...b, position: i }))
    setBlocks(reordered)
    for (let i = 0; i < reordered.length; i++) {
      await updateBlock(reordered[i].id, { position: i })
    }
    onBlocksChange?.()
    setDragState({ draggingId: null, overId: null })
  }, [blocks, onBlocksChange])

  if (blocks.length === 0) {
    return (
      <EmptyBlock
        pageId={pageId}
        onCreated={(newBlocks) => {
          const list = Array.isArray(newBlocks) ? newBlocks : [newBlocks]
          setBlocks(list)
        }}
        onBlocksChange={onBlocksChange}
      />
    )
  }

  const sorted = [...blocks].sort((a, b) => a.position - b.position)

  return (
    <div className="kb-editor" style={{ width: '100%' }}>
      {sorted.map((block) => (
        <BlockItem
          key={block.id}
          block={block}
          pageId={pageId}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onAddBelow={handleAddBelow}
          onDuplicate={handleDuplicate}
          onReorder={handleDrop}
          onSelectPageType={handleSelectPageType}
          dragState={dragState}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          openTypeMenuBlockId={openTypeMenuBlockId}
          onClearOpenTypeMenu={() => setOpenTypeMenuBlockId(null)}
        />
      ))}
      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          onClick={() => handleAddBelow(blocks.length)}
          style={{
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px dashed #555',
            color: '#aaa',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          + Добавить блок
        </button>
      </div>
    </div>
  )
}

function EmptyBlock({ pageId, onCreated, onBlocksChange }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      const block = await createBlock(pageId, { type: 'text', content: '', position: 0 })
      onCreated([block])
      onBlocksChange?.()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={handleClick}
      style={{
        minHeight: 120,
        padding: 32,
        border: '2px dashed #555',
        borderRadius: 12,
        color: '#aaa',
        cursor: 'pointer',
        textAlign: 'center',
        fontSize: 15,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      {loading ? 'Создание...' : '+ Нажми сюда, чтобы добавить первый блок. В блоке нажми / для смены типа. Shift+Enter — новая строка.'}
    </div>
  )
}
