import { Glyph, type GlyphDocument } from "../models/glyph.model"
import mongoose from "mongoose"
import { GlyphType } from "../models/enums"
import { connectToDatabase } from "../connect"

export class GlyphRepository {
  constructor() {
    // Ensure database connection
    connectToDatabase()
  }

  async findById(id: string): Promise<GlyphDocument | null> {
    return Glyph.findById({ _id: new mongoose.Types.ObjectId(id) })
  }

  async findByRef(ref: string): Promise<GlyphDocument | null> {
    return Glyph.findOne({ ref })
  }

  async findAll(limit = 100, skip = 0, query: Record<string, any> = {}): Promise<GlyphDocument[]> {
    return Glyph.find(query).sort({ _id: -1 }).skip(skip).limit(limit)
  }

  async findByTokenType(
    tokenType: GlyphType,
    limit = 100,
    skip = 0,
    query: Record<string, any> = {},
  ): Promise<GlyphDocument[]> {
    return Glyph.find({ tokenType, ...query })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
  }

  async findActive(limit = 100, skip = 0): Promise<GlyphDocument[]> {
    return Glyph.find({ spent: 0, fresh: 0 }).sort({ _id: -1 }).skip(skip).limit(limit)
  }

  async search(
    query: string,
    limit = 100,
    skip = 0,
    additionalQuery: Record<string, any> = {},
  ): Promise<GlyphDocument[]> {
    return Glyph.find({ $text: { $search: query }, ...additionalQuery }, { score: { $meta: "textScore" } })
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
    return Glyph.findOneAndUpdate({ _id: id, spent: 0 }, { spent: 1 }, { new: true })
  }

  async delete(id: string): Promise<boolean> {
    const result = await Glyph.deleteOne({ _id: id })
    return result.deletedCount === 1
  }

  async countByTokenType(tokenType: GlyphType): Promise<number> {
    return Glyph.countDocuments({ tokenType })
  }

  async countDocuments(query: Record<string, any>): Promise<number> {
    return Glyph.countDocuments(query)
  }

  async findByAuthor(author: string, limit = 100, skip = 0): Promise<GlyphDocument[]> {
    return Glyph.find({ author }).sort({ _id: -1 }).skip(skip).limit(limit)
  }

  // Container operations
  async findByContainer(containerRef: string, limit = 100, skip = 0): Promise<GlyphDocument[]> {
    return Glyph.find({ container: containerRef }).sort({ _id: -1 }).skip(skip).limit(limit)
  }

  async findContainers(limit = 100, skip = 0, query: Record<string, any> = {}): Promise<GlyphDocument[]> {
    return Glyph.find({
      $or: [{ isContainer: true }, { tokenType: GlyphType.CONTAINER }],
      ...query,
    })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
  }

  async addToContainer(containerRef: string, glyphRef: string): Promise<GlyphDocument | null> {
    return Glyph.findOneAndUpdate({ ref: containerRef }, { $addToSet: { containerItems: glyphRef } }, { new: true })
  }

  async removeFromContainer(containerRef: string, glyphRef: string): Promise<GlyphDocument | null> {
    return Glyph.findOneAndUpdate({ ref: containerRef }, { $pull: { containerItems: glyphRef } }, { new: true })
  }

  // Add a method to count items in a container
  async countByContainer(containerRef: string): Promise<number> {
    return Glyph.countDocuments({ container: containerRef })
  }

  async findUsers(limit = 100, skip = 0, query: Record<string, any> = {}): Promise<GlyphDocument[]> {
    return Glyph.find({ tokenType: GlyphType.USER, ...query })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
  }
  async findByRevealOutpoint(revealOutpoint: string): Promise<GlyphDocument | null> {
    return Glyph.findOne({ revealOutpoint })
  }
}
