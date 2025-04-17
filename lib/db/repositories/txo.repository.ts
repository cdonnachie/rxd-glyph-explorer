import { TxO, type TxODocument } from "../models/txo.model"
import type { ContractType } from "../models/enums"
import { connectToDatabase } from "../connect"

export class TxORepository {
  constructor() {
    // Ensure database connection
    connectToDatabase()
  }

  async findById(id: string): Promise<TxODocument | null> {
    return TxO.findById(id)
  }

  async findByTxidAndVout(txid: string, vout: number): Promise<TxODocument | null> {
    return TxO.findOne({ txid, vout })
  }

  async findAll(limit = 100, skip = 0): Promise<TxODocument[]> {
    return TxO.find().sort({ _id: -1 }).skip(skip).limit(limit)
  }

  async findByContractType(contractType: ContractType, limit = 100, skip = 0): Promise<TxODocument[]> {
    return TxO.find({ contractType }).sort({ _id: -1 }).skip(skip).limit(limit)
  }

  async findUnspent(limit = 100, skip = 0): Promise<TxODocument[]> {
    return TxO.find({ spent: 0 }).sort({ _id: -1 }).skip(skip).limit(limit)
  }

  async create(txoData: Partial<TxODocument>): Promise<TxODocument> {
    const txo = new TxO(txoData)
    return txo.save()
  }

  async update(id: string, txoData: Partial<TxODocument>): Promise<TxODocument | null> {
    return TxO.findByIdAndUpdate(id, txoData, { new: true })
  }

  async markAsSpent(id: string): Promise<TxODocument | null> {
    return TxO.findOneAndUpdate({ _id: id, spent: 0 }, { spent: 1 }, { new: true })
  }

  async delete(id: string): Promise<boolean> {
    const result = await TxO.deleteOne({ _id: id })
    return result.deletedCount === 1
  }

  async countByContractType(contractType: ContractType): Promise<number> {
    return TxO.countDocuments({ contractType })
  }

  async isSpent(txid: string, vout: number): Promise<boolean> {
    const txo = await TxO.findOne({ txid, vout })
    return txo ? txo.spent === 1 : false
  }
}

