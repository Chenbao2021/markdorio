import { Box, Button, Chip, IconButton, Typography } from '@mui/material'
import { useMemo, useState, type JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Note } from '../data/note'
import { useNotes } from '../context/NotesContext'
import { usePublicSharedNotes, type PublicSharedNote } from '../hooks/usePublicSharedNotes'
import FilterNotesDialog, { type DateFilter } from './FilterNotesDialog'
import './NotesSidebar.less'

interface NotesSidebarProps {
  onRequestDelete: (note: Note) => void
  onNoteSelected?: () => void
}

const TrashDoodle = (): JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M3 5 H15" stroke="#2d2d2d" strokeWidth="1.6" strokeLinecap="round" />
    <path
      d="M6 5 V3.5 A1 1 0 0 1 7 2.5 H11 A1 1 0 0 1 12 3.5 V5"
      stroke="#2d2d2d"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.5 5 L5.3 15 A1 1 0 0 0 6.3 16 H11.7 A1 1 0 0 0 12.7 15 L13.5 5"
      stroke="#2d2d2d"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const SearchDoodle = (): JSX.Element => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="7.5" cy="7.5" r="5" stroke="#2d2d2d" strokeWidth="1.6" />
    <path d="M11.5 11.5 L16 16" stroke="#2d2d2d" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const ChevronDoodle = ({ isOpen }: { isOpen: boolean }): JSX.Element => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
    className={`notes-sidebar-chevron${isOpen ? ' is-open' : ''}`}
  >
    <path d="M3 4.5 L6 7.5 L9 4.5" stroke="#2d2d2d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const GlobeDoodle = (): JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="#6b7280" strokeWidth="1.4" />
    <path d="M2 8 H14 M8 2 C10 4.5 10 11.5 8 14 C6 11.5 6 4.5 8 2" stroke="#6b7280" strokeWidth="1.2" fill="none" />
  </svg>
)

