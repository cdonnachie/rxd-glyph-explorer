import { type NextRequest, NextResponse } from "next/server"
import { TxORepository } from "@/lib/db/repositories/txo.repository"
import type { ContractType } from "@/lib/db/models/enums"
import { connectToDatabase } from "@/lib/db/connect"

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const txoRepo = new TxORepository()

    const searchParams = request.nextUrl.searchParams
    const contractType = searchParams.get("contractType") as ContractType | null
    const unspentOnly = searchParams.get("unspent") === "true"
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const skip = Number.parseInt(searchParams.get("skip") || "0")

    let txos

    if (unspentOnly) {
      txos = await txoRepo.findUnspent(limit, skip)
    } else if (contractType) {
      txos = await txoRepo.findByContractType(contractType, limit, skip)
    } else {
      txos = await txoRepo.findAll(limit, skip)
    }

    return NextResponse.json({ txos })
  } catch (error) {
    console.error("Error fetching TXOs:", error)
    return NextResponse.json({ error: "Failed to fetch TXOs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const txoRepo = new TxORepository()

    const body = await request.json()
    const txo = await txoRepo.create(body)

    return NextResponse.json({ txo }, { status: 201 })
  } catch (error) {
    console.error("Error creating TXO:", error)
    return NextResponse.json({ error: "Failed to create TXO" }, { status: 500 })
  }
}

