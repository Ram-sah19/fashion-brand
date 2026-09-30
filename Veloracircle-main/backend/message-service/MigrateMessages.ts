import dotenv from "dotenv";
import mongoose from "mongoose";

import Message from "./models/Message";
import { encryptMessage } from "./services/EncryptionService";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

const migrateMessages = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected");

    const messages = await Message.find({});

    console.log(`Found ${messages.length} messages`);

    let encryptedCount = 0;
    let skippedCount = 0;

    for (const message of messages) {
      const text = message.text;

      if (!text) {
        skippedCount++;
        continue;
      }

      // Already encrypted messages have this format:
      // IV:AUTH_TAG:ENCRYPTED_DATA
      const parts = text.split(":");

      if (parts.length === 3) {
        skippedCount++;
        continue;
      }

      message.text = encryptMessage(text);

      await message.save();

      encryptedCount++;
    }

    console.log(`Encrypted messages: ${encryptedCount}`);
    console.log(`Skipped messages: ${skippedCount}`);
    console.log("Message migration completed successfully");
  } catch (error) {
    console.error("Message migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

migrateMessages();