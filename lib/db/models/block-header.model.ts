import mongoose, { Schema, type Document } from "mongoose"

export interface BlockHeaderDocument extends Document {
  hash: string
  height: number
  timestamp: Date
  buffer: Buffer // MongoDB stores ArrayBuffer as Buffer
  reorg: boolean
}

const BlockHeaderSchema = new Schema<BlockHeaderDocument>(
  {
    hash: { type: String, required: true, unique: true },
    height: { type: Number, required: true, index: true },
    timestamp: { type: Date, required: true },
    buffer: { type: Buffer, required: true },
    reorg: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  },
)

export const BlockHeader =
  mongoose.models.BlockHeader || mongoose.model<BlockHeaderDocument>("BlockHeader", BlockHeaderSchema)

