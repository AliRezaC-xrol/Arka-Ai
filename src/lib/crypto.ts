import crypto from "crypto";

/**
 * Returns a 32-byte key derived from ENCRYPTION_KEY or SESSION_SECRET
 */
function getEncryptionKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_KEY ||
    process.env.SESSION_SECRET ||
    "arka-super-secure-default-encryption-secret-32-chars";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plain API key using AES-256-GCM.
 * Output format: "ivHex:authTagHex:ciphertextHex"
 */
export function encryptApiKey(plainKey: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(plainKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted payload back to the plain text key.
 */
export function decryptApiKey(encryptedPayload: string): string {
  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted API key format");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Masks an API key for safe UI display (e.g. "sk-...a1b2" or "AIza...9x01").
 * The full key is never sent back to the frontend.
 */
export function maskApiKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return "••••••••";

  if (trimmed.length <= 8) {
    return "••••••••";
  }

  // Preserve standard prefix if present (sk-, AIza, etc.)
  if (trimmed.startsWith("sk-")) {
    return `sk-...${trimmed.slice(-4)}`;
  }
  if (trimmed.startsWith("AIza")) {
    return `AIza...${trimmed.slice(-4)}`;
  }

  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}...${suffix}`;
}
