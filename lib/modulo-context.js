"use client"
import { createContext, useContext } from "react"

const ModuloContext = createContext(null)

export function useModulo() {
  const ctx = useContext(ModuloContext)
  if (!ctx) throw new Error("useModulo debe usarse dentro de ModuloContext.Provider")
  return ctx
}

export default ModuloContext
