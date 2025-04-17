import mongoose from "mongoose"

declare global {
  var mongoose: { conn: any; promise: any } | undefined
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://10.0.101.221:27017/rxd-glyph-explorer"

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export async function connectToDatabase() {
  if (cached!.conn) {
    return cached!.conn
  }

  if (!cached!.promise) {
    // Remove deprecated options, just use the URI
    cached!.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      return mongoose
    })
  }

  cached!.conn = await cached!.promise
  return cached!.conn
}


