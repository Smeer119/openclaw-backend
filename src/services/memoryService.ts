import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { MemoryCreateInput, MemoryResponse } from '../types';
import { embeddingService } from './embeddingService';
import { vectorService } from './vectorService';

const prisma = new PrismaClient();

class MemoryService {
    /**
     * Create a new memory
     */
    async createMemory(
        userId: string,
        input: MemoryCreateInput
    ): Promise<{ memory: MemoryResponse; relatedMemories: MemoryResponse[] }> {
        const now = Date.now();
        let embeddingId: string | undefined;
        let linkedMemoryIds: string[] = [];

        // Generate embedding if requested
        if (input.generateEmbedding !== false) {
            const textToEmbed = `${input.title || ''} ${input.content}`.trim();
            const embedding = await embeddingService.generateEmbedding(textToEmbed);

            // Store in vector DB
            embeddingId = await vectorService.upsertEmbedding(now.toString(), embedding, {
                memoryId: now.toString(), // Temporary, will update after creation
                userId,
                type: input.type,
                tags: input.tags || [],
                timestamp: now,
            });

            // Find similar memories
            const similarResults = await vectorService.searchSimilar(embedding, userId, 5);
            linkedMemoryIds = similarResults.map(r => r.memoryId);
        }

        // Create memory in database
        const memory = await prisma.memory.create({
            data: {
                userId,
                type: input.type,
                title: input.title,
                content: input.content,
                tags: input.tags || [],
                autoTopics: [], // TODO: Extract topics using AI
                items: input.items ? (input.items as Prisma.InputJsonValue) : undefined,
                embeddingId,
                linkedMemoryIds,
                timestamp: BigInt(now),
                reminderAt: input.reminderAt ? BigInt(input.reminderAt) : null,
                isPinned: false,
            },
        });

        // Fetch related memories
        const relatedMemories = await this.getMemoriesByIds(linkedMemoryIds);

        return {
            memory: this.formatMemory(memory),
            relatedMemories: relatedMemories.map(m => this.formatMemory(m)),
        };
    }

    /**
     * Get all memories for a user
     */
    async getMemories(
        userId: string,
        options?: { limit?: number; offset?: number; type?: string }
    ): Promise<{ memories: MemoryResponse[]; total: number }> {
        const where: any = { userId };
        if (options?.type) {
            where.type = options.type;
        }

        const [memories, total] = await Promise.all([
            prisma.memory.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                take: options?.limit || 50,
                skip: options?.offset || 0,
            }),
            prisma.memory.count({ where }),
        ]);

        return {
            memories: memories.map(m => this.formatMemory(m)),
            total,
        };
    }

    /**
     * Get single memory by ID
     */
    async getMemory(memoryId: string, userId: string): Promise<MemoryResponse | null> {
        const memory = await prisma.memory.findFirst({
            where: { id: memoryId, userId },
        });

        if (!memory) return null;

        // Update last accessed time
        await prisma.memory.update({
            where: { id: memoryId },
            data: { lastAccessedAt: new Date() },
        });

        return this.formatMemory(memory);
    }

    /**
     * Update memory
     */
    async updateMemory(
        memoryId: string,
        userId: string,
        updates: Partial<MemoryCreateInput>
    ): Promise<MemoryResponse> {
        const memory = await prisma.memory.findFirst({
            where: { id: memoryId, userId },
        });

        if (!memory) {
            throw new Error('Memory not found');
        }

        // Regenerate embedding if content changed
        let embeddingId = memory.embeddingId;
        if (updates.content && updates.content !== memory.content) {
            const textToEmbed = `${updates.title || memory.title || ''} ${updates.content}`.trim();
            const embedding = await embeddingService.generateEmbedding(textToEmbed);
            embeddingId = await vectorService.upsertEmbedding(memoryId, embedding, {
                memoryId,
                userId,
                type: updates.type || memory.type,
                tags: updates.tags || memory.tags,
                timestamp: Number(memory.timestamp),
            });
        }

        const updated = await prisma.memory.update({
            where: { id: memoryId },
            data: {
                type: updates.type,
                title: updates.title,
                content: updates.content,
                tags: updates.tags,
                items: updates.items ? (updates.items as Prisma.InputJsonValue) : undefined,
                reminderAt: updates.reminderAt ? BigInt(updates.reminderAt) : undefined,
                embeddingId,
                updatedAt: new Date(),
            },
        });

        return this.formatMemory(updated);
    }

    /**
     * Delete memory
     */
    async deleteMemory(memoryId: string, userId: string): Promise<void> {
        const memory = await prisma.memory.findFirst({
            where: { id: memoryId, userId },
        });

        if (!memory) {
            throw new Error('Memory not found');
        }

        // Delete from vector DB
        if (memory.embeddingId) {
            await vectorService.deleteEmbedding(memory.embeddingId);
        }

        // Delete from database
        await prisma.memory.delete({ where: { id: memoryId } });
    }

    /**
     * Get memories by IDs
     */
    private async getMemoriesByIds(ids: string[]): Promise<any[]> {
        if (ids.length === 0) return [];
        return prisma.memory.findMany({
            where: { id: { in: ids } },
        });
    }

    /**
     * Format memory for response
     */
    private formatMemory(memory: any): MemoryResponse {
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

export const memoryService = new MemoryService();
