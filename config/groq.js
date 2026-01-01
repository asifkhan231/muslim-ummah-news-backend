// config/llama.config.js
const Groq = require("groq-sdk");

// Read multiple API keys (comma-separated in .env)
const apiKeys = process.env.GROQ_API_KEYS
  ? process.env.GROQ_API_KEYS.split(",").map(k => k.trim()).filter(Boolean)
  : [];

if (apiKeys.length === 0) {
  throw new Error("❌ No Groq API keys found. Please set GROQ_API_KEYS in .env");
}

let currentIndex = 0;

function getClient() {
  const key = apiKeys[currentIndex];
  return new Groq({ apiKey: key });
}

function rotateKey() {
  currentIndex = (currentIndex + 1) % apiKeys.length;
  console.warn(`⚠️ Rotating Groq key → index ${currentIndex}`);
}

/**
 * Executes an AI generation function with automatic key fallback.
 * @param {Function} generateFn - async (client) => {...}
 */
async function generateWithFallback(generateFn) {
  let lastError;
  for (let i = 0; i < apiKeys.length; i++) {
    const client = getClient();
    try {
      const result = await generateFn(client);
      return result;
    } catch (err) {
      console.error(`❌ Groq key index ${currentIndex} failed:`, err.message);
      lastError = err;
      rotateKey();
    }
  }
  throw new Error(`All Groq API keys failed. Last error: ${lastError?.message}`);
}

module.exports = { generateWithFallback };
