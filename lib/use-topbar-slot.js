"use client"
import { useEffect } from "react"
import { useModulo } from "./modulo-context"

export function useTopbarSlot(node, deps = []) {
  const { setTopbarSlot } = useModulo()

  // Actualiza el slot cuando cambian las deps — sin limpiar entre actualizaciones,
  // para que el componente no se desmonte/remonte y pierda su estado local.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setTopbarSlot(node) }, deps)

  // Solo limpia al desmontar el módulo completo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => setTopbarSlot(null), [])
}
