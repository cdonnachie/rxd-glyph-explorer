import { BlockHeader, type BlockHeaderDocument } from "../models/block-header.model"
import { connectToDatabase } from "../connect"

export class BlockHeaderRepository {
  constructor() {
    // Ensure database connection
    connectToDatabase()
  }

  async findById(id: string): Promise<BlockHeaderDocument | null> {
    return BlockHeader.findById(id)
  }

  async findByHash(hash: string): Promise<BlockHeaderDocument | null> {
    return BlockHeader.findOne({ hash })
  }

  async findByHeight(height: number): Promise<BlockHeaderDocument | null> {
    return BlockHeader.findOne({ height })
  }

  async findAll(limit = 100, skip = 0): Promise<BlockHeaderDocument[]> {
    return BlockHeader.find().sort({ height: -1 }).skip(skip).limit(limit)
  }

  async create(headerData: Partial<BlockHeaderDocument>): Promise<BlockHeaderDocument> {
    const header = new BlockHeader(headerData)
    return header.save()
  }

  async update(id: string, headerData: Partial<BlockHeaderDocument>): Promise<BlockHeaderDocument | null> {
    return BlockHeader.findByIdAndUpdate(id, headerData, { new: true })
  }

  async markAsReorg(hash: string): Promise<BlockHeaderDocument | null> {
    return BlockHeader.findOneAndUpdate({ hash }, { reorg: true }, { new: true })
  }

  async delete(id: string): Promise<boolean> {
    const result = await BlockHeader.deleteOne({ _id: id })
    return result.deletedCount === 1
  }

  async getLatestBlock(): Promise<BlockHeaderDocument | null> {
    return BlockHeader.findOne({ reorg: false }).sort({ height: -1 })
  }

  async getBlockCount(): Promise<number> {
    return BlockHeader.countDocuments({ reorg: false })
  }
}

