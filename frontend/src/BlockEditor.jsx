import { useCallback, useEffect, useRef, useState } from 'react'
import { createBlock, updateBlock, deleteBlock } from './api'

const BLOCK_TYPES = [
  { type: 'text', label: 'Текст' },
  { type: 'heading1', label: 'Заголовок 1' },
  { type: 'heading2', label: 'Заголовок 2' },
  { type: 'heading3', label: 'Заголовок 3' },
  { type: 'bulleted_list', label: 'Маркированный список' },
  { type: 'numbered_list', label: 'Нумерованный список' },
  { type: 'to_do', label: 'Чекбокс' },
  { type: 'code', label: 'Код' },
  { type: 'quote', label: 'Цитата' },
]

function BlockItem({ block, pageId, onUpdate, onDelete, onAddBelow, isLast }) {
  const [content, setContent] = useState(block.content || '')
  const [showMenu, setShowMenu] = useState(false)
  useEffect(() => {
    if (!showMenu) return
    const close = () => setShowMenu(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showMenu])
  const [localType, setLocalType] = useState(block.type)
  const inputRef = useRef(null)

  useEffect(() => {
    setContent(block.content || '')
    setLocalType(block.type)
  }, [block.id])

  useEffect(() => {
    if (content === (block.content || '') && localType === block.type) return
    const t = setTimeout(() => onUpdate(block.id, { content, type: localType }), 500)
    return () => clearTimeout(t)
  }, [content, localType, block.id, block.content, block.type, onUpdate])


  const handleKeyDown = (e) => {
    if (e.key === '/') {
      setShowMenu(true)
      e.preventDefault()
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onAddBelow(block.position + 1)
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
  const isHeading = localType.startsWith('heading')
  const headingLevel = localType === 'heading1' ? 1 : localType === 'heading2' ? 2 : 3

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
  }
  if (isQuote) inputStyle.borderLeft = '4px solid #444'
  if (isQuote) inputStyle.paddingLeft = 16

  return (
    <div className="kb-block-wrap" style={{ marginBottom: 8 }}>
      {showMenu && (
        <div
          className="kb-type-menu"
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            background: '#252525',
            border: '1px solid #444',
            borderRadius: 8,
            padding: 8,
            zIndex: 1000,
            minWidth: 200,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {BLOCK_TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => {
                setLocalType(t.type)
                setShowMenu(false)
                onUpdate(block.id, { type: t.type })
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: localType === t.type ? '#4a9eff' : '#e0e0e0',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: 4,
              }}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => setShowMenu(false)}
            style={{
              marginTop: 8,
              padding: '6px 12px',
              background: '#333',
              border: 'none',
              color: '#999',
              cursor: 'pointer',
              borderRadius: 4,
            }}
          >
            Закрыть
          </button>
        </div>
      )}
      {isTodo ? (
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={content.startsWith('[x]')}
            onChange={(e) => {
              const text = content.replace(/^\[[ x]\]\s*/, '')
              setContent(e.target.checked ? '[x] ' + text : '[ ] ' + text)
            }}
            style={{ marginTop: 10 }}
          />
          <textarea
            ref={inputRef}
            value={content.replace(/^\[[ x]\]\s*/, '')}
            onChange={(e) => setContent((content.startsWith('[x]') ? '[x] ' : '[ ] ') + e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Задача"
            rows={1}
            style={{ ...inputStyle, flex: 1 }}
          />
        </label>
      ) : (
        <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
          placeholder={`Напиши или / для меню`}
          rows={isCode ? 5 : 1}
          style={inputStyle}
        />
      )}
    </div>
  )
}

export default function BlockEditor({ pageId, blocks: initialBlocks, onBlocksChange }) {
  const [blocks, setBlocks] = useState(initialBlocks || [])

  useEffect(() => {
    setBlocks(initialBlocks || [])
  }, [pageId, initialBlocks?.length])

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

  const handleAddBelow = useCallback(async (position) => {
    const newBlock = await createBlock(pageId, { type: 'text', content: '', position })
    setBlocks((prev) => {
      const next = [...prev, newBlock].sort((a, b) => a.position - b.position)
      return next
    })
    onBlocksChange?.()
  }, [pageId, onBlocksChange])

  if (blocks.length === 0) {
    return (
      <EmptyBlock
        pageId={pageId}
        onCreated={(b) => setBlocks([b])}
        onBlocksChange={onBlocksChange}
      />
    )
  }

  const sorted = [...blocks].sort((a, b) => a.position - b.position)

  return (
    <div className="kb-editor">
      {sorted.map((block) => (
        <BlockItem
          key={block.id}
          block={block}
          pageId={pageId}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onAddBelow={handleAddBelow}
        />
      ))}
      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => handleAddBelow(blocks.length)}
          type="button"
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
      {loading ? 'Создание...' : '+ Нажми сюда, чтобы добавить первый блок. В блоке нажми / для смены типа.'}
    </div>
  )
}
