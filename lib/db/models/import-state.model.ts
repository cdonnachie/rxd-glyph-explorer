import mongoose, { Schema, type Document } from "mongoose"

export interface ImportStateDocument extends Document {
  lastBlockHeight: number
  lastBlockHash: string
  lastUpdated: Date
  isImporting: boolean
}

const ImportStateSchema = new Schema<ImportStateDocument>(
  {
    lastBlockHeight: { type: Number, required: true, default: 0 },
    lastBlockHash: { type: String, required: true, default: "" },
    lastUpdated: { type: Date, required: true, default: Date.now },
    isImporting: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  },
)

export const ImportState =
  mongoose.models.ImportState || mongoose.model<ImportStateDocument>("ImportState", ImportStateSchema)

