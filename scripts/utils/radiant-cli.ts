import { config } from "../config"
import { logger } from "./logger"

export class RadiantCli {
  private rpcUrl: string
  private authHeader: string
  private timeout: number

  constructor() {
    const { rpcHost, rpcPort, rpcUser, rpcPassword } = config.radiantCli
    this.rpcUrl = `http://${rpcHost}:${rpcPort}/`

    // Create Basic Auth header
    const authString = `${rpcUser}:${rpcPassword}`
    this.authHeader = `Basic ${Buffer.from(authString).toString("base64")}`

    this.timeout = config.import.commandTimeout
  }

  async executeCommand(method: string, params: any[] = []): Promise<any> {
    logger.debug(`Executing RPC method: ${method}`)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(this.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.authHeader,
        },
        body: JSON.stringify({
          jsonrpc: "1.0",
          id: Date.now(),
          method,
          params,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        console.error(`RPC error: ${JSON.stringify(data.error)}`)
        throw new Error(`RPC error: ${JSON.stringify(data.error)}`)
      }

      return data.result
    } catch (error) {
      logger.error(`RPC method execution failed: ${method}`, error)
      throw error
    }
  }

  async getBlockCount(): Promise<number> {
    return this.executeCommand("getblockcount")
  }

  async getBlockHash(height: number): Promise<string> {
    return this.executeCommand("getblockhash", [height])
  }

  async getBlockHex(hashOrHeight: string | number): Promise<string> {
    if (typeof hashOrHeight === "number") {
      const hash = await this.getBlockHash(hashOrHeight)
      return this.executeCommand("getblock", [hash, 0])
    }
    return this.executeCommand("getblock", [hashOrHeight, 0])
  }

  async getBlock(hashOrHeight: string | number, verbosity = 2): Promise<any> {
    if (typeof hashOrHeight === "number") {
      const hash = await this.getBlockHash(hashOrHeight)
      return this.executeCommand("getblock", [hash, verbosity])
    }
    return this.executeCommand("getblock", [hashOrHeight, verbosity])
  }

  async getRawTransaction(txid: string, verbose = true): Promise<any> {
    return this.executeCommand("getrawtransaction", [txid, verbose])
  }

  async decodeRawTransaction(hexString: string): Promise<any> {
    return this.executeCommand("decoderawtransaction", [hexString])
  }

  async getBlockchainInfo(): Promise<any> {
    return this.executeCommand("getblockchaininfo")
  }
}

