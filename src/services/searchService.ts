import { SearchRequest, SearchResponse, SearchResult } from '../types';
import { embeddingService } from './embeddingService';
import { vectorService } from './vectorService';
import { memoryService } from './memoryService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class SearchService {
    /**
     * Hybrid search (semantic + text)
     */
    async search(userId: string, request: SearchRequest): Promise<SearchResponse> {
        const startTime = Date.now();
        let results: SearchResult[] = [];

        if (request.searchType === 'semantic' || request.searchType === 'hybrid') {
            results = await this.semanticSearch(userId, request);
        }

        if (request.searchType === 'text' || request.searchType === 'hybrid') {
            const textResults = await this.textSearch(userId, request);
            results = this.mergeResults(results, textResults);
        }

        // Sort by score
        results.sort((a, b) => b.score - a.score);

        // Limit results
        results = results.slice(0, request.limit || 20);

        return {
            results,
            total: results.length,
            tookMs: Date.now() - startTime,
        };
    }

    /**
     * Semantic search using embeddings
     */
    private async semanticSearch(
        userId: string,
        request: SearchRequest
    ): Promise<SearchResult[]> {
        // Generate query embedding
        const queryEmbedding = await embeddingService.generateQueryEmbedding(request.query);

        // Search vector DB
        const vectorResults = await vectorService.searchSimilar(
            queryEmbedding,
            userId,
            request.limit || 20,
            request.filters
        );

        // Fetch full memories
        const memoryIds = vectorResults.map(r => r.memoryId);
        const memories = await prisma.memory.findMany({
            where: { id: { in: memoryIds } },
        });

        return vectorResults.map(vr => {
            const memory = memories.find(m => m.id === vr.memoryId);
            if (!memory) return null;

            return {
                memory: this.formatMemory(memory),
                score: vr.score,
                matchType: 'semantic' as const,
            };
        }).filter(Boolean) as SearchResult[];
    }

    /**
     * Text-based search
     */
    private async textSearch(
        userId: string,
        request: SearchRequest
    ): Promise<SearchResult[]> {
        const where: any = {
            userId,
            OR: [
                { content: { contains: request.query, mode: 'insensitive' } },
                { title: { contains: request.query, mode: 'insensitive' } },
            ],
        };

        if (request.filters?.type) {
            where.type = request.filters.type;
        }

        const memories = await prisma.memory.findMany({
            where,
            take: request.limit || 20,
            orderBy: { timestamp: 'desc' },
        });

        return memories.map(memory => ({
            memory: this.formatMemory(memory),
            score: this.calculateTextScore(memory, request.query),
            matchType: 'text' as const,
        }));
    }

    /**
     * Calculate text match score
     */
    private calculateTextScore(memory: any, query: string): number {
        const lowerQuery = query.toLowerCase();
        const lowerContent = memory.content.toLowerCase();
        const lowerTitle = (memory.title || '').toLowerCase();

        let score = 0;

        // Title match is worth more
        if (lowerTitle.includes(lowerQuery)) {
            score += 0.8;
        }

        // Content match
        if (lowerContent.includes(lowerQuery)) {
            score += 0.5;
        }

        // Exact match bonus
        if (lowerTitle === lowerQuery || lowerContent === lowerQuery) {
            score += 0.3;
        }

        return Math.min(score, 1.0);
    }

    /**
     * Merge semantic and text search results
     */
    private mergeResults(
        semanticResults: SearchResult[],
        textResults: SearchResult[]
    ): SearchResult[] {
        const merged = new Map<string, SearchResult>();

        // Add semantic results
        for (const result of semanticResults) {
            merged.set(result.memory.id, result);
        }

        // Merge text results
        for (const result of textResults) {
            const existing = merged.get(result.memory.id);
            if (existing) {
                // Combine scores
                existing.score = (existing.score + result.score) / 2;
                existing.matchType = 'hybrid';
            } else {
                merged.set(result.memory.id, result);
            }
        }

        return Array.from(merged.values());
    }

    private formatMemory(memory: any) {
        return {
            id: memory.id,
            userId: memory.userId,
            type: memory.type,
            title: memory.title,
            content: memory.content,
            tags: memory.tags,
            autoTopics: memory.autoTopics,
            items: memory.items,
            embeddingId: memory.embeddingId,
            linkedMemoryIds: memory.linkedMemoryIds,
            timestamp: Number(memory.timestamp),
            reminderAt: memory.reminderAt ? Number(memory.reminderAt) : undefined,
            isPinned: memory.isPinned,
            createdAt: memory.createdAt,
            updatedAt: memory.updatedAt,
        };
    }
}

export const searchService = new SearchService();
