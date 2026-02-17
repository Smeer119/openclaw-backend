import { Pinecone } from '@pinecone-database/pinecone';
import { config } from '../config';
import { VectorMetadata } from '../types';

class VectorService {
    private client: Pinecone;
    private indexName: string;
    private index: any;

    constructor() {
        this.client = new Pinecone({
            apiKey: config.pinecone.apiKey,
        });
        this.indexName = config.pinecone.indexName;
        this.initializeIndex();
    }

    private async initializeIndex() {
        try {
            // Get or create index
            const indexes = await this.client.listIndexes();
            const indexExists = indexes.indexes?.some(idx => idx.name === this.indexName);

            if (!indexExists) {
                await this.client.createIndex({
                    name: this.indexName,
                    dimension: 768, // Gemini embedding dimension
                    metric: 'cosine',
                    spec: {
                        serverless: {
                            cloud: 'aws',
                            region: config.pinecone.environment,
                        },
                    },
                });
                console.log(`✅ Created Pinecone index: ${this.indexName}`);
            }

            this.index = this.client.index(this.indexName);
        } catch (error) {
            console.error('Error initializing Pinecone index:', error);
        }
    }

    /**
     * Store embedding in vector database
     */
    async upsertEmbedding(
        memoryId: string,
        embedding: number[],
        metadata: VectorMetadata
    ): Promise<string> {
        const embeddingId = `emb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await this.index.upsert([
            {
                id: embeddingId,
                values: embedding,
                metadata,
            },
        ]);

        return embeddingId;
    }

    /**
     * Search for similar embeddings
     */
    async searchSimilar(
        queryEmbedding: number[],
        userId: string,
        topK: number = 20,
        filters?: Record<string, any>
    ): Promise<Array<{ memoryId: string; score: number; metadata: any }>> {
        const filter: Record<string, any> = { userId };
        if (filters) {
            Object.assign(filter, filters);
        }

        const results = await this.index.query({
            vector: queryEmbedding,
            topK,
            filter,
            includeMetadata: true,
        });

        return results.matches.map((match: any) => ({
            memoryId: match.metadata.memoryId,
            score: match.score,
            metadata: match.metadata,
        }));
    }

    /**
     * Delete embedding from vector database
     */
    async deleteEmbedding(embeddingId: string): Promise<void> {
        await this.index.deleteOne(embeddingId);
    }

    /**
     * Get embedding by ID
     */
    async getEmbedding(embeddingId: string): Promise<any> {
        const result = await this.index.fetch([embeddingId]);
        return result.records[embeddingId] || null;
    }
}

export const vectorService = new VectorService();
