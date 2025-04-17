"use client"

import type React from "react"
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
import { fetchGlyphByRef } from "@/lib/actions/glyph-actions"
import { Calendar, User, Hash, Layers, X, Tag, Package, LinkIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useQRCode } from "next-qrcode"
import { useEffect, useRef, useState, useTransition } from "react"

interface GlyphDetailProps {
  glyph: GlyphUI
  onClose: () => void
  onGlyphSelect?: (glyph: GlyphUI) => void
}

export function GlyphDetail({ glyph, onClose, onGlyphSelect }: GlyphDetailProps) {
  const [isPending, startTransition] = useTransition()
  const { Canvas } = useQRCode()
  const [hoverItem, setHoverItem] = useState<GlyphUI | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 })
  const previewRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleContainerItemClick = (item: GlyphUI) => {
    setHoverItem(null)
    onGlyphSelect?.(item)
  }

  const handleContainerClick = () => {
    if (glyph.containerRef && onGlyphSelect) {
      startTransition(async () => {
        const detailedGlyph = await fetchGlyphByRef(glyph.containerRef!)
        if (detailedGlyph && detailedGlyph.length > 0) {
          onGlyphSelect(detailedGlyph[0])
        }
      })
    }
  }

  const handleCreatorClick = () => {
    if (glyph.creator && onGlyphSelect) {
      startTransition(async () => {
        const creatorGlyphs = await fetchGlyphByRef(glyph.creator)
        if (creatorGlyphs && creatorGlyphs.length > 0) {
          onGlyphSelect(creatorGlyphs[0])
        }
      })
    }
  }

  const handleItemMouseEnter = (e: React.MouseEvent<HTMLDivElement>, item: GlyphUI) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const dialogRect = e.currentTarget.closest('[role="dialog"]')?.getBoundingClientRect() || { left: 0, top: 0 }

    // Calculate position relative to the viewport
    const left = rect.right + 8
    const top = rect.top

    setHoverPosition({ top, left })
    setHoverItem(item)
  }

  const handleItemMouseLeave = () => {
    setHoverItem(null)
  }

  // Create a portal for the hover preview outside the dialog
  useEffect(() => {
    // Create a container for the hover preview if it doesn't exist
    let hoverContainer = document.getElementById("hover-preview-container")
    if (!hoverContainer) {
      hoverContainer = document.createElement("div")
      hoverContainer.id = "hover-preview-container"
      hoverContainer.style.position = "fixed"
      hoverContainer.style.zIndex = "9999"
      hoverContainer.style.pointerEvents = "none"
      document.body.appendChild(hoverContainer)
    }

    return () => {
      // Clean up the container when the component unmounts
      if (hoverContainer && document.body.contains(hoverContainer)) {
        document.body.removeChild(hoverContainer)
      }
    }
  }, [])

  // Update the hover preview when hoverItem or hoverPosition changes
  useEffect(() => {
    const hoverContainer = document.getElementById("hover-preview-container")
    if (!hoverContainer) return

    if (hoverItem && hoverItem.embedType?.includes("image")) {

      // Create or update the hover preview
      hoverContainer.innerHTML = `
        <div 
          style="
            position: fixed;
            top: ${hoverPosition.top - 100}px;
            left: ${hoverPosition.left}px;
            width: 200px;
            background-color: #262626;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            animation: fadeIn 0.2s ease-out;
            z-index: 9999;
          "
        >
          <div style="padding: 8px;">
            <div style="position: relative; width: 100%; padding-top: 100%; background-color: #1a1a1a; border-radius: 4px; overflow: hidden;">
              <img 
                src="${hoverItem.image || "/radiant-logo.png?height=200&width=200"}" 
                alt="${hoverItem.name}" 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: fill;"
                crossorigin="anonymous"
              />
            </div>
            <div style="margin-top: 8px;">
              <p style="font-weight: 500; color: white; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${hoverItem.name}</p>
              <p style="color: #a0a0a0; font-size: 12px; margin: 2px 0 0 0;">${hoverItem.tokenType}</p>
              ${hoverItem.creatorName ? `<p style="color: #a0a0a0; font-size: 12px; margin: 2px 0 0 0;">By: ${hoverItem.creatorName}</p>` : ""}
            </div>
          </div>
        </div>
      `
      hoverContainer.style.display = "block"
    } else {
      // Hide the hover preview
      hoverContainer.style.display = "none"
    }
  }, [hoverItem, hoverPosition])

  const imageSrc = glyph.image || glyph.imageUrl || "/radiant-logo.png?height=400&width=400"
  const embedType = glyph.embedType?.includes("image")
    ? "image"
    : glyph.embedType?.includes("text")
      ? "text"
      : glyph.embedType?.includes("audio")
        ? "audio"
        : "unknown"

  return (
    <Dialog open={!!glyph} onOpenChange={(open) => !open && onClose()} modal>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto w-[95vw] p-4 sm:p-6">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">
              {glyph.name}
              {glyph.spent && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Spent
                </Badge>
              )}
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          <DialogDescription className="flex flex-wrap items-center">
            <span className="mr-1">Ref:</span>
            <Link
              href={`${process.env.NEXT_PUBLIC_RXD_EXPLORER_TX_URL}${glyph.ref}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline truncate max-w-[180px] sm:max-w-full"
              title={glyph.ref}>
              {glyph.ref}
            </Link>
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-square w-full max-h-[300px] sm:max-h-[400px] bg-muted rounded-md overflow-hidden">
          <>
            {glyph.remote && glyph.remote.url && (
              <div className="flex flex-row items-center justify-center h-full">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-muted text-sm p-1 rounded flex flex-col items-center space-y-2">
                  <div className="w-full sm:w-80 h-auto sm:h-80 flex items-center justify-center">
                    <Canvas
                      text={glyph.remote.url}
                      options={{
                        type: "image/jpeg",
                        quality: 0.5,
                        errorCorrectionLevel: "H",
                        margin: 3,
                        scale: 4,
                        width: 320,
                      }}
                      logo={{
                        src: "/radiant-logo.png",
                        options: {
                          width: 80,
                          x: undefined,
                          y: undefined,
                        },
                      }}
                    />
                  </div>
                  <Link
                    className="text-blue-500 underline text-center break-all text-xs sm:text-sm"
                    href={glyph.remote.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {glyph.remote.url}
                  </Link>
                </div>
              </div>
            )}
            {embedType === "image" && (
              <Image src={imageSrc || "/radiant-logo.png"} alt={glyph.name} fill className="object-scale-down" />
            )}
            {embedType === "text" && (
              <div className="flex items-center justify-center h-full">
                <textarea
                  className="text-md overflow-auto p-2 w-full h-full resize-none flex items-center justify-center"
                  defaultValue={
                    glyph.image
                      ? Buffer.from(glyph.image.replace(/^data:text\/plain;base64,/, ""), "base64").toString("utf-8")
                      : ""
                  }
                  readOnly
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    verticalAlign: "middle",
                    lineHeight: "1.5",
                    padding: "20%",
                  }}
                />
              </div>
            )}
            {embedType === "audio" && (
              <div className="flex items-center justify-center h-full">
                <div className="text-md flex items-center justify-center w-full">
                  <audio controls className="w-3/4">
                    <source src={glyph.image} type="audio/ogg" />
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              </div>
            )}
          </>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mt-4">
            {glyph.isContainer ? (
              <Badge variant="secondary" className="px-3 py-1">
                <Package className="h-4 w-4 mr-2" />
                Container
              </Badge>
            ) : glyph.tokenType.toLowerCase() === "user" ? (
              <Badge variant="secondary" className="px-3 py-1">
                <User className="h-4 w-4 mr-2" />
                User
              </Badge>
            ) : (
              <Badge variant="outline" className="px-3 py-1">
                {glyph.tokenType}
              </Badge>
            )}
          </div>
          {glyph.containerRef && glyph.containerRef !== glyph.ref && (
            <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Part of container:</span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={handleContainerClick}
                disabled={isPending}
              >
                {isPending ? "Loading..." : glyph.containerName || glyph.containerRef}
              </Button>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            {glyph.tokenType.toLowerCase() !== "user" && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Creator:</span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={handleCreatorClick}
                  disabled={isPending || !glyph.creator || glyph.creator === "Unknown"}
                >
                  <span
                    className="font-medium truncate"
                    title={glyph.creator}
                    style={{
                      maxWidth: "200px",
                      display: "inline-block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {glyph.creatorName || glyph.creator}
                  </span>
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">{new Date(glyph.createdAt).toLocaleDateString()}</span>
            </div>

            {glyph.transactionHash && (
              <div className="flex items-center gap-2 text-sm">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Transaction:</span>
                <Link
                  href={`${process.env.NEXT_PUBLIC_RXD_EXPLORER_TX_URL}${glyph.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline font-medium truncate max-w-[200px] sm:max-w-[400px] inline-block overflow-hidden text-ellipsis whitespace-nowrap"
                  title={glyph.transactionHash}
                >
                  {glyph.transactionHash}
                </Link>
              </div>
            )}

            {glyph.blockNumber && (
              <div className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Block:</span>
                <Link
                  href={`${process.env.NEXT_PUBLIC_RXD_EXPLORER_BLOCK_URL}${glyph.blockNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline font-medium"
                >
                  {glyph.blockNumber}
                </Link>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{glyph.description}</p>
          </div>

          {(glyph.attributes ?? []).length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Attributes</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(glyph.attributes ?? []).map((attr, index) => (
                    <div key={index} className="bg-muted rounded-md p-2">
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{attr.trait_type}</p>
                      </div>
                      <p className="font-medium text-sm break-words">{attr.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {glyph.isContainer && glyph.containerItems && glyph.containerItems.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Container Items</h4>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] sm:max-h-[300px] overflow-y-auto pr-1"
                  ref={containerRef}
                >
                  {glyph.containerItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-muted rounded-md p-2 cursor-pointer hover:bg-accent"
                      onClick={() => handleContainerItemClick(item)}
                      onMouseEnter={(e) => handleItemMouseEnter(e, item)}
                      onMouseLeave={handleItemMouseLeave}
                    >
                      <div className="flex items-center gap-1">
                        <LinkIcon className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{item.tokenType}</p>
                      </div>
                      <p className="font-medium text-sm truncate">{item.name}</p>
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
