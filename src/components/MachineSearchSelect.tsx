import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  filterMachinesByQuery,
  type MachineListItem,
} from '../api/machines'
import './MachineSearchSelect.css'

type MachineSearchSelectProps = {
  machines: MachineListItem[]
  value: string
  onChange: (machineName: string) => void
  disabled?: boolean
  loading?: boolean
  placeholder?: string
  id?: string
}

export function MachineSearchSelect({
  machines,
  value,
  onChange,
  disabled = false,
  loading = false,
  placeholder = 'Makina ara veya seç…',
  id,
}: MachineSearchSelectProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const listboxId = `${inputId}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const filtered = useMemo(
    () => filterMachinesByQuery(machines, query),
    [machines, query],
  )

  function selectMachine(name: string) {
    onChange(name)
    setQuery(name)
    setOpen(false)
  }

  return (
    <div
      className="machine-search"
      ref={rootRef}
      data-open={open ? 'true' : 'false'}
    >
      <input
        id={inputId}
        className="machine-search-input"
        type="text"
        value={query}
        placeholder={loading ? 'Makineler yükleniyor…' : placeholder}
        disabled={disabled || loading}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange('')
          setOpen(true)
        }}
      />
      {open && !disabled && !loading ? (
        <ul
          id={listboxId}
          className="machine-search-list"
          role="listbox"
          aria-label="Makina listesi"
        >
          {filtered.length === 0 ? (
            <li className="machine-search-empty" role="option" aria-disabled>
              Eşleşen makina bulunamadı
            </li>
          ) : (
            filtered.map((machine) => (
              <li key={machine.id} role="option" aria-selected={value === machine.name}>
                <button
                  type="button"
                  className={
                    value === machine.name
                      ? 'machine-search-option machine-search-option--selected'
                      : 'machine-search-option'
                  }
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectMachine(machine.name)}
                >
                  {machine.name}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
