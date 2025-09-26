// Local Embedding Service using Transformers.js
const { pipeline, env } = require('@xenova/transformers');

// Configure Transformers.js
env.allowLocalModels = false; // Download models from HuggingFace
env.localURL = '/models/'; // Path to local models if needed

class EmbeddingService {
  constructor() {
    this.extractor = null;
    this.modelName = 'Xenova/all-MiniLM-L6-v2'; // Small, fast, good quality
    this.isInitialized = false;
    this.initPromise = null;
  }

  async initialize() {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  async _doInitialize() {
    try {
      console.log('Initializing local embedding model:', this.modelName);
      console.log('This may take a moment on first run as the model downloads...');

      // Create feature extraction pipeline
      this.extractor = await pipeline('feature-extraction', this.modelName);

      this.isInitialized = true;
      console.log('✓ Embedding model initialized successfully');

      // Test embedding
      const test = await this.generateEmbedding('test');
      console.log('✓ Test embedding generated, dimension:', test.length);

      return true;
    } catch (error) {
      console.error('Failed to initialize embedding model:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  async generateEmbedding(text) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Truncate text if too long (max ~512 tokens)
      const maxLength = 512;
      const truncatedText = text.length > maxLength * 4 ?
        text.substring(0, maxLength * 4) : text;

      // Generate embedding
      const output = await this.extractor(truncatedText, {
        pooling: 'mean',
        normalize: true
      });

      // Convert to array and return
      return Array.from(output.data);
    } catch (error) {
      console.error('Embedding generation failed:', error);
      // Return null on failure - will fallback to keyword search
      return null;
    }
  }

  async generateBatchEmbeddings(texts) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const embeddings = [];

    // Process in batches to avoid memory issues
    const batchSize = 10;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );
      embeddings.push(...batchEmbeddings);

      // Log progress for large batches
      if (texts.length > 20 && i % 20 === 0) {
        console.log(`Processed ${i + batchEmbeddings.length}/${texts.length} embeddings`);
      }
    }

    return embeddings;
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // Find most similar vectors from a collection
  async findMostSimilar(queryEmbedding, embeddings, topK = 5) {
    if (!queryEmbedding) return [];

    const similarities = embeddings.map((embedding, index) => {
      const similarity = embedding ?
        this.cosineSimilarity(queryEmbedding, embedding) : 0;
      return { index, similarity };
    });

    // Sort by similarity and return top K
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, topK);
  }
}

// Export singleton instance
module.exports = new EmbeddingService();