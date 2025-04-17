// Type of script group
export type ScriptGroup = "rxd" | "ref" | "nft" | "ft" | "container" | "user"

// Type of script subscribed to
export enum ContractType {
  RXD = "RXD",
  NFT = "NFT",
  FT = "FT",
  CONTAINER = "CONTAINER",
  USER = "USER",
  DELEGATE_BURN = "DELEGATE_BURN",
  DELEGATE_TOKEN = "DELEGATE_TOKEN",
}

// Type of radiant smart token (mint operation)
export enum GlyphType {
  NFT = "NFT",
  FT = "FT",
  DAT = "DAT",
  CONTAINER = "CONTAINER",
  USER = "USER",
}
