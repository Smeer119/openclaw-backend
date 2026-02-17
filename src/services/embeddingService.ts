import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

class EmbeddingService {
    private genAI: GoogleGenerativeAI;
    private model: string = 'text-embedding-004';

    constructor() {
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    }

    /**
     * Generate embedding vector for text
     */
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const model = this.genAI.getGenerativeModel({ model: this.model });
            const result = await model.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw new Error('Failed to generate embedding');
        }
    }

    /**
     * Generate embedding for search query
     */
    async generateQueryEmbedding(query: string): Promise<number[]> {
        return this.generateEmbedding(query);
    }

    /**
     * Batch generate embeddings for multiple texts
     */
    async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
        const embeddings: number[][] = [];

        for (const text of texts) {
            const embedding = await this.generateEmbedding(text);
            embeddings.push(embedding);
        }

        return embeddings;
    }
}

export const embeddingService = new EmbeddingService();
