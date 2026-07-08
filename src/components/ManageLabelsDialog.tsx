import { Autocomplete, Box, Button, Chip, Dialog, TextField, Typography } from '@mui/material'
import { useCallback, type JSX } from 'react'
import type { Note } from '../data/note'
import { useNotes } from '../context/NotesContext'
import './ManageLabelsDialog.less'

interface ManageLabelsDialogProps {
  note: Note | null
  onClose: () => void
}

const EMPTY_VALUE: string[] = []

export default function ManageLabelsDialog({ note, onClose }: ManageLabelsDialogProps): JSX.Element {
  const { updateNote, allLabels } = useNotes()

  const handleRemove = useCallback(
    (label: string) => {
      if (!note) return
      updateNote(note.id, { labels: note.labels.filter((l) => l !== label) })
    },
    [note, updateNote],
  )

  const handleAdd = useCallback(
    (raw: string) => {
      if (!note) return
      const cleaned = raw.trim()
      if (!cleaned || note.labels.includes(cleaned)) return
      updateNote(note.id, { labels: [...note.labels, cleaned] })
    },
    [note, updateNote],
  )

  const suggestions = note ? allLabels.filter((l) => !note.labels.includes(l)) : []

  return (
    <Dialog
      open={!!note}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disableScrollLock
      slotProps={{ paper: { className: 'manage-labels-dialog' } }}
    >
      {note && (
        <Box className="manage-labels-dialog-content">
          <Typography className="manage-labels-dialog-title">Libellés de « {note.title || 'Sans titre'} »</Typography>

          <Box className="manage-labels-dialog-list">
            {note.labels.length === 0 && (
              <Typography className="manage-labels-dialog-empty">Aucun libellé pour l'instant.</Typography>
            )}
            {note.labels.map((label) => (
              <Chip
                key={label}
                label={label}
                onDelete={() => handleRemove(label)}
                className="manage-labels-dialog-chip"
              />
            ))}
          </Box>

          <Autocomplete
            multiple
            freeSolo
            size="small"
            options={suggestions}
            value={EMPTY_VALUE}
            onChange={(_, newValue) => {
              const added = newValue[newValue.length - 1]
              if (added) handleAdd(added)
            }}
            renderInput={(params) => <TextField {...params} variant="outlined" placeholder="Ajouter un libellé…" />}
          />

          <Box className="manage-labels-dialog-actions">
            <Button variant="contained" onClick={onClose}>
              Fermer
            </Button>
          </Box>
        </Box>
      )}
    </Dialog>
  )
}
