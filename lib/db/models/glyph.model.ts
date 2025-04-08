import mongoose, { Schema, type Document } from "mongoose"
import { GlyphType } from "./enums"

interface EmbedData {
  t: string // Type
  b: Buffer // Binary data
}

interface RemoteData {
  t: string // Type
  u: string // URL
  h?: Buffer // Hash
  hs?: Buffer // Hash signature
}

export interface GlyphDocument extends Document {
  p?: (number | string)[]
  tokenType: GlyphType
  ref: string
  ticker?: string
  lastTxoId?: mongoose.Types.ObjectId
  revealOutpoint?: string
  spent: 0 | 1
  fresh: 0 | 1
  location?: string
  name: string
  type: string
  immutable?: boolean
  description: string
  author: string
  container: string
  attrs: { [key: string]: string }
  embed?: EmbedData
  remote?: RemoteData
  height?: number
  swapPending?: boolean
}

const GlyphSchema = new Schema<GlyphDocument>(
  {
    p: [Schema.Types.Mixed], // Array of numbers or strings
    tokenType: {
      type: String,
      enum: Object.values(GlyphType),
      required: true,
    },
    ref: { type: String, required: true, index: true },
    ticker: { type: String },
    lastTxoId: { type: Schema.Types.ObjectId, ref: "TxO" },
    revealOutpoint: { type: String },
    spent: { type: Number, enum: [0, 1], required: true },
    fresh: { type: Number, enum: [0, 1], required: true },
    location: { type: String },
    name: { type: String, required: true },
    type: { type: String, required: true },
    immutable: { type: Boolean },
    description: { type: String, required: true },
    author: { type: String, required: true },
    container: { type: String, required: true },
    attrs: { type: Map, of: String, default: {} },
    embed: {
      t: { type: String },
      b: { type: Buffer },
    },
    remote: {
      t: { type: String },
      u: { type: String },
      h: { type: Buffer },
      hs: { type: Buffer },
    },
    height: { type: Number },
    swapPending: { type: Boolean },
  },
  {
    timestamps: true,
  },
)

// Create indexes for common query patterns
GlyphSchema.index({ name: "text", description: "text", author: "text" })
GlyphSchema.index({ tokenType: 1 })
GlyphSchema.index({ spent: 1, fresh: 1 })

export const Glyph = mongoose.models.Glyph || mongoose.model<GlyphDocument>("Glyph", GlyphSchema)

