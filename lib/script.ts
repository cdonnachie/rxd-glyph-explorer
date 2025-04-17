//import { Address, Opcode, Script } from "@radiantblockchain/radiantjs";
import rjs from "@radiantblockchain/radiantjs";
import { sha256 } from "@noble/hashes/sha256";
import { Buffer } from "buffer";
import { glyphMagicBytesHex } from "./token";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { GlyphContractType } from "./types";

const { Address, Opcode, Script } = rjs;

// NOTE: All ref inputs for script functions must be little-endian

// Size of scripts (not including length VarInt)
export const p2pkhScriptSize = 25;
export const nftScriptSize = 63;
export const ftScriptSize = 75;
export const delegateTokenScriptSize = 63;
export const delegateBurnScriptSize = 42;
export const p2pkhScriptSigSize = 107;
export const mutableNftScriptSize = 175;

const zeroRef = "00".repeat(36);

export function varIntSize(n: number) {
  if (n < 253) {
    return 1;
  } else if (n <= 65535) {
    return 3;
  } else if (n <= 4294967295) {
    return 5;
  } else if (n <= 18446744073709551615n) {
    return 9;
  } else {
    throw new Error("Invalid VarInt");
  }
}

export function pushDataSize(len: number) {
  if (len >= 0 && len < Opcode.OP_PUSHDATA1) {
    return 1;
  } else if (len < Math.pow(2, 8)) {
    return 2;
  } else if (len < Math.pow(2, 16)) {
    return 3;
  } else if (len < Math.pow(2, 32)) {
    return 4;
  }
  throw new Error("Invalid push data length");
}

// Transaction size without scripts (not including input/output script size VarInt and script)
export function baseTxSize(numInputs: number, numOutputs: number) {
  return (
    4 + // version
    varIntSize(numInputs) + // Input count
    (32 + // Prev tx hash
      4 + // Prev tx index
      4) * // Sequence num
      numInputs +
    varIntSize(numOutputs) + // Output count
    8 * // Value
      numOutputs +
    4 // nLockTime
  );
}

// Calcualte size of a transaction, given sizes of input and output scripts
export function txSize(
  inputScriptSizes: number[],
  outputScriptSizes: number[]
) {
  return (
    baseTxSize(inputScriptSizes.length, outputScriptSizes.length) +
    inputScriptSizes.reduce((a, s) => a + varIntSize(s) + s, 0) +
    outputScriptSizes.reduce((a, s) => a + varIntSize(s) + s, 0)
  );
}

export function revealScriptSigSize(glyphMagicBytesLen: number) {
  return p2pkhScriptSigSize + glyphMagicBytesLen;
}

export function commitScriptSize(
  contract: GlyphContractType,
  hasDelegate: boolean
) {
  const opSize = {
    ft: 9,
    nft: 10,
    dat: 0,
  };
  return 71 + opSize[contract] + (hasDelegate ? 56 : 0);
}

export function scriptHash(hex: string): string {
  return Buffer.from(sha256(Buffer.from(hex, "hex")))
    .reverse()
    .toString("hex");
}

export function p2pkhScript(address: string): string {
  try {
    return Script.buildPublicKeyHashOut(address).toHex();
  } catch {
    return "";
  }
}

// Handles p2pkh and p2sh
export function payToScript(address: string): string {
  try {
    return Script.fromAddress(address).toHex();
  } catch {
    return "";
  }
}

export function isP2pkh(address: string): boolean {
  try {
    const addr = new Address(address);
    // @ts-expect-error missing definition
    return addr.isPayToPublicKeyHash();
  } catch {
    return false;
  }
}

export function p2pkhScriptHash(address: string): string {
  return scriptHash(p2pkhScript(address));
}

export function parseMutableScript(script: string) {
  // Use RegExp so glyph hex variable can be used
  const pattern = new RegExp(
    `^20([0-9a-f]{64})75bdd8([0-9a-f]{72})7601207f818c54807e5279e2547a0124957f7701247f75887cec7b7f7701457f757801207ec0caa87e885279036d6f64876378eac0e98878ec01205579aa7e01757e8867527902736c8878cd01d852797e016a7e8778da009c9b6968547a03${glyphMagicBytesHex}886d6d51$`
  );
  const [, hash, ref] = script.match(pattern) || [];
  return { hash, ref };
}

export function parseP2pkhScript(script: string): {
  address?: string;
} {
  const pattern = /^76a914([0-9a-f]{40})88ac$/;
  const [, address] = script.match(pattern) || [];
  return { address };
}

export function parseNftScript(script: string): {
  ref?: string;
  address?: string;
} {
  const pattern = /^d8([0-9a-f]{72})7576a914([0-9a-f]{40})88ac$/;
  const [, ref, address] = script.match(pattern) || [];
  return { ref, address };
}

export function parseFtScript(script: string): {
  ref?: string;
  address?: string;
} {
  const pattern =
    /^76a914([0-9a-f]{40})88acbdd0([0-9a-f]{72})dec0e9aa76e378e4a269e69d$/;
  const [, address, ref] = script.match(pattern) || [];
  return { ref, address };
}

export function parseDelegateBaseScript(script: string): string[] {
  const pattern = /^((d1[0-9a-f]{72}75)+).*/; // Don't need to match p2pkh
  const match = script.match(pattern);

  if (match) {
    // Return required refs
    const refs = match[1].match(/.{76}/g);
    if (refs) {
      return refs.map((ref) => ref.substring(2, 74));
    }
  }

  return [];
}

export function parseDelegateBurnScript(script: string): string | undefined {
  const pattern = /^d1([0-9a-f]{72})6a0364656c$/;
  const [, ref] = script.match(pattern) || [];
  return ref;
}

export function parseContractBurnScript(script: string): string | undefined {
  const pattern = /^d1([0-9a-f]{72})6a03636f6e$/;
  const [, ref] = script.match(pattern) || [];
  return ref;
}

export function codeScriptHash(script: string) {
  return bytesToHex(sha256(sha256(hexToBytes(script))));
}

