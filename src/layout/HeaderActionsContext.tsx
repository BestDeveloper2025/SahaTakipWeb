import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type HeaderCtx = {
  /** Sağ üst (ör. Çıkış); null ile temizlenir */
  setHeaderEnd: (node: ReactNode | null) => void
  headerEnd: ReactNode | null
}

const Ctx = createContext<HeaderCtx | null>(null)

export function HeaderActionsProvider({ children }: { children: ReactNode }) {
  const [headerEnd, setHeaderEndState] = useState<ReactNode | null>(null)
  const setHeaderEnd = useCallback((node: ReactNode | null) => {
    setHeaderEndState(node)
  }, [])

  const value = useMemo<HeaderCtx>(
    () => ({ headerEnd, setHeaderEnd }),
    [headerEnd, setHeaderEnd],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useHeaderActions(): HeaderCtx {
  const v = useContext(Ctx)
  if (!v) {
    throw new Error('useHeaderActions HeaderActionsProvider içinde kullanılmalı')
  }
  return v
}
