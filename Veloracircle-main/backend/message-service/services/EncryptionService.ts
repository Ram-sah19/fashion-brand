import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

const ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error("MESSAGE_ENCRYPTION_KEY is not defined");
}

const KEY = Buffer.from(ENCRYPTION_KEY, "hex");

if (KEY.length !== 32) {
  throw new Error(
    "MESSAGE_ENCRYPTION_KEY must be a 32-byte key in hexadecimal format",
  );
}

export const encryptMessage = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    KEY,
    iv,
  );

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};

export const decryptMessage = (encryptedText: string): string => {
  const parts = encryptedText.split(":");

  // Old messages were stored as plain text.
  // Return them unchanged.
  if (parts.length !== 3) {
    return encryptedText;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    iv,
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};