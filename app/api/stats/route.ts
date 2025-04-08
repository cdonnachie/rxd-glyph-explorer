import { type NextRequest, NextResponse } from "next/server"
import { GlyphRepository } from "@/lib/db/repositories/glyph.repository"
import { TxORepository } from "@/lib/db/repositories/txo.repository"
import { BlockHeaderRepository } from "@/lib/db/repositories/block-header.repository"
import { GlyphType, ContractType } from "@/lib/db/models/enums"
import connectToDatabase from "@/lib/db/connect"

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const glyphRepo = new GlyphRepository()
    const txoRepo = new TxORepository()
    const blockRepo = new BlockHeaderRepository()

    // Get counts for different types
    const nftGlyphCount = await glyphRepo.countByTokenType(GlyphType.NFT)
    const ftGlyphCount = await glyphRepo.countByTokenType(GlyphType.FT)
    const datGlyphCount = await glyphRepo.countByTokenType(GlyphType.DAT)

    const rxdTxoCount = await txoRepo.countByContractType(ContractType.RXD)
    const nftTxoCount = await txoRepo.countByContractType(ContractType.NFT)
    const ftTxoCount = await txoRepo.countByContractType(ContractType.FT)

    const blockCount = await blockRepo.getBlockCount()
    const latestBlock = await blockRepo.getLatestBlock()

    return NextResponse.json({
      glyphs: {
        total: nftGlyphCount + ftGlyphCount + datGlyphCount,
        nft: nftGlyphCount,
        ft: ftGlyphCount,
        dat: datGlyphCount,
      },
      txos: {
        total: rxdTxoCount + nftTxoCount + ftTxoCount,
        rxd: rxdTxoCount,
        nft: nftTxoCount,
        ft: ftTxoCount,
      },
      blocks: {
        count: blockCount,
        latest: latestBlock
          ? {
              hash: latestBlock.hash,
              height: latestBlock.height,
              timestamp: latestBlock.createdAt,
            }
          : null,
      },
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}

