/* eslint-disable @typescript-eslint/ban-ts-comment */

import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import rjs from "@radiantblockchain/radiantjs";
import { Buffer } from "buffer";
import { parseNftScript } from "./script";

// ESM compatibility
const { Script, PrivateKey, Transaction, crypto } = rjs;
type Script = rjs.Script;

export function txId(tx: string) {
  return bytesToHex(
    Buffer.from(sha256(sha256(Buffer.from(tx, "hex")))).reverse()
  );
}

// Fee check to prevent unfortunate bugs
export function feeCheck(tx: rjs.Transaction, feeRate: number) {
  const size = tx.toString().length / 2;
  const expected = size * feeRate;
  const actual = tx.getFee();

  // No greater than 20% more than expected
  if (actual > expected && !((actual - expected) / expected < 0.2)) {
    throw new Error("Failed fee check");
  }
}

export function findTokenOutput(
  tx: rjs.Transaction,
  refLE: string,
  parseFn: (script: string) => Partial<{ ref: string }> = parseNftScript
) {
  const vout = tx.outputs.findIndex((output) => {
    const { ref } = parseFn(output.script.toHex());
    return ref === refLE;
  });

  if (vout >= 0) {
    return { vout, output: tx.outputs[vout] };
  }

  return { index: undefined, output: undefined };
}
