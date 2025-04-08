import { Glyph, type GlyphDocument } from "../models/glyph.model"
import type { GlyphType } from "../models/enums"
import connectToDatabase from "../connect"

export class GlyphRepository {
  constructor() {
    // Ensure database connection
    connectToDatabase()
  }

  async findById(id: string): Promise<GlyphDocument | null> {
    return Glyph.findById(id)
  }

  async findByRef(ref: string): Promise<GlyphDocument | null> {
    return Glyph.findOne({ ref })
  }

  async findAll(limit = 100, skip = 0): Promise<GlyphDocument[]> {
    return Glyph.find().sort({ _id: -1 }).skip(skip).limit(limit)
  }

  async findByTokenType(tokenType: GlyphType, limit = 100, skip = 0): Promise<GlyphDocument[]> {
    return Glyph.find({ tokenType }).sort({ _id: -1 }).skip(skip).limit(limit)
  }

  async findActive(limit = 100, skip = 0): Promise<GlyphDocument[]> {
    return Glyph.find({ spent: 0, fresh: 0 }).sort({ _id: -1 }).skip(skip).limit(limit)
  }

  async search(query: string, limit = 100, skip = 0): Promise<GlyphDocument[]> {
    return Glyph.find({ $text: { $search: query } }, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(limit)
  }

  async findOne(query: Record<string, any>): Promise<GlyphDocument | null> {
    return Glyph.findOne(query)
  }

  async create(glyphData: Partial<GlyphDocument>): Promise<GlyphDocument> {
    const glyph = new Glyph(glyphData)
    return glyph.save()
  }

  async update(id: string, glyphData: Partial<GlyphDocument>): Promise<GlyphDocument | null> {
    return Glyph.findByIdAndUpdate(id, glyphData, { new: true })
  }

  async markAsSpent(id: string): Promise<GlyphDocument | null> {
    return Glyph.findByIdAndUpdate(id, { spent: 1 }, { new: true })
  }

  async delete(id: string): Promise<boolean> {
    const result = await Glyph.deleteOne({ _id: id })
    return result.deletedCount === 1
  }

  async countByTokenType(tokenType: GlyphType): Promise<number> {
    return Glyph.countDocuments({ tokenType })
  }

  async findByAuthor(author: string, limit = 100, skip = 0): Promise<GlyphDocument[]> {
    return Glyph.find({ author }).sort({ _id: -1 }).skip(skip).limit(limit)
  }
}

