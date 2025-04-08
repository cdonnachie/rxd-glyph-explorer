export interface Glyph {
  id: string
  name: string
  description: string
  imageUrl: string
  creator: string
  createdAt: string
  transactionHash: string
  blockNumber: number
  rarity: number
  attributes?: {
    trait_type: string
    value: string | number
  }[]
}

