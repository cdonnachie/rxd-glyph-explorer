/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Buffer } from "buffer";
import { decode } from "cbor-x";
// @ts-ignore
import rjs from "@radiantblockchain/radiantjs";
import {
   GlyphEmbeddedFile,
   GlyphFile,
   GlyphPayload,
   GlyphRemoteFile,
} from "./types";
import { GLYPH_MUT, GLYPH_NFT } from "./protocols";

// ESM compatibility
const { Script } = rjs;
type Script = rjs.Script;

export const glyphMagicBytesHex = "676c79"; // gly
export const glyphMagicBytesBuffer = Buffer.from(glyphMagicBytesHex, "hex");

const toObject = (obj: unknown) =>
  typeof obj === "object" ? (obj as { [key: string]: unknown }) : {};

const filterFileObj = (
  obj: GlyphFile
): { embed?: GlyphEmbeddedFile; remote?: GlyphRemoteFile } => {
  const embed = obj as Partial<GlyphEmbeddedFile>;
  if (typeof embed.t === "string" && embed.b instanceof Uint8Array) {
    return { embed: { t: embed.t, b: embed.b } };
  }
  const remote = obj as Partial<GlyphRemoteFile>;
  if (
    typeof remote.u === "string" &&
    (remote.h === undefined || remote.h instanceof Uint8Array) &&
    (remote.hs === undefined || remote.hs instanceof Uint8Array)
  ) {
    return {
      remote: {
        t: typeof remote.t === "string" ? remote.t : "",
        u: remote.u,
        h: remote.h,
        hs: remote.hs,
      },
    };
  }
  return {};
};

export type DecodedGlyph = {
  payload: GlyphPayload;
  embeddedFiles: { [key: string]: GlyphEmbeddedFile };
  remoteFiles: { [key: string]: GlyphRemoteFile };
};

export function decodeGlyph(script: Script): undefined | DecodedGlyph {
  const result: { payload: object } = {
    payload: {},
  };
  (
    script.chunks as {
      opcodenum: number;
      buf?: Uint8Array;
    }[]
  ).some(({ opcodenum, buf }, index) => {
    if (
      !buf ||
      opcodenum !== 3 ||
      Buffer.from(buf).toString("hex") !== glyphMagicBytesHex ||
      script.chunks.length <= index + 1
    ) {
      return false;
    }

    const payload = script.chunks[index + 1];
    if (!payload.buf) {
      return false;
    }
    const decoded = decode(Buffer.from(payload.buf));
    if (!decoded) {
      return false;
    }

    result.payload = decoded;
    return true;
  });

  const { p, attrs, ...rest } = result.payload as {
    [key: string]: unknown;
  };

  // Separate files from root object
  const { meta, embeds, remotes } = Object.entries(rest).reduce<{
    meta: [string, unknown][];
    embeds: [string, unknown][];
    remotes: [string, unknown][];
  }>(
    (a, [k, v]) => {
      const { embed, remote } = filterFileObj(
        v as { t: string; b: Uint8Array }
      );
      if (embed) {
        a.embeds.push([k, embed]);
      } else if (remote) {
        a.remotes.push([k, remote]);
      } else {
        a.meta.push([k, v]);
      }
      return a;
    },
    { meta: [], embeds: [], remotes: [] }
  );

  return {
    payload: {
      p: Array.isArray(p)
        ? p.filter((v) => ["string", "number"].includes(typeof v))
        : [],
      attrs: toObject(attrs),
      ...Object.fromEntries(meta),
    },
    embeddedFiles: Object.fromEntries(embeds) as {
      [key: string]: GlyphEmbeddedFile;
    },
    remoteFiles: Object.fromEntries(remotes) as {
      [key: string]: GlyphRemoteFile;
    },
  };
}

export function isImmutableToken({ p }: GlyphPayload) {
  // Mutable tokens must be NFTs that implement the mutable contract
  return !(p.includes(GLYPH_NFT) && p.includes(GLYPH_MUT));
}

// Filter for attr objects
export function filterAttrs(obj: object) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) =>
        (typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean") &&
        `${value}`.length < 100
    )
  );
}

// Find token script for a ref in reveal inputs and decode if found
export function extractRevealPayload(
  ref: string,
  inputs: rjs.Transaction.Input[]
) {
  const refTxId = ref.substring(0, 64);
  const refVout = parseInt(ref.substring(64), 16);

  // Find token script in the reveal tx
  const revealIndex = inputs.findIndex((input) => {
    return (
      input.prevTxId.toString("hex") === refTxId &&
      input.outputIndex === refVout
    );
  });
  const script = revealIndex >= 0 && inputs[revealIndex].script;

  if (!script) {
    return { revealIndex: -1 };
  }

  return { revealIndex, glyph: decodeGlyph(script) };
}
