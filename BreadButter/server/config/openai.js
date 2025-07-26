const OpenAI = require('openai');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

let openai = null;

// Initialize OpenAI only if API key is provided
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  logger.info('✅ OpenAI client initialized');
} else {
  logger.warn('⚠️  OpenAI API key not provided. Semantic matching will use fallback algorithms.');
}

/**
 * Generate embeddings for text using OpenAI
 * @param {string} text - Text to generate embeddings for
 * @returns {Array|null} - Embedding vector or null if failed
 */
const generateEmbeddings = async (text) => {
  if (!openai) {
    logger.warn('OpenAI not available, skipping embedding generation');
    return null;
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.substring(0, 8000), // Limit text length
    });

    return response.data[0].embedding;
  } catch (error) {
    logger.error('Error generating embeddings:', error.message);
    return null;
  }
};

/**
 * Calculate cosine similarity between two vectors
 * @param {Array} vectorA 
 * @param {Array} vectorB 
 * @returns {number} - Similarity score between 0 and 1
 */
const cosineSimilarity = (vectorA, vectorB) => {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

module.exports = {
  openai,
  generateEmbeddings,
  cosineSimilarity
};
