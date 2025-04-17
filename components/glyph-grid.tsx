"use client"

import type { GlyphUI } from "@/lib/services/glyph-service"
import { GlyphCard } from "@/components/glyph-card"
import { useEffect, useState } from "react"

interface GlyphGridProps {
  glyphs: GlyphUI[]
  onGlyphSelect: (glyph: GlyphUI) => void
  onCreatorClick?: (creator: string) => void
}

export function GlyphGrid({ glyphs, onGlyphSelect, onCreatorClick }: GlyphGridProps) {
  const [visibleGlyphs, setVisibleGlyphs] = useState<GlyphUI[]>([])

  useEffect(() => {
    // Deduplicate glyphs by ID to prevent duplicates
    const uniqueGlyphs = glyphs.filter((glyph, index, self) => index === self.findIndex((g) => g.id === glyph.id))

    // Stagger the appearance of new glyphs for a smoother loading experience
    const newGlyphs = uniqueGlyphs.filter((glyph) => !visibleGlyphs.some((vg) => vg.id === glyph.id))

    if (newGlyphs.length > 0) {
      // If this is the initial load, show all at once
      if (visibleGlyphs.length === 0) {
        setVisibleGlyphs(uniqueGlyphs)
        return
      }

      // Otherwise, stagger the appearance
      let count = 0
      const interval = setInterval(() => {
        if (count < newGlyphs.length) {
          setVisibleGlyphs((prev) => {
            // Make sure we don't add duplicates
            const newGlyph = newGlyphs[count]
            if (newGlyph && !prev.some((g) => g.id === newGlyph.id)) {
              return [...prev, newGlyph]
            }
            return prev
          })
          count++
        } else {
          clearInterval(interval)
        }
      }, 50) 

      return () => clearInterval(interval)
    } else {
      // If there are no new glyphs but the total has changed (e.g., after filtering),
      // update to match the current glyphs array, ensuring no duplicates
      if (glyphs.length !== visibleGlyphs.length) {
        setVisibleGlyphs(uniqueGlyphs)
      }
    }
  }, [glyphs])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {visibleGlyphs.map((glyph, index) => (
        <div
          key={`${glyph.id}-${index}`}
          className="opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]"
          style={{
            animationDelay: `${Math.random() * 0.2}s`,
          }}
        >
          <GlyphCard glyph={glyph} onClick={() => onGlyphSelect(glyph)} onCreatorClick={onCreatorClick} />
        </div>
      ))}
    </div>
  )
}
