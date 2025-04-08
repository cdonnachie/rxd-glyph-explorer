"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { GlyphUI } from "@/lib/services/glyph-service"
import Image from "next/image"

interface GlyphCardProps {
  glyph: GlyphUI
  onClick: () => void
}

export function GlyphCard({ glyph, onClick }: GlyphCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="relative aspect-square bg-muted">
        <Image
          src={glyph.imageUrl || "/placeholder.svg?height=400&width=400"}
          alt={glyph.name}
          fill
          className="object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg truncate">{glyph.name}</h3>
        <p className="text-sm text-muted-foreground truncate">Type: {glyph.tokenType}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <p className="text-sm text-muted-foreground truncate">By {glyph.creator}</p>
        {glyph.rarity && <Badge variant={getRarityVariant(glyph.rarity)}>{getRarityLabel(glyph.rarity)}</Badge>}
      </CardFooter>
    </Card>
  )
}

function getRarityLabel(rarity: number): string {
  if (rarity >= 90) return "Legendary"
  if (rarity >= 75) return "Epic"
  if (rarity >= 50) return "Rare"
  if (rarity >= 25) return "Uncommon"
  return "Common"
}

function getRarityVariant(rarity: number): "default" | "secondary" | "destructive" | "outline" {
  if (rarity >= 90) return "destructive"
  if (rarity >= 75) return "default"
  if (rarity >= 50) return "secondary"
  return "outline"
}