function formatRelativeTime(timestamp: number): string {
  const diffMin = Math.round((Date.now() - timestamp) / 60000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH} h`
  const diffDays = Math.round(diffH / 24)
  return `il y a ${diffDays} j`
}

function matchesDateFilter(timestamp: number, filter: DateFilter): boolean {
  if (filter === 'all') return true
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  if (filter === 'today') return new Date(timestamp).toDateString() === new Date(now).toDateString()
  if (filter === '7d') return now - timestamp <= 7 * dayMs
  if (filter === '30d') return now - timestamp <= 30 * dayMs
  return true
}

interface NoteListItemProps {
  note: Note
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}

function NoteListItem({ note, isActive, onSelect, onDelete }: NoteListItemProps): JSX.Element {
  return (
    <Box className={`notes-sidebar-item${isActive ? ' is-active' : ''}`} onClick={onSelect}>
      <Box className="notes-sidebar-item-main">
        <Typography className="notes-sidebar-item-title">{note.title || 'Sans titre'}</Typography>
        <Typography className="notes-sidebar-item-time">{formatRelativeTime(note.updatedAt)}</Typography>
        {note.labels.length > 0 && (
          <Box className="notes-sidebar-item-labels">
            {note.labels.map((label) => (
              <Chip key={label} label={label} size="small" className="notes-sidebar-item-label" />
            ))}
          </Box>
        )}
      </Box>
      <IconButton
        className="notes-sidebar-item-delete"
        aria-label="Supprimer la note"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <TrashDoodle />
      </IconButton>
    </Box>
  )
}

interface PublicNoteListItemProps {
  note: PublicSharedNote
  onSelect: () => void
}

function PublicNoteListItem({ note, onSelect }: PublicNoteListItemProps): JSX.Element {
  return (
    <Box className="notes-sidebar-item notes-sidebar-item--public" onClick={onSelect}>
      <Box className="notes-sidebar-item-main">
        <Box className="notes-sidebar-item-title-row">
          <GlobeDoodle />
          <Typography className="notes-sidebar-item-title">{note.title || 'Sans titre'}</Typography>
        </Box>
        <Typography className="notes-sidebar-item-time">{formatRelativeTime(note.updatedAt)}</Typography>
      </Box>
    </Box>
  )
}

interface UnlabeledEntry {
  id: string
  updatedAt: number
  render: () => JSX.Element
}

export default function NotesSidebar({ onRequestDelete, onNoteSelected }: NotesSidebarProps): JSX.Element {
  const { notes, selectedNoteId, selectNote, createNote, allLabels } = useNotes()
  const navigate = useNavigate()
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [openLabel, setOpenLabel] = useState<string | null>(null)
  const { publicNotes } = usePublicSharedNotes()

  const hasActiveFilters = selectedLabels.length > 0 || dateFilter !== 'all'

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) => {
        const labelMatch =
          selectedLabels.length === 0 || note.labels.some((label) => selectedLabels.includes(label))
        return labelMatch && matchesDateFilter(note.updatedAt, dateFilter)
      }),
    [notes, selectedLabels, dateFilter],
  )

  const labelGroups = useMemo(
    () =>
      allLabels
        .map((label) => ({
          label,
          notes: filteredNotes.filter((note) => note.labels.includes(label)),
        }))
        .filter((group) => group.notes.length > 0),
    [allLabels, filteredNotes],
  )

  const unlabeledNotes = useMemo(
    () => filteredNotes.filter((note) => note.labels.length === 0),
    [filteredNotes],
  )

  const publicSidebarNotes = useMemo(
    () =>
      selectedLabels.length === 0
        ? publicNotes.filter((note) => matchesDateFilter(note.updatedAt, dateFilter))
        : [],
    [publicNotes, selectedLabels, dateFilter],
  )

  const unlabeledEntries = useMemo<UnlabeledEntry[]>(() => {
    const own: UnlabeledEntry[] = unlabeledNotes.map((note) => ({
      id: note.id,
      updatedAt: note.updatedAt,
      render: () => (
        <NoteListItem
          key={note.id}
          note={note}
          isActive={note.id === selectedNoteId}
          onSelect={() => {
            selectNote(note.id)
            onNoteSelected?.()
          }}
          onDelete={() => onRequestDelete(note)}
        />
      ),
    }))
    const pub: UnlabeledEntry[] = publicSidebarNotes.map((note) => ({
      id: note.id,
      updatedAt: note.updatedAt,
      render: () => (
        <PublicNoteListItem key={note.id} note={note} onSelect={() => navigate(`/share/${note.id}`)} />
      ),
    }))
    return [...own, ...pub].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [unlabeledNotes, publicSidebarNotes, selectedNoteId, selectNote, onNoteSelected, onRequestDelete, navigate])

  const resetFilters = () => {
    setSelectedLabels([])
    setDateFilter('all')
  }

  return (
    <Box className="notes-sidebar">
      <Box className="notes-sidebar-actions">
        <IconButton
          className={`notes-sidebar-filter-btn${hasActiveFilters ? ' has-active-filters' : ''}`}
          aria-label="Filtrer les notes"
          onClick={() => setFilterDialogOpen(true)}
        >
          <SearchDoodle />
        </IconButton>
        <Button
          variant="outlined"
          className="notes-sidebar-new-btn"
          onClick={() => {
            createNote()
            onNoteSelected?.()
          }}
        >
          + Nouvelle note
        </Button>
      </Box>
      <Box className="notes-sidebar-list">
        {filteredNotes.length === 0 && publicSidebarNotes.length === 0 && (
          <Typography className="notes-sidebar-empty">
            {notes.length === 0 ? 'Pas encore de note.' : 'Aucune note ne correspond aux filtres.'}
          </Typography>
        )}
        {labelGroups.map((group) => {
          const isOpen = openLabel === group.label
          return (
            <Box key={group.label} className="notes-sidebar-label-group">
              <Box
                className="notes-sidebar-label-header"
                onClick={() => setOpenLabel(isOpen ? null : group.label)}
                role="button"
                tabIndex={0}
              >
                <Typography className="notes-sidebar-label-title">{group.label}</Typography>
                <Typography className="notes-sidebar-label-count">{group.notes.length}</Typography>
                <ChevronDoodle isOpen={isOpen} />
              </Box>
              {isOpen && (
                <Box className="notes-sidebar-label-list">
                  {group.notes.map((note) => (
                    <NoteListItem
                      key={note.id}
                      note={note}
                      isActive={note.id === selectedNoteId}
                      onSelect={() => {
                        selectNote(note.id)
                        onNoteSelected?.()
                      }}
                      onDelete={() => onRequestDelete(note)}
                    />
                  ))}
                </Box>
              )}
            </Box>
          )
        })}
        {unlabeledEntries.map((entry) => entry.render())}
      </Box>

      <FilterNotesDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        allLabels={allLabels}
        selectedLabels={selectedLabels}
        onSelectedLabelsChange={setSelectedLabels}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        onReset={resetFilters}
      />
    </Box>
  )
}
