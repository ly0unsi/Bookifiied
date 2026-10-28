import mongoose from "mongoose";

const MONGODB_URI_DEV = process.env.MONGODB_URI_DEV;
if (!MONGODB_URI_DEV)
  throw new Error("Please define the MONGODB_URI environment variable");
declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}
let cached =
  global.mongooseCache ||
  (global.mongooseCache = { conn: null, promise: null });

export const connectToDatabase = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI_DEV, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error(
      "MongoDB connection error. Please make sure MongoDB is running. " + e,
    );
    throw e;
  }

  console.info("Connected to MongoDB");
  return cached.conn;
};
