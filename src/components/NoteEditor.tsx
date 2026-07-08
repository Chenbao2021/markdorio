import { Box, IconButton, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type JSX, type UIEvent } from 'react'
import type { Note } from '../data/note'
import { useAuth } from '../context/AuthContext'
import { useNotes } from '../context/NotesContext'
import { useNotesSync } from '../hooks/useNotesSync'
import { FONT_MAP } from '../data/fonts'
import { NEW_NOTE_PLACEHOLDER } from '../data/newNoteTemplate'
import { loadGoogleFont } from '../utils/loadGoogleFont'
import MarkdownPreview from './MarkdownPreview'
import ManageLabelsDialog from './ManageLabelsDialog'
import ShareDialog from './ShareDialog'
import './NoteEditor.less'

interface NoteEditorProps {
  note: Note
  autoSave: boolean
}

const LabelDoodle = (): JSX.Element => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="note-editor-labels-icon">
    <path d="M2 2 H7.5 L14 8.5 L8.5 14 L2 7.5 Z" stroke="#6b7280" strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="4.7" cy="4.7" r="1" fill="#6b7280" />
  </svg>
)

const ShareDoodle = (): JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="12.5" cy="3.5" r="2" stroke="#2d2d2d" strokeWidth="1.4" />
    <circle cx="3.5" cy="8" r="2" stroke="#2d2d2d" strokeWidth="1.4" />
    <circle cx="12.5" cy="12.5" r="2" stroke="#2d2d2d" strokeWidth="1.4" />
    <path d="M5.3 7 L10.7 4 M5.3 9 L10.7 12" stroke="#2d2d2d" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)

type MobileView = 'write' | 'preview'

export default function NoteEditor({ note, autoSave }: NoteEditorProps): JSX.Element {
  const { updateNote } = useNotes()
  const { user } = useAuth()
  const { syncNow } = useNotesSync()
  const [mobileView, setMobileView] = useState<MobileView>('write')
  const [isLabelsDialogOpen, setIsLabelsDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const programmaticScroll = useRef<'write' | 'preview' | null>(null)

  useEffect(() => {
    if (note.fontFamily) {
      const font = FONT_MAP[note.fontFamily]
      if (font) loadGoogleFont(font.googleParam)
    }
  }, [note.fontFamily])

  const handleTitleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => updateNote(note.id, { title: e.target.value }),
    [note.id, updateNote],
  )

  const handleContentChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => updateNote(note.id, { content: e.target.value }),
    [note.id, updateNote],
  )

  const handleTextareaBlur = useCallback(() => {
    if (autoSave && user) void syncNow()
  }, [autoSave, user, syncNow])

  const handleMobileViewChange = useCallback((_: unknown, value: MobileView | null) => {
    if (value) setMobileView(value)
  }, [])

  const handleWriteScroll = useCallback((_: UIEvent<HTMLTextAreaElement>) => {
    if (programmaticScroll.current === 'write') {
      programmaticScroll.current = null
      return
    }
    const textarea = textareaRef.current
    const preview = previewRef.current
    if (!textarea || !preview) return
    const maxScroll = textarea.scrollHeight - textarea.clientHeight
    const ratio = maxScroll > 0 ? textarea.scrollTop / maxScroll : 0
    programmaticScroll.current = 'preview'
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight)
  }, [])

  const handlePreviewScroll = useCallback((_: UIEvent<HTMLDivElement>) => {
    if (programmaticScroll.current === 'preview') {
      programmaticScroll.current = null
      return
    }
    const textarea = textareaRef.current
    const preview = previewRef.current
    if (!textarea || !preview) return
    const maxScroll = preview.scrollHeight - preview.clientHeight
    const ratio = maxScroll > 0 ? preview.scrollTop / maxScroll : 0
    programmaticScroll.current = 'write'
    textarea.scrollTop = ratio * (textarea.scrollHeight - textarea.clientHeight)
  }, [])

  const activeFontFamily = note.fontFamily ? (FONT_MAP[note.fontFamily]?.family ?? null) : null

  return (
    <Box className="note-editor">
      <Box
        className={`note-editor-topbar${mobileView === 'preview' ? ' is-hidden-mobile-preview' : ''}`}
      >
        <TextField
          variant="standard"
          placeholder="Sans titre"
          value={note.title}
          onChange={handleTitleChange}
          className="note-editor-title-input"
          slotProps={{ input: { disableUnderline: true } }}
        />
        <Box
          className="note-editor-labels-summary"
          onClick={() => setIsLabelsDialogOpen(true)}
          role="button"
          tabIndex={0}
        >
          <LabelDoodle />
          <Typography className="note-editor-labels-summary-text">
            {note.labels.length === 0 ? 'Ajouter un libellé' : note.labels[0]}
          </Typography>
          {note.labels.length > 1 && (
            <span className="note-editor-labels-more">+{note.labels.length - 1}</span>
          )}
        </Box>
        <IconButton
          className="note-editor-share-btn note-editor-share-btn--desktop"
          aria-label="Partager la note"
          onClick={() => setIsShareDialogOpen(true)}
        >
          <ShareDoodle />
        </IconButton>
      </Box>

      <Box className="note-editor-mobile-bar">
        <ToggleButtonGroup
          className="note-editor-mobile-toggle"
          value={mobileView}
          exclusive
          onChange={handleMobileViewChange}
          size="small"
        >
          <ToggleButton value="write">Écriture</ToggleButton>
          <ToggleButton value="preview">Aperçu</ToggleButton>
        </ToggleButtonGroup>
        <IconButton
          className="note-editor-share-btn note-editor-share-btn--mobile"
          aria-label="Partager la note"
          onClick={() => setIsShareDialogOpen(true)}
        >
          <ShareDoodle />
        </IconButton>
      </Box>

      <Box className="note-editor-panes">
        <Box
          className={`note-editor-pane note-editor-pane--write${mobileView === 'write' ? ' is-active-mobile' : ''}`}
        >
          <textarea
            ref={textareaRef}
            className="note-editor-textarea"
            value={note.content}
            onChange={handleContentChange}
            onScroll={handleWriteScroll}
            onBlur={handleTextareaBlur}
            spellCheck={false}
            placeholder={NEW_NOTE_PLACEHOLDER}
          />
        </Box>
        <Box
          className={`note-editor-pane note-editor-pane--preview${mobileView === 'preview' ? ' is-active-mobile' : ''}`}
        >
          <MarkdownPreview
            ref={previewRef}
            content={note.content}
            fontFamily={activeFontFamily}
            onScroll={handlePreviewScroll}
          />
        </Box>
      </Box>

      <ManageLabelsDialog note={isLabelsDialogOpen ? note : null} onClose={() => setIsLabelsDialogOpen(false)} />
      <ShareDialog note={isShareDialogOpen ? note : null} onClose={() => setIsShareDialogOpen(false)} />
    </Box>
  )
}
