import mongoose, { Schema, type Document } from "mongoose"

export enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug",
}

export interface ImportLogDocument extends Document {
    timestamp: Date
    level: LogLevel
    message: string
    details?: any
    blockHeight?: number
    txid?: string
}

const ImportLogSchema = new Schema<ImportLogDocument>(
    {
        timestamp: { type: Date, required: true, default: Date.now },
        level: {
            type: String,
            required: true,
            enum: Object.values(LogLevel),
            default: LogLevel.INFO,
        },
        message: { type: String, required: true },
        details: { type: Schema.Types.Mixed },
        blockHeight: { type: Number },
        txid: { type: String },
    },
    {
        timestamps: true,
    },
)

// Create indexes for common query patterns
ImportLogSchema.index({ timestamp: -1 })
ImportLogSchema.index({ level: 1 })
ImportLogSchema.index({ blockHeight: 1 })


export const ImportLog: mongoose.Model<ImportLogDocument> =
    (mongoose.models?.ImportLog as mongoose.Model<ImportLogDocument>) ||
    mongoose.model<ImportLogDocument>("ImportLog", ImportLogSchema)
