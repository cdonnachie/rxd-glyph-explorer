"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { GlyphUI } from "@/lib/services/glyph-service"
import Image from "next/image"
import { Package, User } from "lucide-react"
import ContractName from "./contract-name"
import type { ContractType } from "@/lib/db/models/enums"
import Link from "next/link"
import { useQRCode } from "next-qrcode"

interface GlyphCardProps {
  glyph: GlyphUI
  onClick: () => void
  onCreatorClick?: (creator: string) => void
}

export function GlyphCard({ glyph, onClick, onCreatorClick }: GlyphCardProps) {
  const { Canvas } = useQRCode()
  const imageSrc = glyph.image || glyph.imageUrl || "/radiant-logo.png?height=400&width=400"
  const embedType = glyph.embedType?.includes("image")
    ? "image"
    : glyph.embedType?.includes("text")
      ? "text"
      : glyph.embedType?.includes("audio")
        ? "audio"
        : "unknown"

  return (
    <Card
      className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${glyph.spent ? "opacity-60" : ""}`}
      onClick={onClick}
    >
      <div className="relative aspect-square bg-muted">
        {glyph.spent && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30">
            <Badge variant="secondary" className="bg-black/70 text-white">
              Spent
            </Badge>
          </div>
        )}
        {glyph.remote && glyph.remote.url && (
          <div className="flex flex-row items-center justify-center h-full">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-muted text-sm p-1 rounded flex flex-col items-center space-y-2">
              <div className="w-full max-w-[192px] h-auto flex items-center justify-center">
                <Canvas
                  text={glyph.remote.url}
                  options={{
                    type: "image/jpeg",
                    quality: 0.3,
                    errorCorrectionLevel: "H",
                    margin: 3,
                    scale: 4,
                    width: 192,
                  }}
                  logo={{
                    src: "/radiant-logo.png",
                    options: {
                      width: 35,
                      x: undefined,
                      y: undefined,
                    },
                  }}
                />
              </div>
              <Link
                className="text-blue-500 underline text-center break-all text-xs"
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
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                verticalAlign: "middle",
                lineHeight: "1.5",
                padding: "20%",
              }}
              readOnly
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
        {glyph.isContainer && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary">
              <Package className="h-3 w-3 mr-1" />
              Container
              {glyph.containerItems && glyph.containerItems.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-background/20 rounded-full text-xs">
                  {glyph.containerItems.length}
                </span>
              )}
            </Badge>
          </div>
        )}
        {glyph.tokenType.toLowerCase() === "user" && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary">
              <User className="h-3 w-3 mr-1" />
              User
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg truncate">{glyph.name}</h3>
        <p className="text-sm text-muted-foreground truncate">
          Type: <ContractName contractType={glyph.tokenType as ContractType} />
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        {glyph.tokenType.toLowerCase() !== "user" ? (
          <p className="text-sm text-muted-foreground truncate">
            By{" "}
            {onCreatorClick ? (
              <button
                className="hover:underline focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation()
                  onCreatorClick(glyph.creator)
                }}
              >
                {glyph.creatorName || glyph.creator}
              </button>
            ) : (
              glyph.creatorName || glyph.creator
            )}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground truncate">&nbsp;</p>
        )}
      </CardFooter>
    </Card>
  )
}
