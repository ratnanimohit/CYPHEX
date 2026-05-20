import mongoose from "mongoose";

export async function connectDatabase(mongoUri) {
  mongoose.set("strictQuery", true);
  mongoose.set("bufferCommands", false);
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 2000,
    connectTimeoutMS: 2000
  });
}
