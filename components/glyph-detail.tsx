"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { GlyphUI } from "@/lib/services/glyph-service"
import { Calendar, User, Hash, Layers, X, Tag } from "lucide-react"
import Image from "next/image"

interface GlyphDetailProps {
  glyph: GlyphUI
  onClose: () => void
}

export function GlyphDetail({ glyph, onClose }: GlyphDetailProps) {
  return (
    <Dialog open={!!glyph} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">{glyph.name}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          <DialogDescription>Ref: {glyph.ref}</DialogDescription>
        </DialogHeader>

        <div className="relative aspect-square w-full bg-muted rounded-md overflow-hidden">
          <Image
            src={glyph.imageUrl || "/placeholder.svg?height=400&width=400"}
            alt={glyph.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            {glyph.rarity && (
              <Badge variant={getRarityVariant(glyph.rarity)} className="px-3 py-1">
                {getRarityLabel(glyph.rarity)} ({glyph.rarity}/100)
              </Badge>
            )}
            <Badge variant="outline" className="px-3 py-1">
              {glyph.tokenType}
            </Badge>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Creator:</span>
              <span className="font-medium">{glyph.creator}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">{new Date(glyph.createdAt).toLocaleDateString()}</span>
            </div>

            {glyph.transactionHash && (
              <div className="flex items-center gap-2 text-sm">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Transaction:</span>
                <span className="font-medium truncate">{glyph.transactionHash}</span>
              </div>
            )}

            {glyph.blockNumber && (
              <div className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Block:</span>
                <span className="font-medium">{glyph.blockNumber}</span>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{glyph.description}</p>
          </div>

          {glyph.attributes && glyph.attributes.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Attributes</h4>
                <div className="grid grid-cols-2 gap-2">
                  {glyph.attributes.map((attr, index) => (
                    <div key={index} className="bg-muted rounded-md p-2">
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{attr.trait_type}</p>
                      </div>
                      <p className="font-medium text-sm">{attr.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
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

