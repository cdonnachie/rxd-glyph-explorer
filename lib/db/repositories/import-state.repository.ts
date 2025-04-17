import { ImportState, type ImportStateDocument } from "../models/import-state.model"
import { connectToDatabase } from "../connect"

export class ImportStateRepository {
  constructor() {
    // Ensure database connection
    connectToDatabase()
  }

  async getState(): Promise<ImportStateDocument> {
    // Get the current import state or create a new one if it doesn't exist
    let state = await ImportState.findOne()
    if (!state) {
      state = await ImportState.create({
        lastBlockHeight: 315114, // Start around when the first Glypgh was created
        lastBlockHash: "0000000000000000000000000000000000000000000000000000000000000000",
        lastUpdated: new Date(),
        isImporting: false,
      })
    }
    return state
  }

  async updateState(updates: Partial<ImportStateDocument>): Promise<ImportStateDocument> {
    const state = await this.getState()
    
    // Ensure lastBlockHash is never undefined
    if (updates.lastBlockHash === undefined) {
      updates.lastBlockHash = state.lastBlockHash || ""
    }

    Object.assign(state, updates)
    state.lastUpdated = new Date()
    return state.save()
  }

  async setImporting(isImporting: boolean): Promise<ImportStateDocument> {
    return this.updateState({ isImporting })
  }

  async updateLastBlock(height: number, hash: string): Promise<ImportStateDocument> {
    return this.updateState({
      lastBlockHeight: height,
      lastBlockHash: hash,
    })
  }
}

