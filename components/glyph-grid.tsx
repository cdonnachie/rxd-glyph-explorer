"use client"

import type { GlyphUI } from "@/lib/services/glyph-service"
import { GlyphCard } from "@/components/glyph-card"

interface GlyphGridProps {
  glyphs: GlyphUI[]
  onGlyphSelect: (glyph: GlyphUI) => void
}

export function GlyphGrid({ glyphs, onGlyphSelect }: GlyphGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {glyphs.map((glyph) => (
        <GlyphCard key={glyph.id} glyph={glyph} onClick={() => onGlyphSelect(glyph)} />
      ))}
    </div>
  )
}

