import mongoose, { Schema, type Document } from "mongoose"

export interface StatsDocument extends Document {
  glyphs: {
    total: number
    nft: number
    ft: number
    dat: number
    containers: number
    containedItems: number
    users: number
  }
  txos: {
    total: number
    rxd: number
    nft: number
    ft: number
  }
  blocks: {
    count: number
    latest: {
      hash: string
      height: number
      timestamp: Date
    } | null
  }
  lastUpdated: Date
}

const StatsSchema = new Schema<StatsDocument>(
  {
    glyphs: {
      total: { type: Number, required: true, default: 0 },
      nft: { type: Number, required: true, default: 0 },
      ft: { type: Number, required: true, default: 0 },
      dat: { type: Number, required: true, default: 0 },
      containers: { type: Number, required: true, default: 0 },
      containedItems: { type: Number, required: true, default: 0 },
      users: { type: Number, required: true, default: 0 },
    },
    txos: {
      total: { type: Number, required: true, default: 0 },
      rxd: { type: Number, required: true, default: 0 },
      nft: { type: Number, required: true, default: 0 },
      ft: { type: Number, required: true, default: 0 },
    },
    blocks: {
      count: { type: Number, required: true, default: 0 },
      latest: {
        hash: { type: String },
        height: { type: Number },
        timestamp: { type: Date },
      },
    },
    lastUpdated: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
  },
)

export const Stats = mongoose.models.Stats || mongoose.model<StatsDocument>("Stats", StatsSchema)
