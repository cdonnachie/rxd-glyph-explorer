import mongoose, { Schema, type Document } from "mongoose"
import { ContractType } from "./enums"

export interface TxODocument extends Document {
  txid: string
  vout: number
  script: string
  value: number
  date?: number
  height?: number
  spent: 0 | 1
  change?: 0 | 1
  contractType: ContractType
}

const TxOSchema = new Schema<TxODocument>(
  {
    txid: { type: String, required: true },
    vout: { type: Number, required: true },
    script: { type: String, required: true },
    value: { type: Number, required: true },
    date: { type: Number },
    height: { type: Number },
    spent: { type: Number, enum: [0, 1], required: true },
    change: { type: Number, enum: [0, 1] },
    contractType: {
      type: String,
      enum: Object.values(ContractType),
      required: true,
    },
  },
  {
    timestamps: true,
    // Create a compound index on txid and vout for faster lookups
  },
)

// Create a compound index on txid and vout for faster lookups
TxOSchema.index({ txid: 1, vout: 1 }, { unique: true })

// Index for queries filtering by contractType
TxOSchema.index({ contractType: 1 })

// Index for queries filtering by spent status
TxOSchema.index({ spent: 1 })

// Index for queries that filter by both contract type and spent status
TxOSchema.index({ contractType: 1, spent: 1 })

// Index for sorting by height (useful for blockchain explorer views)
TxOSchema.index({ height: -1 })

// Index for value-based queries (useful for UTXO selection)
TxOSchema.index({ value: 1, spent: 1 })

// Index for date-based queries
TxOSchema.index({ date: -1 })

// Index for finding outputs at specific heights
TxOSchema.index({ height: 1, contractType: 1 })

// Create a model if it doesn't exist already
export const TxO = mongoose.models.TxO || mongoose.model<TxODocument>("TxO", TxOSchema)
