export interface Glyph {
  id: string
  name: string
  description: string
  imageUrl: string
  creator: string
  createdAt: string
  transactionHash: string
  blockNumber: number
  attributes?: {
    trait_type: string
    value: string | number
  }[]
}

export type  GlyphPayload = {
  p: (string | number)[];
  in?: Uint8Array[];
  by?: Uint8Array[];
  attrs?: {
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type  GlyphEmbeddedFile = {
  t: string;
  b: Uint8Array;
};

export type GlyphRemoteFile = {
  t: string;
  u: string;
  h?: Uint8Array;
  hs?: Uint8Array;
};

export type GlyphFile = GlyphEmbeddedFile | GlyphRemoteFile;

export type GlyphContractType = "nft" | "dat" | "ft";

export type Utxo = {
  txid: string;
  vout: number;
  script: string;
  value: number;
};

